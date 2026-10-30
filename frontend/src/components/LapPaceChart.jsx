import { useMemo } from "react";
import { TrendingUp, Activity } from "lucide-react";

export default function LapPaceChart({
  laps = [],
  driver1Code = "VER",
  driver2Code = "LEC",
  driver2Number = "16",
  availableDrivers = [],
  onSelectDriver2,
  currentLap = 18,
  isPlaying = false,
}) {
  // Filter laps up to current simulated lap for real-time progressive plotting
  const visibleLaps = useMemo(() => {
    if (!laps || laps.length === 0) return [];
    const filtered = laps.filter((d) => d.lap <= Math.max(1, currentLap));
    // If at lap 1, ensure at least lap 1 is present
    return filtered.length > 0 ? filtered : [laps[0]];
  }, [laps, currentLap]);

  // Extract min and max lap times for SVG scaling
  const { chartData, minTime, maxTime, currentDelta, latestLapTime } = useMemo(() => {
    if (!visibleLaps || visibleLaps.length === 0) {
      return { chartData: {}, minTime: 94, maxTime: 100, currentDelta: "-0.38s", latestLapTime: 95.2 };
    }

    let min = Infinity;
    let max = -Infinity;

    // Use full laps range to keep Y-axis stable during playback
    laps.forEach((d) => {
      const v = d.ver || d.driver1 || 96;
      const c = d.lec || d.driver2 || 96.5;
      if (v < min) min = v;
      if (v > max) max = v;
      if (c < min) min = c;
      if (c > max) max = c;
    });

    const padding = 0.5;
    const finalMin = Math.floor(min - padding);
    const finalMax = Math.ceil(max + padding);

    const width = 640;
    const height = 180;
    const padX = 40;
    const padY = 20;

    // Total X-axis domain is the full race length (e.g. 57 laps or total laps in dataset)
    const totalDomainLaps = Math.max(20, laps.length || 57);
    const scaleX = (width - padX * 2) / (totalDomainLaps - 1 || 1);
    const scaleY = (height - padY * 2) / (finalMax - finalMin || 1);

    const pts1 = [];
    const pts2 = [];

    visibleLaps.forEach((d) => {
      const x = padX + (d.lap - 1) * scaleX;
      const v = d.ver || d.driver1 || 96;
      const c = d.lec || d.driver2 || 96.5;

      const y1 = height - padY - (v - finalMin) * scaleY;
      const y2 = height - padY - (c - finalMin) * scaleY;

      pts1.push({ x, y: y1, val: v, lap: d.lap });
      pts2.push({ x, y: y2, val: c, lap: d.lap });
    });

    const path1 = pts1.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
      ""
    );
    const path2 = pts2.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
      ""
    );

    const lastPt1 = pts1[pts1.length - 1];
    const lastPt2 = pts2[pts2.length - 1];
    const delta = lastPt1 && lastPt2 ? (lastPt1.val - lastPt2.val).toFixed(3) : "-0.350";
    const deltaStr = Number(delta) < 0 ? `${delta}s` : `+${delta}s`;

    return {
      chartData: { path1, path2, pts1, pts2, lastPt1, lastPt2 },
      minTime: finalMin,
      maxTime: finalMax,
      currentDelta: deltaStr,
      latestLapTime: lastPt1?.val?.toFixed(3) || "95.158",
    };
  }, [visibleLaps, laps]);

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1f2937] bg-[#0d1424] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00d2be]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Real-Time Lap Pace Telemetry
            {isPlaying && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2be] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2be]"></span>
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          {/* Driver 1 (Target Focus - Cyan) */}
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00d2be]"></span>
            <span className="text-gray-200">{driver1Code}</span>
          </div>

          <span className="text-gray-500 font-bold text-[10px]">VS</span>

          {/* Driver 2 (Rival - Red) with interactive dropdown */}
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e10600]"></span>
            {availableDrivers && availableDrivers.length > 0 ? (
              <select
                aria-label="Select Rival Driver"
                value={driver2Number || "16"}
                onChange={(e) => onSelectDriver2 && onSelectDriver2(e.target.value)}
                className="bg-[#0b101c] border border-[#374151] hover:border-[#e10600] rounded px-1.5 py-0.5 text-xs text-gray-200 font-bold outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-[#e10600]"
              >
                {availableDrivers.map((d) => (
                  <option key={d.driver_number} value={d.driver_number} className="bg-[#111827] text-white">
                    {d.code || d.driver_number} ({d.name ? d.name.split(" ").slice(-1)[0] : `#${d.driver_number}`})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-200">{driver2Code}</span>
            )}
          </div>

          <span className="px-2 py-0.5 rounded bg-[#1f2937] text-[10px] font-tabular text-[#00d2be] font-bold">
            Pace Delta: {currentDelta}
          </span>
        </div>
      </div>

      {/* Graph Area */}
      <div className="p-3 bg-[#080c14] relative">
        <svg viewBox="0 0 640 180" className="w-full h-37.5">
          <defs>
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = 20 + pct * 140;
            const timeVal = (maxTime - pct * (maxTime - minTime)).toFixed(1);
            return (
              <g key={i}>
                <line x1="40" y1={y} x2="600" y2={y} stroke="#1f2937" strokeDasharray="3,3" />
                <text x="32" y={y + 3} textAnchor="end" fontSize="9" fill="#6b7280" fontFamily="monospace">
                  {timeVal}s
                </text>
              </g>
            );
          })}

          {/* Pit Window Shading */}
          <rect x="230" y="20" width="80" height="140" fill="#00d2be" opacity="0.05" />
          <line x1="270" y1="20" x2="270" y2="160" stroke="#00d2be" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
          <text x="270" y="15" textAnchor="middle" fontSize="8" fill="#00d2be" fontWeight="bold">
            PIT WINDOW (L18-24)
          </text>

          {/* Trace 2: Competitor (Red) */}
          {chartData.path2 && (
            <path
              d={chartData.path2}
              fill="none"
              stroke="#e10600"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}

          {/* Trace 1: Target Driver (Cyan Glow) */}
          {chartData.path1 && (
            <path
              d={chartData.path1}
              fill="none"
              stroke="#00d2be"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Subtle Data Points */}
          {chartData.pts1 && visibleLaps.length <= 40 &&
            chartData.pts1.map((p, idx) => (
              <circle key={`p1-${idx}`} cx={p.x} cy={p.y} r="1.5" fill="#00d2be" opacity="0.8" />
            ))}
          {chartData.pts2 && visibleLaps.length <= 40 &&
            chartData.pts2.map((p, idx) => (
              <circle key={`p2-${idx}`} cx={p.x} cy={p.y} r="1.2" fill="#e10600" opacity="0.7" />
            ))}

          {/* Live Progress Cursor Line at Current Lap */}
          {chartData.lastPt1 && (
            <g>
              <line
                x1={chartData.lastPt1.x}
                y1={20}
                x2={chartData.lastPt1.x}
                y2={160}
                stroke="#00d2be"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                opacity="0.8"
              />
              {/* Pulsing Live Dot - Native SVG animation without CSS transform offset */}
              <circle
                cx={chartData.lastPt1.x}
                cy={chartData.lastPt1.y}
                r="4.5"
                fill="#00d2be"
                filter="url(#pointGlow)"
              />
              <circle
                cx={chartData.lastPt1.x}
                cy={chartData.lastPt1.y}
                r="4.5"
                fill="none"
                stroke="#00d2be"
                strokeWidth="1.5"
              >
                <animate
                  attributeName="r"
                  from="4.5"
                  to="14"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.9"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                x={Math.min(580, chartData.lastPt1.x + 8)}
                y={chartData.lastPt1.y - 6}
                fontSize="8"
                fontWeight="bold"
                fill="#00d2be"
                fontFamily="monospace"
              >
                L{currentLap}: {latestLapTime}s
              </text>
            </g>
          )}
        </svg>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 px-2 font-tabular">
          <span>LAP 1</span>
          <span className="text-gray-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#00d2be]" />
            LIVE TELEMETRY: PLOTTED UP TO LAP {visibleLaps.length} OF {laps.length || 57}
          </span>
          <span>LAP {laps.length || 57}</span>
        </div>
      </div>
    </div>
  );
}
