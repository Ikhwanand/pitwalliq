import { useMemo } from "react";
import { Compass, MapPin } from "lucide-react";

export default function CircuitMap({
  circuitName = "Bahrain International Circuit",
  points = [],
  corners = [],
  turns = 15,
  lengthKm = 5.412,
  selectedDriverCode = "VER",
  cars = [], // [{ driver_number, code, progress, team_color, isFocused }]
  trackStatus = "GREEN",
  onSelectDriver,
}) {
  // Compute normalized SVG path, scaled points, corners, and start/finish gate
  const { pathData, startFinishPoint, sfGate, turnMarkers, scaledPoints } = useMemo(() => {
    if (!points || points.length === 0) {
      return { pathData: "", startFinishPoint: null, sfGate: null, turnMarkers: [], scaledPoints: [] };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 50;
    const svgWidth = 700;
    const svgHeight = 440;

    const scale = Math.min((svgWidth - padding * 2) / rangeX, (svgHeight - padding * 2) / rangeY);
    const offsetX = (svgWidth - rangeX * scale) / 2;
    const offsetY = (svgHeight - rangeY * scale) / 2;

    const scaled = points.map((p) => ({
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (p.y - minY) * scale,
    }));

    // High-resolution telemetry data (>50 points): use smooth Catmull-Rom cubic Bezier curves
    const isHighRes = scaled.length > 50;
    let closedPath;

    if (isHighRes) {
      // Standard Catmull-Rom to cubic Bezier conversion with tension=0 (div by 6)
      let d = `M ${scaled[0].x.toFixed(1)} ${scaled[0].y.toFixed(1)}`;

      for (let i = 0; i < scaled.length; i++) {
        const p0 = scaled[(i - 1 + scaled.length) % scaled.length];
        const p1 = scaled[i];
        const p2 = scaled[(i + 1) % scaled.length];
        const p3 = scaled[(i + 2) % scaled.length];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }

      closedPath = d + " Z";
    } else {
      // Low-resolution fallback data: straight lines
      const d = scaled.reduce((acc, curr, idx) => {
        return idx === 0
          ? `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
          : `${acc} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      }, "");
      closedPath = `${d} Z`;
    }

    const sf = scaled[0] || null;

    // Perpendicular Start / Finish line gate calculation
    let gate = null;
    if (scaled.length >= 2) {
      const p0 = scaled[0];
      const p1 = scaled[1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const arm = 14;
      gate = {
        x1: p0.x + nx * arm,
        y1: p0.y + ny * arm,
        x2: p0.x - nx * arm,
        y2: p0.y - ny * arm,
        midX: p0.x,
        midY: p0.y,
      };
    }

    // Turn marker detection: use official telemetry corners if provided, else curvature analysis
    let markers = [];
    if (corners && corners.length > 0) {
      markers = corners.map((c) => ({
        turn: c.turn || c.number,
        x: offsetX + (c.x - minX) * scale,
        y: offsetY + (c.y - minY) * scale,
      }));
    } else if (isHighRes) {
      // Curvature analysis: detect turns by measuring angle change between segments
      const minMarkerGap = Math.max(8, Math.floor(scaled.length / 30));
      let lastMarkerIdx = -minMarkerGap;
      let turnNum = 1;

      for (let i = 2; i < scaled.length - 2; i++) {
        if (i - lastMarkerIdx < minMarkerGap) continue;

        const dx1 = scaled[i].x - scaled[i - 2].x;
        const dy1 = scaled[i].y - scaled[i - 2].y;
        const dx2 = scaled[i + 2].x - scaled[i].x;
        const dy2 = scaled[i + 2].y - scaled[i].y;

        const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
        const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const curvature = mag1 > 0.1 && mag2 > 0.1 ? cross / (mag1 * mag2) : 0;

        if (curvature > 0.15) {
          markers.push({ turn: turnNum++, x: scaled[i].x, y: scaled[i].y });
          lastMarkerIdx = i;
        }
      }

      if (markers.length > 20) {
        const keepStep = Math.ceil(markers.length / 18);
        const filtered = markers.filter((_, idx) => idx % keepStep === 0);
        markers.length = 0;
        filtered.forEach((m, idx) => markers.push({ ...m, turn: idx + 1 }));
      }
    } else {
      const step = Math.max(1, Math.floor(scaled.length / 6));
      for (let i = 0; i < scaled.length; i += step) {
        markers.push({
          turn: Math.floor(i / step) * 2 + 1,
          x: scaled[i].x,
          y: scaled[i].y,
        });
      }
    }

    return { pathData: closedPath, startFinishPoint: sf, sfGate: gate, turnMarkers: markers, scaledPoints: scaled };
  }, [points, corners]);

  // Helper to interpolate coordinates on the track path given progress [0.0 - 1.0]
  const getCarPos = (progress) => {
    if (!scaledPoints || scaledPoints.length === 0) return { x: 350, y: 220 };
    const total = scaledPoints.length;
    const norm = ((progress % 1.0) + 1.0) % 1.0;
    const indexFloat = norm * (total - 1);
    const idx = Math.floor(indexFloat);
    const nextIdx = (idx + 1) % total;
    const factor = indexFloat - idx;
    const p1 = scaledPoints[idx];
    const p2 = scaledPoints[nextIdx];
    return {
      x: p1.x + (p2.x - p1.x) * factor,
      y: p1.y + (p2.y - p1.y) * factor,
    };
  };

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1f2937] bg-[#0d1424] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#00d2be]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Live Telemetry Circuit Map
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-300">
          <span className="font-semibold text-white">{circuitName}</span>
          <span className="text-gray-400 font-tabular">{lengthKm} km • {turns} TURNS</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-70 bg-[#080c14] flex items-center justify-center p-2">
        {/* Subtle engineering grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#1f2937 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {pathData ? (
          <svg viewBox="0 0 700 440" className="w-full h-full max-h-67.5">
            <defs>
              <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2be" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#e10600" />
              </linearGradient>
              <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Track Shadow/Casing */}
            <path
              d={pathData}
              fill="none"
              stroke="#1f2937"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Track Asphalt Core */}
            <path
              d={pathData}
              fill="none"
              stroke="#0f172a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Racing Line / Telemetry Trace */}
            <path
              d={pathData}
              fill="none"
              stroke="url(#trackGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#trackGlow)"
            />

            {/* Turn Numbers - Sleek, subtle corner badges */}
            {turnMarkers.map((tm, idx) => (
              <g key={idx} opacity="0.75">
                <rect
                  x={tm.x - 7}
                  y={tm.y - 7}
                  width="14"
                  height="14"
                  rx="3"
                  fill="#0b1120"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
                <text
                  x={tm.x}
                  y={tm.y + 3.5}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="bold"
                  fill="#93c5fd"
                  fontFamily="monospace"
                >
                  T{tm.turn}
                </text>
              </g>
            ))}

            {/* Start / Finish Line - Authentic Motorsport Gate */}
            {sfGate ? (
              <g>
                <line
                  x1={sfGate.x1}
                  y1={sfGate.y1}
                  x2={sfGate.x2}
                  y2={sfGate.y2}
                  stroke="#e10600"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <line
                  x1={sfGate.x1}
                  y1={sfGate.y1}
                  x2={sfGate.x2}
                  y2={sfGate.y2}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                <text
                  x={sfGate.midX}
                  y={sfGate.midY + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="black"
                  fill="#f9fafb"
                  fontFamily="sans-serif"
                  letterSpacing="0.5"
                >
                  START / FINISH
                </text>
              </g>
            ) : startFinishPoint && (
              <g>
                <line
                  x1={startFinishPoint.x - 10}
                  y1={startFinishPoint.y}
                  x2={startFinishPoint.x + 10}
                  y2={startFinishPoint.y}
                  stroke="#e10600"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text
                  x={startFinishPoint.x}
                  y={startFinishPoint.y + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="black"
                  fill="#f9fafb"
                >
                  START / FINISH
                </text>
              </g>
            )}

            {/* Real-time Moving Cars on Circuit */}
            {cars.map((car) => {
              const pos = getCarPos(car.progress);
              const isFocused = car.isFocused || String(car.code) === String(selectedDriverCode);

              return (
                <g
                  key={car.driver_number}
                  id={`car-blip-${car.driver_number}`}
                  className="transition-all duration-75 cursor-pointer"
                  onClick={() => onSelectDriver && onSelectDriver(car.driver_number)}
                >
                  {/* Ping Ring for focused driver - Native SVG animation without CSS transform offset */}
                  {isFocused && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="6"
                      fill="none"
                      stroke="#00d2be"
                      strokeWidth="1.5"
                    >
                      <animate
                        attributeName="r"
                        from="6"
                        to="18"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.85"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Car Blip Marker */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isFocused ? "6.5" : "4.5"}
                    fill={isFocused ? "#00d2be" : car.team_color || "#9ca3af"}
                    stroke="#ffffff"
                    strokeWidth={isFocused ? "1.5" : "1"}
                    filter={isFocused ? "url(#carGlow)" : undefined}
                  />

                  {/* Driver Code Pill Label */}
                  <g transform={`translate(${pos.x + 8}, ${pos.y - 8})`}>
                    <rect
                      x="0"
                      y="-10"
                      width={isFocused ? "34" : "26"}
                      height="13"
                      rx="3"
                      fill="#0b101c"
                      stroke={isFocused ? "#00d2be" : "#374151"}
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text
                      x={isFocused ? "17" : "13"}
                      y="-1"
                      textAnchor="middle"
                      fontSize={isFocused ? "9" : "8"}
                      fontWeight="bold"
                      fill={isFocused ? "#00d2be" : "#f9fafb"}
                      fontFamily="monospace"
                    >
                      {car.code || car.driver_number}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Safety Car Marker when SC is deployed */}
            {trackStatus === "SAFETY CAR" && (
              <g>
                {(() => {
                  const scPos = getCarPos(cars[0] ? cars[0].progress + 0.05 : 0.5);
                  return (
                    <g>
                      <circle cx={scPos.x} cy={scPos.y} r="8" fill="#eab308" stroke="#ffffff" strokeWidth="2" />
                      <g transform={`translate(${scPos.x - 14}, ${scPos.y - 14})`}>
                        <rect x="0" y="0" width="28" height="12" rx="3" fill="#eab308" />
                        <text x="14" y="9" textAnchor="middle" fontSize="8" fontWeight="black" fill="#000000">
                          SC
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        ) : (
          <div className="text-gray-400 text-xs flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500 animate-spin" />
            Generating circuit coordinates...
          </div>
        )}

        {/* Live track telemetry status badge */}
        <div className="absolute bottom-2 left-3 bg-[#111827]/90 border border-[#1f2937] backdrop-blur px-2.5 py-1 rounded text-[10px] text-gray-300 font-tabular flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                trackStatus === "SAFETY CAR" ? "bg-yellow-400" : "bg-[#00d2be]"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                trackStatus === "SAFETY CAR" ? "bg-yellow-400" : "bg-[#00d2be]"
              }`}
            />
          </span>
          <span>TRACK: <strong className="text-white">{trackStatus}</strong></span>
          <span className="text-gray-500">•</span>
          <span>FOCUS: <strong className="text-[#00d2be]">#{selectedDriverCode}</strong></span>
        </div>
      </div>
    </div>
  );
}
