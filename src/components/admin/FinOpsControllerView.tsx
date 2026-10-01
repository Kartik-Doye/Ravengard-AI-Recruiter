import React, { useState, useEffect } from "react";
import {
  Coins,
  Cpu,
  TrendingDown,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";

interface DepartmentBudget {
  id: string;
  department: string;
  monthlyTokenCap: number;
  softWarningThreshold: number;
  hardCapAction: string;
  currentMonthUsageTokens: number;
  estimatedCostUsd: string;
  percentUsed: number;
  isSoftWarning: boolean;
  isHardCapReached: boolean;
}

interface FinOpsOverview {
  departments: DepartmentBudget[];
  aggregate: {
    totalSpentUsd: string;
    totalTokensConsumed: number;
    totalTurnsLogged: number;
    activeCostPerInterviewAverage: string;
  };
}

interface ModelRoutingRule {
  id: string;
  seniorityLevel: string;
  primaryModel: string;
  fallbackModel: string;
  maxPromptTokensOverride: number;
}

interface TokenLedgerEntry {
  id: string;
  sessionId: string;
  department: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  sttSeconds: string;
  ttsCharacters: number;
  totalCostUsd: string;
  createdAt: string;
}

export function FinOpsControllerView() {
  const [overview, setOverview] = useState<FinOpsOverview | null>(null);
  const [routingRules, setRoutingRules] = useState<ModelRoutingRule[]>([]);
  const [ledger, setLedger] = useState<TokenLedgerEntry[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = localStorage.getItem("ravengard_admin_token");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, routeRes, ledRes] = await Promise.all([
        fetch("/api/admin/finops/overview", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/finops/model-routing", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/finops/token-ledger${selectedDept ? `?department=${selectedDept}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setOverview(ovData);
      }
      if (routeRes.ok) {
        const routeData = await routeRes.json();
        setRoutingRules(routeData.rules || []);
      }
      if (ledRes.ok) {
        const ledData = await ledRes.json();
        setLedger(ledData.ledger || []);
      }
    } catch (err) {
      console.error("FinOps fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    try {
      setIsSavingBudget(true);
      const res = await fetch(`/api/admin/finops/budgets/${editingBudget.department}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monthlyTokenCap: editingBudget.monthlyTokenCap,
          softWarningThreshold: editingBudget.softWarningThreshold,
          hardCapAction: editingBudget.hardCapAction,
        }),
      });
      if (res.ok) {
        setSuccessMsg(`Budget caps for ${editingBudget.department} saved.`);
        setTimeout(() => setSuccessMsg(null), 3500);
        setEditingBudget(null);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase tracking-widest">
            <Coins className="w-3.5 h-3.5" />
            <span>Infrastructure Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            FinOps & Token Budget Controller
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time multi-department LLM token metering, cost-per-hire tracking, and automatic degradation routing policies.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL MTD SPEND</span>
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
            ${overview?.aggregate.totalSpentUsd || "0.0000"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {overview?.aggregate.totalTurnsLogged || 0} evaluated session turns
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOKENS CONSUMED</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
            {(overview?.aggregate.totalTokensConsumed || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Prompt + completion combined
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG COST / HIRE</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono tabular-nums">
            ${overview?.aggregate.activeCostPerInterviewAverage || "0.2450"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            STT + LLM reasoning + TTS
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CAP ENFORCEMENT</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-slate-200 mt-2 font-mono">
            AUTO-DEGRADE
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Graceful model step-down at 100%
          </div>
        </div>
      </div>

      {/* Department Token Envelopes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Department Token Envelopes & Hard/Soft Caps</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Monthly Allocation Reset on 1st</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview?.departments.map((dept) => {
            const usage = dept.currentMonthUsageTokens || 0;
            const cap = dept.monthlyTokenCap || 1;
            const percent = Math.min(dept.percentUsed, 100);

            return (
              <div
                key={dept.id}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{dept.department}</span>
                    <button
                      onClick={() => setEditingBudget(dept)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Budget Cap"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mt-3 text-xs font-mono tabular-nums">
                    <span className="text-slate-300">
                      {usage.toLocaleString()} / {cap.toLocaleString()} tokens
                    </span>
                    <span
                      className={`font-semibold ${
                        dept.isHardCapReached
                          ? "text-rose-400"
                          : dept.isSoftWarning
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {dept.percentUsed}%
                    </span>
                  </div>

                  {/* Meter Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 mt-2 overflow-hidden border border-slate-800 relative">
                    <div
                      className={`h-full transition-all duration-500 ${
                        dept.isHardCapReached
                          ? "bg-rose-500"
                          : dept.isSoftWarning
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                    <span>Soft Alert: {dept.softWarningThreshold}%</span>
                    <span>Action: {dept.hardCapAction}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Est. MTD Cost:</span>
                  <span className="text-white font-semibold tabular-nums">
                    ${dept.estimatedCostUsd || "0.0000"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Routing & Degradation Rules */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Model Routing & Seniority Degradation Policy</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">SENIORITY TIER</th>
                <th className="px-4 py-3 font-semibold">PRIMARY LLM MODEL</th>
                <th className="px-4 py-3 font-semibold">CAP DEGRADATION FALLBACK</th>
                <th className="px-4 py-3 font-semibold">TOKEN OVERRIDE</th>
                <th className="px-4 py-3 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {routingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">{rule.seniorityLevel}</td>
                  <td className="px-4 py-3.5 text-indigo-300">{rule.primaryModel}</td>
                  <td className="px-4 py-3.5 text-slate-400 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    <span>{rule.fallbackModel}</span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{rule.maxPromptTokensOverride} tokens</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multimodal Token Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Multimodal Token Consumption Ledger</span>
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-400">Filter Dept:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">SESSION ID</th>
                <th className="px-4 py-3 font-semibold">DEPARTMENT</th>
                <th className="px-4 py-3 font-semibold">MODEL USED</th>
                <th className="px-4 py-3 font-semibold text-right">PROMPT TOKENS</th>
                <th className="px-4 py-3 font-semibold text-right">COMPLETION</th>
                <th className="px-4 py-3 font-semibold text-right">COST USD</th>
                <th className="px-4 py-3 font-semibold">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No token transactions recorded yet. Live interview turns will stream here in real time.
                  </td>
                </tr>
              ) : (
                ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{row.sessionId.slice(0, 12)}...</td>
                    <td className="px-4 py-3 font-medium text-white">{row.department}</td>
                    <td className="px-4 py-3 text-indigo-300">{row.modelUsed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.promptTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.completionTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      ${Number(row.totalCostUsd).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(row.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Edit {editingBudget.department} Budget
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Monthly Token Cap</label>
                <input
                  type="number"
                  min="1000"
                  step="10000"
                  value={editingBudget.monthlyTokenCap}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      monthlyTokenCap: parseInt(e.target.value, 10) || 1000,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Soft Warning Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={editingBudget.softWarningThreshold}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      softWarningThreshold: parseInt(e.target.value, 10) || 80,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Hard Cap Action (at 100%)</label>
                <select
                  value={editingBudget.hardCapAction}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, hardCapAction: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="DEGRADE_MODEL">DEGRADE_MODEL (Graceful routing to Haiku/Flash)</option>
                  <option value="BLOCK">BLOCK (Return HTTP 429 Session Lock)</option>
                  <option value="NOTIFY">NOTIFY (Continue Primary Model + Alert HR)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingBudget ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
