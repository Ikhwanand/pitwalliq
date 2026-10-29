# PitwallIQ — Development Guide & Execution Blueprint

> **Product Name:** PitwallIQ  
> **Tagline:** Your AI Race Strategist  
> **Repository:** `pitwalliq`  
> **Status:** Architecture & Planning Phase (MVP Build)

This document serves as the single source of truth for developing **PitwallIQ**. Any AI agent or developer contributing to this codebase must review and follow the specifications, architectural decisions, and checklists documented below.

---

## 1. Product Vision & Core Workflow

PitwallIQ is a Formula 1 race analytics dashboard with an intelligent AI Strategy Assistant. The platform enables fans, enthusiasts, and motorsport analysts to explore real race data (lap timing, stint pace, tyre degradation, telemetry) and consult an AI strategist for grounded, evidence-backed tactical insights.

### Primary User Flow
$$\text{Select Season \& GP} \longrightarrow \text{Select Session} \longrightarrow \text{Select Team / Driver} \longrightarrow \text{Explore Telemetry Dashboard} \longrightarrow \text{Consult AI Strategist} \longrightarrow \text{Review Evidence \& Decision Matrix}$$

### Strict Data Grounding Rules
* **No Speculative Data:** Never fabricate lap times, tyre compounds, intervals, or pit stop events.
* **Data Provenance:** Every displayed metric must clearly disclose its status (`Historical`, `Delayed`, `Live`, or `Simulated`).
* **Calculation Integrity:** Calculations (stint pace, delta, degradation curves) must be performed by trusted Python code/FastF1, never guessed by an LLM via mental arithmetic.

---

## 2. Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEND (React 19 + Vite + Tailwind v4)        │
│  • Pitwall Dark UI (#090D14) with Electric Cyan & Racing Red    │
│  • Monospace Tabular Timing Tables & Telemetry Track Maps       │
│  • Strategy Panel with Step-by-Step Thinking Indicators         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST / SSE
┌────────────────────────────────▼────────────────────────────────┐
│                     BACKEND (FastAPI Async)                     │
│  • Clean Modular Architecture: routers / schemas / services     │
│  • Data Provider Interface (F1DataProvider)                     │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
┌───────────────▼───────────────┐ ┌───────────────▼───────────────┐
│       DATA ENGINE LAYER       │ │     AI STRATEGY WORKFLOW      │
│  • FastF1 (Primary for MVP)   │ │  Two-Tier Agno Multi-Agent    │
│  • Local Parquet/Disk Caching │ │  1. LLM Race Data Analyst     │
│  • OpenF1 (Future Live Feed)  │ │  2. LLM Decision Maker        │
│                               │ │  • MCP: @mcp:agentforge-ckg   │
└───────────────────────────────┘ └───────────────────────────────┘
```

### Stack Components:
1. **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons.
2. **Backend**: Python 3.11+, FastAPI (Async-first), Pydantic v2 schemas.
3. **Data Layer**: `fastf1` with disk cache enabled via `fastf1.Cache`.
4. **AI Agent Framework**: `agno` framework with **`agentforge-ckg`** MCP integration for agent routing and impact analysis.

---

## 3. Two-Tier AI Strategy Workflow (Analyst + Decision Maker)

To prevent LLM arithmetic hallucinations and deliver authentic pitwall strategy, the AI reasoning is split into two distinct, sequential stages:

### Stage 1: LLM Race Data Analyst (Telemetry & Fact Grounding)
* **Role**: Acts as the Race Data Engineer.
* **Responsibilities**:
  * Calls Python FastF1 tools (`get_lap_times`, `get_stint_pace`, `get_tyre_degradation`).
  * Measures pace drop-offs, calculates intervals to cars ahead/behind, and verifies pit loss windows (~20–24s).
* **Output**: A deterministic, validated `SituationBrief` (Pydantic schema).

### Stage 2: LLM Decision Maker (Chief Race Strategist)
* **Role**: Acts as the Pitwall Chief Strategist.
* **Responsibilities**:
  * Consumes the verified `SituationBrief` from Stage 1.
  * Evaluates tactical game theory: Undercut vs. Overcut, Track Position vs. Fresh Tyre Delta, Safety Car contingency windows.
* **Output**: A structured `StrategyDecisionMatrix`:
  * **Primary Recommendation** (e.g., *"Box this lap for Hard compound"*).
  * **Alternative Plan B** (e.g., *"Extend stint by 4 laps to target Safety Car window"*).
  * **Risk vs. Reward Evaluation**.
  * **Confidence Score & Stated Assumptions**.

---

## 4. Design System & Asset Specifications

### A. Color Palette ("Pitwall Engineering")

| Element | Hex Code | Visual Preview / Purpose |
| :--- | :--- | :--- |
| **Main Background** | `#090D14` | Deep Carbon Black (reduces eye strain, telemetry focus) |
| **Card / Panel Surface** | `#111827` | Slate Charcoal surface container |
| **Border / Divider** | `#1F2937` | Subtle technical boundary lines |
| **Hover Surface** | `#1E293B` | Interactive elevated state |
| **Primary Accent (Racing)** | `#E10600` | F1 Racing Red — Alerts, Box calls, Primary CTA |
| **Secondary Accent (AI Glow)** | `#00D2BE` | Electric Cyan — AI Strategist badge, Live status, Pace gain |
| **Text High Contrast** | `#F9FAFB` | Crisp White — Drivers, Lap times, Headers |
| **Text Secondary** | `#9CA3AF` | Cool Gray — Units, Sector deltas, Metadata |

### B. Pirelli Tyre Compound Standard Colors
* **SOFT**: `#EF4444` (Red)
* **MEDIUM**: `#F59E0B` (Yellow)
* **HARD**: `#F3F4F6` (White)
* **INTERMEDIATE**: `#10B981` (Green)
* **WET**: `#3B82F6` (Blue)

### C. Typography
* **Data & Timing Numbers**: `font-mono` (Tabular figures) to prevent layout shifts during live/lap updates.
* **UI & AI Explanations**: Clean Sans-Serif (`Inter` / `Space Grotesk`).

### D. Brand Assets (Ready in Repository)
* Logo Artwork (Raster): [`frontend/src/assets/logo.jpg`](file:///c:/MyProject/pitwalliq/frontend/src/assets/logo.jpg) & [`frontend/public/logo.jpg`](file:///c:/MyProject/pitwalliq/frontend/public/logo.jpg)
* Logo Vector (Scalable SVG): [`frontend/src/assets/logo.svg`](file:///c:/MyProject/pitwalliq/frontend/src/assets/logo.svg) & [`frontend/public/logo.svg`](file:///c:/MyProject/pitwalliq/frontend/public/logo.svg)

---

## 5. Development Guidelines & Protocols

All contributors and AI subagents must strictly adhere to [`.agents/rules/core-skills-protocol.md`](file:///c:/MyProject/pitwalliq/.agents/rules/core-skills-protocol.md):
1. **Karpathy Guidelines**: Think before coding, simplicity first (anti-overengineering), surgical changes, and goal-driven verification.
2. **AI Agent Development**: When modifying Agno agents, always consult `@mcp:agentforge-ckg` to verify symbol impact and agent routes.
3. **Backend Development**: Follow [`python-backend`](file:///c:/MyProject/pitwalliq/.agents/skills/python-backend/SKILL.md) standards (async-first, Pydantic schemas, dependency injection).
4. **Frontend Development**: Adhere to [`frontend-ui-engineering`](file:///c:/MyProject/pitwalliq/.agents/skills/frontend-ui-engineering/SKILL.md) and [`ui-taste`](file:///c:/MyProject/pitwalliq/.agents/skills/ui-taste/SKILL.md) (no generic AI aesthetic, composable components, WCAG accessible).
5. **Token Conservation**: Run shell commands with `rtk` where applicable to minimize LLM token bloat.

---

## 6. Implementation Checklist

Any AI agent or engineer picking up tasks should reference and update this checklist sequentially.

### Phase 1: Backend Foundation & FastF1 Engine
- [x] Initialize Python virtual environment (`pyproject.toml` or `requirements.txt` with `fastapi`, `uvicorn`, `fastf1`, `pandas`, `pydantic`).
- [x] Create modular backend structure:
  ```
  backend/
  ├── app/
  │   ├── api/          # Route handlers (v1)
  │   ├── core/         # Config, logging, settings
  │   ├── providers/    # F1DataProvider & FastF1Provider
  │   ├── schemas/      # Pydantic request/response models
  │   ├── services/     # Race analysis & data transformation
  │   └── main.py       # FastAPI application entrypoint
  ```
- [x] Implement `F1DataProvider` abstract interface.
- [x] Implement `FastF1Provider` with local disk caching (`cache/fastf1`).
- [x] Create core endpoints:
  - `GET /api/v1/seasons`
  - `GET /api/v1/events?season={year}`
  - `GET /api/v1/sessions/dashboard`
  - `GET /api/v1/sessions/driver-laps`
  - `GET /api/v1/sessions/track-map`
- [x] Write unit tests for data transformation using **2024 Bahrain Grand Prix** as benchmark.

### Phase 2: Agno Two-Tier AI Strategy Assistant
- [ ] Install and configure `agno` framework in `backend/app/agents/`.
- [ ] Implement Stage 1: **Race Data Analyst Agent** with FastF1 query tools.
- [ ] Define Pydantic schema for `SituationBrief`.
- [ ] Implement Stage 2: **Chief Strategist Agent** with decision matrix prompt templates.
- [ ] Build orchestration workflow combining Stage 1 & Stage 2 into a single unified endpoint:
  - `POST /api/v1/strategy/evaluate`
- [ ] Connect `@mcp:agentforge-ckg` to validate agent routing and dependency graph.

### Phase 3: Frontend Telemetry Dashboard
- [ ] Install icons (`lucide-react`) and chart libraries (`recharts` or lightweight SVG/Canvas).
- [ ] Configure global styles with Pitwall Engineering Palette in `frontend/src/index.css`.
- [ ] Build Top Navigation Bar with PitwallIQ Logo and Season/Grand Prix/Session Selector.
- [ ] Build Race Classification & Timing Table with tabular monospace numbers and tyre badges.
- [ ] Build Lap Pace & Stint Comparison Chart.
- [ ] Build SVG Circuit Map dynamically rendered from telemetry coordinates.
- [ ] Build Interactive AI Strategy Panel with:
  - Quick strategy prompt buttons (*"Assess Undercut"*, *"Tyre Wear Analysis"*, *"Pit Window"*)
  - Free-form chat input
  - Step-by-step thinking progress indicators (`[1/2] Analyzing telemetry...` $\rightarrow$ `[2/2] Formulating strategy...`)
  - Formatted Decision Matrix card (Plan A, Plan B, Confidence, Risks).

### Phase 4: Integration, Verification & Polish
- [ ] Connect frontend API clients to backend endpoints with loading and error boundaries.
- [ ] Verify complete user journey on historical 2024 Bahrain GP.
- [ ] Run `graphify update .` to keep knowledge graph up-to-date.
- [ ] Conduct end-to-end audit for performance, accessibility (WCAG), and responsive layout.
