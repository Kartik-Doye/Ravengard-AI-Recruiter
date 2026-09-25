import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  badge?: string;
  navLinks?: Array<{ label: string; path: string }>;
  onLogout?: () => void;
  showBackToHome?: boolean;
}

export function AdminLayout({
  children,
  title = 'Ravengard',
  badge = 'ADMIN AUDIT',
  navLinks,
  onLogout,
  showBackToHome = true,
}: AdminLayoutProps) {
  const location = useLocation();

  const defaultLinks = [
    { label: 'Job Openings', path: '/admin/jobs' },
    { label: 'Candidate Ledger', path: '/admin' },
    { label: 'ATS & HR Funnel', path: '/admin/ats' },
    { label: 'Telemetry & Governance', path: '/admin/telemetry' },
    { label: 'All Candidates', path: '/admin/candidates' },
    { label: 'Scorecards & Reports', path: '/admin/reports' },
    { label: 'Flagged Review Queue', path: '/admin/flags' },
    { label: 'API & Integrations', path: '/admin/api-settings' },
    { label: 'Settings & Security', path: '/admin/settings' },
  ];

  const links = navLinks || defaultLinks;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-white/20 selection:text-white flex flex-col relative">
      {/* Subtle ambient lighting matching homepage */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-[radial-gradient(circle_at_top,rgba(120,140,255,0.08),transparent_60%)] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 px-6 py-3.5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center group-hover:border-white/30 transition-colors shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold tracking-wider uppercase text-slate-100">
                  {title}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-900/80 text-slate-300 text-[10px] rounded-full border border-slate-800 font-mono tracking-wider font-semibold">
                  {badge}
                </span>
              </div>
            </Link>

            {links.length > 0 && (
              <nav className="hidden md:flex items-center gap-1.5 text-xs font-mono">
                {links.map((link) => {
                  const isActive =
                    link.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-slate-950 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showBackToHome && (
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </Link>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 font-mono px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">{children}</main>
    </div>
  );
}

export default AdminLayout;
