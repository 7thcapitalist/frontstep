"""Durable queue tests. Child processes are disposable, offline mock fixtures."""
import hashlib
import json
import os
from pathlib import Path
import queue
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import unittest
from contextlib import closing

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from durable_queue import Claim, DurableQueue
from executor import Blocked, Executor, Ledger, MockRuntime, Policy, Reading


def engine(ledger):
    runtime = MockRuntime(now=1000)
    permit = Reading(10, 10, True, "runtime", 1000, "queue-fixture-permit", "local-backup")
    return Executor(ledger, Policy(paused=False, model="mock-economy"), runtime,
                    lambda: permit, clock=lambda: 1000)


def child_fixture(action, database, token=None):
    def forbidden(*args, **kwargs):
        raise AssertionError("network forbidden in queue fixture")
    socket.socket = socket.create_connection = forbidden
    ledger = Ledger(database, simulation=True)
    pending = DurableQueue(ledger, clock=lambda: 1000)
    runner = engine(ledger)
    result = {"simulation_only": True, "pid": os.getpid()}

    def blocked(name, callback):
        try:
            callback()
        except Blocked as exc:
            result[name] = str(exc)
        else:
            raise AssertionError("expected block: " + name)

    def barrier(claim=None):
        print(json.dumps({"ready": True, "token": claim.token if claim else None}), flush=True)
        sys.stdin.readline()

    if action == "seed":
        pending.enqueue("first", {"synthetic": "first"})
        pending.enqueue("second", {"synthetic": "second"})
        pending.enqueue("first", {"synthetic": "first"})
    elif action == "drain":
        result["restored"] = pending.items()
        blocked("paused_acquisition", pending.acquire)
        ledger.allow_simulation()
        result["order"] = []
        for _ in range(2):
            claim = pending.acquire()
            result["order"].append(claim.job_id)
            pending.run_claim(claim, runner, validator=lambda _: [])
            pending.acknowledge(claim)
        assert pending.acquire() is None
        ledger.pause()
    elif action == "race":
        ledger.allow_simulation()
        barrier()
        try:
            claim = pending.acquire()
            result["acquired"] = claim.job_id
        except Blocked as exc:
            result["blocked"] = str(exc)
    elif action in ("hold_before", "hold_during", "hold_after"):
        pending.enqueue("held", {"synthetic": "held"})
        ledger.allow_simulation()
        claim = pending.acquire()
        if action == "hold_before":
            barrier(claim)
        elif action == "hold_during":
            def uncertain(*args, **kwargs):
                barrier(claim)  # The call reservation is already committed.
                raise AssertionError("parent must terminate this mock fixture")
            runner.runtime.generate = uncertain
            pending.run_claim(claim, runner, validator=lambda _: [])
        else:
            pending.run_claim(claim, runner, validator=lambda _: [])
            barrier(claim)  # Known result persisted; acknowledgement not done.
        raise AssertionError("parent must terminate this mock fixture")
    elif action == "resume_before":
        blocked("new_acquisition", pending.acquire)
        claim = pending.resume(Claim("held", token))
        result["same_token"] = claim.token == token
        pending.run_claim(claim, runner, validator=lambda _: [])
        pending.acknowledge(claim)
        ledger.pause()
    elif action == "resume_after":
        claim = pending.resume(Claim("held", token))
        blocked("reexecute", lambda: pending.run_claim(claim, runner, validator=lambda _: []))
        pending.acknowledge(claim)
        ledger.pause()
    elif action == "uncertain":
        before = ledger.status()["calls"]
        claim = Claim("held", token)
        blocked("new_acquisition", pending.acquire)
        blocked("resume", lambda: pending.resume(claim))
        blocked("run", lambda: pending.run_claim(claim, runner, validator=lambda _: []))
        blocked("ack", lambda: pending.acknowledge(claim))
        assert ledger.status()["calls"] == before
        ledger.pause()
    else:
        raise AssertionError("unknown fixture")
    result.update(items=pending.items(), ledger=ledger.status(), mock_calls=len(runner.runtime.calls))
    print(json.dumps(result), flush=True)


class QueueTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-queue-test-")
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "simulation.sqlite"
        self.ledger = Ledger(self.path, simulation=True)
        self.pending = DurableQueue(self.ledger, clock=lambda: 1000)

    def test_registration_is_durable_and_idempotent_while_generation_remains_paused(self):
        self.pending.enqueue("j1", {"synthetic": 1})
        self.pending.enqueue("j1", {"synthetic": 1})
        with self.assertRaisesRegex(Blocked, "job_id_reused"):
            self.pending.enqueue("j1", {"synthetic": 2})
        with self.assertRaisesRegex(Blocked, "duplicate_brief"):
            self.pending.enqueue("j2", {"synthetic": 1})
        restored = DurableQueue(Ledger(self.path, simulation=True))
        self.assertEqual(restored.items(), [{"job_id": "j1", "state": "queued", "claimed": False}])
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            restored.acquire()
        self.assertTrue(self.ledger.status()["paused"])
        self.assertEqual(self.ledger.status()["calls"], [])

    def test_queue_uses_same_jobs_and_respects_existing_call_limit_and_wrong_claim(self):
        self.pending.enqueue("j1", {"synthetic": 1})
        self.ledger.allow_simulation()
        claim = self.pending.acquire()
        runner = engine(self.ledger)
        with self.assertRaisesRegex(Blocked, "queue_executor_owned"):
            runner.run("other", {"synthetic": 2}, validator=lambda _: [])
        with self.assertRaisesRegex(Blocked, "queue_executor_owned"):
            runner.run("j1", {"synthetic": 1}, validator=lambda _: [])
        with self.assertRaisesRegex(Blocked, "stale_queue_claim"):
            self.pending.resume(Claim("j1", "wrong-token"))
        self.pending.run_claim(claim, runner, validator=lambda _: ["synthetic defect"])
        self.assertEqual(self.pending.resume(claim), claim)
        with self.assertRaisesRegex(Blocked, "queue_job_not_terminal"):
            self.pending.acknowledge(claim)
        self.pending.run_claim(claim, runner, validator=lambda _: ["synthetic defect"])
        with self.assertRaisesRegex(Blocked, "queue_state_not_executable"):
            self.pending.run_claim(claim, runner, validator=lambda _: [])
        self.assertEqual(self.pending.acknowledge(claim), "rejected")
        self.assertEqual(len(runner.runtime.calls), 2)
        self.assertEqual(len(self.ledger.status()["jobs"]), 1)
        with self.ledger.connect() as db:
            tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertEqual(tables, {"meta", "jobs", "calls"})

    def test_missing_budget_keeps_claim_and_never_calls_mock(self):
        self.pending.enqueue("j1", {"synthetic": 1})
        self.ledger.allow_simulation()
        claim = self.pending.acquire()
        runner = engine(self.ledger)
        runner.read_budget = lambda: Reading()
        with self.assertRaisesRegex(Blocked, "budget_authorization_unknown"):
            self.pending.run_claim(claim, runner, validator=lambda _: [])
        self.assertEqual(runner.runtime.calls, [])
        self.assertEqual(self.ledger.status()["calls"], [])
        self.assertTrue(self.pending.items()[0]["claimed"])
        self.assertEqual(self.pending.resume(claim), claim)

    def test_migration_attaches_legacy_request_without_resetting_completed_job(self):
        legacy = Path(self.tmp.name) / "legacy.sqlite"
        encoded = json.dumps({"synthetic": "legacy"}, sort_keys=True, ensure_ascii=False, allow_nan=False)
        with closing(sqlite3.connect(legacy)) as db:
            with db:
                db.execute("CREATE TABLE jobs(id TEXT PRIMARY KEY,digest TEXT UNIQUE NOT NULL,state TEXT NOT NULL,artifact TEXT,validation TEXT)")
                db.execute("INSERT INTO jobs VALUES (?,?, 'complete','preserved artifact','[]')",
                           ("legacy", hashlib.sha256(encoded.encode()).hexdigest()))
        migrated = Ledger(legacy, simulation=True)
        pending = DurableQueue(migrated)
        pending.enqueue("legacy", {"synthetic": "legacy"})
        self.assertEqual(pending.items()[0]["state"], "complete")
        with migrated.connect() as db:
            self.assertEqual(db.execute("SELECT artifact FROM jobs WHERE id='legacy'").fetchone()[0], "preserved artifact")
        migrated.allow_simulation()
        self.assertIsNone(pending.acquire())


class QueueProcessTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-queue-process-")
        self.addCleanup(self.tmp.cleanup)
        self.database = str(Path(self.tmp.name) / "simulation.sqlite")
        self.env = {key: os.environ[key] for key in ("SystemRoot", "WINDIR", "TEMP", "TMP") if key in os.environ}
        self.flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0

    def command(self, action, token=None):
        return [sys.executable, "-I", "-B", str(Path(__file__).resolve()), "--fixture", action,
                self.database] + ([token] if token is not None else [])

    def child(self, action, token=None):
        result = subprocess.run(self.command(action, token), capture_output=True, text=True,
                                env=self.env, creationflags=self.flags, timeout=15, check=True)
        return json.loads(result.stdout)

    @staticmethod
    def stop_owned_fixture(process):
        if process.poll() is None:
            process.kill()
        process.communicate(timeout=5)

    def held(self, action):
        process = subprocess.Popen(self.command(action), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, text=True, env=self.env, creationflags=self.flags)
        self.addCleanup(self.stop_owned_fixture, process)
        output = queue.Queue()
        reader = threading.Thread(target=lambda: output.put(process.stdout.readline()), daemon=True)
        reader.start()
        ready = json.loads(output.get(timeout=10))
        reader.join(timeout=1)
        self.assertTrue(ready["ready"])
        return process, ready

    def test_fifo_requests_persist_across_process_exit_and_are_consumed_once(self):
        seed = self.child("seed")
        self.assertTrue(seed["ledger"]["paused"])
        drained = self.child("drain")
        self.assertEqual(drained["restored"], seed["items"])
        self.assertEqual(drained["paused_acquisition"], "generation_paused")
        self.assertEqual(drained["order"], ["first", "second"])
        self.assertEqual(drained["mock_calls"], 2)
        self.assertTrue(all(row["state"] == "complete" for row in drained["items"]))
        self.assertTrue(drained["ledger"]["paused"])

    def test_two_processes_racing_acquisition_have_exactly_one_winner(self):
        self.child("seed")
        first, _ = self.held("race")
        second, _ = self.held("race")
        for process in (first, second):
            process.stdin.write("go\n")
            process.stdin.flush()
        replies = []
        for process in (first, second):
            out, err = process.communicate(timeout=10)
            self.assertEqual(process.returncode, 0, err)
            replies.append(json.loads(out))
        self.assertEqual(sum("acquired" in item for item in replies), 1)
        self.assertEqual(sum(item.get("blocked") == "queue_executor_owned" for item in replies), 1)
        self.assertTrue(all(item["mock_calls"] == 0 for item in replies))

    def test_crash_before_call_resumes_same_claim_without_force_unlock(self):
        process, ready = self.held("hold_before")
        self.stop_owned_fixture(process)
        resumed = self.child("resume_before", ready["token"])
        self.assertEqual(resumed["new_acquisition"], "queue_executor_owned")
        self.assertTrue(resumed["same_token"])
        self.assertEqual(resumed["mock_calls"], 1)
        self.assertEqual(resumed["items"][0]["state"], "complete")

    def test_crash_during_call_is_blocked_for_reconciliation_without_replay(self):
        process, ready = self.held("hold_during")
        self.stop_owned_fixture(process)
        result = self.child("uncertain", ready["token"])
        for operation in ("new_acquisition", "resume", "run", "ack"):
            self.assertEqual(result[operation], "queue_reconciliation_required")
        self.assertEqual(result["mock_calls"], 0)
        self.assertEqual(len(result["ledger"]["calls"]), 1)
        self.assertEqual(result["ledger"]["calls"][0]["status"], "reserved")
        self.assertIsNone(result["ledger"]["calls"][0]["input_tokens"])
        self.assertTrue(result["items"][0]["claimed"])

    def test_crash_after_known_result_only_acknowledges_without_another_call(self):
        process, ready = self.held("hold_after")
        self.stop_owned_fixture(process)
        result = self.child("resume_after", ready["token"])
        self.assertEqual(result["reexecute"], "queue_state_not_executable")
        self.assertEqual(result["mock_calls"], 0)
        self.assertEqual(len(result["ledger"]["calls"]), 1)
        self.assertFalse(result["items"][0]["claimed"])


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "--fixture":
        child_fixture(*sys.argv[2:])
    else:
        unittest.main()
