import { Play, Pause, RotateCcw, ShieldAlert, Wrench } from "lucide-react";

export default function SimulationControls({
  isPlaying = false,
  onTogglePlay,
  onReset,
  simSpeed = 1,
  onChangeSpeed,
  currentLap = 18,
  totalLaps = 57,
  onSeekLap,
  trackStatus = "GREEN",
  onToggleSafetyCar,
  onTriggerPitStop,
  selectedDriverCode = "VER",
}) {
  const speeds = [1, 2, 4, 8];

  return (
    <div className="bg-[#0b101c] border border-[#1f2937] rounded-xl px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-4 mb-3">
      {/* Playback Primary Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-md ${
            isPlaying
              ? "bg-[#e10600] hover:bg-[#ff1e16] text-white glow-red"
              : "bg-[#00d2be] hover:bg-[#34eedb] text-black font-extrabold glow-cyan"
          }`}
          title={isPlaying ? "Pause simulation" : "Start real-time simulation"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#1e293b] border border-[#1f2937] text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Reset simulation to Lap 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-[#111827] border border-[#1f2937] rounded-lg p-0.5 ml-1">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed && onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-tabular font-bold transition-colors cursor-pointer ${
                simSpeed === s
                  ? "bg-[#00d2be] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Lap Scrubber / Interactive Timeline */}
      <div className="flex-1 min-w-[240px] max-w-xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-tabular">
          <span className="text-gray-400 font-semibold text-[11px]">LAP</span>
          <span className="text-white font-black text-sm">{currentLap}</span>
          <span className="text-gray-500 text-[11px]">/ {totalLaps}</span>
        </div>

        {/* Slider Track */}
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={1}
            max={totalLaps}
            value={currentLap}
            onChange={(e) => onSeekLap && onSeekLap(Number(e.target.value))}
            aria-label="Simulation lap scrubber"
            className="w-full h-1.5 bg-[#1f2937] rounded-lg appearance-none cursor-pointer accent-[#00d2be]"
          />
        </div>

        {/* Live Simulation Status Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? "bg-[#00d2be] animate-ping" : "bg-gray-500"
            }`}
          />
          <span className="font-semibold text-gray-300 font-tabular text-[10px]">
            {isPlaying ? `${simSpeed}x REAL-TIME` : "PAUSED"}
          </span>
        </div>
      </div>

      {/* Tactical Injection Events */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSafetyCar}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            trackStatus === "SAFETY CAR"
              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-pulse"
              : "bg-[#111827] text-gray-300 border-[#1f2937] hover:border-yellow-500/40"
          }`}
          title="Toggle Safety Car scenario to test Plan B reaction"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[11px] font-bold">
            {trackStatus === "SAFETY CAR" ? "SC DEPLOYED" : "SAFETY CAR"}
          </span>
        </button>

        <button
          type="button"
          onClick={onTriggerPitStop}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-[#1a2538] text-gray-300 hover:text-white border border-[#1f2937] hover:border-[#00d2be]/40 transition-colors cursor-pointer"
          title={`Simulate immediate pit stop for #${selectedDriverCode}`}
        >
          <Wrench className="w-3.5 h-3.5 text-[#00d2be]" />
          <span className="text-[11px]">BOX #{selectedDriverCode}</span>
        </button>
      </div>
    </div>
  );
}
