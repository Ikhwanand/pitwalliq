---
name: frontier-flash-orchestrator
description: Orchestrate substantial coding tasks, multi-file builds, and refactors using Frontier Models (Gemini, Claude, GPT) for architecture and final review, while delegating high-volume code writing, unit testing, and debugging to fast/free worker models (such as Xiaomi MiMo-V2.6-Flash Free, DeepSeek V4.1 Flash, or GLM 5.3 Flash) via OpenCode, Freebuff, or 9Router CLI.
---

# Frontier Flash Orchestrator for Antigravity

**Save Frontier tokens for decisions that matter. Let fast/free worker models do the heavy writing.**

When working on large features or complex refactors, typing hundreds of lines of implementation code, boilerplate, and iterative test-fix cycles can consume hundreds of thousands of expensive frontier tokens and cause context bloat.

This skill implements the **Thin-Root Orchestration** pattern in Antigravity:
1. **Frontier Model (Antigravity)**: Plans architecture, sets strict contracts, writes task briefs, and conducts rigorous code/security review.
2. **Flash Worker (OpenCode / Freebuff / 9Router)**: Executes file discovery, code implementation, test execution, and debugging autonomously.
3. **Frontier Model (Antigravity)**: Inspects the patch diff and test evidence, performs final acceptance, and reports to the user.

---

## 1. Triggering the Workflow

When the user asks to build a substantial feature, refactor, or complex task, or invokes `$frontier-flash-orchestrator`:

1. **Check if this is a substantial build**:
   - For trivial edits (typos, single-line fixes, simple questions), execute directly in Antigravity without delegation.
   - For multi-file changes, new features, or multi-step tasks, activate the full orchestrator workflow.

2. **Verify Worker Availability**:
   - Supported Providers: **OpenCode** (`opencode`), **Kilo Code** (`kilo`), and **Freebuff** (`freebuff`).
   - Default Models: `opencode/mimo-v2.6-flash-free`, `openrouter/xiaomi/mimo-v2.6-flash`, or Freebuff built-in flash models.
   - Ensure at least one worker CLI is installed.

---

## 2. Phase 1: Architectural Design & Scope (Frontier)

Antigravity acts as the Lead Architect:
1. Review codebase patterns, conventions, and existing dependencies.
2. Draft a concise feature spec (`docs/agent-work/<feature>/spec.md`):
   - **Objectives & Non-Goals**
   - **Interfaces & Data Contracts**
   - **Concrete Acceptance Criteria**
   - **Verification Commands** (unit tests, build checks, linter)
3. If the task is multi-phased, break it down into sequential, testable bundles.

---

## 3. Phase 2: Create the Task Brief (Frontier)

Create an executable task brief (`docs/agent-work/<feature>/task-brief.md`):
- Specify **Exact in-scope files** to modify or create.
- Specify **Boundaries** (do not modify unrelated files or change project dependencies).
- Specify the **Verification Check**: exact test command that must pass.
- Use the bundled template in `templates/task-brief.md`.

---

## 4. Phase 3: Dispatch Worker Execution (Worker)

Antigravity dispatches the implementation bundle to the local worker via `run_command`:

```powershell
# Auto-detects available provider (OpenCode, Kilo Code, or Freebuff):
python .agents/skills/frontier-flash-orchestrator/scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md

# Or explicitly choose provider:
python .agents/skills/frontier-flash-orchestrator/scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md --provider kilo
python .agents/skills/frontier-flash-orchestrator/scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md --provider freebuff
python .agents/skills/frontier-flash-orchestrator/scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md --provider opencode --model opencode/mimo-v2.6-flash-free
```

*Or directly via Kilo Code / Freebuff / OpenCode:*
```powershell
# Kilo Code CLI:
kilo run --auto "Please read and execute the task brief located at docs/agent-work/<feature>/task-brief.md. Run all tests and verify before finishing."

# Freebuff:
freebuff --trust-agents

# OpenCode:
opencode run --model opencode/mimo-v2.6-flash-free "Please read and execute the task brief located at docs/agent-work/<feature>/task-brief.md. Run all tests and verify before finishing."
```

During this phase:
- The worker model writes the code and runs the tests.
- Antigravity does **not** consume expensive generation tokens while the worker iterates.

---

## 5. Phase 4: Acceptance Review & Quality Gate (Frontier)

Once the worker completes its task:
1. **Inspect Git Diff**: Antigravity runs `git diff` to inspect all changes made by the worker.
2. **Verify Acceptance Criteria**:
   - Check if the code follows clean architecture and project standards.
   - Verify there are no security risks, hardcoded secrets, or unintended side effects.
   - Run the automated test suite to verify independently:
     ```powershell
     npm test # or pytest / cargo test
     ```
3. **Acceptance Decision**:
   - **If clean & passing**: Accept the patch and prepare final user report.
   - **If issues found**: Issue a targeted fix brief to the worker, or apply high-leverage architectural refinements directly.

---

## 6. Phase 5: Final Delivery (Frontier)

Present a structured completion summary to the user:
- Summary of changes implemented.
- Files modified/created with clickable links.
- Test and verification results.
- Token efficiency & model routing notes (e.g. "Implementation handled by MiMo-V2.6-Flash Free via OpenCode").
