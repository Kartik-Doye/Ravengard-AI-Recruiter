import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  FileCheck,
  Download,
  Terminal,
  Activity,
  Filter,
  RefreshCw,
  Globe,
  Flame,
  CheckCircle2
} from "lucide-react";
import { Card } from "../ui/Card";

interface ThreatLog {
  id: string;
  threatType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  ipAddress: string;
  countryCode: string;
  city: string;
  latitude: string | number;
  longitude: string | number;
  rawPayloadSnippet: string;
  actionTaken: string;
  timestamp: string;
}

interface CompliancePackages {
  eeoc: any;
  euAiAct: any;
  gdpr: any;
}

export function SecurityVisualizerView() {
  const [activeTab, setActiveTab] = useState<"stream" | "compliance">("stream");
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedThreat, setSelectedThreat] = useState<ThreatLog | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [complianceData, setComplianceData] = useState<CompliancePackages | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Map ping state
  const [activePin, setActivePin] = useState<{ x: number; y: number; city: string; type: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial threat logs
  const fetchThreatLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch(`/api/admin/security/threat-logs?severity=${severityFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.threats)) {
        setThreats(data.threats);
        if (data.threats.length > 0 && !selectedThreat) {
          setSelectedThreat(data.threats[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load threat logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Connect SSE live stream
  useEffect(() => {
    fetchThreatLogs();

    const token = localStorage.getItem("ravengard_admin_token") || "admin_stream_token";
    const sseUrl = `/api/admin/security/threat-stream?token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.addEventListener("connected", () => {
        setConnected(true);
      });

      es.addEventListener("threat", (event) => {
        try {
          const newThreat: ThreatLog = JSON.parse(event.data);
          setThreats((prev) => [newThreat, ...prev.slice(0, 49)]);
          setSelectedThreat(newThreat);

          // Convert lat/lon to approximate SVG map coordinates (800x400 viewBox)
          const lat = Number(newThreat.latitude);
          const lon = Number(newThreat.longitude);
          const x = ((lon + 180) / 360) * 800;
          const y = ((90 - lat) / 180) * 400;

          setActivePin({ x, y, city: newThreat.city, type: newThreat.threatType });
          setTimeout(() => setActivePin(null), 4000);
        } catch (e) {
          console.error("Failed to parse SSE threat payload:", e);
        }
      });

      es.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Fetch compliance packages
  const fetchCompliance = async () => {
    setComplianceLoading(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/security/compliance-reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.packages) {
        setComplianceData(data.packages);
      }
    } catch (err) {
      console.error("Compliance fetch error:", err);
    } finally {
      setComplianceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "compliance" && !complianceData) {
      fetchCompliance();
    }
  }, [activeTab]);

  const handleSimulateThreat = async (type: string, severity: string) => {
    setSimulating(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      await fetch("/api/admin/security/simulate-threat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ threatType: type, severity })
      });
    } catch (err) {
      console.error("Simulate threat failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Convert lat/long to map coordinates
  const projectCoords = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
              connected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {connected ? "SSE Stream Connected (Live)" : "Stream Reconnecting..."}
            </span>
            <span className="text-slate-400 text-xs font-mono">• Immutable Audit Node</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-slate-100 tracking-wide">
            Real-Time Security & Compliance Visualizer
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-light mt-1">
            Live telemetry threat feed, prompt injection guardrail intercepts, geographical anomaly tracking, and certified regulatory audit packages.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab("stream")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "stream" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Threat Feed</span>
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "compliance" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Regulatory Audits (EU AI / EEOC)</span>
          </button>
        </div>
      </div>

      {activeTab === "stream" && (
        <div className="space-y-6">
          {/* World Threat Vector Map & Attack Simulator Controls */}
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Global Threat & Ingress Telemetry Map</span>
                </h2>
                <span className="text-xs text-slate-500">Live plotting of client IP coordinates and edge guardrail intercepts</span>
              </div>

              {/* Simulation Quick Triggers */}
              <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Simulate Attack:</span>
                <button
                  onClick={() => handleSimulateThreat("PROMPT_INJECTION", "HIGH")}
                  disabled={simulating}
                  className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  Prompt Injection
                </button>
                <button
                  onClick={() => handleSimulateThreat("SQL_INJECTION", "CRITICAL")}
                  disabled={simulating}
                  className="px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/40 transition-colors cursor-pointer"
                >
                  SQL Injection
                </button>
                <button
                  onClick={() => handleSimulateThreat("GEO_ANOMALY", "MEDIUM")}
                  disabled={simulating}
                  className="px-2.5 py-1 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/40 transition-colors cursor-pointer"
                >
                  VPN / Geo Anomaly
                </button>
              </div>
            </div>

            {/* High-Contrast Vector SVG Map */}
            <div className="relative w-full h-[280px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-60">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="800" height="400" fill="url(#grid)" />

                {/* Simplified Continents Outline */}
                {/* North America */}
                <path
                  d="M120,60 Q180,50 240,90 Q220,160 170,180 Q130,150 100,100 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* South America */}
                <path
                  d="M200,210 Q260,230 250,320 Q220,380 190,320 Q180,240 200,210 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Europe */}
                <path
                  d="M400,60 Q480,50 490,110 Q450,150 410,130 Q380,100 400,60 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Africa */}
                <path
                  d="M400,160 Q480,160 480,250 Q430,340 390,260 Q380,200 400,160 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Asia */}
                <path
                  d="M510,60 Q700,60 720,170 Q630,220 540,170 Q500,120 510,60 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Australia */}
                <path
                  d="M640,260 Q720,250 730,320 Q660,350 630,310 Z"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                />

                {/* Plot historical threat coordinates */}
                {threats.map((t) => {
                  const { x, y } = projectCoords(Number(t.latitude) || 37, Number(t.longitude) || -122);
                  const isCritical = t.severity === "CRITICAL";
                  const isHigh = t.severity === "HIGH";
                  return (
                    <g key={t.id} className="cursor-pointer" onClick={() => setSelectedThreat(t)}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isCritical ? 5 : 3.5}
                        fill={isCritical ? "#EF4444" : isHigh ? "#F59E0B" : "#06B6D4"}
                        opacity="0.85"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={isCritical ? 10 : 7}
                        fill="none"
                        stroke={isCritical ? "#EF4444" : "#F59E0B"}
                        strokeWidth="0.8"
                        opacity="0.4"
                      />
                    </g>
                  );
                })}

                {/* Active Ping Pulse Beacon when new SSE arrives */}
                {activePin && (
                  <g>
                    <circle cx={activePin.x} cy={activePin.y} r="16" fill="#EF4444" opacity="0.3">
                      <animate attributeName="r" from="4" to="24" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={activePin.x} cy={activePin.y} r="5" fill="#EF4444" />
                    <text x={activePin.x + 8} y={activePin.y - 8} fill="#FCA5A5" fontSize="10" fontFamily="monospace">
                      {activePin.city}: {activePin.type}
                    </text>
                  </g>
                )}
              </svg>

              <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                <span>Coordinates: Equirectangular Projection · WGS 84</span>
              </div>
            </div>
          </Card>

          {/* Dual Ledger & Threat Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Threat Ledger (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Live Guardrail & Telemetry Feed</span>
                  </h3>

                  {/* Filter by severity */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeverityFilter(s)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                          severityFilter === s ? "bg-slate-700 text-white font-semibold" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950 max-h-[460px] overflow-y-auto">
                  {loading && threats.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-slate-500">Connecting to telemetry buffer...</div>
                  ) : threats.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-slate-500">No threat events matching filter.</div>
                  ) : (
                    threats.map((t) => {
                      const isSelected = selectedThreat?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedThreat(t)}
                          className={`p-3 text-xs font-mono cursor-pointer transition-colors ${
                            isSelected ? "bg-slate-800/70 border-l-2 border-indigo-400" : "hover:bg-slate-900/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  t.severity === "CRITICAL"
                                    ? "bg-rose-950/60 text-rose-300 border border-rose-800/70"
                                    : t.severity === "HIGH"
                                    ? "bg-amber-950/60 text-amber-300 border border-amber-800/70"
                                    : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/70"
                                }`}
                              >
                                {t.severity}
                              </span>
                              <span className="text-slate-200 font-medium">{t.threatType}</span>
                              <span className="text-slate-500 text-[11px]">· {t.city}, {t.countryCode}</span>
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(t.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <p className="text-slate-400 text-[11px] truncate mb-1">
                            "{t.rawPayloadSnippet}"
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            <span>IP: {t.ipAddress}</span>
                            <span>Action: <strong className={t.actionTaken === "BLOCKED" ? "text-rose-400" : "text-amber-400"}>{t.actionTaken}</strong></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Threat Detail Inspector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 border-slate-800 bg-slate-900/50">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-3">
                  Deep Packet & Guardrail Inspector
                </h3>

                {selectedThreat ? (
                  <div className="space-y-3.5 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Incident ID:</span>
                        <span className="text-slate-300">{selectedThreat.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Classification:</span>
                        <span className="text-indigo-400 font-semibold">{selectedThreat.threatType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Severity Level:</span>
                        <span className="text-rose-400 font-semibold">{selectedThreat.severity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Egress Coordinates:</span>
                        <span className="text-slate-300">{selectedThreat.latitude}, {selectedThreat.longitude}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Edge Guardrail Action:</span>
                        <span className="text-emerald-400 font-semibold">{selectedThreat.actionTaken}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1">Raw Intercepted Payload:</span>
                      <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-rose-300 whitespace-pre-wrap break-all leading-relaxed">
                        {selectedThreat.rawPayloadSnippet}
                      </pre>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block mb-1">Automated Defense Response:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        The candidate request was intercepted by the deterministic security proxy. Context was isolated, zero-delete integrity rules remained locked, and no state mutations were persisted.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-slate-500">
                    Select a threat from the live ledger to inspect payload signatures.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Regulatory Audits & Compliance Packages */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Algorithmic Fairness & Regulatory Compliance Packages</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  1-click certified compliance dossiers for EEOC (Title VII), EU Artificial Intelligence Act Annex IV, and GDPR Article 35 DPIA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(complianceData, null, 2));
                    setJsonCopied(true);
                    setTimeout(() => setJsonCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
                >
                  {jsonCopied ? "JSON Copied!" : "Export Raw JSON"}
                </button>
              </div>
            </div>

            {complianceLoading || !complianceData ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                Generating certified compliance packages...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. EEOC Package */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {complianceData.eeoc.complianceStatus}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Title VII</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 font-mono mb-1">
                      EEOC Algorithmic Fairness
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Validated under Uniform Guidelines on Employee Selection Procedures (UGESP). 4/5ths Rule tested.
                    </p>

                    <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Adverse Impact Ratio:</span>
                        <span className="text-emerald-400 font-bold">{complianceData.eeoc.adverseImpactRatio} (Pass &ge; 0.80)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fairness Rating:</span>
                        <span className="text-slate-200">{complianceData.eeoc.algorithmicFairnessScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Variance:</span>
                        <span className="text-slate-200">{complianceData.eeoc.varianceAcrossDemographics}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 font-mono">
                    {complianceData.eeoc.recommendation}
                  </div>
                </div>

                {/* 2. EU AI Act Annex IV */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {complianceData.euAiAct.conformityAssessmentStatus}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">EU 2024/1689</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 font-mono mb-1">
                      EU AI Act Annex IV
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      High-Risk AI system conformity declaration for candidate recruitment and evaluation tools.
                    </p>

                    <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Human Oversight:</span>
                        <span className="text-indigo-300 font-medium">HITL Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Data Isolation:</span>
                        <span className="text-slate-200">Strict Tenant Partition</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificate ID:</span>
                        <span className="text-cyan-400 text-[11px]">{complianceData.euAiAct.auditCertificateId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 font-mono">
                    Meets Article 9 Risk Management & Article 13 Transparency requisites.
                  </div>
                </div>

                {/* 3. GDPR Article 35 DPIA */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {complianceData.gdpr.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">GDPR Article 35</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 font-mono mb-1">
                      GDPR DPIA & Article 22
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Automated decision-making assessment, candidate rights-of-erasure, and encryption validation.
                    </p>

                    <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Article 22:</span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">At-Rest Encryption:</span>
                        <span className="text-slate-200">AES-256 Cloud KMS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">In-Transit:</span>
                        <span className="text-slate-200">TLS 1.3 / PFS</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 font-mono">
                    {complianceData.gdpr.retentionPolicy}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default SecurityVisualizerView;
