import json
import sqlite3
import subprocess
import sys
import tempfile
import threading
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from executor import Blocked, Executor, Ledger, MockRuntime, Policy, Reading, usage_fields
from process_transport import JsonProcessTransport, TerminationUnconfirmed


class ExecutorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-test-")
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "test.sqlite"
        self.ledger = Ledger(self.path, simulation=True)
        self.ledger.allow_simulation()
        self.now = 1000.0
        self.policy = Policy(paused=False, model="mock-economy")
        self.runtime = MockRuntime(now=self.now)
        self.reading = Reading(10, 10, True, "runtime", self.now, "mock-budget", "local-backup")
        self.executor = self.make_executor()

    def make_executor(self, *, ledger=None):
        return Executor(ledger or self.ledger, self.policy, self.runtime, lambda: self.reading,
                        clock=lambda: self.now)

    def run_job(self, job="j1", brief=None, *, phase="initial", validator=lambda _: []):
        return self.executor.run(job, brief or {"name": "Test"}, phase=phase, validator=validator)

    def blocked_without_call(self, expected, **kwargs):
        with self.assertRaisesRegex(Blocked, expected):
            self.run_job(**kwargs)
        self.assertEqual(self.runtime.calls, [])

    def test_only_one_repair_across_restart(self):
        self.run_job(validator=lambda _: ["missing CTA"])
        self.executor = self.make_executor(ledger=Ledger(self.path, simulation=True))
        self.run_job(phase="repair", validator=lambda _: ["still missing CTA"])
        with self.assertRaisesRegex(Blocked, "phase_already_reserved"):
            self.run_job(phase="repair")
        calls = self.ledger.status()["calls"]
        self.assertEqual([r["phase"] for r in calls], ["initial", "repair"])
        self.assertEqual([r["attempt"] for r in calls], [1, 2])
        self.assertEqual(len(self.runtime.calls), 2)
        self.assertEqual(self.ledger.status()["jobs"][0]["state"], "rejected")

    def test_repair_requires_failed_validation(self):
        self.blocked_without_call("repair_not_allowed", phase="repair")
        self.run_job()
        with self.assertRaisesRegex(Blocked, "repair_not_allowed"):
            self.run_job(phase="repair")
        self.assertEqual(len(self.runtime.calls), 1)

    def test_invalid_other_ai_phase(self):
        for phase in ("plan", "status", "audit", "retry", "image"):
            self.blocked_without_call("invalid_phase", phase=phase)

    def test_retry_and_restart_do_not_reset_failed_attempt(self):
        self.runtime.generate = Mock(side_effect=RuntimeError("simulated network failure"))
        with self.assertRaisesRegex(RuntimeError, "simulated"):
            self.run_job()
        self.assertTrue(self.ledger.status()["paused"])
        self.ledger.allow_simulation()
        self.executor = self.make_executor(ledger=Ledger(self.path, simulation=True))
        with self.assertRaisesRegex(Blocked, "phase_already_reserved"):
            self.run_job()
        self.assertEqual(self.runtime.generate.call_count, 1)
        self.assertIsNone(self.ledger.status()["calls"][0]["input_tokens"])

    def test_default_policy_paused(self):
        self.executor.policy = Policy()
        self.blocked_without_call("generation_paused")

    def test_durable_pause_survives_restart(self):
        self.ledger.pause()
        self.executor = self.make_executor(ledger=Ledger(self.path, simulation=True))
        self.blocked_without_call("generation_paused")

    def test_live_ledger_has_no_resume(self):
        live = Ledger(Path(self.tmp.name) / "live.sqlite")
        with self.assertRaisesRegex(Blocked, "live_resume_not_implemented"):
            live.allow_simulation()
        self.assertTrue(live.status()["paused"])
        with self.assertRaisesRegex(Blocked, "ledger_mode_mismatch"):
            Ledger(live.path, simulation=True)

    def test_live_adapter_always_blocked_even_with_mock_evidence(self):
        live = Ledger(Path(self.tmp.name) / "live.sqlite")
        self.executor = self.make_executor(ledger=live)
        self.blocked_without_call("production_adapter_not_audited")

    def test_no_production_runtime(self):
        self.executor.runtime = None
        self.blocked_without_call("production_adapter_unavailable")

    def test_invalid_model_no_fallback(self):
        for model in (None, "opus", "expensive", "mock-economy-typo"):
            self.executor.policy = replace(self.policy, model=model)
            self.blocked_without_call("model_unavailable")

    def test_invalid_or_unsupported_effort(self):
        for effort in ("auto", "max", "", "high", "medium"):
            self.executor.policy = replace(self.policy, effort=effort)
            self.blocked_without_call("invalid_effort")

    def test_availability_must_have_fresh_non_generation_evidence(self):
        cap = self.runtime.capability
        for changed in (replace(cap, expires_at=999), replace(cap, availability_source=""),
                        replace(cap, economical=False)):
            self.runtime.capability = changed
            self.blocked_without_call("model_availability_unconfirmed")

    def test_adapter_cannot_add_retries_tools_or_multiple_generations(self):
        cap = self.runtime.capability
        for changed in (replace(cap, automatic_retries=1), replace(cap, tools_disabled=False),
                        replace(cap, single_request=False)):
            self.runtime.capability = changed
            self.blocked_without_call("runtime_can_bypass_call_limit")

    def test_unknown_or_insufficient_budget(self):
        original = self.reading
        for field in ("authorized_calls", "remaining_calls"):
            self.reading = replace(original, **{field: None})
            self.blocked_without_call("budget_unknown")
            self.reading = replace(original, **{field: 0})
            self.blocked_without_call("budget_insufficient")
        self.reading = replace(original, authorization_id=None)
        self.blocked_without_call("budget_authorization_unknown")

    def test_measurement_unavailable_or_estimated(self):
        self.reading = replace(self.reading, measurement_available=False)
        self.blocked_without_call("measurement_unavailable")
        self.reading = replace(self.reading, measurement_available=True, source="estimate")
        self.blocked_without_call("measurement_unavailable")

    def test_stale_and_future_budget_readings(self):
        for timestamp in (900, 1001, float("nan")):
            self.reading = replace(self.reading, observed_at=timestamp)
            self.blocked_without_call("budget_reading_expired")

    def test_offline_main_is_not_proof_of_handoff(self):
        self.reading = replace(self.reading, exclusive_owner=None)
        self.blocked_without_call("exclusive_handoff_unconfirmed")

    def test_budget_rechecked_before_repair(self):
        self.run_job(validator=lambda _: ["fix"])
        self.reading = replace(self.reading, remaining_calls=0)
        with self.assertRaisesRegex(Blocked, "budget_insufficient"):
            self.run_job(phase="repair")
        self.assertEqual(len(self.runtime.calls), 1)

    def test_authorization_revoked_after_reservation_before_call(self):
        readings = iter([self.reading, replace(self.reading, remaining_calls=0)])
        self.executor.read_budget = lambda: next(readings)
        self.blocked_without_call("budget_insufficient")
        self.assertEqual(len(self.ledger.status()["calls"]), 1)
        self.assertTrue(self.ledger.status()["paused"])

    def test_pause_after_reservation_before_call(self):
        def check():
            self.ledger.pause()
            return self.reading
        original = self.executor._preflight
        counter = 0
        def preflight():
            nonlocal counter
            counter += 1
            if counter == 2:
                check()
            return original()
        self.executor._preflight = preflight
        self.blocked_without_call("generation_paused")

    def test_duplicate_brief_and_changed_brief(self):
        self.run_job()
        with self.assertRaisesRegex(Blocked, "duplicate_brief"):
            self.run_job("j2")
        with self.assertRaisesRegex(Blocked, "job_id_reused_with_changed_brief"):
            self.run_job(brief={"changed": True})
        self.assertEqual(len(self.runtime.calls), 1)

    def test_concurrency_uses_independent_ledger_connections(self):
        entered, release = threading.Event(), threading.Event()
        original = self.runtime.generate
        results = []
        def slow(*args, **kwargs):
            entered.set()
            if not release.wait(5):
                raise TimeoutError("test coordination timeout")
            return original(*args, **kwargs)
        self.runtime.generate = slow
        self.reading = replace(self.reading, authorized_calls=1, remaining_calls=1)
        def first():
            try:
                results.append(self.run_job())
            except BaseException as exc:
                results.append(exc)
        thread = threading.Thread(target=first)
        thread.start()
        try:
            self.assertTrue(entered.wait(5))
            other = self.make_executor(ledger=Ledger(self.path, simulation=True))
            with self.assertRaisesRegex(Blocked, "executor_busy_or_interrupted"):
                other.run("j2", {"different": True}, validator=lambda _: [])
        finally:
            release.set()
            thread.join(5)
        self.assertFalse(thread.is_alive())
        self.assertEqual(results[0]["state"], "complete")
        with self.assertRaisesRegex(Blocked, "budget_insufficient"):
            self.run_job("j2", {"different": True})
        self.assertEqual(len(self.runtime.calls), 1)

    def test_unknown_crash_reservation_never_expires_on_restart(self):
        original = self.runtime.generate
        def crash(*args, **kwargs):
            original(*args, **kwargs)
            self.runtime.termination_confirmed = False
            raise SystemExit("simulated crash")
        self.runtime.generate = crash
        with self.assertRaises(SystemExit):
            self.run_job()
        self.now += 100
        self.reading = replace(self.reading, observed_at=self.now)
        self.ledger.allow_simulation()
        self.executor = self.make_executor(ledger=Ledger(self.path, simulation=True))
        with self.assertRaisesRegex(Blocked, "executor_busy_or_interrupted"):
            self.run_job("j2", {"different": True})
        self.assertEqual(self.ledger.status()["calls"][0]["status"], "reserved")

    def test_recorded_usage_unknown_effective_model_and_cache_not_counted_twice(self):
        original = self.runtime.generate
        def without_model(*args, **kwargs):
            result = original(*args, **kwargs)
            del result["effective_model"]
            return result
        self.runtime.generate = without_model
        self.run_job()
        row = self.ledger.status()["calls"][0]
        self.assertEqual((row["input_tokens"], row["cached_input_tokens"], row["output_tokens"]), (100, 40, 20))
        self.assertEqual(row["input_tokens"] + row["output_tokens"], 120)
        self.assertIsNone(row["effective_model"])
        self.assertEqual(row["metric_source"], "runtime")
        self.assertEqual(row["requested_model"], "mock-economy")
        self.assertEqual(row["job_id"], "j1")
        self.assertGreaterEqual(row["duration_seconds"], 0)

    def test_missing_metrics_are_unknown_and_block_future_calls(self):
        self.runtime.generate = Mock(return_value={"artifact": "mock", "usage": {"source": "runtime"}})
        with self.assertRaisesRegex(Blocked, "runtime_measurement_missing"):
            self.run_job()
        row = self.ledger.status()["calls"][0]
        for field in ("input_tokens", "cached_input_tokens", "output_tokens", "effective_model"):
            self.assertIsNone(row[field])
        self.assertTrue(self.ledger.status()["paused"])

    def test_estimates_are_separate_and_not_runtime_metrics(self):
        fields = usage_fields({"usage": {"input_total": 99, "source": "estimate", "estimates": {"input": 99}}})
        self.assertIsNone(fields["input_tokens"])
        self.assertEqual(fields["metric_source"], "unknown")
        self.assertEqual(fields["estimates"], {"input": 99})
        self.assertIsNone(usage_fields({})["cached_input_tokens"])
        self.assertEqual(usage_fields({"usage": {"source": "runtime", "input_cached": 0}})["cached_input_tokens"], 0)

    def test_effective_model_mismatch_is_recorded_and_pauses(self):
        self.runtime.generate = Mock(return_value={"effective_model": "expensive-model"})
        with self.assertRaisesRegex(Blocked, "effective_model_mismatch"):
            self.run_job()
        self.assertTrue(self.ledger.status()["paused"])
        self.assertEqual(self.ledger.status()["calls"][0]["effective_model"], "expensive-model")
        self.assertEqual(self.runtime.generate.call_count, 1)

    def test_invalid_cache_measurement(self):
        self.runtime.generate = Mock(return_value={"usage": {"source": "runtime", "input_total": 1,
                                                            "input_cached": 2, "output": 0}})
        with self.assertRaisesRegex(Blocked, "invalid_cache_measurement"):
            self.run_job()
        self.assertTrue(self.ledger.status()["paused"])

    def test_prompt_has_no_session_history_and_is_bounded(self):
        self.run_job(validator=lambda _: ["fix"])
        self.run_job(phase="repair")
        second = json.loads(self.runtime.calls[1]["prompt"])
        self.assertEqual(set(second), {"brief", "phase", "response", "artifact", "validation"})
        self.assertNotIn("history", second)
        self.assertEqual(self.runtime.calls[0]["timeout"], 60)
        with self.assertRaisesRegex(Blocked, "prompt_too_large"):
            self.run_job("j3", {"name": "x" * 24000})
        self.assertEqual(len(self.runtime.calls), 2)

    def test_nan_and_infinite_timeout_invalid(self):
        for timeout in (float("nan"), float("inf"), 0, -1, 301, True):
            self.executor.policy = replace(self.policy, timeout_seconds=timeout)
            self.blocked_without_call("invalid_timeout")

    def test_transport_timeout_is_logged_and_not_retried(self):
        fake_process = Mock(pid=123, returncode=None)
        fake_process.communicate.side_effect = subprocess.TimeoutExpired("mock", 1)
        kill = Mock()
        transport = JsonProcessTransport(["mock-only"], cwd=self.tmp.name,
                                         popen=Mock(return_value=fake_process), terminate_tree=kill)
        def generate(*args, **kwargs):
            try:
                return transport.request({"mock": True}, 1)
            finally:
                self.runtime.termination_confirmed = transport.termination_confirmed
        self.runtime.generate = Mock(side_effect=generate)
        with self.assertRaisesRegex(TimeoutError, "runtime_timeout"):
            self.run_job()
        kill.assert_called_once_with(fake_process)
        self.assertTrue(transport.termination_confirmed)
        self.assertEqual(self.runtime.generate.call_count, 1)
        self.assertEqual(self.ledger.status()["calls"][0]["status"], "timeout")
        self.assertTrue(self.ledger.status()["paused"])

    def test_unconfirmed_process_tree_termination_blocks_ledger(self):
        fake_process = Mock(pid=123)
        fake_process.communicate.side_effect = subprocess.TimeoutExpired("mock", 1)
        transport = JsonProcessTransport(["mock-only"], cwd=self.tmp.name,
                popen=Mock(return_value=fake_process), terminate_tree=Mock(side_effect=OSError("mock kill failed")))
        def generate(*args, **kwargs):
            try:
                return transport.request({}, 1)
            finally:
                self.runtime.termination_confirmed = transport.termination_confirmed
        self.runtime.generate = generate
        with self.assertRaises(TerminationUnconfirmed):
            self.run_job()
        self.assertFalse(transport.termination_confirmed)
        self.assertEqual(self.ledger.status()["calls"][0]["status"], "reserved")
        self.assertTrue(self.ledger.status()["paused"])


if __name__ == "__main__":
    unittest.main()
