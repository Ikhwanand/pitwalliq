import { Loader2, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = "info", message = "", title = "System Notification" } = toast;

  let borderColor = "border-[#1f2937]";
  let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

  if (type === "loading") {
    borderColor = "border-[#00d2be]/50 glow-cyan";
    icon = <Loader2 className="w-4 h-4 text-[#00d2be] animate-spin shrink-0" />;
  } else if (type === "success") {
    borderColor = "border-emerald-500/50";
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  } else if (type === "error" || type === "warning") {
    borderColor = "border-amber-500/50";
    icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#0d1424] border ${borderColor} rounded-xl p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            {title}
          </h4>
          <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
