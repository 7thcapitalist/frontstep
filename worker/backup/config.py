"""Strict central policy loader. No environment/global setting mutations."""
import json
from dataclasses import fields
from pathlib import Path

from executor import Blocked, Policy, finite_number


def load_policy(path=None, *, simulation=False):
    values = {} if path is None else json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(values, dict) or set(values) - {field.name for field in fields(Policy)}:
        raise Blocked("unknown_policy_field")
    policy = Policy(**values)
    if type(policy.paused) is not bool:
        raise Blocked("invalid_pause_setting")
    if not simulation and policy.paused is not True:
        raise Blocked("live_resume_not_implemented")
    if policy.model is not None and (not isinstance(policy.model, str) or not policy.model.strip()):
        raise Blocked("invalid_model_setting")
    if policy.effort not in ("low", "medium", "high"):
        raise Blocked("invalid_effort")
    for name, maximum in (("timeout_seconds", 300), ("evidence_max_age_seconds", 300)):
        value = getattr(policy, name)
        if not finite_number(value) or not 0 < value <= maximum:
            raise Blocked("invalid_" + name)
    for name in ("max_prompt_chars", "max_artifact_chars"):
        value = getattr(policy, name)
        if type(value) is not int or not 0 < value <= 400000:
            raise Blocked("invalid_" + name)
    return policy
