# PitwallIQ --- Product Overview & AI Build Brief

> **Working name:** PitwallIQ\
> **Tagline:** Your AI Race Strategist.\
> **Product type:** F1 race analytics dashboard with an AI strategy
> assistant\
> **Document purpose:** Explain the product vision, user flow, core
> features, technical direction, and implementation boundaries to an AI
> coding assistant or development collaborator.

---

## 1. Product vision

PitwallIQ is a Formula 1 analytics application that turns race data into
clear visualizations and practical strategy insights.

A user chooses a Grand Prix/session and a team they want to monitor. The
application retrieves available F1 data through Python-based data
tooling/API access, presents the data in a frontend dashboard, and
provides an AI Strategy Assistant that interprets the race situation and
offers evidence-based recommendations.

The long-term direction is to add machine-learning models that estimate
race outcomes or strategy-relevant quantities as new data becomes
available. "Real-time" must reflect the actual freshness and
availability of the data source; the application must not label delayed,
historical, or simulated data as live.

**Core idea:** not just "show me race statistics," but "help me
understand what is happening and what strategy may make sense next."

## 2. Problem and value proposition

F1 race data can be detailed and difficult to interpret. PitwallIQ aims
to make that data easier to explore and connect it to strategy.

The application should: - Let users explore a selected Grand Prix and
team without manually assembling datasets. - Present key race metrics in
an accessible visual dashboard. - Explain important patterns in plain
language. - Offer strategy options with supporting evidence,
assumptions, uncertainty, and trade-offs. - Eventually provide
predictive estimates using appropriately validated machine-learning
models.

PitwallIQ is an **analytical assistant**, not an official F1 product and
not a guarantee of the strategy a real team should execute.

## 3. Target users

- F1 fans who want to understand race pace, tyre choices, pit stops,
  and team performance.
- Motorsport/data enthusiasts who want to explore timing and telemetry
  data.
- Students and developers interested in data visualization, machine
  learning, and AI applications.
- More advanced users who want to compare teams, drivers, stints, and
  possible race strategies.

## 4. Primary user journey

1.  **Open the application.** The user lands on a clear dashboard or
    race-selection page.
2.  **Choose a season and Grand Prix.** Show only events/sessions
    supported by the configured data source.
3.  **Choose a session.** For example: practice, qualifying, sprint, or
    race, depending on source coverage.
4.  **Choose a team.** The user selects the team to monitor. Where
    useful, allow selection of one or both drivers from that team.
5.  **Load the race dashboard.** Retrieve data, show loading/error
    states, and identify whether the data is live, delayed, or
    historical.
6.  **Explore the data.** The user views timing, position, lap times,
    stints, tyre information, gaps, telemetry, and other fields only
    when the source actually provides them.
7.  **Ask the AI Strategy Assistant.** Example: "Should this team
    consider an undercut?" or "Compare the current stint with the
    previous one."
8.  **Receive a grounded response.** The assistant explains the observed
    situation, possible options, assumptions, risks, and relevant data
    points.
9.  **Optionally view a prediction.** If a trained and evaluated ML
    model is available, display its estimate, uncertainty, and
    model/data timestamp.

### Simplified flow

`Select Grand Prix → Select Session → Select Team/Driver → View Race Dashboard → Ask AI Strategy Assistant → Review recommendation and evidence`

## 5. MVP scope

Prioritize a reliable end-to-end experience over an overly broad feature
set.

### P0 --- Required for the first usable version

- [ ] Race/season/session selection based on data actually available.
- [ ] Team selection, with driver selection where supported.
- [ ] Python data layer that retrieves, normalizes, and serves race
      data.
- [ ] Dashboard visualizations for the available core metrics.
- [ ] AI Strategy Assistant that can answer questions using the
      selected race/team context and retrieved data.
- [ ] Clear loading, empty, unavailable-data, and API-error states.
- [ ] Data provenance/freshness labels: historical, delayed, live, or
      unknown.
- [ ] AI answers distinguish observed facts from interpretations and
      recommendations.
- [ ] Responsive, readable UI suitable for desktop and smaller
      screens.

### P1 --- Valuable follow-up features

- [ ] Compare two drivers or teams.
- [ ] Lap-by-lap pace and stint comparisons.
- [ ] Pit-stop timeline and tyre-stint visualization where data
      exists.
- [ ] Strategy scenarios, such as one-stop vs. two-stop, when enough
      inputs exist.
- [ ] Save/share a race analysis or export a summary.
- [ ] Race replay or session timeline navigation for historical
      sessions.
- [ ] Basic predictive ML model with documented evaluation.

### P2 --- Later possibilities

- [ ] Live updates during sessions, subject to data-source
      availability and terms.
- [ ] Alerts when a meaningful strategy-relevant event occurs.
- [ ] More advanced pace, pit-window, tyre degradation, or
      finishing-position estimates.
- [ ] Model comparisons and explainability.
- [ ] User accounts, saved preferences, and personalized dashboards.

Do not implement P1/P2 features at the expense of a functioning P0
workflow.

## 6. Dashboard requirements

The dashboard should make the selected race and team obvious at all
times.

Potential sections, shown only when supported by data:

- **Race/session header:** season, Grand Prix, session, session
  status, selected team/driver, and data freshness.
- **Live timing / classification:** position, lap, lap time, gaps, and
  status.
- **Lap-time chart:** lap-by-lap pace and comparisons.
- **Position chart:** position changes over the session.
- **Stint and tyre view:** tyre compound, stint length, pit-stop laps,
  and tyre age if available.
- **Telemetry view:** speed, throttle, brake, gear, RPM, or track
  position if available for the selected session.
- **Pit-stop timeline:** pit events and relevant gaps, when available.
- **AI strategy panel:** questions, findings, recommendation options,
  evidence, and uncertainty.
- **Prediction panel:** only when a valid model is configured; include
  prediction time and caveats.

Avoid fake or hardcoded race data in production UI. Mock data may be
used for design development, but it must be clearly marked as demo data
and separated from real API results.

## 7. AI Strategy Assistant

### Purpose

The assistant interprets the selected session/team data and helps the
user reason about potential strategy choices. It should not merely
produce generic F1 commentary.

### Example questions

- "Summarize this team's race so far."
- "How has the selected driver's pace changed over the last five
  laps?"
- "Compare the current stint with the previous stint."
- "What are the potential advantages and risks of an undercut here?"
- "What information would we need to assess a pit stop now?"
- "Give me two possible strategy scenarios and explain the
  trade-offs."

### Expected answer structure

Where relevant, an answer should include:

1.  **Situation:** what the current data indicates.
2.  **Evidence:** relevant laps, lap times, gaps, tyre/stint data, or
    other source-backed facts.
3.  **Options:** one or more plausible strategies.
4.  **Trade-offs and risks:** traffic, track position, uncertainty,
    degradation assumptions, weather/safety-car uncertainty, or missing
    information.
5.  **Recommendation:** a conditional suggestion, not an unsupported
    certainty.
6.  **Confidence/limitations:** what is known, what is inferred, and
    what data is missing.

### Grounding and safety rules for the assistant

- Ground race-specific claims in data retrieved for the selected
  session/team.
- Never invent lap times, tyre compounds, gaps, pit events, weather,
  safety-car status, or driver/team radio messages.
- If relevant data is missing, state that clearly and ask for or
  retrieve the missing information if possible.
- Distinguish **observed data**, **derived metrics**, **model
  predictions**, and **LLM interpretation**.
- A language model must not fabricate a prediction and present it as
  the output of a trained ML model.
- Strategy recommendations should be framed as analysis with
  assumptions and uncertainty, not as guaranteed outcomes.
- When the source is historical, do not imply that the assistant is
  observing a live race.
- Prefer calculations performed in Python or trusted application code
  over mental arithmetic by the LLM.
- Return structured results when useful so the UI can render key
  findings, evidence, options, and caveats consistently.

## 8. Data acquisition and backend direction

The intended approach is to use Python tooling/API access to acquire F1
data, process it, and provide clean data to the frontend.

A possible source to evaluate is **FastF1**, a Python package used to
access and analyze available Formula 1 timing and telemetry-related
data. Confirm its current capabilities, supported sessions, caching
behavior, data freshness, licensing/terms, and availability before
depending on it. The exact data provider has not yet been finalized.

### Backend responsibilities

- Retrieve seasons, events, sessions, teams/drivers, and session data
  as supported by the source.
- Normalize source-specific formats into stable application schemas.
- Calculate derived metrics such as rolling lap pace or stint
  summaries when valid inputs exist.
- Cache expensive requests and avoid repeatedly downloading the same
  session data.
- Expose API endpoints for the frontend.
- Handle missing fields, rate limits, source errors, and partial
  datasets.
- Record source and retrieval timestamps.
- Keep API keys/secrets on the server, never in frontend code.

### Possible API shape (illustrative, not a fixed contract)

- `GET /api/seasons`
- `GET /api/events?season={year}`
- `GET /api/sessions?event_id={id}`
- `GET /api/teams?session_id={id}`
- `GET /api/sessions/{session_id}/dashboard?team_id={id}`
- `GET /api/sessions/{session_id}/drivers/{driver_id}/laps`
- `POST /api/strategy/analyze`
- `GET /api/predictions/{session_id}?team_id={id}`

Adapt these routes to the actual framework and data model; do not create
endpoints that the chosen source cannot support.

### Data freshness

The UI must show when the data was retrieved and the session it belongs
to. If the provider supplies historical or delayed data, describe it
accurately. Real-time functionality depends on the provider's
availability, latency, access conditions, and terms; it must not be
assumed merely because the frontend refreshes periodically.

## 9. Machine learning direction

ML is a potential extension, not a prerequisite for the first working
version. Begin with clear analytics and a grounded assistant, then add
predictive models once the required data and evaluation process are in
place.

Potential prediction tasks: - Estimate lap time or pace trend. -
Estimate tyre degradation or pace loss over a stint. - Estimate a
potential pit-stop window under stated assumptions. - Compare
hypothetical strategy scenarios. - Estimate finishing position or race
outcome probabilities, if a suitable historical dataset and evaluation
setup are available.

### ML principles

- Define one prediction target at a time.
- Use historical data with appropriate train/validation/test splits,
  preferably respecting chronological order to reduce leakage.
- Avoid using information that would not have been available at
  prediction time.
- Establish a simple baseline before trying complex models.
- Evaluate with metrics suitable for the task; compare predictions
  with held-out sessions/races.
- Show uncertainty or ranges where possible, not just a single
  confident number.
- Log the model version, input timestamp, and prediction timestamp.
- Explain that race outcomes depend on incidents and variables that
  may not be observable or predictable.
- Do not claim "real-time prediction" unless the pipeline receives
  timely inputs and updates predictions accordingly.

## 10. Suggested technical architecture

The exact stack is open for implementation decisions, but a reasonable
starting architecture is:

- **Frontend:** a modern web framework with reusable components and
  interactive charting.
- **Backend/data service:** Python API (for example, FastAPI)
  responsible for data access, normalization, analytics, and ML
  inference.
- **Data source:** a suitable F1 data API/library, to be validated
  before implementation.
- **Cache/storage:** caching for expensive session loads; persistent
  database only if the product requires saved analyses, user accounts,
  or stored prediction history.
- **LLM integration:** a server-side service that receives a selected
  race context and curated data summaries/tools, then returns grounded
  analysis.
- **ML layer:** separate, testable Python modules or service functions
  for training, evaluation, and inference.
- **Visualization:** charts that handle missing data and provide
  labels, units, tooltips, and sensible empty states.

Keep responsibilities separated:

`F1 Data Source → Python Data/Analytics Layer → API → Frontend Dashboard`

`Selected Session Data + Derived Metrics → Strategy Assistant → Structured Insight → Frontend`

`Historical Training Data → ML Training/Evaluation → Versioned Model → Prediction API`

Do not send huge raw telemetry datasets to an LLM when a concise,
computed summary or a targeted tool call is sufficient.

## 11. Design direction

Visual identity should feel inspired by professional motorsport
engineering interfaces without copying official F1/team branding.

Suggested direction: - Dark dashboard as the default. -
Charcoal/near-black surfaces, white text, restrained red accents, and
neutral chart colors. - Strong typographic hierarchy and compact data
cards. - Clear timing tables and readable charts. - Distinct visual
states for live, delayed, historical, loading, and error. - Avoid
excessive neon, unnecessary animation, and decorative elements that make
dense data harder to read. - Make the AI panel easy to find but do not
let it obscure the race data.

The working product name is **PitwallIQ**, with the tagline **"Your AI
Race Strategist."** The name is provisional and has not been checked for
domain or trademark availability. Do not use official F1 logos or imply
official affiliation.

## 12. Functional acceptance criteria

The first version can be considered usable when:

- [ ] A user can select a supported season/event/session and team.
- [ ] The backend returns data for the selected context, or a clear
      explanation when data is unavailable.
- [ ] The frontend visualizes real retrieved data and labels its
      freshness/source status.
- [ ] Changing the selected event/session/team updates the relevant
      dashboard context.
- [ ] The assistant receives the correct selected context and relevant
      data summaries.
- [ ] The assistant can answer basic race-analysis questions with
      supporting evidence.
- [ ] The assistant explicitly acknowledges missing data instead of
      making up values.
- [ ] Loading, empty, and error states are understandable.
- [ ] Any ML prediction is labeled as a model estimate and includes
      appropriate caveats.
- [ ] No credentials or private API secrets are exposed to the
      browser.
- [ ] Core data processing and API behavior have basic automated
      tests.

## 13. Non-goals for the first version

- Reproducing every feature of a professional F1 team's internal
  strategy software.
- Guaranteeing the optimal pit-stop decision.
- Claiming to have official team telemetry, radio, weather, or live
  timing unless the selected source actually provides it.
- Training a complex model before defining the prediction target and
  obtaining suitable data.
- Building user accounts, payments, social features, or a mobile app
  before the core flow works.
- Presenting AI-generated speculation as verified race data.

## 14. Open decisions for the developer/AI assistant

Do not silently assume these have already been decided. Research or ask
the project owner when they materially affect implementation:

- Which exact F1 data source/library will be used, and what data does
  it provide?
- Which frontend framework, chart library, and UI component system are
  preferred?
- Which backend framework will expose the data?
- Which LLM provider/model will power the strategy assistant?
- Is the initial experience historical analysis only, or is a
  supported live/delayed feed available?
- Which ML prediction target should be implemented first?
- Is data stored persistently, or loaded/cached on demand?
- What are the deployment target, budget, and expected user scale?

When making recommendations, explain trade-offs and favor the simplest
architecture that supports the MVP.

## 15. Instructions for an AI coding assistant

Use this document as the product source of truth.

1.  First inspect the existing repository and its conventions before
    editing files.
2.  Summarize the current architecture and identify what already exists.
3.  Propose a small implementation plan that maps to the MVP acceptance
    criteria.
4.  Verify data-source capabilities before designing around particular
    fields or claiming live access.
5.  Implement in small, testable steps; do not generate the entire
    application in one unreviewed change.
6.  Keep the data provider, analytics, AI integration, and UI concerns
    modular.
7.  Use real API data where configured. If using mock data, label it
    clearly and isolate it from production paths.
8.  Do not invent credentials, endpoints, source fields, model
    performance, or completed functionality.
9.  Add useful error handling and tests for data transformations and
    core API behavior.
10. Document setup, environment variables, how to run the project, and
    known limitations.
11. Ask the owner before making major product or stack changes.
12. At each milestone, report what changed, how it was tested, and what
    remains incomplete.

---

## Short project summary

**PitwallIQ is an F1 race analytics dashboard with an AI Strategy
Assistant. Users select a Grand Prix/session and a team, explore the
available race data through visualizations, and ask an AI to interpret
the situation and discuss possible strategies. A future ML layer may
provide validated estimates such as pace trends, tyre degradation, pit
windows, or outcome probabilities. Data freshness, evidence,
uncertainty, and source limitations must always be made explicit.**
