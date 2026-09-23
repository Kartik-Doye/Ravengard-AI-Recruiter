import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Sliders
} from "lucide-react";

interface TelemetryOverview {
  totalTokens: number;
  avgLatency: number;
  totalRequests: number;
}

interface TenantStats {
  organizationId: string;
  organizationName: string;
  totalTokens: number;
  avgLatency: number;
  requestCount: number;
}

interface ModuleStats {
  module: string;
  totalTokens: number;
  avgLatency: number;
  requestCount: number;
}

interface PendingJob {
  id: string;
  title: string;
  department: string;
  description: string;
  requirementsJson: string[];
  screeningThreshold: number;
  status: string;
  createdAt: string;
}

export function AdminTelemetryDashboard() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<{
    overview: TelemetryOverview;
    tenants: TenantStats[];
    modules: ModuleStats[];
  } | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{ [jobId: string]: string }>({});
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);

  const fetchTelemetryData = async (selectedTimeframe: string) => {
    setLoading(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const [telemetryRes, pendingJobsRes] = await Promise.all([
        fetch(`/api/admin/telemetry/stats?timeframe=${selectedTimeframe}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/jobs/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (telemetryRes.ok) {
        const telJson = await telemetryRes.json();
        if (telJson.success) setData(telJson.data);
      }

      if (pendingJobsRes.ok) {
        const jobsJson = await pendingJobsRes.json();
        if (jobsJson.success) setPendingJobs(jobsJson.jobs || []);
      }
    } catch (error) {
      console.error("Failed to load telemetry or pending jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData(timeframe);
  }, [timeframe]);

  const handleApproveJob = async (jobId: string) => {
    setActionLoading(jobId);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error("Failed to approve job:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    setActionLoading(jobId);
    const token = localStorage.getItem("ravengard_admin_token");
    const feedback = feedbackInput[jobId] || "Requisition requires revisions before publishing.";
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
        setRejectingJobId(null);
      }
    } catch (err) {
      console.error("Failed to reject job:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-96 text-white/50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--color-secondary)] mr-3"></div>
        <span className="font-mono text-xs uppercase tracking-widest">Aggregating Global Telemetry & Observability...</span>
      </div>
    );
  }

  const overview = data?.overview || { totalTokens: 0, avgLatency: 0, totalRequests: 0 };
  const tenants = data?.tenants || [];
  const modules = data?.modules || [];
  const maxTenantTokens = Math.max(...tenants.map((t) => t.totalTokens), 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-medium tracking-wide text-white">
              System Telemetry & Multi-Tenant Governance
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider font-semibold">
              Live Observability
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Real-time tracking of multi-provider LLM token consumption, latency, and Job Approval Gate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTelemetryData(timeframe)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex bg-black/60 border border-white/10 rounded-lg p-1">
            {(["24h", "7d", "30d"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  timeframe === tf
                    ? "bg-[var(--color-secondary)] text-black font-semibold shadow"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tf === "24h" ? "Last 24 Hours" : tf === "7d" ? "Last 7 Days" : "Last 30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-[var(--color-secondary)]/50 transition-colors"
        >
          <div className="flex justify-between items-center text-white/40 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total LLM Tokens</span>
            <Cpu className="w-4 h-4 text-[var(--color-secondary)]" />
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight">
            {overview.totalTokens.toLocaleString()}
          </div>
          <p className="text-[11px] font-mono text-white/40 mt-2">
            Across Gemini 2.5 Flash, Groq LPU & failover proxies
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex justify-between items-center text-white/40 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Average API Latency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400 tracking-tight">
            {overview.avgLatency} <span className="text-sm font-normal text-white/40">ms</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-400/70 mt-2">
            Sub-200ms target for conversational speech synthesis
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors"
        >
          <div className="flex justify-between items-center text-white/40 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Inferences / Turns</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-blue-400 tracking-tight">
            {overview.totalRequests.toLocaleString()} <span className="text-sm font-normal text-white/40">calls</span>
          </div>
          <p className="text-[11px] font-mono text-white/40 mt-2">
            Zero API spend via multi-provider free tier rotation
          </p>
        </motion.div>
      </div>

      {/* Super Admin Job Approval Gate Section */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-display font-medium text-white tracking-wide">
                Job Approval Gate (Super Admin Requisition Review)
              </h2>
              <p className="text-[11px] text-white/40 font-mono">
                Requisitions created in Draft/Pending status must be approved before public candidate enrollment.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-white/60">
            {pendingJobs.length} Requisitions Pending Review
          </span>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="text-center py-8 text-white/40 font-mono text-xs bg-white/[0.02] rounded-lg border border-dashed border-white/10">
            All job requisitions have been audited and published to candidate portal.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-black/60 border border-white/10 rounded-lg hover:border-amber-500/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{job.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                        {job.department || "Engineering"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 max-w-2xl">{job.description}</p>
                    {job.requirementsJson && job.requirementsJson.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requirementsJson.map((req, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleApproveJob(job.id)}
                      disabled={actionLoading === job.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>

                    <button
                      onClick={() => setRejectingJobId(rejectingJobId === job.id ? null : job.id)}
                      disabled={actionLoading === job.id}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-400 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {rejectingJobId === job.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter feedback reason for rejection..."
                      value={feedbackInput[job.id] || ""}
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, [job.id]: e.target.value })}
                      className="flex-1 bg-black border border-white/20 rounded-md px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => handleRejectJob(job.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-medium cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tenant Usage Leaderboard */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-sm font-display font-medium text-white tracking-wide">
                Tenant Consumption Leaderboard
              </h2>
            </div>
            <span className="text-[11px] font-mono text-white/40">Multi-Tenant Quota Distribution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-white/5 text-white/40 font-mono uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Organization Name</th>
                  <th className="py-2.5 px-3">Requests</th>
                  <th className="py-2.5 px-3">Avg Latency</th>
                  <th className="py-2.5 px-3">Total Tokens</th>
                  <th className="py-2.5 px-3 w-36">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((tenant) => {
                  const percentage = Math.round((tenant.totalTokens / maxTenantTokens) * 100);
                  return (
                    <tr key={tenant.organizationId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-white/40" />
                        {tenant.organizationName}
                      </td>
                      <td className="py-3 px-3 font-mono text-white/50">{tenant.requestCount.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{tenant.avgLatency} ms</td>
                      <td className="py-3 px-3 font-mono text-[var(--color-secondary)] font-semibold">
                        {tenant.totalTokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 w-36">
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--color-secondary)] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module Usage Breakdown */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-display font-medium text-white tracking-wide">
              Module Distribution
            </h2>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.module} className="p-3.5 bg-black/60 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-white capitalize">
                    {mod.module.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-mono text-white/50">{mod.requestCount} calls</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-white/50 mt-2">
                  <span>Tokens: <strong className="text-[var(--color-secondary)] font-semibold">{mod.totalTokens.toLocaleString()}</strong></span>
                  <span>Latency: <strong className="text-emerald-400 font-semibold">{mod.avgLatency} ms</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
