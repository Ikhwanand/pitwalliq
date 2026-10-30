import { Radio, Activity, Cpu } from "lucide-react";

export default function Navbar({
  seasons = [2024, 2023],
  selectedSeason = 2024,
  onSelectSeason,
  events = [],
  selectedRound = 1,
  onSelectRound,
  sessions = ["Race", "Qualifying", "Practice 1"],
  selectedSession = "Race",
  onSelectSession,
  isBackendConnected = true,
}) {
  return (
    <header className="bg-[#0b111e] border-b border-[#1f2937] px-4 py-3 select-none sticky top-0 z-50 shadow-md">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-[#111827] border border-[#1f2937] rounded-lg shadow-inner">
            <Radio className="w-6 h-6 text-[#00d2be]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white">
                PITWALL<span className="text-[#00d2be] drop-shadow-[0_0_8px_rgba(0,210,190,0.5)]">IQ</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e10600]/20 text-[#ff4d4d] border border-[#e10600]/40 uppercase tracking-widest">
                F1 AI STRATEGY
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Tactical Telemetry Directorate
            </span>
          </div>
        </div>

        {/* Global Event Selectors */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Season Selector */}
          <div className="flex items-center bg-[#111827] border border-[#1f2937] rounded-md px-2.5 py-1.5">
            <span className="text-xs text-gray-400 font-medium mr-2">SEASON:</span>
            <select
              value={selectedSeason}
              onChange={(e) => onSelectSeason && onSelectSeason(Number(e.target.value))}
              aria-label="Select season"
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {seasons.map((s) => (
                <option key={s} value={s} className="bg-[#111827] text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Event Selector */}
          <div className="flex items-center bg-[#111827] border border-[#1f2937] rounded-md px-2.5 py-1.5">
            <span className="text-xs text-gray-400 font-medium mr-2">GRAND PRIX:</span>
            <select
              value={selectedRound}
              onChange={(e) => onSelectRound && onSelectRound(Number(e.target.value))}
              aria-label="Select Grand Prix"
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              {events.map((ev) => (
                <option key={ev.round_number} value={ev.round_number} className="bg-[#111827] text-white">
                  R{ev.round_number} — {ev.event_name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div className="flex items-center bg-[#111827] border border-[#1f2937] rounded-md px-2.5 py-1.5">
            <span className="text-xs text-gray-400 font-medium mr-2">SESSION:</span>
            <select
              value={selectedSession}
              onChange={(e) => onSelectSession && onSelectSession(e.target.value)}
              aria-label="Select session"
              className="bg-transparent text-xs font-semibold text-[#00d2be] focus:outline-none cursor-pointer"
            >
              {sessions.map((sess) => (
                <option key={sess} value={sess} className="bg-[#111827] text-white">
                  {sess}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] px-3 py-1.5 rounded-full text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? "bg-[#00d2be] animate-pulse" : "bg-yellow-400"
              }`}
            />
            <span className="font-semibold text-gray-200 tracking-wide text-[11px] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#00d2be]" />
              {isBackendConnected ? "TELEMETRY LIVE" : "OFFLINE FALLBACK"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#111827] border border-[#1f2937] px-3 py-1.5 rounded-full text-xs">
            <Cpu className="w-3.5 h-3.5 text-[#ff8000]" />
            <span className="text-gray-300 font-medium text-[11px]">
              Agno Engine: <span className="text-[#00d2be] font-bold">2-Tier</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
