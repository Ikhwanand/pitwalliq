# Graph Report - C:\MyProject\pitwalliq  (2026-10-29)

## Corpus Check
- 18 files · ~53,697 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 99 nodes · 279 edges · 14 communities detected
- Extraction: 33% EXTRACTED · 67% INFERRED · 0% AMBIGUOUS · INFERRED: 186 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `FastF1Provider` - 29 edges
2. `LapData` - 23 edges
3. `CircuitTrackMap` - 23 edges
4. `RaceDashboardData` - 23 edges
5. `SeasonInfo` - 21 edges
6. `GrandPrixEvent` - 21 edges
7. `F1Service` - 21 edges
8. `F1DataProvider` - 18 edges
9. `Format pandas Timedelta to F1 timing format (e.g., 1:32.451).` - 12 edges
10. `Production FastF1 provider with local disk caching and threadpool execution.` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Retrieve all Grand Prix events/schedule for a given season.` --uses--> `GrandPrixEvent`  [INFERRED]
  C:\MyProject\pitwalliq\backend\app\api\v1\events.py → C:\MyProject\pitwalliq\backend\app\schemas\f1.py
- `Retrieve all Grand Prix events/schedule for a given season.` --uses--> `F1Service`  [INFERRED]
  C:\MyProject\pitwalliq\backend\app\api\v1\events.py → C:\MyProject\pitwalliq\backend\app\services\f1_service.py
- `Retrieve list of supported F1 seasons.` --uses--> `SeasonInfo`  [INFERRED]
  C:\MyProject\pitwalliq\backend\app\api\v1\seasons.py → C:\MyProject\pitwalliq\backend\app\schemas\f1.py
- `Retrieve list of supported F1 seasons.` --uses--> `F1Service`  [INFERRED]
  C:\MyProject\pitwalliq\backend\app\api\v1\seasons.py → C:\MyProject\pitwalliq\backend\app\services\f1_service.py
- `Retrieve full normalized race dashboard data (timing, classification, stints, an` --uses--> `CircuitTrackMap`  [INFERRED]
  C:\MyProject\pitwalliq\backend\app\api\v1\sessions.py → C:\MyProject\pitwalliq\backend\app\schemas\f1.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (15): DataFreshness, StandardResponse, Enum, list_events(), Retrieve all Grand Prix events/schedule for a given season., format_timedelta(), list_seasons(), Retrieve list of supported F1 seasons. (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.49
Nodes (17): F1DataProvider, Abstract interface for Formula 1 data providers (FastF1, OpenF1, etc.)., Get list of supported seasons., Get Grand Prix schedule/events for a given season., Get full normalized session dashboard data (timing, classification, stints)., Get lap-by-lap timing and tyre info for a specific driver., Extract circuit coordinates from car telemetry., CircuitTrackMap (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.32
Nodes (11): BaseModel, DriverClassification, DriverInfo, EventSessionSummary, TrackCoordinate, TyreStint, F1DataProvider, FastF1Provider (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (3): F1Service, get_f1_service(), run_benchmark()

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (6): health_check(), lifespan(), Lifespan event handler for startup and shutdown procedures., Basic health check endpoint., Root endpoint welcoming developers., root()

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (1): ABC

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (2): BaseSettings, Settings

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (1): PitwallIQ Backend Application Package.

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **4 isolated node(s):** `Lifespan event handler for startup and shutdown procedures.`, `Basic health check endpoint.`, `Root endpoint welcoming developers.`, `PitwallIQ Backend Application Package.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (2 nodes): `__init__.py`, `PitwallIQ Backend Application Package.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `App()`, `App.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `router.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FastF1Provider` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `F1Service` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `F1DataProvider` connect `Community 1` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `FastF1Provider` (e.g. with `F1DataProvider` and `CircuitTrackMap`) actually correct?**
  _`FastF1Provider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `LapData` (e.g. with `Retrieve full normalized race dashboard data (timing, classification, stints, an` and `Retrieve lap-by-lap timing, sector times, tyre compound, and tyre age for a driv`) actually correct?**
  _`LapData` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `CircuitTrackMap` (e.g. with `Retrieve full normalized race dashboard data (timing, classification, stints, an` and `Retrieve lap-by-lap timing, sector times, tyre compound, and tyre age for a driv`) actually correct?**
  _`CircuitTrackMap` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `RaceDashboardData` (e.g. with `Retrieve full normalized race dashboard data (timing, classification, stints, an` and `Retrieve lap-by-lap timing, sector times, tyre compound, and tyre age for a driv`) actually correct?**
  _`RaceDashboardData` has 21 INFERRED edges - model-reasoned connections that need verification._