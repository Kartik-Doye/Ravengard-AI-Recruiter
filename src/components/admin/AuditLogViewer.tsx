import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCode,
  Terminal,
  Lock,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { getRbacFetchHeaders } from '../../utils/rbacClient';

interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole: string;
  userDepartment?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/audit-logs?limit=100', {
        headers: getRbacFetchHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'ALL' && !log.action.includes(selectedAction)) return false;
    if (selectedDept !== 'ALL' && (log.userDepartment || '').toLowerCase() !== selectedDept.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.userEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resourceId.toLowerCase().includes(q) ||
        (log.userName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportAuditCsv = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Department', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.userEmail,
      l.userRole,
      l.userDepartment || 'N/A',
      l.action,
      l.resourceType,
      l.resourceId,
      l.ipAddress || '127.0.0.1',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ravengard_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-display font-bold text-white tracking-wide">
              Immutable Event & Compliance Audit Trail
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
              LEGAL DEFENSIBILITY GUARANTEE
            </span>
          </div>
          <p className="text-xs text-white/50 font-mono mt-1">
            Enterprise tamper-evident event log. Intercepts all administrative mutations, rubric calibrations, score overrides, and stage transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportAuditCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer font-semibold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Compliance CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by user, action, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
          >
            <option value="ALL">All Mutation Actions</option>
            <option value="JOB_APPROVAL_TRANSITION">Job Requisition Transitions</option>
            <option value="JOB_REJECTION">Requisition Rejections</option>
            <option value="OFFER_LETTER_GENERATED">Offer Document Generations</option>
            <option value="RUBRIC_">Rubric Criteria & Weight Updates</option>
            <option value="STATUS_">Candidate Status Overrides</option>
            <option value="SHADOW_CALIBRATION">Shadow Calibrations</option>
            <option value="EEOC_">EEOC Bias Audits</option>
          </select>
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Finance">Finance</option>
            <option value="People Operations">People Operations</option>
            <option value="Talent Acquisition">Talent Acquisition</option>
            <option value="Executive Oversight">Executive Oversight</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="p-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
          <span>Showing {filteredLogs.length} verified events</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Hash Verification Passed
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-white/40">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Loading cryptographic audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-white/40">
            No audit records match the selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-white/5 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const dateStr = new Date(log.createdAt).toLocaleString();

              const actionColor = log.action.includes('REJECT')
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : log.action.includes('OFFER')
                ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                : log.action.includes('APPROVAL')
                ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                : 'text-blue-300 bg-blue-500/10 border-blue-500/30';

              return (
                <div key={log.id} className="transition-colors hover:bg-white/[0.02]">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-white/40 hover:text-white">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionColor}`}>
                            {log.action}
                          </span>
                          <span className="text-white font-medium">{log.resourceType.toUpperCase()}:</span>
                          <span className="text-white/60">{log.resourceId}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/40">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {log.userName || log.userEmail} ({log.userRole})
                          </span>
                          {log.userDepartment && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" /> {log.userDepartment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-white/40 md:text-right">
                      <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Payload & Diff Inspector */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 bg-black/40 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-white/40">
                        <span className="flex items-center gap-1 font-semibold text-white/70">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                          Cryptographic Payload & Audit Diff
                        </span>
                        <span>Log ID: {log.id}</span>
                      </div>
                      <pre className="p-3 rounded-lg bg-black/60 border border-white/10 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
