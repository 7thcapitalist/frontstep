"""Offline verification and assembly of the recovered Frontstep builder kit.

Does not install skills globally, run scripts, call AI or start a worker.
"""
import argparse
import json
from pathlib import Path

from import_resources import ensure_inside, sha


def verify(pack):
    pack = Path(pack)
    manifest = json.loads((pack / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("schema") != 1 or not isinstance(manifest.get("files"), list):
        raise ValueError("invalid resource manifest")
    names = set()
    for entry in manifest["files"]:
        path = ensure_inside(pack, entry["path"])
        if entry["path"].casefold() in names:
            raise ValueError("duplicate manifest path")
        names.add(entry["path"].casefold())
        data = path.read_bytes()
        if len(data) != entry["bytes"] or sha(data) != entry["sha256"]:
            raise ValueError(f"resource integrity failed: {entry['path']}")
    return manifest


def inventory(pack):
    manifest = verify(pack)
    paths = [entry["path"] for entry in manifest["files"]]
    skills = [p for p in paths if p.endswith("/SKILL.md")]
    return {"verified_files": len(paths), "original_commit": manifest["original_commit"],
            "skills": skills, "production_verified": False, "generation_paused": True,
            "production_adapter": "unavailable"}


def prepare(pack, destination):
    """Assemble a fresh workspace; existing workspaces are never overwritten.

    All building knowledge is available on disk. Runtime-specific context
    loading, cost permits and one-request enforcement still require an audited
    adapter. Merely preparing these files does NOT imply a build is authorized.
    """
    pack, destination = Path(pack), Path(destination)
    manifest = verify(pack)
    destination.mkdir(parents=True, exist_ok=False)
    mappings = [
        ("original-builder/skills/frontstep-coder/", "skill/"),
        ("design-kit/", "reference/design-kit/"),
        ("local-qa/", "qa-tools/"),
    ]
    for entry in manifest["files"]:
        for prefix, output in mappings:
            if entry["path"].startswith(prefix):
                relative = output + entry["path"][len(prefix):]
                target = ensure_inside(destination, relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as stream:
                    stream.write(ensure_inside(pack, entry["path"]).read_bytes())
                break
    (destination / "EXECUTION-POLICY.md").write_text(
        "# Frontstep reserve workspace\n\n"
        "Generation is PAUSED. This is an offline resource assembly, not a completed site.\n"
        "skill/SKILL.md and reference/design-kit/ contain recovered construction knowledge.\n"
        "Historical instructions to deploy, invoke AI reviews, generate images, retry or loop\n"
        "do not authorize execution. No production integrations are connected.\n"
        "All AI work must share ONE initial request and at most ONE repair per persistent job.\n"
        "Planning is part of initial generation; QA/status are deterministic code.\n"
        "Missing runtime, model availability, quota measurement or exclusive handoff blocks execution.\n"
        "This policy takes precedence over imported historical skill instructions.\n",
        encoding="utf-8")
    return {"prepared": True, "generation_paused": True, "production_verified": False,
            "resources": len(manifest["files"])}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("verify",))
    args = parser.parse_args()
    print(json.dumps(inventory(Path(__file__).resolve().parent / "resources"), ensure_ascii=False))
