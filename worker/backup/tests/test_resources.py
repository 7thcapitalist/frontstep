import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_resources import import_pack, safe_relative
from resource_pack import prepare, verify


class ResourceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="frontstep-resources-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pack = self.root / "pack"
        self.entries = [
            ("original-builder/skills/frontstep-coder/SKILL.md", "mock source", b"# Mock skill"),
            ("original-builder/skills/frontstep-coder/assets/starter/public/index.html", "mock source", b"mock starter"),
            ("original-builder/worker/worker.mjs.source.txt", "mock source", b"never execute this mocked worker"),
            ("design-kit/skills/mock/SKILL.md", "mock source", b"# Mock extra skill"),
            ("local-qa/qa.mjs", "mock source", b"mock deterministic QA"),
        ]

    def test_import_exact_bytes_and_rerun_is_idempotent(self):
        first = import_pack(self.entries, self.pack)
        second = import_pack(self.entries, self.pack)
        self.assertEqual(first, second)
        self.assertEqual(len(verify(self.pack)["files"]), len(self.entries))
        for name, _, data in self.entries:
            self.assertEqual((self.pack / name).read_bytes(), data)

    def test_preserve_existing_file_and_abort_before_any_write(self):
        existing = self.pack / self.entries[1][0]
        existing.parent.mkdir(parents=True)
        existing.write_bytes(b"previous work")
        with self.assertRaises(FileExistsError):
            import_pack(self.entries, self.pack)
        self.assertEqual(existing.read_bytes(), b"previous work")
        self.assertFalse((self.pack / self.entries[0][0]).exists())
        self.assertFalse((self.pack / "manifest.json").exists())

    def test_existing_manifest_preserved(self):
        import_pack(self.entries, self.pack)
        before = (self.pack / "manifest.json").read_bytes()
        with self.assertRaises(FileExistsError):
            import_pack(self.entries + [("new.md", "mock source", b"new")], self.pack)
        self.assertEqual((self.pack / "manifest.json").read_bytes(), before)
        self.assertFalse((self.pack / "new.md").exists())

    def test_traversal_absolute_and_duplicate_paths_blocked(self):
        for name in ("../escape", "/absolute", "C:/escape", "a\\b", "a/../b", "a//b", "a./b"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                safe_relative(name)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            import_pack([("a.md", "mock", b"a"), ("A.md", "mock", b"a")], self.pack)

    def test_possible_credentials_block_import_without_logging_contents(self):
        with self.assertRaisesRegex(ValueError, "possible credential"):
            import_pack([("mock.txt", "mock", b"sk-ant-" + b"FAKE" * 12)], self.pack)
        self.assertFalse(self.pack.exists())

    def test_modified_resource_blocks_assembly(self):
        import_pack(self.entries, self.pack)
        (self.pack / self.entries[0][0]).write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "integrity"):
            prepare(self.pack, self.root / "workspace")
        self.assertFalse((self.root / "workspace").exists())

    def test_assembly_contains_original_skill_assets_extra_skills_and_qa_without_execution(self):
        import_pack(self.entries, self.pack)
        with patch("subprocess.Popen", side_effect=AssertionError("no subprocess allowed")):
            output = self.root / "workspace"
            result = prepare(self.pack, output)
        self.assertTrue(result["generation_paused"])
        self.assertFalse(result["production_verified"])
        self.assertEqual((output / "skill/SKILL.md").read_bytes(), b"# Mock skill")
        self.assertEqual((output / "skill/assets/starter/public/index.html").read_bytes(), b"mock starter")
        self.assertTrue((output / "reference/design-kit/skills/mock/SKILL.md").exists())
        self.assertTrue((output / "qa-tools/qa.mjs").exists())
        self.assertFalse((output / "worker").exists())
        self.assertIn("Generation is PAUSED", (output / "EXECUTION-POLICY.md").read_text())
        with self.assertRaises(FileExistsError):
            prepare(self.pack, output)

    def test_missing_manifest_blocks_assembly(self):
        with self.assertRaises(FileNotFoundError):
            prepare(self.pack, self.root / "workspace")
        self.assertFalse((self.root / "workspace").exists())


if __name__ == "__main__":
    unittest.main()
