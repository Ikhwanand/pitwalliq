# Core Skills & Development Protocol (PitwallIQ)

Mandatory operational rules for AI assistants analyzing, architecting, and implementing code in this repository.

---

## 0. Primary Source of Truth: `DEV_GUIDE.md`

Before taking any action, implementing features, modifying files, or answering architecture questions:
* **The AI MUST consult and align with [`DEV_GUIDE.md`](file:///c:/MyProject/pitwalliq/DEV_GUIDE.md)**.
* Check the current phase, architectural boundaries, data contracts, and design tokens established in `DEV_GUIDE.md`.
* Actively track and update the implementation checklist (`- [ ]` to `- [x]`) as tasks are completed.

---

## 1. Foundational Working Philosophy (Discipline & Efficiency)

The AI's primary working philosophy is centered on **Rigorous Coding Discipline and Token Efficiency**, adopting principles from `karpathy-guidelines` and `frontier-flash-orchestrator`:

1. **Think Before Coding**:
   - Explicitly surface all assumptions, constraints, and trade-offs before touching code.
   - If ambiguities exist or a significantly simpler approach is available, present alternatives and ask the user before proceeding. Never make silent assumptions.
2. **Simplicity First (Anti-Overengineering)**:
   - Write the minimum amount of code required to solve the problem directly.
   - Avoid premature abstractions, speculative features, or unrequested flexibility/configuration.
   - Always evaluate: *"Would a senior engineer consider this overcomplicated?"* If yes, simplify.
3. **Surgical Changes**:
   - Touch only lines of code directly relevant to the user's explicit request.
   - Never arbitrarily reformat, refactor, or "improve" adjacent working code.
   - Match existing codebase conventions and clean up any orphaned imports/variables introduced by your changes.
4. **Goal-Driven & Verification Loop**:
   - Define verifiable success criteria (unit tests, build checks, or linter runs) for every task.
   - Validate state before and verify correctness after changes.
5. **Frontier-Flash Thin-Root Delegation**:
   - For multi-file implementation, new features, or bulk coding tasks, **Antigravity MUST NOT write high-volume boilerplate directly**.
   - Instead, act as Lead Architect: draft the architecture spec and task brief (`docs/agent-work/<feature>/task-brief.md`), dispatch to the local worker model (`kilo` or `opencode` via `dispatch_worker.py`), and conduct rigorous acceptance review on the resulting git diff and test evidence.

---

## 2. Three-Layer Architecture & Mandatory Skill Invocations

Before making modifications or implementing features in any layer, **the AI MUST consult and adhere to the guidance of the respective skills**.

### A. AI Agent Layer (`agno` + MCP `@mcp:agentforge-ckg`)
* **Mandatory Skill**: [`agno`](file:///c:/MyProject/pitwalliq/.agents/skills/agno/SKILL.md)
* **Mandatory MCP Server**: `@mcp:agentforge-ckg`
* **Execution Protocol**:
  1. Whenever designing, modifying, debugging, or analyzing AI Agent architectures (Agno Agents, Teams, Workflows, or AgentOS runtime):
     - **Always utilize tools from the `agentforge-ckg` MCP server** (`ckg_repo_map`, `ckg_search`, `ckg_symbol`, `ckg_impact`, `ckg_neighbors`, `ckg_routes`, `ckg_decisions`) to map agent routes, trace symbol dependencies, and perform impact analysis on agent code before applying changes.
  2. Adhere to production Agno patterns:
     - Define sharp, role-based instructions and explicit delegation in Multi-Agent Teams.
     - Decouple session memory, knowledge bases (RAG), and tools cleanly.
     - Ensure robust error handling, rate limiting, and exponential backoff.

### B. Backend Layer (`python-backend`)
* **Mandatory Skill**: [`python-backend`](file:///c:/MyProject/pitwalliq/.agents/skills/python-backend/SKILL.md)
* **Execution Protocol**:
  1. **Async-first**: Use `async`/`await` for all I/O operations, asynchronous database sessions (SQLAlchemy async), and external API integrations (FastF1/OpenF1). Never block the event loop with synchronous calls.
  2. **Type Everything & Strict Schema**: Enforce Pydantic schemas for all request/response data contracts. Validate early.
  3. **Dependency Injection**: Leverage FastAPI's `Depends()` for database sessions, authentication, and service providers.
  4. **Fail Fast & Secure**: Return structured error payloads via `HTTPException`. Never trust unvalidated input.
  5. **Clean Architecture**: Strictly separate `router` (endpoints), `schemas` (contracts/DTOs), `models` (ORM entities), and `services` (business logic).

### C. Frontend Layer (`frontend-ui-engineering`, `ui-taste`, `uizze-ui`)
* **Mandatory Skills**:
  - [`frontend-ui-engineering`](file:///c:/MyProject/pitwalliq/.agents/skills/frontend-ui-engineering/SKILL.md)
  - [`ui-taste`](file:///c:/MyProject/pitwalliq/.agents/skills/ui-taste/SKILL.md)
  - [`uizze-ui`](file:///c:/MyProject/pitwalliq/.agents/skills/uizze-ui/SKILL.md)
* **Execution Protocol**:
  1. **Zero AI-Slop**: Reject generic, soulless AI aesthetics. Build high-contrast, premium UI inspired by real Formula 1 telemetry and pitwall monitors.
  2. **Composition over Configuration**: Prefer composable, modular components over monolithic components with dozens of configuration props.
  3. **Image-First Workflow**: For new visual designs or significant UI overhauls, establish and inspect a clear visual target before writing JSX/CSS.
  4. **Accessibility & Resilience**: Maintain semantic HTML5, WCAG color contrast, full keyboard navigation, and proper handling of loading, empty, and error states.

---

## 3. Pre-Action Verification Checklist

Before executing actions (editing files, generating features, or refactoring):
- [ ] **Have I consulted and aligned with [`DEV_GUIDE.md`](file:///c:/MyProject/pitwalliq/DEV_GUIDE.md) and tracked milestone items?**
- [ ] Have I applied the Karpathy principles (Simple, Surgical, Verified)?
- [ ] **If this is a multi-file build or feature task: Have I prepared a Task Brief (`docs/agent-work/<feature>/task-brief.md`) and dispatched implementation to the local worker model (`dispatch_worker.py`) to conserve tokens?**
- [ ] Have I consulted the corresponding skill for this layer (`agno`, `python-backend`, or `frontend-ui-engineering` / `ui-taste`)?
- [ ] If working on Agno AI Agents: **Have I invoked MCP `agentforge-ckg` to analyze code impact and agent routing?**
- [ ] Can shell commands be executed with the `rtk` prefix to optimize token usage?
