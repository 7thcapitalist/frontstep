"""Paused local site construction pipeline. No server, deploy or messaging.

The build method is usable with an injected single-request runtime; this CLI
only exposes status. Tests exercise construction entirely with mocks. Execution remains
behind the durable pause, account evidence, quota authority and billing consent.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from executor import Blocked, Executor, Ledger, Policy, Reading
from import_resources import ensure_inside, sha
from resource_pack import prepare, verify

REFERENCE_PATHS = (
    "original-builder/skills/frontstep-coder/SKILL.md",
    "original-builder/skills/frontstep-coder/references/nichos.md",
    "original-builder/skills/frontstep-coder/references/direction.md",
    "original-builder/skills/frontstep-coder/references/accessibility.md",
    "original-builder/skills/frontstep-coder/references/conversion-rules.md",
    "original-builder/skills/frontstep-coder/references/motion-rules.md",
    "original-builder/skills/frontstep-coder/references/motion-opportunities.md",
    "design-kit/skills/frontend-design/SKILL.md",
    "design-kit/vercel-web-interface-guidelines.md",
    "design-kit/runtime/MOTION-RUNTIME.md",
    "design-kit/skills/gsap-performance/SKILL.md",
    "design-kit/skills/improve-animations/SKILL.md",
)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False)


def validate_brief(brief):
    if not isinstance(brief, dict) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,60}", brief.get("slug", "")):
        raise Blocked("invalid_brief_slug")
    for section, fields in (("business", ("name", "niche", "city")), ("contact", ("whatsapp",))):
        values = brief.get(section)
        if not isinstance(values, dict) or any(not isinstance(values.get(k), str) or not values[k].strip() for k in fields):
            raise Blocked("invalid_brief_" + section)
    if brief.get("fase", "previa") not in ("previa", "final"):
        raise Blocked("invalid_brief_phase")
    if len(canonical(brief)) > 20000:
        raise Blocked("brief_too_large")


def no_duplicates(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise Blocked("duplicate_bundle_key")
        result[key] = value
    return result


def decode_bundle(artifact):
    try:
        data = json.loads(artifact, object_pairs_hook=no_duplicates)
    except (ValueError, TypeError) as exc:
        raise Blocked("invalid_site_bundle_json") from exc
    files = data.get("files") if isinstance(data, dict) else None
    if not isinstance(files, dict) or not 1 <= len(files) <= 100:
        raise Blocked("invalid_site_bundle_files")
    seen = set()
    for name, text in files.items():
        # Restrict generated output to static site sources and audit notes. No
        # generated build scripts, packages, hooks, config or binary payloads.
        try:
            ensure_inside(Path.cwd(), name)
        except (ValueError, TypeError) as exc:
            raise Blocked("unsafe_bundle_path") from exc
        parts = name.split("/")
        protected = any(p.lower() in ("vendor", "media", "fonts", ".git", "node_modules") or
                        p.startswith(".") or p.split(".")[0].upper() in
                        {"CON", "NUL", "AUX", "PRN", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
                        for p in parts)
        allowed = (name in ("plan.md", "skill-usage.json") or
                   (name.startswith("public/") and Path(name).suffix.lower() in (".html", ".css", ".js", ".json")))
        if protected or not allowed or name.casefold() in seen or not isinstance(text, str):
            raise Blocked("unsafe_or_duplicate_bundle_file")
        seen.add(name.casefold())
    if "public/index.html" not in files:
        raise Blocked("site_index_missing")
    if "plan.md" not in files or "skill-usage.json" not in files:
        raise Blocked("site_construction_notes_missing")
    try:
        receipts = json.loads(files["skill-usage.json"])
    except ValueError as exc:
        raise Blocked("invalid_skill_receipts") from exc
    if not isinstance(receipts, list) or not receipts:
        raise Blocked("invalid_skill_receipts")
    return files


def public_digest(root):
    records = []
    for file in sorted(Path(root).rglob("*")):
        if file.is_symlink() or file.is_junction():
            raise Blocked("site_links_forbidden")
        if file.is_file():
            records.append([file.relative_to(root).as_posix(), sha(file.read_bytes())])
    return sha(json.dumps(records, separators=(",", ":"), ensure_ascii=False).encode())


class BrowserQa:
    """Fixed local browser probe through injected process supervision.

    The shipped entry point does not construct a process transport. Tests use
    MockQa or a mocked transport. Browser code never opens external connections.
    """
    def __init__(self, transport):
        self.transport = transport

    def check(self, site, brief, out):
        return self.transport.request({"root": str(site), "brief": brief, "out": str(out)}, 60)


class SiteBuilder:
    def __init__(self, executor, *, resources, work_root, qa, media_root=None):
        self.executor, self.resources, self.work_root = executor, Path(resources), Path(work_root)
        self.qa, self.media_root = qa, Path(media_root) if media_root is not None else None

    def _context(self, manifest):
        by_path = {e["path"]: e for e in manifest["files"]}
        refs = []
        for name in REFERENCE_PATHS:
            if name not in by_path:
                raise Blocked("construction_reference_missing:" + name)
            refs.append({"path": name, "sha256": by_path[name]["sha256"],
                         "text": ensure_inside(self.resources, name).read_text(encoding="utf-8")})
        return {"policy": "Construct a full static HTML/CSS/JS site from the brief and these references. "
                          "Planning is part of this call. Output a COMPLETE JSON files map, including "
                          "public/index.html, styles/JS as needed, plan.md and skill-usage.json. "
                          "Do not invoke tools, generate images, download, install, deploy, send messages, "
                          "run AI reviews or ask for extra model calls. Historical instructions conflicting "
                          "with this policy are inactive. Use relative local assets; no CDN. "
                          "Preserve client facts, photo roles, palette, premium feature and no-JS/reduced-motion fallback. "
                          "On repair, preserve working parts and return the complete file map again. "
                          "Never invent proof. Missing facts/media must be listed in plan.md.",
                "references": refs}

    def construction_inputs(self, brief, *, existing_site=None):
        """Read and fingerprint local inputs without calls, claims or workspaces."""
        validate_brief(brief)
        manifest = verify(self.resources)
        context = self._context(manifest)
        identity = {"brief": brief, "resource_manifest": sha(canonical(manifest).encode())}
        baseline = {}
        baseline_media = []
        if existing_site is not None:
            base = Path(existing_site).resolve()
            if not base.is_relative_to(self.work_root.resolve()) or not base.is_dir():
                raise Blocked("revision_source_outside_job_workspaces")
            identity["baseline_digest"] = public_digest(base)
            for file in sorted(base.rglob("*")):
                if file.is_file() and file.suffix.lower() in (".html", ".css", ".js", ".json"):
                    relative = file.relative_to(base).as_posix()
                    if relative.split("/")[0] not in ("vendor", "media", "fonts"):
                        baseline["public/" + relative] = file.read_text(encoding="utf-8")
                if file.is_file() and file.relative_to(base).parts[0] == "media":
                    if file.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".avif"):
                        raise Blocked("unsupported_baseline_media")
                    baseline_media.append((file.relative_to(base).as_posix(), file.read_bytes()))
            if len(canonical(baseline)) > 120000:
                raise Blocked("revision_context_too_large")
            context["existing_site"] = baseline
            context["revision_rule"] = "Apply every brief.revisions item to this existing site. Preserve working pages, features, photos and structure; do not start over."
        media = list(baseline_media)
        media_spec = brief.get("media") or {}
        local_inputs = list(media_spec.get("local_files", []))
        for upload in media_spec.get("uploads", []):
            if not isinstance(upload, str):
                raise Blocked("invalid_upload_path")
            local_inputs.append({"path": upload})
        for photo in media_spec.get("photos", []):
            if isinstance(photo, dict) and isinstance(photo.get("local_path"), str):
                local_inputs.append({"path": photo["local_path"]})
            elif photo and not any(item.get("source_url") == photo for item in local_inputs if isinstance(item, dict)):
                raise Blocked("remote_photo_requires_verified_local_copy")
        added = set()
        for item in local_inputs:
            if self.media_root is None or not isinstance(item, dict):
                raise Blocked("local_media_unavailable")
            source = ensure_inside(self.media_root, item["path"])
            if source.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".avif", ".woff2"):
                raise Blocked("unsupported_local_media")
            data = source.read_bytes()
            if len(data) > 10000000:
                raise Blocked("local_media_too_large")
            relative = "media/" + source.name
            if relative.casefold() in added:
                raise Blocked("duplicate_local_media")
            added.add(relative.casefold())
            media = [(name, content) for name, content in media if name.casefold() != relative.casefold()]
            media.append((relative, data))
        context["local_media"] = [{"path": path, "sha256": sha(data)} for path, data in media]
        context["local_assets"] = ["vendor/" + e["path"][len("design-kit/runtime/public/"):]
                                    for e in manifest["files"] if e["path"].startswith("design-kit/runtime/public/")]
        context["local_assets"] += ["fonts/" + e["path"][len("design-kit/fonts/"):]
                                     for e in manifest["files"] if e["path"].startswith("design-kit/fonts/")]
        # Media bytes are part of identity, so a restart cannot silently swap them.
        ledger_brief = {"brief": brief, "resources_sha256": identity["resource_manifest"],
                        "local_media": context["local_media"], "baseline_digest": identity.get("baseline_digest")}
        return manifest, context, identity, baseline, media, ledger_brief

    def build(self, job_id, brief, *, existing_site=None, queue=None, claim=None):
        validate_brief(brief)
        if not isinstance(job_id, str) or not 1 <= len(job_id) <= 128:
            raise Blocked("invalid_job")
        # Check before creating workspaces, copying inputs or loading costly context.
        self.executor._preflight()
        with self.executor.ledger.connect() as db:
            if db.execute("SELECT value FROM meta WHERE key='paused'").fetchone()[0] != "false":
                raise Blocked("generation_paused")
        manifest, context, identity, baseline, media, ledger_brief = self.construction_inputs(
            brief, existing_site=existing_site)
        if (queue is None) != (claim is None):
            raise Blocked("queue_claim_required")
        if queue is not None:
            if Path(queue.ledger.path).resolve() != Path(self.executor.ledger.path).resolve():
                raise Blocked("queue_executor_ledger_mismatch")
            request = queue.read_claim(claim)
            if (claim.job_id != job_id or request.get("contract") != "frontstep-manual-v1" or
                    request.get("inputs") != ledger_brief or
                    request.get("existing_site") != (str(Path(existing_site).resolve()) if existing_site else None)):
                raise Blocked("queued_construction_inputs_changed")
        workspace = ensure_inside(self.work_root, hashlib.sha256(job_id.encode()).hexdigest())
        if workspace.exists():
            if (workspace / "request.json").read_text(encoding="utf-8") != canonical(identity):
                raise Blocked("workspace_request_mismatch")
        else:
            prepare(self.resources, workspace)
            (workspace / "request.json").write_text(canonical(identity), encoding="utf-8")
        if not (workspace / "brief.json").exists():
            with (workspace / "brief.json").open("x", encoding="utf-8") as stream:
                stream.write(canonical(brief))
        with self.executor.ledger.connect() as db:
            job = db.execute("SELECT state FROM jobs WHERE id=?", (job_id,)).fetchone()
        if job is not None and job["state"] not in (("claimed", "needs_repair") if queue else ("needs_repair",)):
            raise Blocked("job_already_executed")

        def validate(phase, artifact):
            try:
                files = decode_bundle(artifact)
            except Blocked as exc:
                return [str(exc)]
            if any(name.endswith(".html") and name not in files for name in baseline):
                return ["existing_site_page_missing"]
            stage = workspace / phase
            stage.mkdir(exist_ok=False)  # Never overwrite a prior attempt.
            site = stage / "public"
            for entry in manifest["files"]:
                for prefix, output in (("design-kit/runtime/public/", "public/vendor/"),
                                       ("design-kit/fonts/", "public/fonts/")):
                    if not entry["path"].startswith(prefix):
                        continue
                    # Bundled browser assets/fonts only. No runtime build
                    # scripts or test fixtures are exposed as public assets.
                    relative = output + entry["path"][len(prefix):]
                    target = ensure_inside(stage, relative)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with target.open("xb") as stream:
                        stream.write(ensure_inside(self.resources, entry["path"]).read_bytes())
                    break
            for relative, data in media:
                target = ensure_inside(site, relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as stream:
                    stream.write(data)
            for name, text in files.items():
                target = ensure_inside(stage, name)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("x", encoding="utf-8", newline="\n") as stream:
                    stream.write(text)
            before = public_digest(site)
            report = self.qa.check(site, brief, stage / "qa")
            if (not isinstance(report, dict) or report.get("completed") is not True or
                    report.get("digest") != before or public_digest(site) != before):
                raise Blocked("qa_unavailable_or_stale")
            checks = report.get("checks")
            if (not isinstance(checks, list) or not checks or
                    any(not isinstance(c, dict) or type(c.get("passed")) is not bool or
                        not isinstance(c.get("code"), str) for c in checks)):
                raise Blocked("qa_measurement_missing")
            expected = {f"{viewport}:{code}" for viewport in ("desktop", "mobile")
                        for code in ("document", "layout", "photos", "accessibility", "feature",
                                     "typography", "links", "js_errors", "local_assets", "reduced_motion")}
            if brief.get("premium_feature"):
                expected |= {f"{viewport}:{code}" for viewport in ("desktop", "mobile")
                             for code in ("feature_scenario", "feature_fallback", "nojs_local_assets",
                                          "interaction_js_errors", "interaction_local_assets")}
            if not expected.issubset({c["code"] for c in checks}):
                raise Blocked("qa_checks_incomplete")
            screenshots = report.get("screenshots")
            if not isinstance(screenshots, dict) or not {"desktop", "mobile"}.issubset(screenshots):
                raise Blocked("qa_screenshots_missing")
            if brief.get("premium_feature") and not {"desktopNoJs", "mobileNoJs"}.issubset(screenshots):
                raise Blocked("qa_nojs_screenshots_missing")
            for shot in screenshots.values():
                if not isinstance(shot, dict):
                    raise Blocked("invalid_qa_screenshot")
                image = ensure_inside(stage / "qa", shot["path"])
                data = image.read_bytes()
                if not data.startswith(b"\x89PNG\r\n\x1a\n") or sha(data) != shot.get("sha256"):
                    raise Blocked("invalid_qa_screenshot")
            (stage / "qa-report.json").write_text(canonical(report), encoding="utf-8")
            return [c["code"][:500] for c in checks if not c["passed"]][:20]

        phase = "repair" if job and job["state"] == "needs_repair" else "initial"

        def run_phase():
            # Re-read immutable inputs before EVERY call, including a repair.
            if self.construction_inputs(brief, existing_site=existing_site)[-1] != ledger_brief:
                raise Blocked("queued_construction_inputs_changed")
            if queue is not None:
                return queue.run_claim(claim, self.executor, context=context,
                                       validator=lambda text: validate(phase, text))
            return self.executor.run(job_id, ledger_brief, phase=phase,
                                     context=context, validator=lambda text: validate(phase, text))

        result = run_phase()
        if result["state"] == "needs_repair":
            phase = "repair"
            result = run_phase()
        status = "awaiting_visual_review" if result["state"] == "complete" else "rejected"
        outcome = {"job_id": job_id, "state": status, "site": str(workspace / phase / "public"),
                   "human_review_required": True, "published": False,
                   "simulation_only": self.executor.ledger.simulation}
        with (workspace / "outcome.json").open("x", encoding="utf-8") as stream:
            stream.write(canonical(outcome))
        return outcome


def main():
    from config import load_policy
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("status",))
    parser.add_argument("--config", type=Path)
    args = parser.parse_args()
    policy = load_policy(args.config)
    print(canonical({"paused": policy.paused, "model": policy.model,
                     "api_transport_enabled": False, "production_verified": False,
                     "site_pipeline": "implemented", "real_generation": "blocked"}))


if __name__ == "__main__":
    main()
