"""Regression checks for invalid metadata; no application or database access."""

from pathlib import Path
import tempfile
import unittest

from validate_ai_config import validate_agent, validate_skill


class ConfigValidationTests(unittest.TestCase):
    def test_agent_requires_instructions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "example.toml"
            path.write_text('name = "example"\ndescription = "example"\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_agent(path)

    def test_agent_rejects_permission_expansion(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "example.toml"
            path.write_text('name = "example"\ndescription = "example"\n'
                            'developer_instructions = "Review only"\n'
                            'sandbox_mode = "danger-full-access"\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_agent(path)

    def test_skill_requires_description(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "SKILL.md"
            path.write_text('---\nname: example\n---\nInstructions\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_skill(path)


if __name__ == "__main__":
    unittest.main()
