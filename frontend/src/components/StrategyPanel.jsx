import { useState } from "react";
import {
  BrainCircuit,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Volume2,
} from "lucide-react";

export default function StrategyPanel({
  selectedDriver = { driver_number: "1", code: "VER", name: "Max Verstappen", team: "Red Bull Racing" },
  currentLap = 18,
  onEvaluateStrategy,
  strategyResult = null,
  isLoading = false,
  evaluationStage = 0, // 0 = idle, 1 = analyst, 2 = strategist team
}) {
  const [userQuery, setUserQuery] = useState("");

  const quickPrompts = [
    { label: "Assess Undercut on P2", query: "Can we execute an undercut on the car ahead? What is the pit exit window and traffic risk?" },
    { label: "Tyre Cliff Warning", query: "Are we approaching the tyre degradation cliff on this compound? What is our lap time drop-off?" },
    { label: "Pit Window & Clean Air", query: "Find the optimal pit stop window to rejoin into clean air without getting stuck in a DRS train." },
    { label: "Safety Car Plan B", query: "If a Safety Car or VSC is deployed within the next 5 laps, what is our Plan B reaction?" },
  ];

  const handleQuickPrompt = (promptQuery) => {
    setUserQuery(promptQuery);
    if (onEvaluateStrategy) {
      onEvaluateStrategy(promptQuery);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userQuery.trim() || isLoading) return;
    if (onEvaluateStrategy) {
      onEvaluateStrategy(userQuery);
    }
  };

  // Confidence gauge percentage
  const confidenceScore = strategyResult?.confidence_score
    ? Math.round(strategyResult.confidence_score * 100)
    : 88;

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col h-full shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1f2937] bg-[#0d1424] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#00d2be]" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              AI Strategy Directorate
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00d2be]/20 text-[#00d2be] border border-[#00d2be]/40">
                AGNO 2-TIER
              </span>
            </h2>
            <div className="text-[10px] text-gray-400">
              Focus: <span className="text-white font-semibold">{selectedDriver.code || selectedDriver.name}</span> (#{selectedDriver.driver_number}) • Lap {currentLap}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[720px]">
        {/* Quick Strategy Pills */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
            Tactical Scenarios (Quick Pills)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(p.query)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1a2333] hover:bg-[#243147] border border-[#1f2937] text-gray-200 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-[#00d2be]" />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Query Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              rows={2}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask pitwall strategist (e.g., 'Should we box on Lap 20 to undercut Leclerc?')"
              disabled={isLoading}
              className="w-full bg-[#0a0e17] border border-[#1f2937] focus:border-[#00d2be] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || isLoading}
              className="absolute right-2.5 bottom-3.5 px-3 py-1 bg-[#e10600] hover:bg-[#ff1e16] disabled:bg-gray-700 text-white font-bold text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Send className="w-3 h-3" />
              <span>Analyze</span>
            </button>
          </div>
        </form>

        {/* Multi-Stage Thinking Progress Indicator */}
        {isLoading && (
          <div className="bg-[#0b101c] border border-[#00d2be]/40 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-300">
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d2be] animate-ping" />
                Agno Strategy Pipeline Running...
              </span>
              <span className="text-[#00d2be] font-tabular text-[11px]">
                {evaluationStage === 1 ? "STAGE 1/2" : "STAGE 2/2"}
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] text-gray-400">
              <div className={`flex items-center gap-2 ${evaluationStage >= 1 ? "text-[#00d2be]" : ""}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stage 1: Race Data Analyst grounding FastF1 telemetry & stint delta...
              </div>
              <div className={`flex items-center gap-2 ${evaluationStage >= 2 ? "text-[#00d2be]" : "text-gray-500"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stage 2: Decision Model & Strategy Team computing probabilities & radio call...
              </div>
            </div>
          </div>
        )}

        {/* Strategy Decision Matrix Card */}
        {strategyResult ? (
          <div className="space-y-3">
            {/* F1 Team Radio Audio Callout */}
            <div className="bg-gradient-to-r from-[#180a0a] via-[#1c1212] to-[#121c1a] border border-[#e10600]/50 rounded-xl p-3.5 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black tracking-wider text-[#ff4d4d]">
                  <Volume2 className="w-4 h-4 text-[#e10600]" />
                  <span>PITWALL TO CAR #{selectedDriver.driver_number}</span>
                </div>
                {/* Animated Radio Waveform */}
                <div className="flex items-center gap-0.5 h-4">
                  {[4, 8, 14, 6, 16, 10, 5].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-[#00d2be] rounded-full animate-radio-bar"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>

              {/* Radio Transmission Quote */}
              <div className="text-white text-sm font-bold tracking-wide italic bg-[#000000]/40 p-2.5 rounded-lg border border-[#e10600]/30">
                "{strategyResult.pitwall_radio || strategyResult.recommendation}"
              </div>
            </div>

            {/* Decision Model Probabilities & Confidence Gauge */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Decision Probabilities */}
              <div className="bg-[#0b101c] border border-[#1f2937] rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  System 1 Probabilities
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Undercut Viability:</span>
                    <span className="font-tabular font-bold text-[#00d2be]">
                      {strategyResult.decision_probabilities?.undercut_opportunity !== undefined
                        ? `${Math.round(strategyResult.decision_probabilities.undercut_opportunity * 100)}%`
                        : "84%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Tyre Cliff Reached:</span>
                    <span className="font-tabular font-bold text-yellow-400">
                      {strategyResult.decision_probabilities?.tyre_cliff_reached !== undefined
                        ? `${Math.round(strategyResult.decision_probabilities.tyre_cliff_reached * 100)}%`
                        : "72%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Meter */}
              <div className="bg-[#0b101c] border border-[#1f2937] rounded-lg p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Tactical Confidence
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00d2be] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,210,190,0.6)]"
                      style={{ width: `${confidenceScore}%` }}
                    />
                  </div>
                  <span className="font-tabular text-xs font-black text-[#00d2be]">
                    {confidenceScore}%
                  </span>
                </div>
                <span className="text-[9px] text-gray-400">Calibrated by Strategy Team</span>
              </div>
            </div>

            {/* Primary Plan A & Plan B */}
            <div className="space-y-2">
              {/* Plan A */}
              <div className="bg-[#111c2e] border border-[#00d2be]/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#00d2be]/20 text-[#00d2be] border border-[#00d2be]/40">
                    PLAN A (PRIMARY)
                  </span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  {strategyResult.primary_plan || strategyResult.recommendation}
                </p>
              </div>

              {/* Plan B */}
              <div className="bg-[#1f192b] border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    PLAN B (CONTINGENCY)
                  </span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  {strategyResult.alternative_plan || "Extend current stint to Lap 24 if degradation stabilizes; switch to Medium compound."}
                </p>
              </div>
            </div>

            {/* Risk Assessment & Assumptions */}
            <div className="bg-[#0b101c] border border-[#1f2937] rounded-lg p-3 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  Tactical Risk Assessment
                </span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {strategyResult.risk_assessment || "Traffic on pit exit at Turn 4. Cold hard tyre out-lap delta of +1.8s."}
                </p>
              </div>

              {strategyResult.assumptions && strategyResult.assumptions.length > 0 && (
                <div className="border-t border-[#1f2937] pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Operational Assumptions
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-400">
                    {strategyResult.assumptions.map((asm, idx) => (
                      <li key={idx} className="truncate">
                        {asm}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="border border-dashed border-[#1f2937] rounded-xl p-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <BrainCircuit className="w-8 h-8 text-gray-600" />
              <span className="text-xs font-semibold text-gray-300">
                AI Race Strategist Ready
              </span>
              <p className="text-[11px] text-gray-400 max-w-xs">
                Select a quick scenario above or ask a tactical question to generate real-time pitstop recommendations.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
