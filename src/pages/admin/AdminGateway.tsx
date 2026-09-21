import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import SessionDetail from './SessionDetail';
import AdminLogin from './AdminLogin';
import { CandidatesPage } from './CandidatesPage';
import { CandidateDetail } from './CandidateDetail';
import { ReportsPage } from './ReportsPage';
import { FlagQueue } from './FlagQueue';
import { AtsPipeline } from './AtsPipeline';
import { ApiSettings } from '../../components/admin/ApiSettings';
import { ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminGateway() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('ravengard_admin_token');
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          localStorage.removeItem('ravengard_admin_token');
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('ravengard_admin_token');
    setIsAdmin(false);
    navigate('/admin/login', { replace: true });
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-0)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--color-secondary)] rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-white/50 tracking-widest uppercase">Verifying Admin Privileges...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: always render the strict AdminLogin screen
  if (!isAdmin) {
    return (
      <AdminLogin
        onSuccess={() => {
          setIsAdmin(true);
          navigate('/admin', { replace: true });
        }}
      />
    );
  }

  // If authenticated and user navigates directly to /admin/login, redirect to /admin
  if (location.pathname === '/admin/login') {
    return <Navigate to="/admin" replace />;
  }

  const navLinks = [
    { label: 'Candidate Ledger', path: '/admin' },
    { label: 'ATS & HR Funnel', path: '/admin/ats' },
    { label: 'All Candidates', path: '/admin/candidates' },
    { label: 'Scorecards & Reports', path: '/admin/reports' },
    { label: 'Flagged Review Queue', path: '/admin/flags' },
    { label: 'API & Integrations', path: '/admin/api-settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] text-white font-sans selection:bg-[var(--color-secondary)] selection:text-black">
      {/* Top Enterprise Navigation */}
      <header className="border-b border-white/10 px-6 py-3.5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[var(--color-secondary)] transition-colors">
                <ShieldCheck className="w-4 h-4 text-[var(--color-secondary)]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-display font-medium tracking-wider uppercase text-white">
                  Ravengard
                </span>
                <span className="px-1.5 py-0.5 bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] text-[10px] rounded border border-[var(--color-secondary)]/30 font-mono tracking-wider font-semibold">
                  ADMIN AUDIT
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white font-medium shadow-sm'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-mono"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Candidate Portal</span>
            </a>

            <div className="h-4 w-px bg-white/10" />

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-colors cursor-pointer border border-white/10"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5 text-white/40" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="p-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ats" element={<AtsPipeline />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/flags" element={<FlagQueue />} />
          <Route path="/api-settings" element={<ApiSettings />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
