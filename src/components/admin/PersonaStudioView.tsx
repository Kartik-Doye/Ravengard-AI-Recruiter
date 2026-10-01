import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Sliders,
  FileText,
  GitBranch,
  CheckCircle2,
  Volume2,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
} from "lucide-react";

interface PersonaConfig {
  id: string;
  organizationId: string;
  personaName: string;
  strictnessLevel: number;
  interruptionPolicy: string;
  cadenceWordsPerMinute: number;
  probingSensitivity: number;
}

interface RubricDimension {
  name: string;
  weight: number;
  description: string;
  score1: string;
  score3: string;
  score5: string;
}

interface RubricTemplate {
  id: string;
  jobId: string;
  version: number;
  title: string;
  dimensions: RubricDimension[];
  status: string;
  createdBy: string;
  createdAt: string;
}

interface PromptVersion {
  id: string;
  rubricTemplateId: string;
  version: number;
  systemPrompt: string;
  diffSummary: string;
  createdBy: string;
  createdAt: string;
}

export function PersonaStudioView() {
  const [activeTab, setActiveTab] = useState<"persona" | "rubric" | "prompt">("persona");
  const [persona, setPersona] = useState<PersonaConfig | null>(null);
  const [rubrics, setRubrics] = useState<RubricTemplate[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<RubricTemplate | null>(null);
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Generator form states
  const [jobTitle, setJobTitle] = useState("Staff Backend Distributed Systems Engineer");
  const [jobDescription, setJobDescription] = useState(
    `We are seeking a Staff Backend Engineer to architect our next-generation event-driven distributed platform. 
Requirements:
- 7+ years building high-throughput systems in Go, Rust, or Node.js.
- Deep expertise with Kafka, distributed transaction patterns (Saga, 2PC), and raft consensus.
- Strong grounding in database internals, query optimization, and write-ahead logging (WAL).
- Experience leading architectural reviews and designing zero-downtime database migrations.`
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Prompt version editor states
  const [editingPromptText, setEditingPromptText] = useState("");
  const [diffSummaryText, setDiffSummaryText] = useState("");
  const [isPublishingPrompt, setIsPublishingPrompt] = useState(false);

  const token = localStorage.getItem("ravengard_admin_token");

  const fetchStudioData = async () => {
    try {
      setLoading(true);
      const [personaRes, rubricsRes] = await Promise.all([
        fetch("/api/admin/studio/persona", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/studio/rubrics", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (personaRes.ok) {
        const pData = await personaRes.json();
        setPersona(pData.persona);
      }
      if (rubricsRes.ok) {
        const rData = await rubricsRes.json();
        const list = rData.rubrics || [];
        setRubrics(list);
        if (list.length > 0 && !selectedRubric) {
          setSelectedRubric(list[0]);
          fetchPromptHistory(list[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch studio data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromptHistory = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/studio/prompts/${templateId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPromptHistory(data.history || []);
        if (data.history?.length > 0) {
          setEditingPromptText(data.history[0].systemPrompt);
        }
      }
    } catch (err) {
      console.error("Fetch prompt history error:", err);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, []);

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persona) return;
    try {
      const res = await fetch("/api/admin/studio/persona", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(persona),
      });
      if (res.ok) {
        setSuccessMsg("Interviewer persona parameters successfully saved.");
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error("Save persona error:", err);
    }
  };

  const handleGenerateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await fetch("/api/admin/studio/rubrics/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: `job_${Date.now()}`,
          jobTitle,
          descriptionText: jobDescription,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRubric(data.rubric);
        setSuccessMsg("AI Rubric synthesized and baseline prompt version created!");
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchStudioData();
        if (data.rubric?.id) {
          await fetchPromptHistory(data.rubric.id);
        }
        setActiveTab("rubric");
      }
    } catch (err) {
      console.error("Generate rubric error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRubric || !editingPromptText.trim()) return;
    try {
      setIsPublishingPrompt(true);
      const res = await fetch("/api/admin/studio/prompts/version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rubricTemplateId: selectedRubric.id,
          systemPrompt: editingPromptText,
          diffSummary: diffSummaryText || "Updated evaluation criteria & probing rigor.",
        }),
      });
      if (res.ok) {
        setSuccessMsg("New prompt version published to immutable audit ledger.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setDiffSummaryText("");
        await fetchPromptHistory(selectedRubric.id);
      }
    } catch (err) {
      console.error("Publish prompt error:", err);
    } finally {
      setIsPublishingPrompt(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio & Rubric Studio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AI Persona & Rubric Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Fine-tune interviewer behavioral traits, synthesize 5-point evaluation rubrics from job specs, and manage immutable prompt versions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab("persona")}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeTab === "persona"
                ? "bg-white text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Interviewer Persona
          </button>
          <button
            onClick={() => setActiveTab("rubric")}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeTab === "rubric"
                ? "bg-white text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Rubric Generator
          </button>
          <button
            onClick={() => setActiveTab("prompt")}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeTab === "prompt"
                ? "bg-white text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Prompt Version Ledger
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: INTERVIEWER PERSONA TUNING */}
      {activeTab === "persona" && persona && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSavePersona} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Interviewer "Sarah" Behavioral Calibration</span>
              </h2>

              {/* Strictness Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">Strictness & Evaluation Rigor</span>
                  <span className="text-indigo-400 font-bold">
                    Level {persona.strictnessLevel} / 5{" "}
                    {persona.strictnessLevel === 1
                      ? "(Lenient)"
                      : persona.strictnessLevel === 3
                      ? "(Standard)"
                      : persona.strictnessLevel >= 4
                      ? "(Exacting / Staff-Grade)"
                      : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={persona.strictnessLevel}
                  onChange={(e) =>
                    setPersona({ ...persona, strictnessLevel: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  Level 5 enforces rigorous edge-case questioning, Big-O complexity verifications, and algorithmic proof justifications.
                </p>
              </div>

              {/* Interruption Policy */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-300 font-medium">
                  Interruption & Follow-up Policy
                </label>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  {["CONSERVATIVE", "ADAPTIVE", "AGGRESSIVE"].map((policy) => (
                    <button
                      key={policy}
                      type="button"
                      onClick={() => setPersona({ ...persona, interruptionPolicy: policy })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        persona.interruptionPolicy === policy
                          ? "bg-indigo-950/60 border-indigo-500 text-white font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold">{policy}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {policy === "CONSERVATIVE" && "Waits >2.5s pause"}
                        {policy === "ADAPTIVE" && "Probes on high TTFT"}
                        {policy === "AGGRESSIVE" && "Cuts off tangents >45s"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cadence WPM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">Speaking Cadence (TTS)</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {persona.cadenceWordsPerMinute} Words / Min
                  </span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="200"
                  step="5"
                  value={persona.cadenceWordsPerMinute}
                  onChange={(e) =>
                    setPersona({ ...persona, cadenceWordsPerMinute: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Probing Sensitivity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">Probing Sensitivity</span>
                  <span className="text-emerald-400 font-bold">
                    {persona.probingSensitivity} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={persona.probingSensitivity}
                  onChange={(e) =>
                    setPersona({ ...persona, probingSensitivity: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-colors"
                >
                  Save Persona Parameters
                </button>
              </div>
            </form>
          </div>

          {/* Persona Live Card Preview */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Interviewer Persona: Sarah</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Autonomous Technical Evaluator</p>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300 divide-y divide-slate-800/60">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Tone:</span>
                  <span>Objective & Analytical</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Interruption:</span>
                  <span>{persona.interruptionPolicy}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Speed:</span>
                  <span>{persona.cadenceWordsPerMinute} WPM</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Rigor Level:</span>
                  <span>{persona.strictnessLevel} / 5</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 leading-relaxed">
              "Sarah will maintain high conversational empathy while strictly requiring architectural trade-off proofs and edge-case justifications."
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RUBRIC GENERATOR FROM JOB DESCRIPTION */}
      {activeTab === "rubric" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Description Input */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Job Requisition Rubric Synthesizer</span>
            </h2>

            <form onSubmit={handleGenerateRubric} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Target Requisition Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Job Description & Competencies</label>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white font-mono text-xs leading-relaxed outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? "Synthesizing 5-Dimension Rubric..." : "Generate Evaluation Rubric"}</span>
              </button>
            </form>
          </div>

          {/* Generated Rubric Display */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedRubric?.title || "Active Evaluation Rubric"}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Version {selectedRubric?.version || 1} · {selectedRubric?.dimensions?.length || 5} Weighted Dimensions
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
              {selectedRubric?.dimensions?.map((dim, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {idx + 1}. {dim.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold">
                      {dim.weight}% Weight
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{dim.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-500">
                    <div><span className="text-rose-400">1-pt (Novice):</span> {dim.score1}</div>
                    <div><span className="text-amber-400">3-pt (Competent):</span> {dim.score3}</div>
                    <div><span className="text-emerald-400">5-pt (Staff):</span> {dim.score5}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMPT VERSION CONTROL & DIFF INSPECTOR */}
      {activeTab === "prompt" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>System Prompt Editor & Release Publisher</span>
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Target: {selectedRubric?.title || "Requisition #REQ-8840"}
                </span>
              </div>

              <form onSubmit={handlePublishPrompt} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1">System Prompt Directive</label>
                  <textarea
                    rows={10}
                    value={editingPromptText}
                    onChange={(e) => setEditingPromptText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 font-mono text-xs leading-relaxed outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Diff / Release Summary</label>
                  <input
                    type="text"
                    placeholder="e.g., Added explicit probing on Saga pattern recovery vs 2PC..."
                    value={diffSummaryText}
                    onChange={(e) => setDiffSummaryText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPublishingPrompt}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {isPublishingPrompt ? "Publishing Version..." : "Publish Prompt Version"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Immutable Version Timeline */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Version History Timeline</span>
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              {promptHistory.map((ver, i) => (
                <div key={ver.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">Version {ver.version}</span>
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {ver.diffSummary || "Prompt configuration update."}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{ver.createdBy}</span>
                    <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
