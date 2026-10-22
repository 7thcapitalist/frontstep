"""Fail-closed local reserve executor. No production AI runtime is enabled.

The default demo uses MockRuntime. Optional transports are disabled by default.
A simulation ledger cannot be opened as a live ledger. There is deliberately no
live resume command.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sqlite3
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable


class Blocked(RuntimeError):
    pass


@dataclass(frozen=True)
class Policy:
    paused: bool = True
    model: str | None = None
    effort: str = "low"
    timeout_seconds: float = 60
    max_prompt_chars: int = 24000
    evidence_max_age_seconds: float = 60
    max_artifact_chars: int = 200000


@dataclass(frozen=True)
class Capability:
    model: str
    efforts: tuple[str, ...]
    economical: bool
    availability_source: str
    expires_at: float
    # This is a contract for an audited single-request adapter, NOT a claim
    # that one headless CLI invocation equals one model request.
    single_request: bool = True
    automatic_retries: int = 0
    tools_disabled: bool = True


@dataclass(frozen=True)
class Reading:
    authorized_calls: int | None = None
    remaining_calls: int | None = None
    measurement_available: bool = False
    source: str = "unknown"
    observed_at: float = 0
    authorization_id: str | None = None
    # Shared request permits, not a percentage converted into calls or dollars.
    # Counters must be cumulative within this authorization and include calls
    # already reserved by this ledger. Only an external authority can issue one.
    exclusive_owner: str | None = None


def finite_number(value):
    return type(value) in (int, float) and math.isfinite(value)


def count(value):
    return value if type(value) is int and value >= 0 else None


def usage_fields(result):
    """Input TOTAL already includes cached input. Never add cache a second time.

    Runtime adapters must normalize provider semantics before returning this
    shape. Anthropic's uncached input field, for example, is not input_total.
    Estimates are retained separately and never used as reported measurements.
    """
    usage = result.get("usage") if isinstance(result, dict) else None
    usage = usage if isinstance(usage, dict) else {}
    reported = usage.get("source") == "runtime"
    return {
        "input_tokens": count(usage.get("input_total")) if reported else None,
        "cached_input_tokens": count(usage.get("input_cached")) if reported else None,
        "output_tokens": count(usage.get("output")) if reported else None,
        "metric_source": "runtime" if reported else "unknown",
        "estimates": usage.get("estimates"),
    }


class Ledger:
    def __init__(self, path, *, simulation=False):
        self.path = str(path)
        self.simulation = simulation
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, digest TEXT UNIQUE NOT NULL,
                    state TEXT NOT NULL, artifact TEXT, validation TEXT);
                CREATE TABLE IF NOT EXISTS calls (
                    id INTEGER PRIMARY KEY, job_id TEXT NOT NULL, phase TEXT NOT NULL,
                    authorization_id TEXT NOT NULL, requested_model TEXT NOT NULL,
                    effort TEXT NOT NULL, effective_model TEXT, started REAL NOT NULL,
                    duration_seconds REAL, attempt INTEGER NOT NULL,
                    status TEXT NOT NULL, input_tokens INTEGER, cached_input_tokens INTEGER,
                    output_tokens INTEGER, metric_source TEXT NOT NULL DEFAULT 'unknown',
                    estimates TEXT, UNIQUE(job_id,phase));
                CREATE UNIQUE INDEX IF NOT EXISTS one_active_call ON calls(status)
                    WHERE status='reserved';
            """)
            # Migrate in one write transaction so independent local processes
            # cannot race ALTER TABLE. Queue state lives in jobs, not a second
            # queue database/table that could diverge from the call ledger.
            db.execute("BEGIN IMMEDIATE")
            columns = {row[1] for row in db.execute("PRAGMA table_info(jobs)")}
            for column, kind in (("request_json", "TEXT"), ("queue_owner", "TEXT"), ("queued_at", "REAL")):
                if column not in columns:
                    db.execute(f"ALTER TABLE jobs ADD COLUMN {column} {kind}")
            db.execute("CREATE UNIQUE INDEX IF NOT EXISTS one_queue_owner ON jobs((1)) WHERE queue_owner IS NOT NULL")
            db.execute("INSERT OR IGNORE INTO meta VALUES ('mode',?)",
                       ("simulation" if simulation else "live",))
            db.execute("INSERT OR IGNORE INTO meta VALUES ('paused','true')")
            mode = db.execute("SELECT value FROM meta WHERE key='mode'").fetchone()[0]
            if mode != ("simulation" if simulation else "live"):
                raise Blocked("ledger_mode_mismatch")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10, isolation_level="DEFERRED")
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA synchronous=FULL")
        try:
            with db:
                yield db
        finally:
            db.close()

    def allow_simulation(self):
        if not self.simulation:
            raise Blocked("live_resume_not_implemented")
        with self.connect() as db:
            db.execute("UPDATE meta SET value='false' WHERE key='paused'")

    def pause(self):
        with self.connect() as db:
            db.execute("UPDATE meta SET value='true' WHERE key='paused'")

    def status(self):
        with self.connect() as db:
            return {
                "mode": db.execute("SELECT value FROM meta WHERE key='mode'").fetchone()[0],
                "paused": db.execute("SELECT value FROM meta WHERE key='paused'").fetchone()[0] == "true",
                "calls": [dict(row) for row in db.execute("SELECT * FROM calls ORDER BY id")],
                "jobs": [dict(row) for row in db.execute("SELECT id,state FROM jobs ORDER BY id")],
                "production_adapter": "unavailable",
            }


class Executor:
    def __init__(self, ledger: Ledger, policy: Policy, runtime, read_budget: Callable[[], Reading],
                 *, clock=time.time, monotonic=time.monotonic):
        self.ledger, self.policy, self.runtime = ledger, policy, runtime
        self.read_budget, self.clock, self.monotonic = read_budget, clock, monotonic

    def _preflight(self):
        p, now = self.policy, self.clock()
        if p.paused:
            raise Blocked("generation_paused")
        if not finite_number(p.timeout_seconds) or not 0 < p.timeout_seconds <= 300:
            raise Blocked("invalid_timeout")
        if type(p.max_prompt_chars) is not int or not 1 <= p.max_prompt_chars <= 400000:
            raise Blocked("invalid_prompt_limit")
        if type(p.max_artifact_chars) is not int or not 1 <= p.max_artifact_chars <= 400000:
            raise Blocked("invalid_artifact_limit")
        if not finite_number(p.evidence_max_age_seconds) or not 0 < p.evidence_max_age_seconds <= 300:
            raise Blocked("invalid_evidence_age")
        if self.runtime is None:
            raise Blocked("production_adapter_unavailable")
        if (self.ledger.simulation != (getattr(self.runtime, "is_mock", False) is True) or
                (not self.ledger.simulation and getattr(self.runtime, "audited_single_request", False) is not True)):
            raise Blocked("production_adapter_not_audited")
        cap = self.runtime.capability
        if not isinstance(cap, Capability) or not p.model or p.model != cap.model:
            raise Blocked("model_unavailable")
        if p.effort not in ("low", "medium", "high") or p.effort not in cap.efforts:
            raise Blocked("invalid_effort")
        if (cap.economical is not True or not cap.availability_source or
                not finite_number(cap.expires_at) or cap.expires_at <= now):
            raise Blocked("model_availability_unconfirmed")
        if (cap.single_request is not True or cap.automatic_retries != 0 or
                cap.tools_disabled is not True):
            raise Blocked("runtime_can_bypass_call_limit")
        reading = self.read_budget()  # Deterministic authority; never an AI query.
        if not isinstance(reading, Reading) or not reading.authorization_id:
            raise Blocked("budget_authorization_unknown")
        if count(reading.authorized_calls) is None or count(reading.remaining_calls) is None:
            raise Blocked("budget_unknown")
        if reading.authorized_calls <= 0 or reading.remaining_calls <= 0:
            raise Blocked("budget_insufficient")
        if reading.measurement_available is not True or reading.source != "runtime":
            raise Blocked("measurement_unavailable")
        if (not finite_number(reading.observed_at) or
                not 0 <= now - reading.observed_at <= p.evidence_max_age_seconds):
            raise Blocked("budget_reading_expired")
        if reading.exclusive_owner != "local-backup":
            raise Blocked("exclusive_handoff_unconfirmed")
        return reading

    def run(self, job_id: str, brief: dict, *, phase="initial", validator: Callable, context=None,
            queue_claim=None):
        if phase not in ("initial", "repair"):
            raise Blocked("invalid_phase")
        if not isinstance(job_id, str) or not 1 <= len(job_id) <= 128 or not isinstance(brief, dict):
            raise Blocked("invalid_job")
        canonical = json.dumps(brief, sort_keys=True, ensure_ascii=False, allow_nan=False)
        digest = hashlib.sha256(canonical.encode()).hexdigest()
        reading = self._preflight()
        p = self.policy
        # BEGIN IMMEDIATE + durable phase reservation protects independent
        # processes and restarts. No expiring lock that could revive old work.
        with self.ledger.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            if db.execute("SELECT value FROM meta WHERE key='paused'").fetchone()[0] != "false":
                raise Blocked("generation_paused")
            if db.execute("SELECT 1 FROM calls WHERE status='reserved'").fetchone():
                raise Blocked("executor_busy_or_interrupted")
            owner = db.execute("SELECT id,queue_owner FROM jobs WHERE queue_owner IS NOT NULL").fetchone()
            if owner and (owner["id"] != job_id or owner["queue_owner"] != queue_claim):
                raise Blocked("queue_executor_owned")
            job = db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            if job and job["request_json"] is not None:
                if queue_claim is None or job["queue_owner"] != queue_claim:
                    raise Blocked("queue_claim_required")
                if job["state"] not in ("claimed", "needs_repair"):
                    raise Blocked("queue_state_not_executable")
            elif queue_claim is not None:
                raise Blocked("queue_claim_invalid")
            if job and job["digest"] != digest:
                raise Blocked("job_id_reused_with_changed_brief")
            if db.execute("SELECT 1 FROM jobs WHERE digest=? AND id<>?", (digest, job_id)).fetchone():
                raise Blocked("duplicate_brief")
            if db.execute("SELECT 1 FROM calls WHERE job_id=? AND phase=?", (job_id, phase)).fetchone():
                raise Blocked("phase_already_reserved")
            if phase == "repair" and (not job or job["state"] != "needs_repair"):
                raise Blocked("repair_not_allowed")
            used = db.execute("SELECT COUNT(*) FROM calls WHERE authorization_id=?",
                              (reading.authorization_id,)).fetchone()[0]
            if used >= min(reading.authorized_calls, reading.remaining_calls):
                raise Blocked("budget_insufficient")
            prompt = {"brief": brief, "phase": phase, "response": "site files only; no tools or delegation"}
            if context is not None:
                prompt["construction_context"] = context
            if phase == "repair":
                prompt.update(artifact=job["artifact"], validation=json.loads(job["validation"]))
            prompt = json.dumps(prompt, ensure_ascii=False, allow_nan=False)
            if len(prompt) > p.max_prompt_chars:
                raise Blocked("prompt_too_large")
            if not job:
                db.execute("INSERT INTO jobs(id,digest,state) VALUES (?,?,'reserved')", (job_id, digest))
            attempt = 1 + db.execute("SELECT COUNT(*) FROM calls WHERE job_id=?", (job_id,)).fetchone()[0]
            call_id = db.execute("""INSERT INTO calls
                (job_id,phase,authorization_id,requested_model,effort,started,attempt,status)
                VALUES (?,?,?,?,?,?,?,'reserved')""",
                (job_id, phase, reading.authorization_id, p.model, p.effort, self.clock(), attempt)).lastrowid
            db.execute("UPDATE jobs SET state='running' WHERE id=?", (job_id,))
        started = self.monotonic()
        result = {}
        status, state, validation = "failed", "failed", []
        release = True
        try:
            # Read AGAIN after acquiring the reservation. An intervening pause,
            # expired reading or revoked authorization must prevent this call.
            current = self._preflight()
            if current != reading:
                raise Blocked("budget_changed_before_call")
            with self.ledger.connect() as db:
                if db.execute("SELECT value FROM meta WHERE key='paused'").fetchone()[0] != "false":
                    raise Blocked("generation_paused")
            result = self.runtime.generate(prompt, model=p.model, effort=p.effort,
                                           timeout=p.timeout_seconds)
            if not isinstance(result, dict):
                result = {}
                raise Blocked("invalid_runtime_result")
            effective = result.get("effective_model")
            if effective is not None and effective != p.model:
                raise Blocked("effective_model_mismatch")
            u = usage_fields(result)
            if any(u[key] is None for key in ("input_tokens", "cached_input_tokens", "output_tokens")):
                raise Blocked("runtime_measurement_missing")
            if u["cached_input_tokens"] > u["input_tokens"]:
                raise Blocked("invalid_cache_measurement")
            artifact = result.get("artifact")
            if not isinstance(artifact, str) or len(artifact) > p.max_artifact_chars:
                raise Blocked("invalid_or_oversized_artifact")
            if result.get("content_error"):
                raise Blocked(result["content_error"])
            validation = validator(artifact)  # Local code only; receives no runtime.
            if (not isinstance(validation, list) or len(validation) > 20 or
                    any(not isinstance(v, str) or len(v) > 500 for v in validation)):
                raise Blocked("invalid_validation")
            state = "complete" if not validation else ("needs_repair" if phase == "initial" else "rejected")
            status = "succeeded"
            return {"job_id": job_id, "state": state, "artifact": artifact, "validation": validation}
        except BaseException as exc:
            if isinstance(getattr(exc, "result", None), dict):
                result = exc.result
            status = "timeout" if isinstance(exc, TimeoutError) else "failed"
            # A timed-out transport must attest that the WHOLE process tree
            # stopped. Otherwise preserve the global reservation indefinitely.
            if getattr(self.runtime, "termination_confirmed", False) is not True:
                release = False
            self.ledger.pause()
            raise
        finally:
            u = usage_fields(result)
            with self.ledger.connect() as db:
                db.execute("""UPDATE calls SET status=?,duration_seconds=?,effective_model=?,
                    input_tokens=?,cached_input_tokens=?,output_tokens=?,metric_source=?,estimates=?
                    WHERE id=?""", (status if release else "reserved", self.monotonic() - started,
                    result.get("effective_model") if isinstance(result.get("effective_model"), str) else None,
                    u["input_tokens"], u["cached_input_tokens"],
                    u["output_tokens"], u["metric_source"], json.dumps(u["estimates"]), call_id))
                db.execute("UPDATE jobs SET state=?,artifact=?,validation=? WHERE id=?",
                           (state, result.get("artifact") if isinstance(result.get("artifact"), str) else None,
                            json.dumps(validation), job_id))


class MockRuntime:
    is_mock = True
    termination_confirmed = True

    def __init__(self, *, model="mock-economy", now=None):
        self.capability = Capability(model, ("low",), True, "mock fixture, NOT account evidence",
                                     (time.time() if now is None else now) + 3600)
        self.calls = []

    def generate(self, prompt, *, model, effort, timeout):
        self.calls.append({"prompt": prompt, "model": model, "effort": effort, "timeout": timeout})
        return {"artifact": "<!doctype html><html lang='pt-BR'><title>Mock</title></html>",
                "effective_model": model,
                "usage": {"source": "runtime", "input_total": 100, "input_cached": 40, "output": 20}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("status", "mock-demo"))
    parser.add_argument("--state", type=Path)
    args = parser.parse_args()
    if args.action == "status":
        if args.state is None:
            print(json.dumps({"paused": True, "production_adapter": "unavailable",
                              "model": None, "budget": "unknown", "production_verified": False}))
        else:
            print(json.dumps(Ledger(args.state).status(), ensure_ascii=False))
        return
    if args.state is not None:
        parser.error("mock-demo always uses a disposable simulation ledger")
    import tempfile
    with tempfile.TemporaryDirectory(prefix="frontstep-mock-") as folder:
        ledger = Ledger(Path(folder) / "simulation.sqlite", simulation=True)
        ledger.allow_simulation()
        now = time.time()
        runtime = MockRuntime(now=now)
        reading = Reading(2, 2, True, "runtime", now, "mock-authorization", "local-backup")
        executor = Executor(ledger, Policy(paused=False, model="mock-economy"), runtime, lambda: reading)
        executor.run("mock-job", {"business": "Mock"}, validator=lambda _: ["mock repair needed"])
        executor.run("mock-job", {"business": "Mock"}, phase="repair", validator=lambda _: [])
        print(json.dumps({"simulation_only": True, **ledger.status()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
