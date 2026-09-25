import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Lock,
  RefreshCw,
  UserCheck,
  Layers,
  FileText,
  Sparkles
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface SetupStatusResponse {
  success: boolean;
  superAdmin: {
    email: string;
    role: string;
    isConfigured: boolean;
    hasActiveSetupToken: boolean;
    setupToken: string | null;
    department: string;
  };
  systemCounts: {
    candidates: number;
    sessions: number;
    applications: number;
  };
  zeroDeleteEnforced: boolean;
  immutableAuditRetention: string;
}

export function AdminSettings() {
  const [data, setData] = useState<SetupStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Purge Modal State
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem('ravengard_admin_token');
    try {
      const res = await fetch('/api/admin/setup-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch setup status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string, type: 'token' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleExecutePurge = async () => {
    if (confirmationInput !== 'PURGE-DEMO-DATA') {
      setPurgeError('Please type "PURGE-DEMO-DATA" in all uppercase to confirm.');
      return;
    }

    setPurging(true);
    setPurgeError(null);
    setPurgeSuccess(null);

    const token = localStorage.getItem('ravengard_admin_token');
    try {
      const res = await fetch('/api/admin/purge-demo-data', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: 'PURGE-DEMO-DATA' })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to purge demo data.');
      }

      setPurgeSuccess('All demo candidate data, test sessions, and transcripts have been successfully purged.');
      setConfirmationInput('');
      fetchStatus();
      setTimeout(() => setPurgeModalOpen(false), 2500);
    } catch (err: any) {
      setPurgeError(err.message || 'Purge failed.');
    } finally {
      setPurging(false);
    }
  };

  const setupUrl = data?.superAdmin.setupToken
    ? `${window.location.origin}/admin/login?token=${data.superAdmin.setupToken}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Super Admin Control Plane
            </span>
            <span className="text-white/40 text-xs font-mono">• Root Tenant Configuration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wide">
            Enterprise Governance & Security Settings
          </h1>
          <p className="text-xs md:text-sm text-white/60 font-light mt-1">
            Manage organization credentials, zero-delete LLM database guardrails, and production data purge controls.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Primary Super Admin Provisioning Card */}
        <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Primary Super Admin Status</h2>
              <p className="text-xs font-mono text-slate-400">Organization Head & RBAC Authority</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Account Email:</span>
              <span className="text-white font-semibold">{data?.superAdmin.email || 'madhunand@gmail.com'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Assigned Role:</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                super_admin
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Credential Status:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Initialized & Active
              </span>
            </div>

            {data?.superAdmin.hasActiveSetupToken && data.superAdmin.setupToken && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-3 mt-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <Key className="w-4 h-4 text-purple-400" /> Temporary Setup Token
                </div>
                <p className="text-[11px] text-slate-300">
                  This cryptographically generated token was created on server startup for initial super-admin credential setup:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={data.superAdmin.setupToken}
                    className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs font-mono text-purple-200"
                  />
                  <button
                    onClick={() => handleCopy(data?.superAdmin.setupToken || '', 'token')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedToken ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {setupUrl && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleCopy(setupUrl, 'link')}
                      className="text-xs font-mono text-purple-400 hover:text-purple-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Direct 1-Click Setup Link
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 2. Zero-Delete Policy & Database Safety Card */}
        <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Zero-Delete LLM Guardrail</h2>
              <p className="text-xs font-mono text-slate-400">Drizzle ORM & Middleware Safety Boundary</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed">
              <strong>Active Protection:</strong> AI models and automated background tools have ZERO capability to execute raw <code className="text-emerald-300 font-mono">DELETE</code> or destructive SQL statements. All AI queries pass through Drizzle ORM validation with hard middleware blocks.
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Soft Delete Policy:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Enforced (<code className="text-[10px]">deleted_at</code>)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Compliance Standard:</span>
              <span className="text-slate-200">DPDP / GDPR / EEOC Annex IV</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-mono">
              <span className="text-slate-400">Immutable Audit Trail:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Append-Only (<code className="text-[10px]">audit_logs</code>)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Production Transition & Data Purge Card */}
      <Card className="p-6 bg-slate-900/60 border-rose-900/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Production Data Purge Control
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  SUPER ADMIN ONLY
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Wipe dummy candidates, transcripts, resume files, and test notifications before production launch.
              </p>
            </div>
          </div>

          <button
            onClick={() => setPurgeModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-rose-950/40"
          >
            <Trash2 className="w-4 h-4" />
            Purge Demo & Dummy Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-white">{data?.systemCounts.candidates ?? '—'}</div>
            <div className="text-[11px] font-mono text-slate-400">Registered Candidates</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-white">{data?.systemCounts.sessions ?? '—'}</div>
            <div className="text-[11px] font-mono text-slate-400">Interview Sessions</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-white">{data?.systemCounts.applications ?? '—'}</div>
            <div className="text-[11px] font-mono text-slate-400">Job Applications</div>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Confirm Enterprise Data Purge</h3>
                <p className="text-xs font-mono text-rose-300">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently wipe all test candidates, interview sessions, transcripts, AI evaluations, and test notifications. 
              <strong> Job requisitions, admin accounts, and audit log history will be safely preserved.</strong>
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-mono text-slate-300 block">
                Type <span className="text-rose-400 font-bold">PURGE-DEMO-DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="PURGE-DEMO-DATA"
                className="w-full bg-black/60 border border-rose-500/40 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            {purgeError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {purgeError}
              </div>
            )}

            {purgeSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                {purgeSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setPurgeModalOpen(false);
                  setConfirmationInput('');
                  setPurgeError(null);
                }}
                disabled={purging}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePurge}
                disabled={purging || confirmationInput !== 'PURGE-DEMO-DATA'}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                {purging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {purging ? 'Purging...' : 'Execute Permanent Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
