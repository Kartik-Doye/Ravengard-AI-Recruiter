import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export interface SkillMetric {
  subject: string;
  score: number;
  benchmark: number;
  fullMark: number;
}

export interface ProgressHistoryPoint {
  stage: string;
  date: string;
  score: number;
  timeSpentMinutes: number;
}

export interface CompetencyDimension {
  dimension: string;
  score: number;
  target: number;
  category: string;
}

export interface CandidateMetricsVisualizationProps {
  candidateName?: string;
  activeJobTitle?: string;
  mcqScore?: number | null;
  interviewScore?: number | null;
  aiOverallScore?: number | null;
  skillMetrics?: SkillMetric[];
  progressHistory?: ProgressHistoryPoint[];
  competencyDimensions?: CompetencyDimension[];
}

const DEFAULT_SKILL_METRICS: SkillMetric[] = [
  { subject: 'System Design', score: 92, benchmark: 80, fullMark: 100 },
  { subject: 'Distributed Systems', score: 88, benchmark: 75, fullMark: 100 },
  { subject: 'PostgreSQL & DB', score: 95, benchmark: 80, fullMark: 100 },
  { subject: 'Cloud & Security', score: 86, benchmark: 70, fullMark: 100 },
  { subject: 'Communication', score: 89, benchmark: 75, fullMark: 100 },
  { subject: 'AI & Engineering', score: 91, benchmark: 80, fullMark: 100 },
];

const DEFAULT_PROGRESS_HISTORY: ProgressHistoryPoint[] = [
  { stage: 'Resume Audit', date: 'Sep 20', score: 94, timeSpentMinutes: 5 },
  { stage: 'Adaptive MCQ', date: 'Sep 22', score: 92, timeSpentMinutes: 42 },
  { stage: 'Voice Probing', date: 'Sep 25', score: 88, timeSpentMinutes: 28 },
  { stage: 'System Design', date: 'Sep 28', score: 95, timeSpentMinutes: 35 },
  { stage: 'Final Review', date: 'Oct 01', score: 93, timeSpentMinutes: 20 },
];

const DEFAULT_COMPETENCY_DIMENSIONS: CompetencyDimension[] = [
  { dimension: 'Technical Depth', score: 94, target: 85, category: 'Engineering' },
  { dimension: 'Problem Solving', score: 91, target: 80, category: 'Analytics' },
  { dimension: 'Communication', score: 88, target: 75, category: 'Soft Skills' },
  { dimension: 'System Design', score: 95, target: 85, category: 'Architecture' },
  { dimension: 'Reliability', score: 86, target: 80, category: 'Ops' },
];

// Custom Dark Tooltip Component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
        <p className="font-bold text-white mb-1 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CandidateMetricsVisualization: React.FC<CandidateMetricsVisualizationProps> = ({
  candidateName = 'Alex Chen',
  activeJobTitle = 'Senior Full-Stack AI Engineer',
  mcqScore = 92,
  interviewScore = 91,
  aiOverallScore = 93,
  skillMetrics = DEFAULT_SKILL_METRICS,
  progressHistory = DEFAULT_PROGRESS_HISTORY,
  competencyDimensions = DEFAULT_COMPETENCY_DIMENSIONS,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'progress' | 'competencies'>('radar');

  const overallPercent = aiOverallScore || 93;

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-slate-100 relative overflow-hidden">
      {/* Background Accent Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-white/10 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Analytics & Assessment Metrics</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Skill Mastery & Interview Velocity</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
              Verified
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {candidateName} · {activeJobTitle}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Skill Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interview Velocity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('competencies')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'competencies'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Competencies</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 relative z-10">
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Overall AI Score
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{overallPercent}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              MCQ Adaptive Test
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-300">
              {mcqScore ? `${mcqScore}%` : 'Passed'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Live Probing Score
            </span>
            <span className="text-2xl font-bold font-mono text-blue-300">
              {interviewScore ? `${interviewScore}%` : '91%'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Data Visualization Chart Area */}
      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 relative z-10">
        {activeTab === 'radar' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Skill Mastery Radar</h3>
                <p className="text-xs text-slate-400">
                  Candidate performance compared against Ravengard benchmark standard (80%)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  Candidate Score
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                  Benchmark Standard
                </span>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillMetrics}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar
                    name="Candidate Score"
                    dataKey="score"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="benchmark"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.2}
                    strokeDasharray="4 4"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Interview Progression & Velocity</h3>
                <p className="text-xs text-slate-400">
                  Sequential stage scores and evaluation duration across the recruitment funnel
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="stage" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis domain={[60, 100]} stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Stage Score"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'competencies' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Competency Benchmark Comparison</h3>
                <p className="text-xs text-slate-400">
                  Granular breakdown of evaluation dimensions vs role targets
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competencyDimensions} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dimension" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                  <Bar dataKey="score" name="Candidate Score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target" name="Target Benchmark" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight Banner */}
      <div className="mt-5 p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/20 flex items-center justify-between text-xs text-slate-300 relative z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Candidate demonstrates top <strong className="text-white font-mono">5%</strong> performance in System Architecture & Database Engineering.
          </span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-semibold hidden sm:inline-block">
          STATUS: EXCEEDS BENCHMARK
        </span>
      </div>
    </div>
  );
};

export default CandidateMetricsVisualization;
