"""Offline Windows brief -> durable queue -> site pipeline. No consumer/service.

CLI admission is local and allowed while paused. CLI build stays blocked; the
execution seam is exercised only by injected mocks in tests. No runtime, model
probe, credential reader, SSH, n8n, callback or deployment is created here.
"""
import argparse
from pathlib import Path

from build_contract import construction_job_id, _credential_keys, _parse, _tree
from config import load_policy
from durable_queue import DurableQueue
from executor import Blocked, Ledger
from site_builder import SiteBuilder, canonical, validate_brief

ROOT = Path(__file__).resolve().parent


def submit(queue, builder, brief, *, construction_id, revision_id, existing_site=None):
    """Explicit stable identity; resubmission never resets history or input hashes."""
    identity = {"construction_id": construction_id, "revision_id": revision_id}
    job_id = construction_job_id(identity)
    brief = _parse(brief)
    _tree(brief)
    if _credential_keys(brief):
        raise Blocked("credential_field_in_build_content")
    try:
        validate_brief(brief)
    except (TypeError, ValueError, Blocked):
        raise Blocked("invalid_site_brief") from None
    inputs = builder.construction_inputs(brief, existing_site=existing_site)[-1]
    request = {"contract": "frontstep-manual-v1", "identity": identity, "inputs": inputs,
               "existing_site": str(Path(existing_site).resolve()) if existing_site else None}
    queue.enqueue(job_id, request)
    return job_id


def execute_claim(queue, builder, claim):
    """One owned job, at most initial + repair; never a worker loop or auto retry."""
    if Path(queue.ledger.path).resolve() != Path(builder.executor.ledger.path).resolve():
        raise Blocked("queue_executor_ledger_mismatch")
    builder.executor._preflight()
    queue.resume(claim)
    request = queue.read_claim(claim)
    if request.get("contract") != "frontstep-manual-v1":
        raise Blocked("unsupported_manual_contract")
    # A known terminal call may only be acknowledged after a crash, not replayed.
    with queue.ledger.connect() as db:
        state = db.execute("SELECT state FROM jobs WHERE id=?", (claim.job_id,)).fetchone()[0]
    if state in ("complete", "rejected", "failed"):
        raise Blocked("manual_terminal_reconciliation_required")
    result = builder.build(claim.job_id, request["inputs"]["brief"],
                           existing_site=request["existing_site"], queue=queue, claim=claim)
    queue.acknowledge(claim)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("submit", "status", "build"))
    parser.add_argument("--brief", type=Path)
    parser.add_argument("--construction-id")
    parser.add_argument("--revision-id")
    parser.add_argument("--media-root", type=Path)
    parser.add_argument("--existing-site", type=Path)
    parser.add_argument("--config", type=Path, default=ROOT / "config.example.json")
    args = parser.parse_args(argv)
    try:
        policy = load_policy(args.config)
        if args.action == "build":
            # Fail before opening a ledger, acquiring a job or creating outputs.
            # There is no live runtime wired into this manual command.
            raise Blocked("generation_paused" if policy.paused else "live_runtime_not_configured")
        if args.action == "submit" and (args.brief is None or not args.construction_id or not args.revision_id):
            raise Blocked("manual_brief_and_identity_required")
        state = ROOT / ".state" / "manual.sqlite"
        state.parent.mkdir(exist_ok=True)
        ledger = Ledger(state)
        queue = DurableQueue(ledger)
        if args.action == "submit":
            builder = SiteBuilder(None, resources=ROOT / "resources", work_root=ROOT / "workspaces",
                                  qa=None, media_root=args.media_root)
            job_id = submit(queue, builder, args.brief.read_text(encoding="utf-8-sig"),
                            construction_id=args.construction_id, revision_id=args.revision_id,
                            existing_site=args.existing_site)
            print(canonical({"job_id": job_id, "admission": "accepted", "generation_started": False}))
        else:
            print(canonical({"paused": True, "model": policy.model, "real_generation": "blocked",
                             "api_transport_enabled": False, "production_verified": False,
                             "queue": queue.items()}))
        return 0
    except (Blocked, OSError, ValueError, TypeError, KeyError):
        # Do not expose the brief, filesystem contents or raw parser exceptions.
        import sys
        exc = sys.exception()
        code = str(exc) if isinstance(exc, Blocked) else "manual_input_unavailable_or_invalid"
        print(canonical({"blocked": code, "generation_started": False}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
