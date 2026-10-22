"""Import local recovery material without overwriting any existing file.

Reads the original builder from pinned Git blobs, never from an installer.
Historical workers/installers/launchers are retained as .source.txt references.
No subprocess other than read-only Git, no dependencies, no network or AI.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path, PurePosixPath

PINNED_COMMIT = "0c24be3ea0990abcd0860450de89c09d55c0438d"
SKIP = {".git", "node_modules", "__pycache__", "jobs", "test-output", "motion-evidence"}
SECRET = re.compile(rb"(?:sk-ant-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,}|APP_USR-[A-Za-z0-9_-]{15,})")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_relative(value):
    if not isinstance(value, str) or not value or "\\" in value or ":" in value:
        raise ValueError("unsafe resource path")
    relative = PurePosixPath(value)
    if relative.is_absolute() or any(part in (".", "..") for part in value.split("/")):
        raise ValueError("unsafe resource path")
    if relative.as_posix() != value:
        raise ValueError("noncanonical resource path")
    if any(part.endswith((".", " ")) for part in relative.parts):
        raise ValueError("unsafe Windows resource path")
    return relative


def ensure_inside(root, relative):
    relative = safe_relative(relative)
    root = Path(root).resolve()
    target = root.joinpath(*relative.parts)
    if not target.resolve().is_relative_to(root):
        raise ValueError("resource path escapes destination")
    # Refuse links/junctions even if they resolve inside the pack.
    for candidate in [target, *target.parents]:
        if candidate == root:
            break
        if candidate.is_symlink() or candidate.is_junction():
            raise ValueError("resource links are forbidden")
    return target


def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], check=True,
                          capture_output=True, timeout=30).stdout


def candidates(repo, project):
    tracked = git(repo, "ls-tree", "-r", "--name-only", PINNED_COMMIT).decode().splitlines()
    for name in tracked:
        safe_relative(name)
        if name.startswith("worker/") or name == "install.sh":
            target = "original-builder/" + name + ".source.txt"
        elif name == "CLAUDE.md":
            # Stored knowledge, never a global or automatically loaded policy.
            target = "original-builder/CLAUDE.md.source.txt"
        else:
            target = "original-builder/" + name
        yield target, f"git:{PINNED_COMMIT}:{name}", git(repo, "show", f"{PINNED_COMMIT}:{name}")
    mappings = [("design-kit", project / "local-factory" / "design-kit"),
                ("examples", project / "local-factory" / "examples"),
                ("local-briefs", project / "local-briefs"),
                ("local-qa", project / "local-qa")]
    for prefix, source in mappings:
        if not source.is_dir():
            raise ValueError(f"missing recovery source: {source}")
        for file in sorted(source.rglob("*")):
            if not file.is_file() or any(part in SKIP for part in file.relative_to(source).parts):
                continue
            if file.is_symlink() or file.is_junction():
                raise ValueError(f"source link forbidden: {file.name}")
            if file.name.startswith(".env") or file.suffix.lower() in (".log", ".key", ".pem", ".sqlite", ".db"):
                continue
            yield prefix + "/" + file.relative_to(source).as_posix(), str(file), file.read_bytes()
    # Recover the local factory's orchestration source, not its live jobs/logs.
    # These scripts include AI calls and batch launchers and must stay inert.
    for file in sorted((project / "local-factory").glob("*.mjs")):
        yield "local-factory-source/" + file.name + ".source.txt", str(file), file.read_bytes()
    for name in ("BUILDER-ORIGIN.md", "RUN-CODEX.md", "FACTORY-REPORT.md"):
        file = project / name
        if file.is_file():
            yield "provenance/" + name, str(file), file.read_bytes()


def import_pack(entries, destination):
    destination = Path(destination)
    material = []
    seen = set()
    for name, source, data in entries:
        target = ensure_inside(destination, name)
        folded = name.casefold()
        if folded in seen:
            raise ValueError("duplicate resource destination")
        seen.add(folded)
        if SECRET.search(data):
            raise ValueError(f"possible credential in resource: {name}")
        if target.exists() and (not target.is_file() or target.read_bytes() != data):
            raise FileExistsError(f"preserved existing resource, import aborted: {name}")
        material.append((name, str(source), data))
    manifest = {"schema": 1, "original_commit": PINNED_COMMIT, "production_verified": False,
                "files": [{"path": name, "source": source, "sha256": sha(data), "bytes": len(data)}
                          for name, source, data in material]}
    encoded = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode()
    manifest_path = ensure_inside(destination, "manifest.json")
    if manifest_path.exists() and manifest_path.read_bytes() != encoded:
        raise FileExistsError("existing manifest preserved, import aborted")
    # All collisions are checked BEFORE writing. Exclusive creation also
    # protects against a file appearing concurrently. Partial imports are safe
    # to rerun; without the complete manifest they cannot be used by the runner.
    for name, _, data in material:
        target = ensure_inside(destination, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            with target.open("xb") as stream:
                stream.write(data)
    if not manifest_path.exists():
        with manifest_path.open("xb") as stream:
            stream.write(encoded)
    return {"files": len(material), "bytes": sum(len(item[2]) for item in material),
            "manifest_sha256": sha(encoded), "production_verified": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-repo", required=True, type=Path)
    parser.add_argument("--project-copy", required=True, type=Path)
    args = parser.parse_args()
    destination = Path(__file__).resolve().parent / "resources"
    print(json.dumps(import_pack(candidates(args.source_repo, args.project_copy), destination)))
