"""Local persistent queue backed exclusively by Ledger.jobs and Ledger.calls.

No consumer loop, service, AI runtime, networking or host failover is started.
Admission is allowed while paused; acquisition and execution remain blocked.
Claims have no expiry. Unknown calls must be reconciled, never replayed.
"""
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
import time
import uuid

from executor import Blocked


@dataclass(frozen=True)
class Claim:
    job_id: str
    token: str


class DurableQueue:
    def __init__(self, ledger, *, clock=time.time):
        self.ledger, self.clock = ledger, clock

    def enqueue(self, job_id, request):
        if not isinstance(job_id, str) or not 1 <= len(job_id) <= 128 or not isinstance(request, dict):
            raise Blocked("invalid_queue_request")
        encoded = json.dumps(request, sort_keys=True, ensure_ascii=False, allow_nan=False)
        if len(encoded) > 400000:
            raise Blocked("queue_request_too_large")
        digest = hashlib.sha256(encoded.encode()).hexdigest()
        with self.ledger.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            job = db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            if job:
                if job["digest"] != digest or (job["request_json"] is not None and job["request_json"] != encoded):
                    raise Blocked("job_id_reused_with_changed_brief")
                # Attach the original payload to a legacy job without resetting
                # its state, phase history, reservations or usage counters.
                if job["request_json"] is None:
                    db.execute("UPDATE jobs SET request_json=?,queued_at=? WHERE id=?",
                               (encoded, self.clock(), job_id))
                return job_id
            if db.execute("SELECT 1 FROM jobs WHERE digest=?", (digest,)).fetchone():
                raise Blocked("duplicate_brief")
            db.execute("INSERT INTO jobs(id,digest,state,request_json,queued_at) VALUES (?,?,'queued',?,?)",
                       (job_id, digest, encoded, self.clock()))
        return job_id

    def items(self):
        with self.ledger.connect() as db:
            return [{"job_id": row["id"], "state": row["state"], "claimed": row["queue_owner"] is not None}
                    for row in db.execute("SELECT id,state,queue_owner FROM jobs WHERE request_json IS NOT NULL ORDER BY rowid")]

    @staticmethod
    def _ready(db):
        if db.execute("SELECT value FROM meta WHERE key='paused'").fetchone()[0] != "false":
            raise Blocked("generation_paused")
        if db.execute("SELECT 1 FROM calls WHERE status='reserved'").fetchone():
            raise Blocked("queue_reconciliation_required")

    def acquire(self):
        with self.ledger.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            self._ready(db)
            if db.execute("SELECT 1 FROM jobs WHERE queue_owner IS NOT NULL").fetchone():
                raise Blocked("queue_executor_owned")
            job = db.execute("""SELECT id,state FROM jobs WHERE request_json IS NOT NULL
                AND state IN ('queued','needs_repair') ORDER BY rowid LIMIT 1""").fetchone()
            if job is None:
                return None
            claim = Claim(job["id"], uuid.uuid4().hex)
            state = "claimed" if job["state"] == "queued" else "needs_repair"
            db.execute("UPDATE jobs SET state=?,queue_owner=? WHERE id=?",
                       (state, claim.token, claim.job_id))
            return claim

    @staticmethod
    def _owned(db, claim):
        if not isinstance(claim, Claim) or not claim.token:
            raise Blocked("invalid_queue_claim")
        job = db.execute("SELECT * FROM jobs WHERE id=?", (claim.job_id,)).fetchone()
        if job is None or job["queue_owner"] != claim.token or job["request_json"] is None:
            raise Blocked("stale_queue_claim")
        return job

    def resume(self, claim):
        # Explicit possession of the SAME durable claim, not automatic lease
        # expiry/requeue. A reserved call blocks this even if its PID is gone.
        with self.ledger.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            self._ready(db)
            job = self._owned(db, claim)
            if job["state"] not in ("claimed", "needs_repair", "complete", "rejected", "failed"):
                raise Blocked("queue_reconciliation_required")
            return claim

    def run_claim(self, claim, executor, *, validator, context=None):
        if Path(executor.ledger.path).resolve() != Path(self.ledger.path).resolve():
            raise Blocked("queue_executor_ledger_mismatch")
        with self.ledger.connect() as db:
            self._ready(db)
            job = self._owned(db, claim)
            if job["state"] not in ("claimed", "needs_repair"):
                raise Blocked("queue_state_not_executable")
            encoded = job["request_json"]
            if hashlib.sha256(encoded.encode()).hexdigest() != job["digest"]:
                raise Blocked("queue_request_integrity_failed")
            request = json.loads(encoded)
            phase = "repair" if job["state"] == "needs_repair" else "initial"
        # Ownership, phase uniqueness and the global call lock are checked AGAIN
        # atomically by Executor before reserving a single model request.
        return executor.run(claim.job_id, request, phase=phase, validator=validator,
                            context=context, queue_claim=claim.token)

    def read_claim(self, claim):
        """Read the immutable owned request; never reconstruct it from CLI inputs."""
        with self.ledger.connect() as db:
            self._ready(db)
            job = self._owned(db, claim)
            if hashlib.sha256(job["request_json"].encode()).hexdigest() != job["digest"]:
                raise Blocked("queue_request_integrity_failed")
            return json.loads(job["request_json"])

    def acknowledge(self, claim):
        with self.ledger.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            job = self._owned(db, claim)
            if db.execute("SELECT 1 FROM calls WHERE status='reserved'").fetchone():
                raise Blocked("queue_reconciliation_required")
            if job["state"] not in ("complete", "rejected", "failed"):
                raise Blocked("queue_job_not_terminal")
            # Normal acknowledgement of a known terminal state only. This is
            # not a force-unlock, crash reset, deletion or uncertain-call retry.
            db.execute("UPDATE jobs SET queue_owner=NULL WHERE id=?", (claim.job_id,))
            return job["state"]
