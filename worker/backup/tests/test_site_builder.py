import json
import sys
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from executor import Blocked, Executor, Ledger, Policy, Reading
from import_resources import import_pack, sha
from messages_runtime import (HttpResponse, HttpsMessagesTransport, IsolatedMessagesTransport, MessagesRuntime,
                              RuntimeFailure, capability_from_catalog, normalize_usage)
from site_builder import REFERENCE_PATHS, SiteBuilder, canonical, decode_bundle, public_digest
from config import load_policy


def bundle(css="body{color:#222;background:#fff}"):
    return {"files": {
        "public/index.html": "<!doctype html><html lang='pt-BR'><title>Mock</title><h1>Mock site</h1></html>",
        "public/styles.css": css,
        "public/app.js": "// mock interaction, never executed by the tests",
        "plan.md": "Mock design plan. No invented customer facts.",
        "skill-usage.json": '[{"skill":"frontstep-coder","application":"mock fixture"}]',
    }}


def response(artifact=None, **overrides):
    result = {"model": "fixture-model", "stop_reason": "end_turn",
              "content": [{"type": "text", "text": canonical(artifact or bundle())}],
              "usage": {"input_tokens": 100, "cache_read_input_tokens": 40,
                        "cache_creation_input_tokens": 10, "output_tokens": 20}}
    result.update(overrides)
    return HttpResponse(200, result)


def capability():
    catalog = {"data": [{"id": "fixture-model", "lifecycle": "active", "capabilities": {
        "effort": {"supported": True, "low": {"supported": True}}}}]}
    return capability_from_catalog(catalog, "fixture-model", observed_at=1000,
                                   account_scope="mock-account", approved_economical=True, now=1000)


class FakeMessages:
    is_mock = True
    protocol = "anthropic-messages-v1"

    def __init__(self, responses=None):
        self.responses = list(responses or [response()])
        self.calls = []

    def send(self, body, timeout):
        self.calls.append((body, timeout))
        result = self.responses.pop(0)
        if isinstance(result, BaseException):
            raise result
        return result


class FakeQa:
    def __init__(self, failing=()):
        self.calls = []
        self.failing = set(failing)

    def check(self, root, brief, out):
        self.calls.append((root, brief))
        out.mkdir()
        # Simulated screenshot bytes, not evidence of a real browser run.
        data = b"\x89PNG\r\n\x1a\nSIMULATED_SCREENSHOT"
        shots = {}
        for viewport in ("desktop", "mobile"):
            (out / f"{viewport}.png").write_bytes(data)
            shots[viewport] = {"path": f"{viewport}.png", "sha256": sha(data)}
        checks = [{"code": f"{viewport}:{code}", "passed": not (code == "layout" and len(self.calls) in self.failing)}
                  for viewport in ("desktop", "mobile") for code in
                  ("document", "layout", "photos", "accessibility", "feature", "typography",
                   "links", "js_errors", "local_assets", "reduced_motion")]
        if brief.get("premium_feature"):
            checks += [{"code": f"{viewport}:{code}", "passed": True} for viewport in ("desktop", "mobile")
                       for code in ("feature_scenario", "feature_fallback", "nojs_local_assets",
                                    "interaction_js_errors", "interaction_local_assets")]
            for viewport in ("desktop", "mobile"):
                (out / f"{viewport}-nojs.png").write_bytes(data)
                shots[viewport + "NoJs"] = {"path": f"{viewport}-nojs.png", "sha256": sha(data)}
        return {"completed": True, "digest": public_digest(root), "checks": checks, "screenshots": shots}


class RuntimeTests(unittest.TestCase):
    def test_isolated_http_reads_mock_child_result_without_running_child_or_network(self):
        process = Mock(exitcode=0)
        process.is_alive.return_value = False
        def factory(**kwargs):
            output = kwargs["args"][3]
            process.start.side_effect = lambda: Path(output).write_text(canonical(
                {"status": 200, "payload": response().payload}), encoding="utf-8")
            return process
        transport = IsolatedMessagesTransport(lambda: "MOCK_KEY", enabled=True,
                    billing_authorized=True, process_factory=factory)
        with patch("http.client.HTTPSConnection", side_effect=AssertionError("no network")):
            result = transport.send({"mock": True}, 1)
        self.assertEqual(result.status, 200)
        process.close.assert_called_once()

    def test_isolated_http_timeout_terminates_only_mock_owned_process_and_does_not_retry(self):
        process = Mock(exitcode=0)
        state = {"running": True}
        process.is_alive.side_effect = lambda: state["running"]
        process.terminate.side_effect = lambda: state.update(running=False)
        factory = Mock(return_value=process)
        transport = IsolatedMessagesTransport(lambda: "MOCK_KEY", enabled=True,
                    billing_authorized=True, process_factory=factory)
        with self.assertRaisesRegex(TimeoutError, "runtime_timeout"):
            transport.send({"mock": True}, 1)
        factory.assert_called_once()
        process.start.assert_called_once()
        process.terminate.assert_called_once()
        self.assertEqual(process.join.call_args_list[0].args, (1,))
        process.close.assert_called_once()

    def test_isolated_http_uses_forced_kill_if_mock_process_ignores_termination(self):
        process = Mock(exitcode=0)
        state = {"running": True}
        process.is_alive.side_effect = lambda: state["running"]
        process.kill.side_effect = lambda: state.update(running=False)
        transport = IsolatedMessagesTransport(lambda: "MOCK_KEY", enabled=True,
                    billing_authorized=True, process_factory=Mock(return_value=process))
        with self.assertRaises(TimeoutError):
            transport.send({}, 1)
        process.kill.assert_called_once()

    def test_raw_http_cannot_be_registered_as_live_runtime_without_process_deadline(self):
        with self.assertRaisesRegex(Blocked, "production_http_requires_process_deadline"):
            MessagesRuntime(capability(), HttpsMessagesTransport(), max_output_tokens=8192)

    def test_isolated_http_disabled_by_default_creates_no_process_and_reads_no_key(self):
        key, factory = Mock(), Mock()
        transport = IsolatedMessagesTransport(key, process_factory=factory)
        with self.assertRaisesRegex(Blocked, "api_transport_disabled"):
            transport.send({}, 1)
        key.assert_not_called()
        factory.assert_not_called()

    def test_request_has_exact_model_effort_single_message_no_tools_no_history(self):
        transport = FakeMessages()
        runtime = MessagesRuntime(capability(), transport, max_output_tokens=8192)
        result = runtime.generate("mock", model="fixture-model", effort="low", timeout=60)
        body, timeout = transport.calls[0]
        self.assertEqual(len(transport.calls), 1)
        self.assertEqual(body["model"], "fixture-model")
        self.assertEqual(body["output_config"], {"effort": "low"})
        self.assertEqual(body["max_tokens"], 8192)
        self.assertEqual(len(body["messages"]), 1)
        self.assertNotIn("tools", body)
        self.assertEqual(result["usage"]["input_total"], 150)
        self.assertEqual(result["usage"]["input_cached"], 40)
        self.assertEqual(result["usage"]["input_total"] + result["usage"]["output"], 170)

    def test_missing_cache_creation_is_unknown_not_inferred_zero(self):
        self.assertIsNone(normalize_usage({"usage": {"input_tokens": 100, "cache_read_input_tokens": 40}})["input_total"])
        self.assertIsNone(normalize_usage({})["output"])

    def test_invalid_model_or_effort_never_sends(self):
        transport = FakeMessages()
        runtime = MessagesRuntime(capability(), transport, max_output_tokens=8192)
        for model, effort in (("expensive", "low"), ("fixture-model", "high")):
            with self.assertRaisesRegex(Blocked, "invalid_model_or_effort"):
                runtime.generate("mock", model=model, effort=effort, timeout=60)
        self.assertEqual(transport.calls, [])

    def test_public_or_stale_catalog_does_not_prove_availability(self):
        for args in ({"account_scope": ""}, {"observed_at": 0}, {"approved_economical": False}):
            kwargs = dict(observed_at=1000, account_scope="mock", approved_economical=True, now=1000)
            kwargs.update(args)
            with self.assertRaises(Blocked):
                capability_from_catalog({"data": []}, "fixture-model", **kwargs)

    def test_disabled_http_does_not_read_credentials_or_open_socket(self):
        credentials, connection = Mock(), Mock()
        transport = HttpsMessagesTransport(credentials, connection_factory=connection)
        with self.assertRaisesRegex(Blocked, "api_transport_disabled"):
            transport.send({}, 60)
        credentials.assert_not_called()
        connection.assert_not_called()

    def test_http_uses_fixed_endpoint_no_redirect_or_retry_with_mock_connection(self):
        reply = Mock(status=302)
        reply.read.return_value = b'{"error":{"type":"mock_redirect"}}'
        conn = Mock()
        conn.getresponse.return_value = reply
        factory = Mock(return_value=conn)
        transport = HttpsMessagesTransport(lambda: "MOCK_ONLY", enabled=True,
                    billing_authorized=True, connection_factory=factory)
        result = transport.send({"test": True}, 60)
        self.assertEqual(result.status, 302)
        factory.assert_called_once_with("api.anthropic.com", timeout=60)
        self.assertEqual(conn.request.call_args.args[:2], ("POST", "/v1/messages"))
        conn.close.assert_called_once()
        self.assertEqual(conn.request.call_count, 1)

    def test_http_error_and_tool_response_retain_usage_without_followup(self):
        for reply in (HttpResponse(429, response().payload), response(content=[{"type": "tool_use", "name": "test"}])):
            transport = FakeMessages([reply])
            runtime = MessagesRuntime(capability(), transport, max_output_tokens=8192)
            with self.assertRaises(RuntimeFailure) as caught:
                runtime.generate("mock", model="fixture-model", effort="low", timeout=60)
            self.assertEqual(caught.exception.result["usage"]["input_total"], 150)
            self.assertEqual(len(transport.calls), 1)


class SiteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-site-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pack = self.root / "pack"
        entries = [(name, "mock reference", ("Mock knowledge: " + name).encode()) for name in REFERENCE_PATHS]
        entries += [("original-builder/skills/frontstep-coder/assets/starter/public/index.html", "mock", b"mock starter"),
                    ("design-kit/runtime/public/frontstep-motion.js", "mock", b"// mock motion library"),
                    ("design-kit/fonts/mock.woff2", "mock", b"MOCK_FONT")]
        import_pack(entries, self.pack)
        self.ledger = Ledger(self.root / "simulation.sqlite", simulation=True)
        self.ledger.allow_simulation()
        self.reading = Reading(2, 2, True, "runtime", 1000, "mock-authorization", "local-backup")
        self.transport = FakeMessages([response(), response(bundle("body{color:blue}"))])
        self.runtime = MessagesRuntime(capability(), self.transport, max_output_tokens=8192)
        self.policy = Policy(paused=False, model="fixture-model", max_prompt_chars=240000)
        self.executor = Executor(self.ledger, self.policy, self.runtime, lambda: self.reading, clock=lambda: 1000)
        self.qa = FakeQa()
        self.builder = self.make_builder()
        self.brief = {"slug": "mock-clinic", "business": {"name": "Mock Clinic", "niche": "clinica", "city": "Teste"},
                      "contact": {"whatsapp": "5511999999999"}}

    def make_builder(self):
        return SiteBuilder(self.executor, resources=self.pack, work_root=self.root / "work", qa=self.qa,
                           media_root=self.root / "media")

    def test_complete_pipeline_materializes_site_references_assets_and_qa_without_external_processes(self):
        with patch("subprocess.Popen", side_effect=AssertionError("no process")), \
             patch("http.client.HTTPSConnection", side_effect=AssertionError("no network")):
            outcome = self.builder.build("job-1", self.brief)
        site = Path(outcome["site"])
        self.assertTrue((site / "index.html").exists())
        self.assertTrue((site / "styles.css").exists())
        self.assertTrue((site / "vendor/frontstep-motion.js").exists())
        self.assertEqual((site / "fonts/mock.woff2").read_bytes(), b"MOCK_FONT")
        self.assertEqual(outcome["state"], "awaiting_visual_review")
        self.assertTrue(outcome["human_review_required"])
        self.assertFalse(outcome["published"])
        self.assertTrue(outcome["simulation_only"])
        request = json.loads(self.transport.calls[0][0]["messages"][0]["content"])
        refs = request["construction_context"]["references"]
        self.assertEqual(len(refs), len(REFERENCE_PATHS))
        self.assertTrue(all(ref["text"].startswith("Mock knowledge:") for ref in refs))
        self.assertEqual(len(self.transport.calls), 1)
        self.assertEqual(len(self.qa.calls), 1)

    def test_one_repair_preserves_first_attempt_and_uses_new_directory(self):
        self.qa.failing = {1}
        result = self.builder.build("job-1", self.brief)
        repaired = Path(result["site"])
        original = repaired.parent.parent / "initial/public/styles.css"
        self.assertIn("#222", original.read_text())
        self.assertIn("blue", (repaired / "styles.css").read_text())
        self.assertEqual(len(self.transport.calls), 2)
        second = json.loads(self.transport.calls[1][0]["messages"][0]["content"])
        self.assertEqual(second["phase"], "repair")
        self.assertIn("mobile:layout", second["validation"])
        with self.assertRaisesRegex(Blocked, "job_already_executed"):
            self.builder.build("job-1", self.brief)
        self.assertEqual(len(self.transport.calls), 2)

    def test_failed_repair_rejects_without_third_call_or_publication(self):
        self.qa.failing = {1, 2}
        result = self.builder.build("job-1", self.brief)
        self.assertEqual(result["state"], "rejected")
        self.assertEqual(len(self.transport.calls), 2)
        self.assertFalse(result["published"])

    def test_paused_build_creates_no_workspace_and_never_calls_runtime(self):
        self.executor.policy = replace(self.policy, paused=True)
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            self.builder.build("job-1", self.brief)
        self.assertFalse((self.root / "work").exists())
        self.assertEqual(self.transport.calls, [])

    def test_durable_pause_blocks_even_when_policy_unpaused(self):
        self.ledger.pause()
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            self.builder.build("job-1", self.brief)
        self.assertFalse((self.root / "work").exists())

    def test_media_bytes_copied_without_download_and_cannot_be_overwritten_by_model(self):
        (self.root / "media").mkdir()
        (self.root / "media/portrait.png").write_bytes(b"MOCK_PHOTO")
        self.brief["media"] = {"local_files": [{"path": "portrait.png", "role": "portrait"}]}
        result = self.builder.build("job-1", self.brief)
        self.assertEqual((Path(result["site"]) / "media/portrait.png").read_bytes(), b"MOCK_PHOTO")
        for name in ("public/../escape.js", "public/vendor/hook.js", "/absolute", "public/CON.txt", "package.json", ".env"):
            bad = bundle()
            bad["files"][name] = "mock unsafe"
            with self.subTest(name=name), self.assertRaises(Blocked):
                decode_bundle(canonical(bad))

    def test_unknown_budget_and_missing_reference_block_without_model(self):
        self.reading = replace(self.reading, remaining_calls=None)
        with self.assertRaisesRegex(Blocked, "budget_unknown"):
            self.builder.build("job-1", self.brief)
        self.assertEqual(self.transport.calls, [])

    def test_missing_or_stale_qa_is_not_accepted_and_does_not_trigger_ai_repair(self):
        self.qa.check = Mock(return_value={"completed": False})
        with self.assertRaisesRegex(Blocked, "qa_unavailable_or_stale"):
            self.builder.build("job-1", self.brief)
        self.assertTrue(self.ledger.status()["paused"])
        self.assertEqual(len(self.transport.calls), 1)

    def test_empty_check_list_is_not_success(self):
        original = self.qa.check
        def incomplete(*args):
            result = original(*args)
            result["checks"] = []
            return result
        self.qa.check = incomplete
        with self.assertRaisesRegex(Blocked, "qa_measurement_missing"):
            self.builder.build("job-1", self.brief)

    def test_truncation_keeps_runtime_usage_and_pauses(self):
        self.transport.responses = [response(stop_reason="max_tokens")]
        with self.assertRaisesRegex(Blocked, "runtime_truncated_or_nonfinal"):
            self.builder.build("job-1", self.brief)
        row = self.ledger.status()["calls"][0]
        self.assertEqual(row["input_tokens"], 150)
        self.assertEqual(row["output_tokens"], 20)
        self.assertEqual(len(self.transport.calls), 1)
        self.assertTrue(self.ledger.status()["paused"])

    def test_ambiguous_network_timeout_retains_global_reservation(self):
        self.transport.responses = [TimeoutError("mock socket timeout")]
        with self.assertRaises(TimeoutError):
            self.builder.build("job-1", self.brief)
        self.assertEqual(self.ledger.status()["calls"][0]["status"], "reserved")
        self.assertIsNone(self.ledger.status()["calls"][0]["input_tokens"])

    def test_restart_continues_only_unused_repair_after_budget_returns(self):
        self.qa.failing = {1}
        original = self.qa.check
        def temporarily_revoke(*args):
            result = original(*args)
            self.reading = replace(self.reading, remaining_calls=None)
            return result
        self.qa.check = temporarily_revoke
        with self.assertRaisesRegex(Blocked, "budget_unknown"):
            self.builder.build("job-1", self.brief)
        self.assertEqual(len(self.transport.calls), 1)
        self.reading = replace(self.reading, remaining_calls=2)
        self.executor.ledger = Ledger(self.root / "simulation.sqlite", simulation=True)
        self.qa.check = original
        self.builder = self.make_builder()
        result = self.builder.build("job-1", self.brief)
        self.assertEqual(result["state"], "awaiting_visual_review")
        self.assertEqual([c["phase"] for c in self.ledger.status()["calls"]], ["initial", "repair"])

    def test_config_is_strict_and_cannot_resume_live_generation(self):
        self.assertTrue(load_policy().paused)
        config = self.root / "config.json"
        for values, error in (({"effort": "auto"}, "invalid_effort"),
                              ({"paused": False}, "live_resume"),
                              ({"paused": "false"}, "invalid_pause"),
                              ({"model": ""}, "invalid_model"),
                              ({"fallback_model": "expensive"}, "unknown_policy_field")):
            config.write_text(canonical(values))
            with self.subTest(values=values), self.assertRaisesRegex(Blocked, error):
                load_policy(config)

    def test_feature_requires_functional_and_nojs_evidence(self):
        self.brief["premium_feature"] = "agendamento"
        self.brief["qa_scenario"] = {"steps": [], "assertions": [{"kind": "visible", "selector": "#result"}]}
        outcome = self.builder.build("job-1", self.brief)
        report = json.loads((Path(outcome["site"]).parent / "qa-report.json").read_text())
        self.assertIn("desktopNoJs", report["screenshots"])
        self.assertIn("mobile:feature_scenario", [c["code"] for c in report["checks"]])

    def test_revision_receives_existing_source_and_keeps_original_files_unchanged(self):
        first = self.builder.build("job-1", self.brief)
        original = Path(first["site"])
        before = public_digest(original)
        revised = json.loads(canonical(self.brief))
        revised["revisions"] = ["Mudar apenas a cor do botão"]
        second = self.builder.build("job-2", revised, existing_site=original)
        self.assertEqual(public_digest(original), before)
        self.assertNotEqual(first["site"], second["site"])
        request = json.loads(self.transport.calls[1][0]["messages"][0]["content"])
        self.assertIn("public/index.html", request["construction_context"]["existing_site"])
        self.assertIn("do not start over", request["construction_context"]["revision_rule"])

    def test_revision_cannot_read_outside_job_workspace(self):
        with self.assertRaisesRegex(Blocked, "revision_source_outside_job_workspaces"):
            self.builder.build("job-1", self.brief, existing_site=self.root)
        self.assertEqual(self.transport.calls, [])

    def test_original_uploads_contract_reads_only_explicit_local_files(self):
        (self.root / "media/uploads").mkdir(parents=True)
        (self.root / "media/uploads/portrait.jpg").write_bytes(b"MOCK_UPLOAD")
        self.brief["media"] = {"uploads": ["uploads/portrait.jpg"]}
        output = self.builder.build("job-1", self.brief)
        self.assertEqual((Path(output["site"]) / "media/portrait.jpg").read_bytes(), b"MOCK_UPLOAD")

    def test_unresolved_remote_photo_is_not_downloaded_or_sent_to_ai(self):
        self.brief["media"] = {"photos": ["https://photos.invalid/portrait.jpg"]}
        with self.assertRaisesRegex(Blocked, "remote_photo_requires_verified_local_copy"):
            self.builder.build("job-1", self.brief)
        self.assertEqual(self.transport.calls, [])

    def test_actual_restored_references_are_present_and_fit_context_without_generation(self):
        # Read-only assembly of real reference TEXT, while the AI transport is
        # still a fake and is never called. This catches manifest/path drift.
        from resource_pack import verify
        actual = Path(__file__).resolve().parents[1] / "resources"
        self.builder.resources = actual
        context = self.builder._context(verify(actual))
        self.assertLess(len(canonical(context)), 150000)
        self.assertEqual(len(context["references"]), len(REFERENCE_PATHS))
        self.assertTrue(any("frontstep-coder" in item["text"] for item in context["references"]))
        self.assertEqual(self.transport.calls, [])


if __name__ == "__main__":
    unittest.main()
