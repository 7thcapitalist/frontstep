"""Offline legacy /build validation and durable admission. No network/runtime.

The observed envelope does not define a stable construction/revision identity.
An authoritative caller MUST supply both identifiers explicitly, separately.
Correlation material is validated in memory and never persisted or returned.
"""
from dataclasses import dataclass, field
import hashlib
import json
import math
import re

from executor import Blocked
from site_builder import validate_brief

IDENTIFIER = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\Z")
SENSITIVE_KEYS = {"buildtoken", "token", "apikey", "authorization", "password", "secret",
                  "credentials", "cookie", "cookies", "oauthtoken", "accesstoken", "refreshtoken",
                  "runnersecret", "verceltoken", "claudecodeoauthtoken"}


class ContractError(Blocked):
    """Only fixed diagnostic codes; never input values or raw parser errors."""


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False)


def _pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ContractError("ambiguous_json_keys")
        result[key] = value
    return result


def _parse(value):
    if type(value) is str:
        if len(value) > 400000:
            raise ContractError("build_envelope_too_large")
        try:
            value = json.loads(value, object_pairs_hook=_pairs,
                               parse_constant=lambda _: (_ for _ in ()).throw(ContractError("invalid_json_number")))
        except (ValueError, TypeError, RecursionError):
            raise ContractError("invalid_build_json") from None
    if type(value) is not dict:
        raise ContractError("invalid_build_object")
    return value


def _tree(value, *, depth=0):
    if depth > 20:
        raise ContractError("build_structure_too_deep")
    if type(value) is dict:
        for key, item in value.items():
            if type(key) is not str:
                raise ContractError("invalid_json_key")
            _tree(key, depth=depth + 1)
            _tree(item, depth=depth + 1)
    elif type(value) is list:
        for item in value:
            _tree(item, depth=depth + 1)
    elif type(value) is str:
        try:
            value.encode("utf-8")
        except UnicodeError:
            raise ContractError("invalid_json_string") from None
    elif type(value) is float:
        if not math.isfinite(value):
            raise ContractError("invalid_json_number")
    elif value is not None and type(value) not in (bool, int):
        raise ContractError("invalid_json_value")


def _contains(value, text):
    if type(value) is str:
        return text in value
    if type(value) is dict:
        return any(text in key or _contains(item, text) for key, item in value.items())
    if type(value) is list:
        return any(_contains(item, text) for item in value)
    return False


def _credential_keys(value):
    if type(value) is dict:
        return any(re.sub(r"[^a-z0-9]", "", key.lower()) in SENSITIVE_KEYS or _credential_keys(item)
                   for key, item in value.items())
    return type(value) is list and any(_credential_keys(item) for item in value)


@dataclass(frozen=True)
class NormalizedBuild:
    job_id: str
    _encoded_request: str = field(repr=False)

    def request_for_queue(self):
        # A fresh object; later caller mutations cannot change this admission.
        return json.loads(self._encoded_request)


def construction_job_id(identity):
    """One identity namespace for legacy and manual admission, never two jobs."""
    if type(identity) is not dict or set(identity) != {"construction_id", "revision_id"}:
        raise ContractError("explicit_construction_and_revision_required")
    if any(type(value) is not str or not IDENTIFIER.fullmatch(value) for value in identity.values()):
        raise ContractError("invalid_explicit_build_identity")
    key = _canonical(["frontstep-build-v1", identity["construction_id"], identity["revision_id"]])
    return "build-v1-" + hashlib.sha256(key.encode()).hexdigest()


def normalize_build(payload, *, identity=None):
    try:
        envelope = _parse(payload)
        _tree(envelope)
        if set(envelope) != {"row_id", "build_token", "brief"}:
            raise ContractError("incomplete_or_unsupported_build_envelope")
        token = envelope["build_token"]
        if (type(token) is not str or not 1 <= len(token) <= 1024 or
                any(not 33 <= ord(char) <= 126 for char in token)):
            raise ContractError("invalid_build_correlation")
        row = envelope["row_id"]
        if type(row) is int:
            if not 0 < row <= 9007199254740991:
                raise ContractError("invalid_build_row")
            row = str(row)
        elif type(row) is str and IDENTIFIER.fullmatch(row):
            if row.isdecimal() and (row.startswith("0") or int(row) > 9007199254740991):
                raise ContractError("ambiguous_build_row")
        else:
            raise ContractError("invalid_build_row")
        job_id = construction_job_id(identity)
        brief = _parse(envelope["brief"])
        _tree(brief)
        if _credential_keys(brief):
            raise ContractError("credential_field_in_build_content")
        if _contains({"identity": identity, "row": row, "brief": brief}, token):
            raise ContractError("build_correlation_echo_forbidden")
        try:
            validate_brief(brief)
        except (Blocked, ValueError, TypeError):
            raise ContractError("invalid_site_brief") from None
        # Identity is explicit and independent of row, slug, token, timestamp
        # and randomness. JSON encoding avoids delimiter collisions.
        # A fingerprint detects correlation rotation under the same identity
        # without storing the raw correlation value or making it the job ID.
        fingerprint = hashlib.sha256(_canonical({"row_id": row, "brief": brief,
                                                "build_token": token}).encode()).hexdigest()
        request = {"contract": "frontstep-build-v1", "identity": dict(identity), "row_id": row,
                   "brief": brief, "envelope_fingerprint": fingerprint}
        encoded = _canonical(request)
        if token in encoded or token in job_id:
            raise ContractError("build_correlation_echo_forbidden")
        return NormalizedBuild(job_id, encoded)
    except ContractError:
        raise
    except (ValueError, TypeError, UnicodeError, RecursionError, OverflowError):
        raise ContractError("invalid_build_contract") from None


def admit_build(queue, payload, *, identity=None):
    normalized = normalize_build(payload, identity=identity)
    try:
        queue.enqueue(normalized.job_id, normalized.request_for_queue())
        return normalized.job_id
    except Blocked as exc:
        if str(exc) in ("job_id_reused_with_changed_brief", "duplicate_brief"):
            raise ContractError("build_reconciliation_required") from None
        raise ContractError("build_admission_blocked") from None
    except Exception:
        # No raw payload, parser, filesystem, DB or callback diagnostic escapes.
        raise ContractError("build_admission_failed") from None
