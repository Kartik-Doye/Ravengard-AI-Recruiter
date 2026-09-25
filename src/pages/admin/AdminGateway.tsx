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
import { JobsPage } from './JobsPage';
import { JobApprovalGate } from './JobApprovalGate';
import { AdminTelemetryDashboard } from './AdminTelemetryDashboard';
import { ApiSettings } from '../../components/admin/ApiSettings';
import { AdminSettings } from './AdminSettings';
import { ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Verifying Admin Privileges...</span>
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

  return (
    <AdminLayout
      title="Ravengard"
      badge="ADMIN AUDIT"
      onLogout={handleLogout}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobApprovalGate />} />
          <Route path="/ats" element={<AtsPipeline />} />
          <Route path="/telemetry" element={<AdminTelemetryDashboard />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/flags" element={<FlagQueue />} />
          <Route path="/api-settings" element={<ApiSettings />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </AdminLayout>
  );
}
