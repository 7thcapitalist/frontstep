"""Recovery evidence across disposable Python processes, exclusively with mocks.

No server, queue consumer, network, production runtime or credential is used.
The child entry point is a test fixture, not an executor launcher.
"""
import json
import os
from pathlib import Path
import queue
import socket
import subprocess
import sys
import tempfile
import threading
import unittest
from dataclasses import replace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from executor import Blocked, Executor, Ledger, MockRuntime, Policy, Reading

BRIEF = {"name": "Synthetic recovery fixture"}


def fixture(action, database):
    def forbidden_network(*args, **kwargs):
        raise AssertionError("network forbidden in recovery fixture")
    socket.socket = forbidden_network
    socket.create_connection = forbidden_network
    ledger = Ledger(database, simulation=True)
    runtime = MockRuntime(now=1000)
    reading = Reading(2, 2, True, "runtime", 1000, "synthetic-permit", "local-backup")
    engine = Executor(ledger, Policy(paused=False, model="mock-economy"), runtime,
                      lambda: reading, clock=lambda: 1000)
    evidence = {"pid": os.getpid(), "simulation_only": True, "queue": "not_exercised_by_this_fixture"}

    def blocked(name, callback):
        try:
            callback()
        except Blocked as exc:
            evidence[name] = str(exc)
        else:
            raise AssertionError("expected block: " + name)

    def run(job="recovery-job", phase="initial", validator=lambda _: []):
        return engine.run(job, BRIEF, phase=phase, validator=validator)

    if action == "seed":
        evidence["initially_paused"] = ledger.status()["paused"]
        blocked("pause_block", run)
        ledger.allow_simulation()  # Only the disposable, mode-tagged mock ledger.
        evidence["initial"] = run(validator=lambda _: ["synthetic repair needed"])["state"]
    elif action == "recover":
        evidence["restored"] = ledger.status()
        blocked("duplicate_phase", run)
        blocked("duplicate_brief", lambda: run("duplicate-job"))
        reading = replace(reading, remaining_calls=None)
        blocked("budget_unknown", lambda: run(phase="repair"))
        reading = replace(reading, remaining_calls=2)
        evidence["repair"] = run(phase="repair", validator=lambda _: ["synthetic rejection"])["state"]
        blocked("third_attempt", lambda: run(phase="repair"))
        evidence["mock_calls_this_process"] = len(runtime.calls)
        ledger.pause()
    elif action == "hold":
        ledger.allow_simulation()
        def hold(*args, **kwargs):
            print(json.dumps({"ready": True, "pid": os.getpid()}), flush=True)
            sys.stdin.read()  # Parent terminates ONLY this disposable fixture.
            raise AssertionError("fixture must be terminated while reserved")
        runtime.generate = hold
        run()
    elif action == "contend":
        blocked("exclusive_lock", lambda: run("competing-job"))
        evidence["mock_calls_this_process"] = len(runtime.calls)
    else:
        raise AssertionError("unknown fixture action")
    evidence["ledger"] = ledger.status()
    print(json.dumps(evidence), flush=True)


class ProcessRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-process-test-")
        self.addCleanup(self.tmp.cleanup)
        self.database = str(Path(self.tmp.name) / "simulation.sqlite")
        # Do not forward application credentials to the fixture children.
        self.env = {key: os.environ[key] for key in ("SystemRoot", "WINDIR", "TEMP", "TMP")
                    if key in os.environ}

    def command(self, action):
        return [sys.executable, "-I", "-B", str(Path(__file__).resolve()),
                "--fixture", action, self.database]

    def child(self, action):
        result = subprocess.run(self.command(action), capture_output=True, text=True,
                                env=self.env, timeout=15, check=True)
        return json.loads(result.stdout)

    def test_separate_process_recovers_pending_job_ledger_and_remaining_repair_only(self):
        seed = self.child("seed")
        self.assertTrue(seed["initially_paused"])
        self.assertEqual(seed["pause_block"], "generation_paused")
        self.assertEqual(seed["initial"], "needs_repair")
        recovered = self.child("recover")  # New process after seed has exited.
        self.assertEqual(recovered["restored"], seed["ledger"])
        self.assertEqual(recovered["queue"], "not_exercised_by_this_fixture")
        self.assertEqual(recovered["duplicate_phase"], "phase_already_reserved")
        self.assertEqual(recovered["duplicate_brief"], "duplicate_brief")
        self.assertEqual(recovered["budget_unknown"], "budget_unknown")
        self.assertEqual(recovered["repair"], "rejected")
        self.assertEqual(recovered["third_attempt"], "phase_already_reserved")
        self.assertEqual(recovered["mock_calls_this_process"], 1)
        self.assertEqual([c["attempt"] for c in recovered["ledger"]["calls"]], [1, 2])
        self.assertTrue(recovered["ledger"]["paused"])

    def test_other_process_is_blocked_before_and_after_owned_fixture_is_terminated(self):
        process = subprocess.Popen(self.command("hold"), stdin=subprocess.PIPE,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True, env=self.env)
        ready = queue.Queue()
        reader = threading.Thread(target=lambda: ready.put(process.stdout.readline()), daemon=True)
        reader.start()
        try:
            message = json.loads(ready.get(timeout=10))
            self.assertTrue(message["ready"])
            while_alive = self.child("contend")
            self.assertEqual(while_alive["exclusive_lock"], "executor_busy_or_interrupted")
            self.assertEqual(while_alive["mock_calls_this_process"], 0)
        finally:
            # This PID belongs to this test, has never called a model, and is
            # deliberately blocked on fixture stdin. No service PID is touched.
            if process.poll() is None:
                process.kill()
            process.communicate(timeout=5)
            reader.join(timeout=1)
        after_exit = self.child("contend")
        self.assertEqual(after_exit["exclusive_lock"], "executor_busy_or_interrupted")
        self.assertEqual(after_exit["mock_calls_this_process"], 0)
        self.assertEqual(after_exit["ledger"]["calls"], while_alive["ledger"]["calls"])
        self.assertEqual(after_exit["ledger"]["calls"][0]["status"], "reserved")
        self.assertIsNone(after_exit["ledger"]["calls"][0]["input_tokens"])


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--fixture":
        fixture(sys.argv[2], sys.argv[3])
    else:
        unittest.main()
