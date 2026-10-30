import { Flag, Gauge } from "lucide-react";

// Compound styling helper
function getTyreBadge(compound, age) {
  const c = (compound || "MEDIUM").toUpperCase();
  let bg = "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  let letter = "M";

  if (c.includes("SOFT")) {
    bg = "bg-red-500/20 text-red-400 border-red-500/50";
    letter = "S";
  } else if (c.includes("HARD")) {
    bg = "bg-gray-100/20 text-gray-100 border-gray-300/50";
    letter = "H";
  } else if (c.includes("INTER")) {
    bg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    letter = "I";
  } else if (c.includes("WET")) {
    bg = "bg-blue-500/20 text-blue-400 border-blue-500/50";
    letter = "W";
  }

  return (
    <div className="flex items-center gap-1.5" title={`${compound} tyre - ${age} laps old`}>
      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-black border ${bg}`}>
        {letter}
      </span>
      <span className="font-tabular text-xs text-gray-300">L{age}</span>
    </div>
  );
}

export default function TimingTower({
  classification = [],
  selectedDriverNumber = "1",
  onSelectDriver,
  currentLap = 18,
  totalLaps = 57,
  trackStatus = "GREEN",
  trackTemp = 24.5,
}) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col h-full shadow-lg overflow-hidden">
      {/* Tower Header */}
      <div className="p-3.5 border-b border-[#1f2937] bg-[#0d1424] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-[#e10600]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Race Classification
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-tabular">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LAP {currentLap}/{totalLaps}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#1f2937] text-gray-300 font-tabular text-[10px] uppercase">
            {trackStatus}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#1f2937] text-gray-300 font-tabular text-[10px]">
            {trackTemp}°C TRK
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-[#0b101c] border-b border-[#1f2937]">
        <div className="col-span-1 text-center">POS</div>
        <div className="col-span-4 pl-1">DRIVER</div>
        <div className="col-span-3 text-right">GAP / INT</div>
        <div className="col-span-2 text-center">TYRE</div>
        <div className="col-span-2 text-right">LAST</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#1f2937]/50 overflow-y-auto max-h-160 flex-1">
        {classification.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Loading telemetry classification...
          </div>
        ) : (
          classification.map((d) => {
            const isSelected = String(d.driver_number) === String(selectedDriverNumber);
            return (
              <div
                key={d.driver_number}
                id={`timing-row-${d.driver_number}`}
                data-driver-number={d.driver_number}
                onClick={() => onSelectDriver && onSelectDriver(d.driver_number)}
                className={`grid grid-cols-12 items-center px-3 py-2 cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? "bg-[#1e293b] border-l-4 border-l-[#00d2be] text-white"
                    : "hover:bg-[#151f30] text-gray-300"
                }`}
              >
                {/* Pos */}
                <div className="col-span-1 text-center font-tabular font-bold text-gray-300">
                  {d.pos}
                </div>

                {/* Driver with Team Color Bar */}
                <div className="col-span-4 flex items-center gap-2 truncate pl-1">
                  <div
                    className="w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: d.team_color || "#9ca3af" }}
                  />
                  <div className="truncate flex flex-col">
                    <span className="font-bold tracking-wider text-white text-xs">
                      {d.code || d.driver_number}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">#{d.driver_number}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 truncate hidden md:block">
                      {d.team}
                    </span>
                  </div>
                </div>

                {/* Gap & Interval */}
                <div className="col-span-3 text-right font-tabular text-[11px]">
                  <div className="text-gray-200 font-semibold">{d.gap}</div>
                  {d.interval && d.interval !== "-" && (
                    <div className="text-[10px] text-gray-400">{d.interval}</div>
                  )}
                </div>

                {/* Tyre Compound Pill */}
                <div className="col-span-2 flex justify-center">
                  {getTyreBadge(d.tyre_compound, d.tyre_age)}
                </div>

                {/* Last Lap */}
                <div className="col-span-2 text-right font-tabular text-[11px] text-gray-300 font-medium">
                  {d.last_lap || "--:--.---"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-2 border-t border-[#1f2937] bg-[#0d1424] text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
        <Gauge className="w-3 h-3 text-[#00d2be]" />
        Click any driver row to focus AI Strategy & telemetry
      </div>
    </div>
  );
}
