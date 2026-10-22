import contextlib
import io
import json
import sys
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import manual_flow
import test_site_builder as fixtures
from durable_queue import DurableQueue
from build_contract import admit_build
from executor import Blocked, Executor, Ledger, Policy, Reading
from import_resources import import_pack
from messages_runtime import MessagesRuntime
from site_builder import REFERENCE_PATHS, SiteBuilder


class ManualFlowTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="frontstep-manual-mock-")
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.pack = self.root / "pack"
        entries = [(name, "mock", b"Mock reference") for name in REFERENCE_PATHS]
        entries += [("design-kit/runtime/public/frontstep-motion.js", "mock", b"// mock"),
                    ("design-kit/fonts/mock.woff2", "mock", b"MOCK_FONT")]
        import_pack(entries, self.pack)
        self.ledger = Ledger(self.root / "simulation.sqlite", simulation=True)
        self.ledger.allow_simulation()
        self.queue = DurableQueue(self.ledger)
        self.transport = fixtures.FakeMessages([fixtures.response(), fixtures.response()])
        self.reading = Reading(2, 2, True, "runtime", 1000, "mock-only", "local-backup")
        self.executor = Executor(self.ledger, Policy(paused=False, model="fixture-model", max_prompt_chars=240000),
            MessagesRuntime(fixtures.capability(), self.transport, max_output_tokens=8192),
            lambda: self.reading, clock=lambda: 1000)
        self.qa = fixtures.FakeQa()
        self.builder = SiteBuilder(self.executor, resources=self.pack, work_root=self.root / "work",
                                   qa=self.qa, media_root=self.root / "media")
        self.brief = {"slug": "mock-clinic", "business": {"name": "Mock", "niche": "clinica", "city": "Teste"},
                      "contact": {"whatsapp": "5500000000000"}}
        self.identity = {"construction_id": "client-001", "revision_id": "r1"}
        # Every test fails immediately if application code attempts networking or
        # a process. Existing transport tests cover separately simulated processes.
        for name in ("socket.socket", "subprocess.Popen", "http.client.HTTPSConnection"):
            patcher = patch(name, side_effect=AssertionError("mock-only manual flow"))
            patcher.start()
            self.addCleanup(patcher.stop)

    def submit(self):
        return manual_flow.submit(self.queue, self.builder, self.brief, **self.identity)

    def calls(self):
        with self.ledger.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM calls ORDER BY id")]

    def test_paused_admission_is_idempotent_and_does_not_construct_or_call(self):
        self.ledger.pause()
        job = self.submit()
        self.assertEqual(self.submit(), job)
        self.assertEqual(len(self.queue.items()), 1)
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            self.queue.acquire()
        self.assertFalse((self.root / "work").exists())
        self.assertEqual(self.transport.calls, [])
        self.assertEqual(self.calls(), [])

    def test_brief_queue_files_qa_usage_and_ack_share_one_job(self):
        job = self.submit()
        claim = self.queue.acquire()
        outcome = manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(outcome["job_id"], job)
        self.assertEqual(outcome["state"], "awaiting_visual_review")
        self.assertTrue(outcome["simulation_only"])
        self.assertFalse(outcome["published"])
        self.assertTrue((Path(outcome["site"]) / "index.html").exists())
        self.assertEqual(self.queue.items(), [{"job_id": job, "state": "complete", "claimed": False}])
        self.assertIsNone(self.queue.acquire())
        self.assertEqual(self.submit(), job)
        self.assertEqual(len(self.calls()), 1)
        call = self.calls()[0]
        self.assertEqual((call["input_tokens"], call["cached_input_tokens"], call["output_tokens"]), (150, 40, 20))
        prompt = json.loads(self.transport.calls[0][0]["messages"][0]["content"])
        self.assertEqual(prompt["brief"]["inputs"]["brief"], self.brief)
        self.assertEqual(len(prompt["construction_context"]["references"]), len(REFERENCE_PATHS))

    def test_exactly_one_repair_then_terminal_rejection_without_replay(self):
        self.qa.failing = {1, 2}
        self.submit()
        claim = self.queue.acquire()
        outcome = manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(outcome["state"], "rejected")
        self.assertEqual([c["phase"] for c in self.calls()], ["initial", "repair"])
        self.submit()
        self.assertIsNone(self.queue.acquire())
        with self.assertRaises(Blocked):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(len(self.transport.calls), 2)

    def test_restart_before_call_uses_same_claim_and_same_ledger(self):
        self.submit()
        claim = self.queue.acquire()
        restarted = DurableQueue(Ledger(self.ledger.path, simulation=True))
        with self.assertRaisesRegex(Blocked, "queue_executor_owned"):
            restarted.acquire()
        manual_flow.execute_claim(restarted, self.builder, claim)
        self.assertEqual(len(self.calls()), 1)

    def test_explicit_revision_preserves_previous_site_and_binds_baseline(self):
        self.submit()
        first = manual_flow.execute_claim(self.queue, self.builder, self.queue.acquire())
        original = Path(first["site"]) / "index.html"
        before = original.read_bytes()
        self.brief["revisions"] = ["Mock revision instruction"]
        job = manual_flow.submit(self.queue, self.builder, self.brief,
                                construction_id="client-001", revision_id="r2", existing_site=first["site"])
        claim = self.queue.acquire()
        self.assertIsNotNone(self.queue.read_claim(claim)["inputs"]["baseline_digest"])
        second = manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(second["job_id"], job)
        self.assertNotEqual(first["site"], second["site"])
        self.assertEqual(original.read_bytes(), before)
        prompt = json.loads(self.transport.calls[1][0]["messages"][0]["content"])
        self.assertIn("public/index.html", prompt["construction_context"]["existing_site"])

    def test_restart_after_initial_only_allows_remaining_repair(self):
        self.submit()
        claim = self.queue.acquire()
        self.queue.run_claim(claim, self.executor, validator=lambda _: ["mock layout failure"])
        restarted = DurableQueue(Ledger(self.ledger.path, simulation=True))
        result = manual_flow.execute_claim(restarted, self.builder, claim)
        self.assertEqual(result["state"], "awaiting_visual_review")
        self.assertEqual([c["phase"] for c in self.calls()], ["initial", "repair"])

    def test_changed_brief_cannot_reset_identity(self):
        self.submit()
        self.brief["business"]["name"] = "Changed"
        with self.assertRaisesRegex(Blocked, "job_id_reused_with_changed_brief"):
            self.submit()
        self.assertEqual(len(self.queue.items()), 1)

    def test_legacy_admission_cannot_create_second_job_for_same_identity(self):
        self.submit()
        with self.assertRaisesRegex(Blocked, "build_reconciliation_required"):
            admit_build(self.queue, {"row_id": 42, "build_token": "MOCK_CORRELATION_ONLY",
                                    "brief": self.brief}, identity=self.identity)
        self.assertEqual(len(self.queue.items()), 1)

    def test_resource_tampering_after_admission_blocks_without_call(self):
        self.submit()
        claim = self.queue.acquire()
        (self.pack / REFERENCE_PATHS[0]).write_text("tampered", encoding="utf-8")
        with self.assertRaises((Blocked, ValueError)):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(self.calls(), [])

    def test_cli_submit_status_and_blocked_build_use_mock_fixture_only(self):
        # A disposable, paused live-mode ledger is safe: no runtime is created.
        # The resource pack and brief are entirely synthetic fixtures.
        self.pack.rename(self.root / "resources")
        brief_path = self.root / "brief.json"
        brief_path.write_text(json.dumps(self.brief), encoding="utf-8")
        config_path = self.root / "config.example.json"
        config_path.write_text('{"paused": true, "model": null}', encoding="utf-8")
        output = io.StringIO()
        with patch.object(manual_flow, "ROOT", self.root), contextlib.redirect_stdout(output):
            code = manual_flow.main(["submit", "--brief", str(brief_path),
                                    "--construction-id", "mock-client", "--revision-id", "r1"])
        self.assertEqual(code, 0)
        admitted = json.loads(output.getvalue())
        self.assertFalse(admitted["generation_started"])
        output = io.StringIO()
        with patch.object(manual_flow, "ROOT", self.root), contextlib.redirect_stdout(output):
            self.assertEqual(manual_flow.main(["status"]), 0)
            self.assertEqual(manual_flow.main(["build"]), 2)
        status, blocked = map(json.loads, output.getvalue().splitlines())
        self.assertTrue(status["paused"])
        self.assertEqual(status["queue"], [{"job_id": admitted["job_id"], "state": "queued", "claimed": False}])
        self.assertEqual(blocked["blocked"], "generation_paused")
        self.assertEqual(Ledger(self.root / ".state/manual.sqlite").status()["calls"], [])
        self.assertFalse((self.root / "workspaces").exists())

    def test_changed_media_blocks_before_call_or_workspace(self):
        media = self.root / "media"
        media.mkdir()
        photo = media / "photo.jpg"
        photo.write_bytes(b"MOCK_PHOTO")
        self.brief["media"] = {"uploads": ["photo.jpg"]}
        self.submit()
        claim = self.queue.acquire()
        photo.write_bytes(b"CHANGED_PHOTO")
        with self.assertRaisesRegex(Blocked, "queued_construction_inputs_changed"):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(self.calls(), [])
        self.assertFalse((self.root / "work").exists())

    def test_changed_media_before_repair_blocks_second_call(self):
        media = self.root / "media"
        media.mkdir()
        photo = media / "photo.jpg"
        photo.write_bytes(b"MOCK_PHOTO")
        self.brief["media"] = {"uploads": ["photo.jpg"]}
        self.submit()
        claim = self.queue.acquire()
        original = self.qa.check
        def mutate(*args):
            report = original(*args)
            photo.write_bytes(b"CHANGED_PHOTO")
            report["checks"][0]["passed"] = False
            return report
        self.qa.check = mutate
        with self.assertRaisesRegex(Blocked, "queued_construction_inputs_changed"):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(len(self.calls()), 1)

    def test_unknown_budget_blocks_owned_job_without_consuming_call(self):
        self.submit()
        claim = self.queue.acquire()
        self.reading = replace(self.reading, remaining_calls=None)
        with self.assertRaises(Blocked):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(self.calls(), [])

    def test_pausing_after_claim_blocks_build(self):
        self.submit()
        claim = self.queue.acquire()
        self.ledger.pause()
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            manual_flow.execute_claim(self.queue, self.builder, claim)
        self.assertEqual(self.calls(), [])

    def test_invalid_brief_identity_and_credentials_never_enter_queue(self):
        for brief, identity in (({}, self.identity), (self.brief, {**self.identity, "revision_id": "../bad"}),
                                ({**self.brief, "credentials": "forbidden"}, self.identity)):
            with self.assertRaises(Blocked):
                manual_flow.submit(self.queue, self.builder, brief, **identity)
        self.assertEqual(self.queue.items(), [])

    def test_cli_build_is_blocked_before_opening_ledger_or_runtime(self):
        output = io.StringIO()
        with patch.object(manual_flow, "Ledger", side_effect=AssertionError("no state changes")), \
                contextlib.redirect_stdout(output):
            code = manual_flow.main(["build"])
        self.assertEqual(code, 2)
        self.assertEqual(json.loads(output.getvalue()), {"blocked": "generation_paused", "generation_started": False})


if __name__ == "__main__":
    unittest.main()
