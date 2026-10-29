# Frontier Flash Orchestrator for Antigravity

A native Antigravity skill that brings the **Thin-Root Orchestration** pattern to Antigravity sessions.

- **Orchestrator**: Frontier Model (Gemini 3.8 Flash High, Claude 3.7 Sonnet, GPT-5).
- **Implementation Worker**: High-speed / Free models (Xiaomi MiMo-V2.6-Flash Free, DeepSeek V4.1 Flash, GLM 5.3 Flash) via OpenCode, Kilo Code, or Freebuff.

---

## What It Does

1. **Architecture & Scope (Frontier)**:
   Antigravity analyzes requirements, defines boundaries, and writes an executable task brief in `docs/agent-work/<feature>/task-brief.md`.

2. **Autonomous Implementation (Worker via OpenCode, Kilo Code, or Freebuff)**:
   Antigravity dispatches the brief using:
   ```powershell
   # Auto-detects OpenCode, Kilo Code, or Freebuff
   python .agents/skills/frontier-flash-orchestrator/scripts/dispatch_worker.py --brief docs/agent-work/<feature>/task-brief.md
   ```
   The worker creates files, writes the code, and runs tests iteratively without consuming expensive Frontier tokens.

3. **Batched Acceptance Review (Frontier)**:
   Antigravity inspects `git diff`, validates that acceptance criteria are met, executes verification commands, and presents the final summary to you.

---

## How to Use in Antigravity Chat

In any Antigravity conversation, simply type:

```text
$frontier-flash-orchestrator Tolong buatkan fitur [nama fitur atau deskripsi tugas].
Gunakan model frontier untuk arsitektur dan review, lalu delegasikan penulisan kode ke worker OpenCode.
```

---

## Installing into Other Projects

To use this skill in another project:
Copy the `.agents/skills/frontier-flash-orchestrator` directory into the `.agents/skills/` directory of that project:

```powershell
Copy-Item -Recurse -Path ".agents\skills\frontier-flash-orchestrator" -Destination "C:\Path\To\YourOtherProject\.agents\skills\"
```
