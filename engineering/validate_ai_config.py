"""Validate HIVE instruction references and the project's deliberately small config schema.

Run with Python 3.11+ and requirements-validation.txt installed.
This is structural validation, not proof of client discovery or agent behavior.
"""

from pathlib import Path
import re
import subprocess
import tomllib

import yaml

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read(path):
    return path.read_text(encoding="utf-8")


def validate_agent(path):
    data = tomllib.loads(read(path))
    required = {"name", "description", "developer_instructions"}
    require(required <= data.keys(), f"{path}: missing agent fields")
    require(data.keys() <= required | {"sandbox_mode"}, f"{path}: unexpected setting")
    for key in required:
        require(isinstance(data[key], str) and data[key].strip(), f"{path}: empty {key}")
    require(data["name"] == path.stem, f"{path}: name differs from filename")
    if "sandbox_mode" in data:
        require(data["sandbox_mode"] == "read-only", f"{path}: unsafe sandbox override")
    return data


def validate_skill(path):
    text = read(path)
    match = re.match(r"\A---\r?\n(.*?)\r?\n---\r?\n(.+)", text, re.S)
    require(match is not None, f"{path}: missing frontmatter or body")
    data = yaml.safe_load(match.group(1))
    require(isinstance(data, dict), f"{path}: invalid metadata")
    for key in ("name", "description"):
        require(isinstance(data.get(key), str) and data[key].strip(), f"{path}: invalid {key}")
    require(data["name"] == path.parent.name, f"{path}: directory/name mismatch")
    require(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", data["name"]), f"{path}: invalid name")


def main():
    for area in (ROOT, ROOT / "apps/frontend", ROOT / "apps/backend"):
        instructions = area / "AGENTS.md"
        require(bool(read(instructions).strip()), f"{instructions}: empty")
        imports = re.findall(r"^@([^\s]+)$", read(area / "CLAUDE.md"), re.M)
        expected = {"AGENTS.md"} if area == ROOT else {"../../AGENTS.md", "AGENTS.md"}
        require(set(imports) == expected, f"{area}: unexpected CLAUDE imports")
        for target in imports:
            require((area / target).resolve().is_file(), f"{area}: broken import {target}")
    for guide in ("ai-workflow.md", "review.md", "ci.md", "ai-config.md"):
        require((ROOT / "engineering" / guide).is_file(), f"missing guide {guide}")

    config = tomllib.loads(read(ROOT / ".codex/config.toml"))
    require(config == {"agents": {"enabled": True, "max_concurrent_threads_per_session": 2}},
            "project config differs from reviewed minimal policy")
    agents = list((ROOT / ".codex/agents").glob("*.toml"))
    names = set()
    for path in agents:
        data = validate_agent(path)
        require(data["name"] not in names, "duplicate agent name")
        names.add(data["name"])
        if data["name"] == "hive-reviewer":
            require(data.get("sandbox_mode") == "read-only", "reviewer must default to read-only")
    require(names == {"hive-frontend", "hive-backend", "hive-reviewer"}, "unexpected agents")
    skills = list((ROOT / ".agents/skills").glob("*/SKILL.md"))
    require(len(skills) == 2, "expected two project skills")
    for path in skills:
        validate_skill(path)

    # BaseLoader keeps YAML 1.1 from interpreting GitHub's `on` key as a boolean.
    workflow = yaml.load(read(ROOT / ".github/workflows/ci.yml"), Loader=yaml.BaseLoader)
    require({"pull_request", "push", "workflow_dispatch"} <= workflow["on"].keys(), "missing CI trigger")
    require(workflow["permissions"] == {"contents": "read"}, "unexpected CI permissions")
    require({"backend", "frontend", "ai-config"} <= workflow["jobs"].keys(), "missing CI job")
    tracked = subprocess.check_output(["git", "ls-files", "--", "docs/"], cwd=ROOT, text=True)
    require(not tracked.strip(), "root docs must remain untracked")
    ignored = subprocess.run(["git", "check-ignore", "-q", "docs/ai-validation-probe.md"], cwd=ROOT)
    require(ignored.returncode == 0, "root docs must remain ignored")
    print("OK: AGENTS/CLAUDE imports, 3 agents, 2 skills, CI YAML and local docs policy")


if __name__ == "__main__":
    main()
