#!/usr/bin/env python3
"""
Universal AI Coding Agent Orchestrator Installer.
Installs thin-root orchestrator rules and worker dispatchers into any project or AI tool:
- Claude Code (CLAUDE.md)
- Cursor (.cursor/rules/orchestrator.mdc)
- Windsurf (.windsurfrules)
- GitHub Copilot (.github/copilot-instructions.md)
- OpenCode / Kilo Code / Antigravity / Codex (AGENTS.md & .agents/skills/)
"""
from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import sys

AGENTS_MD = """# Universal Frontier-to-Flash Orchestrator Protocol

> **Role & Philosophy**:
> "Save Frontier Model tokens (Claude, Gemini, GPT) for architecture, high-stakes decisions, and final review. Delegate high-volume code writing, iterative test runs, and routine debugging to fast, free, or local worker models (such as Xiaomi MiMo-V2.6-Flash Free, DeepSeek Flash, or GLM 5.3 Flash via OpenCode, Freebuff, or 9Router)."

---

## 1. When This Protocol Activates
- **Skip Trivial Tasks**: Single-line edits, typos, quick explanations stay directly with the active agent.
- **Activate for Substantial Work**: Multi-file features, architectural refactors, test suite additions, and large bug-hunt cycles.

---

## 2. Universal 3-Step Lifecycle

### Step 1: Architect (Frontier Agent)
Before writing voluminous code:
1. Examine existing codebase patterns and dependencies.
2. Formulate a short, strict specification (`docs/agent-work/<task>/spec.md`):
   - Scope boundaries (In-Scope files vs Out-of-Scope files).
   - Clear contracts & interface signatures.
   - Exact verification commands (e.g. `npm test`, `pytest`).
3. Output the executable task brief (`docs/agent-work/<task>/task-brief.md`).

### Step 2: Delegate Implementation (Fast/Free Worker)
Invoke the worker CLI using the cross-tool dispatcher (supports OpenCode, Kilo Code, and Freebuff):
```bash
# Auto-detects available worker (OpenCode, Kilo Code, or Freebuff):
python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md

# Or explicitly specify provider:
python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md --provider kilo
python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md --provider freebuff
python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md --provider opencode --model opencode/mimo-v2.6-flash-free
```
*Or directly via Kilo Code / Freebuff / OpenCode:*
```bash
# Kilo Code CLI:
kilo run --auto "Read and implement docs/agent-work/<task>/task-brief.md, run tests, and report."

# Freebuff (reads .agents and AGENTS.md automatically):
freebuff --trust-agents

# OpenCode:
opencode run --model opencode/mimo-v2.6-flash-free "Read and implement docs/agent-work/<task>/task-brief.md, run tests, and report."
```
*The worker handles file discovery, drafting, test-driven debugging, and test validation without eating expensive frontier tokens.*

### Step 3: Acceptance Review (Frontier Agent)
Once the worker concludes:
1. Run `git diff` to inspect every file changed by the worker.
2. Confirm the code adheres strictly to architectural boundaries, security practices, and clean code conventions.
3. Independently execute the verification tests.
4. If clean, accept the patch and summarize the outcome to the user.
"""

CLAUDE_MD = """# Claude Code Orchestrator Protocol

You are operating as the **Lead Architect & Reviewer** (Frontier Model).
To preserve high-reasoning tokens and maintain context clarity on large tasks, apply the **Frontier-to-Flash Delegation Protocol**:

## Workflow Rules for Claude Code:
1. **Direct Execution**: For small, 1-2 file edits or quick bugfixes, implement directly using your native edit tools.
2. **Substantial Tasks**: When the user requests a multi-file feature, major refactor, or complex task:
   - Create a task plan and task brief in `docs/agent-work/<task>/task-brief.md`.
   - Delegate implementation and test iterations to the fast/free local worker (OpenCode or Freebuff) using Bash:
     ```bash
     python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md
     ```
   - Once completed, inspect `git status` and `git diff`.
   - Run the project's test suite to verify code quality.
   - Present the final reviewed diff and test results to the user.
"""

CURSOR_MDC = """---
description: Thin-Root Frontier-to-Flash Orchestration for large builds and refactors
globs: *
alwaysApply: false
---

# Cursor Orchestration Rule

When working on large, multi-file features or substantial refactoring tasks:
1. Act as the **Architect & Reviewer**:
   - Create a task brief specifying scope, interfaces, and test requirements.
   - Do not spend massive context writing hundreds of lines of repetitive boilerplate if a free worker CLI is available.
2. Delegate volume implementation to the local worker via terminal:
   ```bash
   python scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md
   ```
3. Perform **Acceptance Review**:
   - Inspect the worker's changes via `git diff`.
   - Run verification checks and tests.
   - Deliver reviewed results to the user.
"""

WINDSURF_RULES = """# Windsurf Frontier-to-Flash Orchestration Rules

- For small, single-file edits, implement directly.
- For multi-file builds, large refactors, or extensive test generation:
  1. Define the architectural spec and task brief (`docs/agent-work/<task>/task-brief.md`).
  2. Dispatch implementation to the fast worker (OpenCode or Freebuff) via terminal:
     `python scripts/dispatch_worker.py --brief docs/agent-work/<task>/task-brief.md`
  3. Review the git diff and run verification commands before completing the turn.
"""

COPILOT_INSTRUCTIONS = """# GitHub Copilot Orchestrator Instructions

When tackling multi-file builds, refactors, or substantial features:
1. Start with an architectural specification and clear acceptance criteria.
2. Structure implementation into coherent, isolated bundles with designated test commands.
3. If autonomous worker execution is requested, generate an executable task brief in `docs/agent-work/<task>/task-brief.md`.
4. Review all generated code against security standards, edge cases, and unit test pass rates.
"""

def install_to(target_dir: Path, tools: list[str] | None = None) -> None:
    target_dir = target_dir.resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    all_tools = {"claude", "cursor", "windsurf", "copilot", "universal"}
    selected = set(tools) if tools else all_tools

    print(f"[*] Installing Universal Orchestrator rules into: {target_dir}")

    # Universal AGENTS.md
    if "universal" in selected:
        (target_dir / "AGENTS.md").write_text(AGENTS_MD, encoding="utf-8")
        print("  [+] Installed AGENTS.md (Universal: OpenCode, Kilo, Codex, Antigravity)")

    # Claude Code
    if "claude" in selected:
        (target_dir / "CLAUDE.md").write_text(CLAUDE_MD, encoding="utf-8")
        print("  [+] Installed CLAUDE.md (Claude Code)")

    # Cursor
    if "cursor" in selected:
        cursor_dir = target_dir / ".cursor" / "rules"
        cursor_dir.mkdir(parents=True, exist_ok=True)
        (cursor_dir / "orchestrator.mdc").write_text(CURSOR_MDC, encoding="utf-8")
        print("  [+] Installed .cursor/rules/orchestrator.mdc (Cursor)")

    # Windsurf
    if "windsurf" in selected:
        (target_dir / ".windsurfrules").write_text(WINDSURF_RULES, encoding="utf-8")
        print("  [+] Installed .windsurfrules (Windsurf)")

    # GitHub Copilot
    if "copilot" in selected:
        github_dir = target_dir / ".github"
        github_dir.mkdir(parents=True, exist_ok=True)
        (github_dir / "copilot-instructions.md").write_text(COPILOT_INSTRUCTIONS, encoding="utf-8")
        print("  [+] Installed .github/copilot-instructions.md (GitHub Copilot)")

    # Scripts / Dispatcher
    scripts_dest = target_dir / "scripts"
    scripts_dest.mkdir(parents=True, exist_ok=True)
    # Check if dispatch_worker.py exists nearby
    this_dir = Path(__file__).resolve().parent
    local_dispatcher = this_dir / "dispatch_worker.py"
    if local_dispatcher.exists():
        shutil.copy2(local_dispatcher, scripts_dest / "dispatch_worker.py")
        print("  [+] Installed scripts/dispatch_worker.py (Execution Engine)")

    print("[SUCCESS] All orchestrator rules successfully configured!\n")

def main() -> int:
    parser = argparse.ArgumentParser(description="Universal AI Coding Agent Orchestrator Installer")
    parser.add_argument("--target", default=".", help="Target project directory (default: current directory)")
    parser.add_argument("--tools", nargs="+", choices=["claude", "cursor", "windsurf", "copilot", "universal"],
                        help="Specific tools to install for (default: all)")
    args = parser.parse_args()

    install_to(Path(args.target), args.tools)
    return 0

if __name__ == "__main__":
    sys.exit(main())
