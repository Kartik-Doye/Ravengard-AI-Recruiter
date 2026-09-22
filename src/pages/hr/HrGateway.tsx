import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import HrLogin from './HrLogin';
import HrAtsPipeline from './HrAtsPipeline';
import HrCandidateDossier from './HrCandidateDossier';
import HrComparisonMatrix from './HrComparisonMatrix';
import {
  Building2,
  LogOut,
  ArrowLeft,
  LayoutDashboard,
  Briefcase,
  Users,
  GitCompare,
  Key,
  Shield,
} from 'lucide-react';

interface HrUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export default function HrGateway() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hrUser, setHrUser] = useState<HrUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('ravengard_hr_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await fetch('/api/hr/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setHrUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('ravengard_hr_token');
        localStorage.removeItem('ravengard_hr_user');
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('ravengard_hr_token');
    localStorage.removeItem('ravengard_hr_user');
    setIsAuthenticated(false);
    setHrUser(null);
    navigate('/hr/login', { replace: true });
  };

  const handleLoginSuccess = () => {
    const stored = localStorage.getItem('ravengard_hr_user');
    if (stored) {
      try {
        setHrUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setIsAuthenticated(true);
    navigate('/hr', { replace: true });
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-white/50 tracking-widest uppercase">
            Verifying HR Portal Access...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated
  if (!isAuthenticated) {
    return <HrLogin onSuccess={handleLoginSuccess} />;
  }

  // Redirect from /hr/login if already authed
  if (location.pathname === '/hr/login') {
    return <Navigate to="/hr" replace />;
  }

  const navLinks = [
    { label: 'ATS Pipeline', path: '/hr', icon: LayoutDashboard },
    { label: 'Job Postings', path: '/hr/jobs', icon: Briefcase },
    { label: 'Comparison', path: '/hr/comparison', icon: GitCompare },
    { label: 'API & Integrations', path: '/hr/integrations', icon: Key },
  ];

  const roleBadgeColors: Record<string, string> = {
    hr_admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    hr_user: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    recruiter: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    hiring_manager: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    super_admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const roleBadge = roleBadgeColors[hrUser?.role || ''] || 'bg-white/10 text-white/60 border-white/20';

  return (
    <div className="min-h-screen bg-[#090D16] text-white font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/8 px-6 py-3 bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-6">
            {/* Brand */}
            <Link to="/hr" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center group-hover:border-blue-400/40 transition-colors">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-display font-semibold tracking-wider uppercase text-white">
                  Ravengard
                </span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded border font-mono tracking-wider font-bold ${roleBadge}`}>
                  {(hrUser?.role || 'HR').replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.path === '/hr'
                    ? location.pathname === '/hr' || location.pathname === '/hr/'
                    : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/20'
                        : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Org indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-mono">
              <Shield className="w-3 h-3" />
              <span>{hrUser?.organizationId || 'org-ravengard'}</span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* User info */}
            <span className="text-xs text-white/50 font-mono hidden sm:inline">
              {hrUser?.email}
            </span>

            <div className="h-4 w-px bg-white/10" />

            {/* Public site link */}
            <a
              href="/"
              className="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-white/60 transition-colors font-mono"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Site</span>
            </a>

            <div className="h-4 w-px bg-white/10" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-300 text-xs font-mono transition-all cursor-pointer border border-white/8 hover:border-red-500/20"
              title="Sign out of HR Session"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6 max-w-[1440px] mx-auto">
        <Routes>
          <Route path="/" element={<HrAtsPipeline />} />
          <Route path="/jobs" element={<HrJobsPlaceholder />} />
          <Route path="/candidates/:id" element={<HrCandidateDossier />} />
          <Route path="/comparison" element={<HrComparisonMatrix />} />
          <Route path="/integrations" element={<HrIntegrationsPlaceholder />} />
          <Route path="*" element={<Navigate to="/hr" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Temporary placeholder for jobs page — will reuse existing admin JobsPage
 * with HR tenant scoping.
 */
function HrJobsPlaceholder() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ravengard_hr_token');
    fetch('/api/hr/jobs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-white">Job Postings</h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            {jobs.length} active posting{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.map((job: any) => (
          <div
            key={job.id}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-blue-500/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                <p className="text-xs text-white/40 font-mono mt-0.5">{job.department || 'General'}</p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  job.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                {job.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-white/30 mt-2 line-clamp-2">{job.description}</p>
            <div className="flex gap-3 mt-3 text-[10px] font-mono text-white/30">
              <span>Total: {job.metrics?.total || 0}</span>
              <span>Shortlisted: {job.metrics?.shortlisted || 0}</span>
              <span>Completed: {job.metrics?.completed || 0}</span>
              <span>Recommended: {job.metrics?.recommended || 0}</span>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm font-mono">
            No job postings yet. Create one from the admin panel.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Integrations page — wraps existing ApiSettings component for HR.
 */
function HrIntegrationsPlaceholder() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-display font-bold text-white">API & Integrations</h1>
        <p className="text-xs text-white/40 font-mono mt-1">
          Manage API keys and ATS integrations for your organization
        </p>
      </div>
      <div className="text-center py-12 text-white/30 text-sm font-mono">
        Use the API settings from the admin panel to manage integrations and API keys.
      </div>
    </div>
  );
}
