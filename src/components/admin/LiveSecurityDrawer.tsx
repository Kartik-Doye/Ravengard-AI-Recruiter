import React, { useState } from "react";
import {
  Radio,
  X,
  ShieldAlert,
  UserCheck,
  Activity,
  Terminal,
  Trash2,
  Play,
  Flame,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useSecurityStream } from "../../contexts/SecurityStreamContext";
import { Link } from "react-router-dom";

export function LiveSecurityDrawer() {
  const {
    allEvents,
    threats,
    loginAttempts,
    isConnected,
    unreadCount,
    isPanelOpen,
    setIsPanelOpen,
    clearUnread,
    simulateThreat,
    simulateLogin
  } = useSecurityStream();

  const [filter, setFilter] = useState<"ALL" | "THREATS" | "LOGINS">("ALL");

  const filteredLogs = allEvents.filter((evt) => {
    if (filter === "THREATS") return evt.type === "THREAT";
    if (filter === "LOGINS") return evt.type === "LOGIN_ATTEMPT";
    return true;
  });

  return (
    <>
      {/* Floating Status Pill & Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => {
            setIsPanelOpen(!isPanelOpen);
            if (!isPanelOpen) clearUnread();
          }}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full font-mono text-xs border shadow-2xl transition-all cursor-pointer backdrop-blur-md ${
            isPanelOpen
              ? "bg-slate-900 border-indigo-500 text-white"
              : isConnected
              ? "bg-slate-950/90 hover:bg-slate-900 border-slate-800 text-slate-200"
              : "bg-amber-950/90 border-amber-800 text-amber-200"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {isConnected && (
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping" />
            )}
          </div>

          <span className="font-semibold tracking-wide">
            {isPanelOpen ? "Close Live Stream" : "Live SSE Telemetry"}
          </span>

          {unreadCount > 0 && !isPanelOpen && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Drawer Panel */}
      {isPanelOpen && (
        <aside
          className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl z-50 flex flex-col shadow-2xl font-mono text-xs text-slate-200 transition-transform duration-300"
          aria-label="Live Security & Activity Telemetry Stream"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-slate-100 text-xs">
                  Live Security & Ingress Stream
                </h3>
                <span className="text-[10px] text-slate-400">
                  {isConnected ? "Connected · SSE Active" : "Reconnecting to event stream..."}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPanelOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Bar & Fast Actions */}
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "ALL" ? "bg-white text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({allEvents.length})
              </button>
              <button
                onClick={() => setFilter("THREATS")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "THREATS" ? "bg-rose-500 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Threats ({threats.length})
              </button>
              <button
                onClick={() => setFilter("LOGINS")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "LOGINS" ? "bg-emerald-500 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Logins ({loginAttempts.length})
              </button>
            </div>

            <Link
              to="/admin/security-stream"
              onClick={() => setIsPanelOpen(false)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Full Visualizer</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Simulation Toolbar */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-2">
            <span>Simulate Live Event:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => simulateLogin("Tokyo")}
                className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/70 hover:bg-emerald-900/40"
              >
                + Tokyo Login
              </button>
              <button
                onClick={() => simulateThreat("PROMPT_INJECTION", "HIGH")}
                className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/70 hover:bg-rose-900/40"
              >
                + Threat
              </button>
            </div>
          </div>

          {/* Event Stream List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 p-2 space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Awaiting inbound events on the SSE stream...
              </div>
            ) : (
              filteredLogs.map((evt) => {
                const isThreat = evt.type === "THREAT";
                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isThreat
                        ? "bg-slate-950/60 border-slate-800 hover:border-rose-900/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-emerald-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {isThreat ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              evt.severity === "CRITICAL"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {evt.threatType || "THREAT"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            AUTH SUCCESS
                          </span>
                        )}
                        <span className="text-slate-200 text-xs font-semibold">
                          {evt.city}, {evt.countryCode}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {isThreat ? (
                      <div className="text-[11px] text-rose-300/90 font-mono bg-rose-950/20 p-2 rounded border border-rose-900/30 truncate mb-1">
                        "{evt.rawPayloadSnippet || "Guardrail rule triggered on candidate input."}"
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-300 truncate mb-1">
                        User: <strong className="text-slate-100">{evt.email || "admin@ravengard.com"}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>IP: {evt.ipAddress}</span>
                      <span>Coords: {evt.latitude}, {evt.longitude}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Buffer: {allEvents.length} events active</span>
            <button
              onClick={clearUnread}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Mark all read
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

export default LiveSecurityDrawer;
