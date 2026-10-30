import { useState, useEffect, useMemo } from "react";
import { X, Activity, Zap, Gauge, RefreshCw } from "lucide-react";
import { fetchGhostComparison, getGridDriversForSeason, F1_GRID_DRIVERS } from "../api/client";

export default function DataGhostModal({
  isOpen,
  onClose,
  season = 2026,
  roundNumber = 1,
  sessionName = "Race",
  eventName = "Australian Grand Prix",
  defaultDriver1 = "1",
  defaultDriver2 = "16",
  availableDrivers = [],
}) {
  // Normalize driver list from real session classification or fallback to season grid
  const driverList = useMemo(() => {
    const raw = availableDrivers && availableDrivers.length > 0
      ? availableDrivers
      : (getGridDriversForSeason ? getGridDriversForSeason(season) : F1_GRID_DRIVERS);
    const seen = new Set();
    const list = [];
    raw.forEach((d, idx) => {
      const drv = d.driver || {};
      const num = String(d.driver_number || drv.driver_number || idx + 1);
      if (!seen.has(num)) {
        seen.add(num);
        list.push({
          driver_number: num,
          code: d.code || drv.abbreviation || drv.broadcast_name || `D${num}`,
          name: d.name || drv.full_name || drv.broadcast_name || `Driver ${num}`,
          team: d.team || drv.team_name || "Formula 1 Team",
          team_color: d.team_color || drv.team_color || "#3671C6",
        });
      }
    });
    return list.length > 0 ? list : F1_GRID_DRIVERS;
  }, [availableDrivers, season]);

  const [driver1, setDriver1] = useState(() => String(defaultDriver1 || "1"));
  const [driver2, setDriver2] = useState(() => {
    const d1 = String(defaultDriver1 || "1");
    if (defaultDriver2 && String(defaultDriver2) !== d1) {
      return String(defaultDriver2);
    }
    const rival = driverList.find((d) => String(d.driver_number) !== d1);
    return rival ? String(rival.driver_number) : "16";
  });
  const [loading, setLoading] = useState(false);
  const [ghostData, setGhostData] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Fetch ghost telemetry comparison
  useEffect(() => {
    if (!isOpen || !driver1 || !driver2) return;
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchGhostComparison(season, roundNumber, sessionName, driver1, driver2);
        if (!isCancelled && data) {
          setGhostData(data);
          setHoverIndex(Math.floor((data.telemetry_points?.length || 100) / 2));
        }
      } catch (err) {
        console.error("Failed to load ghost telemetry:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, season, roundNumber, sessionName, driver1, driver2]);

  // Resolve metadata for currently selected Driver 1 & Driver 2
  const activeD1 = useMemo(() => {
    const found = driverList.find((d) => String(d.driver_number) === String(driver1));
    return {
      code: found?.code || ghostData?.driver_1?.abbreviation || `D${driver1}`,
      name: found?.name || ghostData?.driver_1?.full_name || `Driver ${driver1}`,
      team: found?.team || ghostData?.driver_1?.team_name || "Formula 1 Team",
      team_color: found?.team_color || ghostData?.driver_1?.team_color || "#3671C6",
    };
  }, [driverList, driver1, ghostData]);

  const activeD2 = useMemo(() => {
    const found = driverList.find((d) => String(d.driver_number) === String(driver2));
    return {
      code: found?.code || ghostData?.driver_2?.abbreviation || `D${driver2}`,
      name: found?.name || ghostData?.driver_2?.full_name || `Driver ${driver2}`,
      team: found?.team || ghostData?.driver_2?.team_name || "Formula 1 Team",
      team_color: found?.team_color || ghostData?.driver_2?.team_color || "#E8002D",
    };
  }, [driverList, driver2, ghostData]);

  // Dynamic rival presets based on actual grid
  const rivalPresets = useMemo(() => {
    const presets = [];
    if (driverList.length >= 2) {
      presets.push({
        d1: driverList[0].driver_number,
        d2: driverList[1].driver_number,
        label: `${driverList[0].code} vs ${driverList[1].code}`,
      });
    }
    if (driverList.length >= 3) {
      presets.push({
        d1: driverList[0].driver_number,
        d2: driverList[2].driver_number,
        label: `${driverList[0].code} vs ${driverList[2].code}`,
      });
    }
    if (driverList.length >= 4) {
      presets.push({
        d1: driverList[1].driver_number,
        d2: driverList[2].driver_number,
        label: `${driverList[1].code} vs ${driverList[2].code}`,
      });
      presets.push({
        d1: driverList[2].driver_number,
        d2: driverList[3].driver_number,
        label: `${driverList[2].code} vs ${driverList[3].code}`,
      });
    }
    const map = new Map();
    presets.forEach((p) => {
      if (!map.has(p.label)) map.set(p.label, p);
    });
    return Array.from(map.values()).slice(0, 4);
  }, [driverList]);

  const points = useMemo(() => ghostData?.telemetry_points || [], [ghostData]);

  // Calculate SVG plot dimensions
  const svgW = 860;
  const speedH = 170;
  const deltaH = 90;
  const pedalH = 80;
  const padX = 55;
  const padY = 15;

  const maxDist = useMemo(() => {
    if (!points || points.length === 0) return 5280;
    return points[points.length - 1].distance || 5280;
  }, [points]);

  const maxSpeed = useMemo(() => {
    if (!points || points.length === 0) return 340;
    let m = 0;
    points.forEach((p) => {
      if (p.speed_1 > m) m = p.speed_1;
      if (p.speed_2 > m) m = p.speed_2;
    });
    return Math.max(320, Math.ceil((m + 15) / 20) * 20);
  }, [points]);

  const minSpeed = useMemo(() => {
    if (!points || points.length === 0) return 60;
    let m = 350;
    points.forEach((p) => {
      if (p.speed_1 < m && p.speed_1 > 20) m = p.speed_1;
      if (p.speed_2 < m && p.speed_2 > 20) m = p.speed_2;
    });
    return Math.max(50, Math.floor((m - 10) / 20) * 20);
  }, [points]);

  const maxDelta = useMemo(() => {
    if (!points || points.length === 0) return 0.5;
    let m = 0.1;
    points.forEach((p) => {
      const absD = Math.abs(p.delta_time || 0);
      if (absD > m) m = absD;
    });
    return Math.min(1.5, Math.max(0.3, m * 1.25));
  }, [points]);

  // Generate SVG coordinates
  const { speedPath1, speedPath2, deltaPath, throttlePath1, throttlePath2, brakePath1, brakePath2 } = useMemo(() => {
    if (!points || points.length === 0) {
      return { speedPath1: "", speedPath2: "", deltaPath: "", throttlePath1: "", throttlePath2: "", brakePath1: "", brakePath2: "" };
    }

    const scaleX = (svgW - padX * 2) / (maxDist || 1);
    const speedScaleY = (speedH - padY * 2) / (maxSpeed - minSpeed || 1);
    const deltaScaleY = (deltaH - padY * 2) / (maxDelta * 2 || 1);
    const deltaZeroY = deltaH / 2;

    const pedalScaleY = (pedalH - padY * 2) / 100;

    let sp1 = "";
    let sp2 = "";
    let dp = "";
    let th1 = "";
    let th2 = "";
    let br1 = "";
    let br2 = "";

    points.forEach((p, idx) => {
      const x = padX + p.distance * scaleX;

      // Speed
      const yS1 = speedH - padY - (p.speed_1 - minSpeed) * speedScaleY;
      const yS2 = speedH - padY - (p.speed_2 - minSpeed) * speedScaleY;
      sp1 += idx === 0 ? `M ${x.toFixed(1)} ${yS1.toFixed(1)}` : ` L ${x.toFixed(1)} ${yS1.toFixed(1)}`;
      sp2 += idx === 0 ? `M ${x.toFixed(1)} ${yS2.toFixed(1)}` : ` L ${x.toFixed(1)} ${yS2.toFixed(1)}`;

      // Delta Time: negative means D1 is ahead (plot above baseline)
      const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, p.delta_time || 0));
      const yDelta = deltaZeroY + clampedDelta * deltaScaleY;
      dp += idx === 0 ? `M ${x.toFixed(1)} ${yDelta.toFixed(1)}` : ` L ${x.toFixed(1)} ${yDelta.toFixed(1)}`;

      // Throttle
      const yTh1 = pedalH - padY - (p.throttle_1 || 0) * pedalScaleY;
      const yTh2 = pedalH - padY - (p.throttle_2 || 0) * pedalScaleY;
      th1 += idx === 0 ? `M ${x.toFixed(1)} ${yTh1.toFixed(1)}` : ` L ${x.toFixed(1)} ${yTh1.toFixed(1)}`;
      th2 += idx === 0 ? `M ${x.toFixed(1)} ${yTh2.toFixed(1)}` : ` L ${x.toFixed(1)} ${yTh2.toFixed(1)}`;

      // Brake (step binary)
      const yBr1 = pedalH - padY - (p.brake_1 ? 100 : 0) * pedalScaleY;
      const yBr2 = pedalH - padY - (p.brake_2 ? 100 : 0) * pedalScaleY;
      br1 += idx === 0 ? `M ${x.toFixed(1)} ${yBr1.toFixed(1)}` : ` L ${x.toFixed(1)} ${yBr1.toFixed(1)}`;
      br2 += idx === 0 ? `M ${x.toFixed(1)} ${yBr2.toFixed(1)}` : ` L ${x.toFixed(1)} ${yBr2.toFixed(1)}`;
    });

    return {
      speedPath1: sp1,
      speedPath2: sp2,
      deltaPath: dp,
      throttlePath1: th1,
      throttlePath2: th2,
      brakePath1: br1,
      brakePath2: br2,
    };
  }, [points, maxDist, maxSpeed, minSpeed, maxDelta, svgW, speedH, deltaH, pedalH, padX, padY]);

  // Active hover point
  const currentHoverPoint = useMemo(() => {
    if (!points || points.length === 0) return null;
    const idx = hoverIndex !== null ? Math.max(0, Math.min(points.length - 1, hoverIndex)) : Math.floor(points.length / 2);
    return points[idx];
  }, [points, hoverIndex]);

  // Handle mouse move across SVG graphs
  const handleSvgMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = (clientX - padX) / (rect.width - (padX * 2 * (rect.width / svgW)));
    const targetDist = Math.max(0, Math.min(1, normX)) * maxDist;

    if (!points || points.length === 0) return;
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-[#0c1017] border border-gray-800/80 rounded-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden text-gray-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-white uppercase font-mono">
                  Data Ghost Telemetry Comparator
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                  FastF1 Head-to-Head
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {eventName} {season} • Synchronized Speed Trace, Delta Time (Δt) & Throttle/Brake Dynamics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Driver Selection & Hero Battle Banner */}
        <div className="px-6 py-4 border-b border-gray-800/60 bg-gray-950/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Driver 1 Selector */}
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-10 rounded-full shadow-lg"
                style={{ backgroundColor: activeD1.team_color || "#3671C6" }}
              />
              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                  Driver 1 (Reference)
                </label>
                <select
                  id="ghost-driver-1-select"
                  value={driver1}
                  onChange={(e) => setDriver1(e.target.value)}
                  className="bg-gray-900/90 border border-gray-700 text-white font-mono text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                >
                  {driverList.map((d) => (
                    <option key={d.driver_number} value={d.driver_number}>
                      {d.code} — {d.name} ({d.team})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right pl-2">
                <span className="block text-xs font-mono text-gray-400">Fastest Lap</span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {ghostData?.lap_time_1 || "—"}
                </span>
              </div>
            </div>

            {/* Quick Rival Battle Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mr-1">
                Presets:
              </span>
              {rivalPresets.map(({ d1: p1, d2: p2, label }, idx) => (
                <button
                  key={label}
                  id={`ghost-preset-${idx}`}
                  onClick={() => {
                    setDriver1(p1);
                    setDriver2(p2);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all cursor-pointer ${
                    driver1 === p1 && driver2 === p2
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20"
                      : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Driver 2 Selector */}
            <div className="flex items-center gap-3">
              <div className="text-left pr-2">
                <span className="block text-xs font-mono text-gray-400">Fastest Lap</span>
                <span className="font-mono text-sm font-bold text-rose-400">
                  {ghostData?.lap_time_2 || "—"}
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1 text-right">
                  Driver 2 (Rival Ghost)
                </label>
                <select
                  id="ghost-driver-2-select"
                  value={driver2}
                  onChange={(e) => setDriver2(e.target.value)}
                  className="bg-gray-900/90 border border-gray-700 text-white font-mono text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-400 transition-colors cursor-pointer"
                >
                  {driverList.map((d) => (
                    <option key={d.driver_number} value={d.driver_number}>
                      {d.code} — {d.name} ({d.team})
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="w-3.5 h-10 rounded-full shadow-lg"
                style={{ backgroundColor: activeD2.team_color || "#E8002D" }}
              />
            </div>

          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          
          {/* Live Telemetry HUD Bar */}
          {currentHoverPoint && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-gray-950/80 border border-gray-800/80 rounded-xl font-mono text-xs shadow-inner">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Track Distance</span>
                <span className="text-base font-bold text-white">
                  {currentHoverPoint.distance.toLocaleString()} <span className="text-xs text-gray-400 font-normal">m</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest">{activeD1.code} Speed</span>
                <span className="text-base font-bold text-cyan-400">
                  {currentHoverPoint.speed_1} <span className="text-xs text-gray-400 font-normal">km/h</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  THR: {currentHoverPoint.throttle_1}% • BRK: {currentHoverPoint.brake_1 ? "ON" : "OFF"} • G{currentHoverPoint.gear_1}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-rose-400 uppercase tracking-widest">{activeD2.code} Speed</span>
                <span className="text-base font-bold text-rose-400">
                  {currentHoverPoint.speed_2} <span className="text-xs text-gray-400 font-normal">km/h</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  THR: {currentHoverPoint.throttle_2}% • BRK: {currentHoverPoint.brake_2 ? "ON" : "OFF"} • G{currentHoverPoint.gear_2}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Speed Delta</span>
                <span className={`text-base font-bold ${currentHoverPoint.speed_1 >= currentHoverPoint.speed_2 ? "text-cyan-400" : "text-rose-400"}`}>
                  {currentHoverPoint.speed_1 >= currentHoverPoint.speed_2 ? "+" : ""}
                  {(currentHoverPoint.speed_1 - currentHoverPoint.speed_2).toFixed(1)}{" "}
                  <span className="text-xs text-gray-400 font-normal">km/h</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Cumulative Time Delta</span>
                <span className={`text-base font-bold ${currentHoverPoint.delta_time <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {currentHoverPoint.delta_time <= 0 ? "" : "+"}
                  {currentHoverPoint.delta_time.toFixed(3)}{" "}
                  <span className="text-xs text-gray-400 font-normal">s ({currentHoverPoint.delta_time <= 0 ? activeD1.code : activeD2.code})</span>
                </span>
              </div>
            </div>
          )}

          {/* Graphs Container */}
          <div
            className="relative bg-gray-950/90 border border-gray-800/80 rounded-xl p-3 cursor-crosshair select-none"
            onMouseMove={handleSvgMouseMove}
          >
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading telemetry curves...</span>
                </div>
              </div>
            )}

            {/* 1. Speed Trace Graph */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1 px-2">
                <span className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-semibold">Speed Trace (km/h)</span>
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeD1.team_color || "#3671C6" }} />
                    {activeD1.code}
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeD2.team_color || "#E8002D" }} />
                    {activeD2.code}
                  </span>
                </div>
              </div>

              <svg viewBox={`0 0 ${svgW} ${speedH}`} className="w-full h-44 overflow-visible">
                {/* Horizontal Grid lines */}
                {[100, 150, 200, 250, 300].filter((v) => v <= maxSpeed && v >= minSpeed).map((spd) => {
                  const y = speedH - padY - (spd - minSpeed) * ((speedH - padY * 2) / (maxSpeed - minSpeed || 1));
                  return (
                    <g key={spd}>
                      <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                      <text x={padX - 8} y={y + 3} fill="#6b7280" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {spd}
                      </text>
                    </g>
                  );
                })}

                {/* Driver 2 (Rival) Speed Curve */}
                <path
                  d={speedPath2}
                  fill="none"
                  stroke={activeD2.team_color || "#E8002D"}
                  strokeWidth="2.2"
                  strokeOpacity="0.85"
                />

                {/* Driver 1 (Reference) Speed Curve */}
                <path
                  d={speedPath1}
                  fill="none"
                  stroke={activeD1.team_color || "#3671C6"}
                  strokeWidth="2.6"
                />

                {/* Vertical hover crosshair */}
                {currentHoverPoint && (
                  <line
                    x1={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y1={padY}
                    x2={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y2={speedH - padY}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}
              </svg>
            </div>

            {/* 2. Delta Time (Δt) Graph */}
            <div className="mb-2 pt-2 border-t border-gray-800/60">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1 px-2">
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white font-semibold">Time Delta Δt (Seconds)</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  Above = {activeD1.code} Faster • Below = {activeD2.code} Faster
                </span>
              </div>

              <svg viewBox={`0 0 ${svgW} ${deltaH}`} className="w-full h-24 overflow-visible">
                {/* Zero baseline */}
                <line x1={padX} y1={deltaH / 2} x2={svgW - padX} y2={deltaH / 2} stroke="#374151" strokeWidth="1.5" />
                <text x={padX - 8} y={deltaH / 2 + 3} fill="#9ca3af" fontSize="10" textAnchor="end" fontFamily="monospace">
                  0.0s
                </text>

                {/* Delta Curve */}
                <path
                  d={deltaPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                />

                {/* Vertical hover crosshair */}
                {currentHoverPoint && (
                  <line
                    x1={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y1={padY}
                    x2={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y2={deltaH - padY}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}
              </svg>
            </div>

            {/* 3. Throttle & Brake Dynamics */}
            <div className="pt-2 border-t border-gray-800/60">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1 px-2">
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white font-semibold">Throttle & Brake Application</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  Solid = Throttle (0-100%) • Stepped = Brake (ON/OFF)
                </span>
              </div>

              <svg viewBox={`0 0 ${svgW} ${pedalH}`} className="w-full h-20 overflow-visible">
                {/* 0 and 100% lines */}
                <line x1={padX} y1={pedalH - padY} x2={svgW - padX} y2={pedalH - padY} stroke="#1f2937" />
                <line x1={padX} y1={padY} x2={svgW - padX} y2={padY} stroke="#1f2937" strokeDasharray="2 2" />
                <text x={padX - 8} y={padY + 4} fill="#6b7280" fontSize="10" textAnchor="end" fontFamily="monospace">
                  100%
                </text>
                <text x={padX - 8} y={pedalH - padY + 3} fill="#6b7280" fontSize="10" textAnchor="end" fontFamily="monospace">
                  0%
                </text>

                {/* Throttle 2 */}
                <path d={throttlePath2} fill="none" stroke={activeD2.team_color || "#E8002D"} strokeWidth="1.8" strokeOpacity="0.8" />
                {/* Throttle 1 */}
                <path d={throttlePath1} fill="none" stroke={activeD1.team_color || "#3671C6"} strokeWidth="2.2" />

                {/* Brake 2 */}
                <path d={brakePath2} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" strokeOpacity="0.8" />
                {/* Brake 1 */}
                <path d={brakePath1} fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="3 2" />

                {/* Vertical hover crosshair */}
                {currentHoverPoint && (
                  <line
                    x1={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y1={padY}
                    x2={padX + currentHoverPoint.distance * ((svgW - padX * 2) / (maxDist || 1))}
                    y2={pedalH - padY}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Strategic Takeaway / Telemetry Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Fastest Flying Lap
              </span>
              <p className="text-gray-200">
                <span className="font-bold text-emerald-400">{ghostData?.faster_driver || activeD1.code}</span> was{" "}
                <span className="font-bold text-white">{Math.abs(ghostData?.delta_final_seconds || 0.161).toFixed(3)}s</span> faster across the full lap.
              </p>
            </div>

            <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Cornering & Apex Velocity
              </span>
              <p className="text-gray-200">
                Differences in corner apex minimum speeds reveal braking discipline and traction control on corner exits.
              </p>
            </div>

            <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Telemetry Resolution
              </span>
              <p className="text-gray-200">
                Synchronized across <span className="text-cyan-400 font-bold">{points.length}</span> normalized distance checkpoints (<span className="text-white">~20m spacing</span>).
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800/80 bg-gray-900/40 text-xs font-mono text-gray-400">
          <span>Move cursor across telemetry tracks to inspect speed, time deltas, and pedal inputs.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
