"""Only synthetic /build payloads; no runtime, credential, endpoint or consumer."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import traceback
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_contract import ContractError, admit_build, normalize_build
from durable_queue import DurableQueue
from executor import Blocked, Ledger


SYNTHETIC_CORRELATION = "CORRELATION_FIXTURE_NOT_A_REAL_CREDENTIAL_42"
IDENTITY = {"construction_id": "synthetic-construction-A", "revision_id": "revision-1"}


def payload():
    return {"row_id": 42, "build_token": SYNTHETIC_CORRELATION,
            "brief": {"slug": "synthetic-shop", "fase": "previa",
                      "business": {"name": "Loja fictícia", "niche": "loja", "city": "Cidade fictícia"},
                      "contact": {"whatsapp": "5511999999999"}}}


class BuildContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-contract-test-")
        self.addCleanup(self.tmp.cleanup)
        self.database = Path(self.tmp.name) / "simulation.sqlite"
        self.ledger = Ledger(self.database, simulation=True)
        self.pending = DurableQueue(self.ledger, clock=lambda: 1000)

    def admit(self, body, identity=None):
        return admit_build(self.pending, body, identity=IDENTITY if identity is None else identity)

    def assert_rejected(self, body, *, identity=None):
        with self.assertRaises(ContractError) as caught:
            self.admit(body, identity=identity)
        self.assertNotIn(SYNTHETIC_CORRELATION, str(caught.exception))
        self.assertEqual(self.pending.items(), [])

    def test_raw_json_object_and_json_brief_have_same_stable_job_across_reopen(self):
        body = payload()
        original = copy.deepcopy(body)
        with patch("uuid.uuid4", side_effect=AssertionError("no generated identity")):
            first = self.admit(body)
            body["brief"] = json.dumps(body["brief"], ensure_ascii=False, indent=2)
            second = self.admit(json.dumps(body))
        self.assertEqual(first, second)
        restored = DurableQueue(Ledger(self.database, simulation=True))
        self.assertEqual(admit_build(restored, original, identity=IDENTITY), first)
        self.assertEqual(restored.items(), [{"job_id": first, "state": "queued", "claimed": False}])
        self.assertTrue(self.ledger.status()["paused"])
        self.assertEqual(self.ledger.status()["calls"], [])
        with self.assertRaisesRegex(Blocked, "generation_paused"):
            restored.acquire()

    def test_explicit_construction_and_revision_are_mandatory_not_inferred_from_legacy_fields(self):
        for identity in (None, {}, {"construction_id": "synthetic"}, {"revision_id": "revision-1"},
                         {"construction_id": "synthetic", "revision_id": "revision-1", "fallback": True}):
            with self.subTest(identity=identity), self.assertRaisesRegex(ContractError, "explicit_construction_and_revision_required"):
                normalize_build(payload(), identity=identity)
        self.assertEqual(self.pending.items(), [])

    def test_distinct_revision_is_explicit_and_does_not_depend_on_row_or_token(self):
        first = self.admit(payload())
        other_revision = dict(IDENTITY, revision_id="revision-2")
        second = self.admit(payload(), identity=other_revision)
        self.assertNotEqual(first, second)
        self.assertEqual(len(self.pending.items()), 2)
        # Correlation rotation never chooses another job ID.
        changed = payload()
        changed["build_token"] = "ANOTHER_SYNTHETIC_CORRELATION_VALUE_42"
        self.assertEqual(normalize_build(changed, identity=IDENTITY).job_id, first)

    def test_conflicting_content_or_correlation_under_same_identity_requires_reconciliation(self):
        first = self.admit(payload())
        with self.ledger.connect() as db:
            before = dict(db.execute("SELECT * FROM jobs WHERE id=?", (first,)).fetchone())
        changed_brief = payload()
        changed_brief["brief"]["business"]["name"] = "Outra loja fictícia"
        changed_row = payload()
        changed_row["row_id"] = 43
        changed_token = payload()
        changed_token["build_token"] = "ANOTHER_SYNTHETIC_CORRELATION_VALUE_42"
        for changed in (changed_brief, changed_row, changed_token):
            with self.assertRaisesRegex(ContractError, "build_reconciliation_required"):
                self.admit(changed)
        self.assertEqual(len(self.pending.items()), 1)
        with self.ledger.connect() as db:
            self.assertEqual(dict(db.execute("SELECT * FROM jobs WHERE id=?", (first,)).fetchone()), before)
        self.assertEqual(self.ledger.status()["calls"], [])

    def test_raw_correlation_never_enters_persisted_request_receipt_or_repr(self):
        normalized = normalize_build(payload(), identity=IDENTITY)
        job_id = self.admit(payload())
        with self.ledger.connect() as db:
            row = dict(db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone())
        for representation in (repr(normalized), job_id, json.dumps(row), json.dumps(self.pending.items())):
            self.assertNotIn(SYNTHETIC_CORRELATION, representation)
        self.assertNotIn(SYNTHETIC_CORRELATION.encode(), self.database.read_bytes())
        self.assertNotIn("build_token", row["request_json"])
        self.assertIn("envelope_fingerprint", json.loads(row["request_json"]))

    def test_payloads_are_not_mutated_and_normalized_request_is_a_snapshot(self):
        body = payload()
        before = copy.deepcopy(body)
        normalized = normalize_build(body, identity=IDENTITY)
        self.assertEqual(body, before)
        body["brief"]["business"]["name"] = "Changed after normalization"
        outgoing = normalized.request_for_queue()
        outgoing["brief"]["business"]["name"] = "Changed returned copy"
        self.assertEqual(normalized.request_for_queue()["brief"]["business"]["name"], before["brief"]["business"]["name"])

    def test_missing_unknown_or_invalid_envelope_fields_are_rejected(self):
        cases = [None, [], "[]", "not json"]
        for field in ("row_id", "build_token", "brief"):
            body = payload()
            del body[field]
            cases.append(body)
        body = payload()
        body["unobserved_field"] = "synthetic"
        cases.append(body)
        for body in cases:
            with self.subTest(kind=type(body).__name__):
                self.assert_rejected(body)

    def test_row_ids_and_correlation_types_are_strict(self):
        for row in (True, False, 0, -1, 1.0, [], {}, None, "", "042", "0", " 42", "42 ", 9007199254740992):
            body = payload()
            body["row_id"] = row
            self.assert_rejected(body)
        for value in (None, 42, True, {}, [], "", "has spaces", "line\nbreak"):
            body = payload()
            body["build_token"] = value
            self.assert_rejected(body)
        integer = normalize_build(payload(), identity=IDENTITY)
        body = payload()
        body["row_id"] = "42"
        self.assertEqual(integer.request_for_queue(), normalize_build(body, identity=IDENTITY).request_for_queue())

    def test_invalid_brief_and_non_json_values_are_rejected(self):
        for brief in (None, [], "[]", "broken json", {}, {"slug": "missing-required-fields"}):
            body = payload()
            body["brief"] = brief
            self.assert_rejected(body)
        for value in (float("nan"), float("inf"), object()):
            body = payload()
            body["brief"]["unsupported"] = value
            self.assert_rejected(body)

    def test_duplicate_json_keys_in_envelope_and_nested_brief_are_rejected(self):
        raw = json.dumps(payload())
        duplicate_row = raw[:-1] + ',"row_id":42}'
        self.assert_rejected(duplicate_row)
        body = payload()
        brief = json.dumps(body["brief"])
        body["brief"] = brief[:-1] + ',"slug":"conflicting-slug"}'
        self.assert_rejected(body)

    def test_credential_fields_and_correlation_echo_are_rejected_without_value_in_diagnostics(self):
        body = payload()
        body["brief"]["metadata"] = {"authorization": "ONLY_A_SYNTHETIC_VALUE"}
        self.assert_rejected(body)
        echo = payload()
        echo["brief"]["business"]["name"] = SYNTHETIC_CORRELATION
        try:
            self.admit(echo)
        except ContractError as exc:
            diagnostic = str(exc) + repr(exc) + traceback.format_exc()
            self.assertNotIn(SYNTHETIC_CORRELATION, diagnostic)
        else:
            self.fail("echo must be rejected")
        bad_identity = dict(IDENTITY, construction_id=SYNTHETIC_CORRELATION)
        self.assert_rejected(payload(), identity=bad_identity)

    def test_identity_validation_and_structured_encoding_avoid_ambiguous_ids(self):
        for value in (None, True, 1, "", " ", "name with spaces", "a/../b"):
            with self.assertRaises(ContractError):
                normalize_build(payload(), identity=dict(IDENTITY, revision_id=value))
        one = normalize_build(payload(), identity={"construction_id": "a:b", "revision_id": "c"})
        two = normalize_build(payload(), identity={"construction_id": "a", "revision_id": "b:c"})
        self.assertNotEqual(one.job_id, two.job_id)

    def test_dependency_failures_are_sanitized_and_never_return_dependency_payload(self):
        queue = Mock()
        queue.enqueue.side_effect = RuntimeError(SYNTHETIC_CORRELATION)
        try:
            admit_build(queue, payload(), identity=IDENTITY)
        except ContractError as exc:
            self.assertEqual(str(exc), "build_admission_failed")
            self.assertNotIn(SYNTHETIC_CORRELATION, traceback.format_exc())
        else:
            self.fail("dependency failure must be blocked")
        queue.enqueue.side_effect = None
        queue.enqueue.return_value = SYNTHETIC_CORRELATION
        self.assertNotEqual(admit_build(queue, payload(), identity=IDENTITY), SYNTHETIC_CORRELATION)


if __name__ == "__main__":
    unittest.main()
