# 🏎️ PitwallIQ — Formula 1 Tactical Telemetry & AI Strategy Directorate

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![FastF1](https://img.shields.io/badge/FastF1-3.4+-E10600.svg?style=flat&logo=formula1&logoColor=white)](https://docs.fastf1.dev)
[![Agno AI](https://img.shields.io/badge/Agno-Multi--Agent-FF6B6B.svg?style=flat)](https://agno.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**PitwallIQ** is a mission-control Formula 1 tactical race engineering dashboard. It combines authentic GPS telemetry data, dynamic track geometry, real-time race simulation playback, and an autonomous **2-Tier Agno Multi-Agent AI Strategy Directorate** to deliver real-time pitstop strategy, undercut/overcut analysis, and tyre degradation predictions.

---

## 📸 Key Features

### 1. 🗺️ High-Fidelity Telemetry Circuit Map
- **Authentic Track Geometry**: 40+ official circuits (Bahrain, Jeddah, Suzuka, Monaco, Spa, Silverstone, etc.) mapped via real GPS telemetry coordinates.
- **Catmull-Rom Cubic Bezier Smoothing**: Converts raw telemetry coordinate arrays into fluid, continuous racing tracks without sharp polygon kinks.
- **Dynamic Corner Markers**: Automatically detects turns (e.g. `T1` through `T15`) via official corner telemetry and curvature vectors.
- **Motorsport Start/Finish Gate**: True-to-life perpendicular start/finish line with red & white racing stripes.
- **Real-Time Car Blips**: Visualizes top 10 cars with official team colors, driver pills (`VER`, `PER`, `LEC`), and focus glow on the selected target driver.

### 2. ⏱️ Motorsport Simulation & Playback Engine
- **Realistic Telemetry Pace**: Configured to match real F1 lap times (~75–80s per lap at `1x` real-time), preventing frantic car movements.
- **Speed Multipliers**: Granular speed controls (`1x`, `2x`, `4x`, `8x`).
- **Interactive Scenarios**:
  - **Safety Car**: Deploys the Safety Car in front of the race leader with automatic pit window triggers.
  - **Box Call**: Triggers an instant pitstop simulation for fresh tyre compounds (`SOFT`, `MEDIUM`, `HARD`).
  - **Interactive Lap Scrubber**: Jump to any lap of the Grand Prix.

### 3. 🧠 Agno 2-Tier AI Pitwall Directorate
- **Tier 1 — Telemetry Analyst Agent**: Analyzes sector deltas, tyre wear trajectories, stint progression, and gap evolution against rival drivers.
- **Tier 2 — Chief Race Strategist Agent**: Evaluates pitstop windows, undercut feasibility, track position delta, and contingency plans (Plan A / Plan B / Safety Car).
- **Quick Tactical Pills**: 1-click execution for standard race engineer questions:
  - *Assess Undercut on P2*
  - *Tyre Cliff Warning*
  - *Pit Window & Clean Air*
  - *Safety Car Plan B Contingency*

### 4. 📊 Real-Time Classification & Telemetry Delta
- **Live Classification Table**: Live standings, driver intervals, tyre compound badges, and tyre ages.
- **Pace Comparison Chart**: Interactive lap pace telemetry comparing your selected driver against key rivals (e.g., `VER vs LEC`) with designated pit window zones.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[FastF1 Official API] -->|Telemetry / GPS / Laps| B[FastF1 Provider & Disk Cache]
    B --> C[FastAPI Backend Engine]
    
    C -->|Session & Track Data| D[REST API Endpoints]
    
    subgraph "AI Strategy Directorate (Agno)"
        E[Telemetry Analyst Agent] -->|Degradation & Deltas| F[Chief Strategist Agent]
        F -->|OpenRouter LLM| G[Tactical Recommendations]
    end
    
    C --> E
    G --> D
    
    D -->|JSON / SSE| H[Frontend (React 19 + Vite)]
    H --> I[SVG Circuit Map Engine]
    H --> J[Simulation Playback Engine]
    H --> K[Race Classification Table]
    H --> L[Telemetry Delta Charts]
```

---

## 📁 Repository Structure

```text
pitwalliq/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint
│   │   ├── core/
│   │   │   └── config.py               # Settings & environment configuration
│   │   ├── api/v1/
│   │   │   ├── router.py               # Central API router
│   │   │   ├── seasons.py              # Seasons & calendar endpoints
│   │   │   ├── events.py               # Grand Prix weekend events
│   │   │   ├── sessions.py             # Practice, Quali, Race sessions
│   │   │   └── strategy.py             # Agno AI strategy chat & recommendations
│   │   ├── agents/
│   │   │   ├── analyst.py              # Agno Telemetry Analyst agent
│   │   │   └── strategist.py           # Agno Chief Race Strategist agent
│   │   ├── providers/
│   │   │   ├── base.py                 # Abstract F1 provider interface
│   │   │   └── fastf1_provider.py      # FastF1 telemetry adapter & disk caching
│   │   ├── schemas/
│   │   │   ├── common.py               # Standardized response envelopes
│   │   │   ├── f1.py                   # Pydantic models for F1 data
│   │   │   └── strategy.py             # Strategy request & recommendation schemas
│   │   └── data/
│   │       └── circuits.json           # GPS coordinates for 40+ F1 circuits
│   ├── cache/fastf1/                   # Local FastF1 disk cache (git-ignored)
│   ├── requirements.txt                # Python backend dependencies
│   └── .env.example                    # Backend environment configuration template
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                    # React entrypoint
│   │   ├── App.jsx                     # Mission-control dashboard container
│   │   ├── index.css                   # Tailwind CSS styling & animations
│   │   ├── api/
│   │   │   └── client.js               # API client with fallback circuits
│   │   ├── components/
│   │   │   ├── CircuitMap.jsx          # SVG Track & live car blip renderer
│   │   │   ├── SimulationControls.jsx  # Playback & speed controls
│   │   │   ├── ClassificationTable.jsx # Live driver standings
│   │   │   ├── TelemetryChart.jsx      # Recharts lap delta comparison
│   │   │   ├── StrategyDirectorate.jsx # AI pitwall strategist chat
│   │   │   └── Toast.jsx               # Notifications banner
│   │   └── data/
│   │       └── circuits.json           # Client-side circuit geometry fallback
│   ├── package.json                    # Frontend dependencies & scripts
│   └── vite.config.js                  # Vite bundler configuration
│
├── .gitignore                          # Clean repository ignore configuration
└── README.md                           # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: `3.11` or `3.12`
- **Node.js**: `18.x` or `20.x` (with `npm`)
- **OpenRouter API Key** (for AI Strategy Directorate)
- **F1TV Account** (optional, for authenticated FastF1 live timing data)

---

### 1. Backend Setup

1. **Navigate to the backend directory and activate a virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   
   # Linux / macOS
   source .venv/bin/activate
   ```

2. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   PROJECT_NAME=PitwallIQ
   DEBUG=True
   CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
   
   # AI Strategy Engine
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet  # or deepseek/deepseek-chat
   
   # FastF1 Grounding (Optional)
   F1_USERNAME=your_f1_account_email
   F1_PASSWORD=your_f1_account_password
   FASTF1_CACHE_DIR=cache/fastf1
   ```

4. **Start the FastAPI backend server:**
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   The backend API will be running at `http://127.0.0.1:8000`.  
   Interactive API docs (Swagger): `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/seasons` | Available championship seasons (2018–2024) |
| `GET` | `/api/v1/events?year={year}` | List of Grand Prix events for a season |
| `GET` | `/api/v1/sessions?year={year}&round_number={round}` | Sessions (FP1, FP2, FP3, Quali, Race) |
| `GET` | `/api/v1/dashboard?year={y}&round_number={r}&session_name={s}` | Full telemetry, classification, and track status |
| `GET` | `/api/v1/track-map?year={y}&round_number={r}&session_name={s}` | GPS coordinates & corner definitions |
| `GET` | `/api/v1/laps?year={y}&round_number={r}&session_name={s}` | Lap times & stint details per driver |
| `POST`| `/api/v1/strategy/chat` | Chat with Agno Chief Race Strategist |
| `POST`| `/api/v1/strategy/recommend` | Structured AI pit strategy assessment |

---

## 🛠️ Git Clean Commit Guide

If you previously committed unwanted folders (e.g. `.agents/`, `graphify-out/`, `DEV_GUIDE.md`, etc.), run the following commands to untrack them without deleting them from your hard drive:

```bash
# Untrack all ignored folders and files
git rm -r --cached .agents graphify-out DEV_GUIDE.md PROJECT.md skills-lock.json

# Verify status
git status

# Commit cleanly
git commit -m "chore: remove untracked local artifacts and update documentation"
```

---

## 📄 License
MIT License. Developed for Formula 1 motorsport analysis and tactical simulation research.
