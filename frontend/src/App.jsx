import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "./components/Navbar";
import SimulationControls from "./components/SimulationControls";
import TimingTower from "./components/TimingTower";
import CircuitMap from "./components/CircuitMap";
import LapPaceChart from "./components/LapPaceChart";
import StrategyPanel from "./components/StrategyPanel";
import Toast from "./components/Toast";
import {
  fetchSeasons,
  fetchEvents,
  fetchDashboard,
  fetchTrackMap,
  fetchDriverLaps,
  evaluateStrategy,
  getCircuitFallback,
  getDashboardFallback,
  getLapPaceFallback,
  MOCK_DASHBOARD,
  MOCK_TRACK_MAP,
  MOCK_LAP_PACE,
  INITIAL_EVENTS,
} from "./api/client";
import { ShieldCheck, Database } from "lucide-react";

export default function App() {
  const [seasons, setSeasons] = useState([2026, 2025, 2024, 2023, 2022, 2021, 2020]);
  const [selectedSeason, setSelectedSeason] = useState(2026);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedSession, setSelectedSession] = useState("Race");

  // Telemetry Dashboard State
  const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
  const [selectedDriverNumber, setSelectedDriverNumber] = useState("1");
  const [comparisonDriverNumber, setComparisonDriverNumber] = useState("16");
  const [trackMap, setTrackMap] = useState(MOCK_TRACK_MAP);
  const [lapPace, setLapPace] = useState(MOCK_LAP_PACE);

  // Simulation Controls & Real-Time Engine State
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [currentLap, setCurrentLap] = useState(18);
  const totalLaps = dashboard.total_laps || 58;
  const [lapProgress, setLapProgress] = useState(0.42);
  const [trackStatus, setTrackStatus] = useState("GREEN");

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Strategy Assistant State
  const [strategyResult, setStrategyResult] = useState(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);
  const [evaluationStage, setEvaluationStage] = useState(0);

  // Helper to trigger toast with auto-dismiss
  const showToast = useCallback((type, title, message, duration = 4000) => {
    setToast({ type, title, message });
    if (duration > 0) {
      setTimeout(() => {
        setToast((current) => (current && current.message === message ? null : current));
      }, duration);
    }
  }, []);

  // Strategy Evaluation Handler
  const handleRunStrategy = useCallback(
    async (userQuestion) => {
      setIsStrategyLoading(true);
      setEvaluationStage(1);

      setTimeout(() => {
        setEvaluationStage(2);
      }, 800);

      const payload = {
        season: selectedSeason,
        round_number: selectedRound,
        session_name: selectedSession,
        driver_number: String(selectedDriverNumber),
        current_lap: currentLap,
        user_question: userQuestion,
      };

      try {
        const res = await evaluateStrategy(payload);
        if (res && res.data) {
          setStrategyResult(res.data);
          showToast("success", "AI Strategy Decision Ready", `Plan synthesized for #${selectedDriverNumber}: ${res.data.recommendation?.slice(0, 48)}...`);
        }
      } catch (err) {
        console.error("Strategy error:", err);
        showToast("error", "Strategy Evaluation Issue", "AI backend busy; displayed strategic fallback.");
      } finally {
        setIsStrategyLoading(false);
        setEvaluationStage(0);
      }
    },
    [selectedSeason, selectedRound, selectedSession, selectedDriverNumber, currentLap, showToast]
  );

  // Load Seasons on Mount
  useEffect(() => {
    async function loadSeasonsList() {
      const s = await fetchSeasons();
      if (s && s.length > 0) {
        setSeasons(s);
      }
    }
    loadSeasonsList();
  }, []);

  // Load Events when Season changes
  useEffect(() => {
    async function loadEventsList() {
      showToast("loading", "FastF1 Schedule", `Loading ${selectedSeason} Grand Prix calendar...`, 0);
      const evs = await fetchEvents(selectedSeason);
      if (evs && evs.length > 0) {
        setEvents(evs);
        const activeEv = evs.find((e) => Number(e.round_number) === Number(selectedRound)) || evs[0];
        const evName = activeEv ? activeEv.event_name : "";
        setTrackMap(getCircuitFallback(selectedRound, evName));
        setDashboard(getDashboardFallback(selectedRound, selectedSeason, selectedSession, evName));
        setLapPace(getLapPaceFallback(selectedRound, evName));
        showToast("success", "Season Loaded", `${evs.length} Grand Prix events active for ${selectedSeason}.`);
      } else {
        showToast("warning", "Schedule Cached", `Using calendar for season ${selectedSeason}.`);
      }
    }
    loadEventsList();
  }, [selectedSeason, selectedRound, selectedSession, showToast]);

  // Load Session Telemetry, Track Map & Driver Laps when Season, Round, or Session changes
  useEffect(() => {
    let isCancelled = false;

    async function loadSessionTelemetry() {
      const activeEvent = events.find((e) => Number(e.round_number) === Number(selectedRound));
      const eventTitle = activeEvent ? activeEvent.event_name : `Round ${selectedRound}`;

      showToast("loading", "FastF1 Telemetry Engine", `Fetching ${eventTitle} (${selectedSession}) telemetry...`, 6000);

      // Concurrent fetching: each updates the UI immediately as soon as its data is ready
      const pMap = fetchTrackMap(selectedSeason, selectedRound, selectedSession, activeEvent?.event_name)
        .then((map) => {
          if (!isCancelled && map && map.points && map.points.length > 0) {
            setTrackMap(map);
          }
        })
        .catch((err) => console.warn("Track map load warning:", err));

      const pDash = fetchDashboard(selectedSeason, selectedRound, selectedSession, activeEvent?.event_name)
        .then((dash) => {
          if (!isCancelled && dash && dash.classification) {
            setDashboard(dash);
          }
        })
        .catch((err) => console.warn("Dashboard load warning:", err));

      const pLaps = fetchDriverLaps(
        selectedSeason,
        selectedRound,
        selectedSession,
        String(selectedDriverNumber),
        String(comparisonDriverNumber),
        activeEvent?.event_name
      )
        .then((laps) => {
          if (!isCancelled && laps && laps.laps) {
            setLapPace(laps.laps);
          }
        })
        .catch((err) => console.warn("Driver laps load warning:", err));

      await Promise.allSettled([pMap, pDash, pLaps]);

      if (!isCancelled) {
        showToast("success", "Telemetry Synchronized", `${eventTitle} - ${selectedSession} data loaded successfully.`);
      }
    }

    loadSessionTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [selectedSeason, selectedRound, selectedSession, selectedDriverNumber, comparisonDriverNumber, events, showToast]);

  // Initial Strategy Load
  useEffect(() => {
    let isMounted = true;
    async function initStrategy() {
      const payload = {
        season: selectedSeason,
        round_number: selectedRound,
        session_name: selectedSession,
        driver_number: String(selectedDriverNumber),
        current_lap: currentLap,
        user_question: "Assess undercut opportunity against car ahead and predict tyre cliff window.",
      };
      const res = await evaluateStrategy(payload);
      if (isMounted && res && res.data) {
        setStrategyResult(res.data);
      }
    }
    initStrategy();
    return () => {
      isMounted = false;
    };
  }, [selectedDriverNumber, selectedSeason, selectedRound, selectedSession]);

  // Real-Time Simulation Animation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setLapProgress((prev) => {
        // Realistic F1 lap time ~75-80 seconds at 1x real-time (50ms interval = 20 ticks/sec => 1500 ticks = 75s)
        const step = 0.00065 * simSpeed;
        const next = prev + step;

        if (next >= 1.0) {
          setCurrentLap((prevLap) => {
            const newLap = prevLap >= totalLaps ? 1 : prevLap + 1;

            setDashboard((prevDash) => {
              if (!prevDash || !prevDash.classification) return prevDash;
              const updatedClassification = prevDash.classification.map((d) => ({
                ...d,
                tyre_age: (d.tyre_age || 0) + 1,
              }));
              return {
                ...prevDash,
                current_lap: newLap,
                classification: updatedClassification,
              };
            });

            return newLap;
          });
          return next % 1.0;
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, totalLaps]);

  // Simulation Controls Handlers
  const handleTogglePlay = () => setIsPlaying((p) => !p);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentLap(1);
    setLapProgress(0.0);
    setTrackStatus("GREEN");
    setDashboard((prevDash) => {
      if (!prevDash || !prevDash.classification) return prevDash;
      const resetClass = prevDash.classification.map((d) => ({
        ...d,
        tyre_age: 1,
      }));
      return { ...prevDash, current_lap: 1, classification: resetClass };
    });
    showToast("info", "Simulation Reset", "Race timeline reset to Lap 1.");
  };

  const handleSeekLap = (newLap) => {
    setCurrentLap(newLap);
    setDashboard((prevDash) => ({
      ...prevDash,
      current_lap: newLap,
      classification: prevDash.classification.map((d) => ({
        ...d,
        tyre_age: Math.max(1, newLap - 2),
      })),
    }));
  };

  const handleToggleSafetyCar = () => {
    const nextStatus = trackStatus === "SAFETY CAR" ? "GREEN" : "SAFETY CAR";
    setTrackStatus(nextStatus);
    showToast(
      nextStatus === "SAFETY CAR" ? "warning" : "success",
      nextStatus === "SAFETY CAR" ? "SAFETY CAR DEPLOYED" : "TRACK CLEAR (GREEN)",
      nextStatus === "SAFETY CAR" ? "Race control deployed safety car. Pit window open." : "Track clear. Green flag racing resumes."
    );
    if (nextStatus === "SAFETY CAR") {
      handleRunStrategy(`SAFETY CAR DEPLOYED ON LAP ${currentLap}! Should we pit now for Plan B contingency?`);
    }
  };

  const handleTriggerPitStop = () => {
    setDashboard((prevDash) => {
      if (!prevDash || !prevDash.classification) return prevDash;
      const updated = prevDash.classification.map((d) => {
        if (String(d.driver_number) === String(selectedDriverNumber)) {
          return {
            ...d,
            tyre_compound: d.tyre_compound === "HARD" ? "MEDIUM" : "HARD",
            tyre_age: 0,
            status: "BOXING",
          };
        }
        return d;
      });
      return { ...prevDash, classification: updated };
    });

    showToast("info", "Pitstop Triggered", `Box call executed for #${selectedDriverNumber}. Fitting fresh tyres.`);
    handleRunStrategy(`We are boxing on Lap ${currentLap}! Confirm tyre compound and out-lap delta.`);
  };

  // Compute available sessions dynamically from the active event
  const activeEvent = useMemo(() => {
    return events.find((e) => e.round_number === selectedRound) || events[0];
  }, [events, selectedRound]);

  const availableSessions = useMemo(() => {
    if (activeEvent && Array.isArray(activeEvent.sessions) && activeEvent.sessions.length > 0) {
      return activeEvent.sessions.map((s) => s.name || s);
    }
    return ["Race", "Qualifying", "Practice 1", "Practice 2", "Practice 3"];
  }, [activeEvent]);

  // Compute realistic car positions on the circuit
  const topDrivers = (dashboard.classification || []).slice(0, 10);
  const carsOnTrack = topDrivers.map((d, idx) => {
    const gapOffset = idx * 0.055;
    const progress = (lapProgress - gapOffset + 1.0) % 1.0;
    return {
      driver_number: d.driver_number,
      code: d.code,
      progress,
      team_color: d.team_color,
      isFocused: String(d.driver_number) === String(selectedDriverNumber),
    };
  });

  // Find currently selected target driver & rival driver details
  const selectedDriver =
    dashboard.classification?.find((d) => String(d.driver_number) === String(selectedDriverNumber)) ||
    { driver_number: "1", code: "VER", name: "Max Verstappen", team: "Red Bull Racing" };

  const comparisonDriver =
    dashboard.classification?.find((d) => String(d.driver_number) === String(comparisonDriverNumber)) ||
    { driver_number: "16", code: "LEC", name: "Charles Leclerc", team: "Ferrari", team_color: "#E8002D" };

  return (
    <div className="min-h-screen bg-[#090d14] text-[#f9fafb] flex flex-col select-none relative">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navbar with Dynamic Dropdowns */}
      <Navbar
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSelectSeason={(season) => {
          setSelectedSeason(season);
          setSelectedRound(1);
          setSelectedSession("Race");
          const is2026 = Number(season) === 2026;
          const defaultEventName = is2026 ? "Australian Grand Prix" : "Bahrain Grand Prix";
          setTrackMap(getCircuitFallback(1, defaultEventName));
          setDashboard(getDashboardFallback(1, season, "Race", defaultEventName));
          setLapPace(getLapPaceFallback(1, defaultEventName));
          setCurrentLap(18);
          setLapProgress(0.0);
        }}
        events={events}
        selectedRound={selectedRound}
        onSelectRound={(roundNum) => {
          setSelectedRound(roundNum);
          setSelectedSession("Race"); // Default to Race on round change
          const activeEv = events.find((e) => Number(e.round_number) === Number(roundNum));
          const evName = activeEv?.event_name || "";
          setTrackMap(getCircuitFallback(roundNum, evName));
          setDashboard(getDashboardFallback(roundNum, selectedSeason, "Race", evName));
          setLapPace(getLapPaceFallback(roundNum, evName));
          setCurrentLap(18);
          setLapProgress(0.0);
        }}
        sessions={availableSessions}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
      />

      {/* Main Pitwall Dashboard Content */}
      <main className="flex-1 p-3 max-w-[1920px] w-full mx-auto">
        {/* Real-Time Race Simulation Controls Bar */}
        <SimulationControls
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          simSpeed={simSpeed}
          onChangeSpeed={setSimSpeed}
          currentLap={currentLap}
          totalLaps={totalLaps}
          onSeekLap={handleSeekLap}
          trackStatus={trackStatus}
          onToggleSafetyCar={handleToggleSafetyCar}
          onTriggerPitStop={handleTriggerPitStop}
          selectedDriverCode={selectedDriver.code || selectedDriver.driver_number}
        />

        {/* 3-Column Command Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
          {/* Left Column: Timing Tower Leaderboard (3 cols) */}
          <section className="lg:col-span-4 xl:col-span-3 flex flex-col">
            <TimingTower
              classification={dashboard.classification || []}
              selectedDriverNumber={selectedDriverNumber}
              onSelectDriver={(num) => setSelectedDriverNumber(num)}
              currentLap={currentLap}
              totalLaps={totalLaps}
              trackStatus={trackStatus}
              trackTemp={dashboard.track_temp_c || 24.5}
            />
          </section>

          {/* Center Column: Live Dynamic SVG Circuit Map & Real-Time Pace Graph (5 cols) */}
          <section className="lg:col-span-4 xl:col-span-5 flex flex-col gap-3">
            <CircuitMap
              circuitName={trackMap.circuit_name || (activeEvent ? activeEvent.event_name : "Grand Prix Circuit")}
              points={trackMap.points || []}
              corners={trackMap.corners || []}
              turns={trackMap.turns || 15}
              lengthKm={trackMap.length_km || 5.412}
              selectedDriverCode={selectedDriver.code || selectedDriver.driver_number}
              cars={carsOnTrack}
              trackStatus={trackStatus}
            />
            <LapPaceChart
              laps={lapPace}
              driver1Code={selectedDriver.code || "VER"}
              driver2Code={comparisonDriver.code || "LEC"}
              driver2Number={comparisonDriverNumber}
              availableDrivers={dashboard.classification || []}
              onSelectDriver2={(drvNum) => setComparisonDriverNumber(drvNum)}
              currentLap={currentLap}
              isPlaying={isPlaying}
            />
          </section>

          {/* Right Column: AI Pitwall Strategy Directorate (4 cols) */}
          <section className="lg:col-span-4 xl:col-span-4 flex flex-col">
            <StrategyPanel
              selectedDriver={selectedDriver}
              currentLap={currentLap}
              onEvaluateStrategy={handleRunStrategy}
              strategyResult={strategyResult}
              isLoading={isStrategyLoading}
              evaluationStage={evaluationStage}
            />
          </section>
        </div>
      </main>

      {/* Engineering Status Footer */}
      <footer className="bg-[#0b111e] border-t border-[#1f2937] px-4 py-2 text-[11px] text-gray-400">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <Database className="w-3.5 h-3.5 text-[#00d2be]" />
              Telemetry Engine: <strong className="text-white">FastF1 Grounded</strong> (Disk Cached)
            </span>
            <span className="hidden sm:inline-block text-gray-600">•</span>
            <span className="hidden sm:flex items-center gap-1 text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tactical AI: <strong className="text-white">Agno Multi-Agent + OpenRouter Decision API</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 font-tabular text-[10px] text-gray-400">
            <span>PITWALLIQ V1.0</span>
            <span>•</span>
            <span className="text-[#00d2be]">
              {isPlaying ? `SIMULATION ACTIVE (${simSpeed}x)` : "SIMULATION PAUSED"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
