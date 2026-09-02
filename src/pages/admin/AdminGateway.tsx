import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import SessionDetail from './SessionDetail';

export default function AdminGateway() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('ravengard_uid');
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-0)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-[var(--color-secondary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-0)] flex flex-col items-center justify-center text-center p-6">
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <h2 className="text-2xl font-display text-white mb-2">Restricted Area</h2>
        <p className="text-white/50 mb-6 max-w-md">You do not have the required administrative privileges to view this dashboard.</p>
        <a href="/" className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors">Return to Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] text-white font-sans">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display tracking-widest uppercase text-white">Ravengard</h1>
          <span className="px-2 py-1 bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] text-xs rounded border border-[var(--color-secondary)]/30 font-mono">ADMIN</span>
        </div>
        <a href="/" className="text-sm text-white/50 hover:text-white transition-colors">Exit Dashboard</a>
      </nav>
      <div className="p-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
