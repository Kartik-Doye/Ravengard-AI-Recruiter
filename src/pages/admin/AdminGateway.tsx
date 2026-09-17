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
      <div className="min-h-screen bg-[var(--color-bg-0)] flex flex-col items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-md w-full border border-white/10 rounded-xl">
          <h2 className="text-2xl font-display text-white mb-6 text-center tracking-wider uppercase">Admin Portal</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            const password = (form.elements.namedItem('password') as HTMLInputElement).value;
            
            try {
              const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              if (res.ok) {
                const data = await res.json();
                localStorage.setItem('ravengard_uid', data.token);
                setIsAdmin(true);
              } else {
                alert('Invalid credentials');
              }
            } catch (err) {
              alert('Login failed');
            }
          }} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2 uppercase tracking-widest">Email</label>
              <input type="email" name="email" defaultValue="admin@ravengard.com" required className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-[var(--color-secondary)] transition-colors" />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2 uppercase tracking-widest">Password</label>
              <input type="password" name="password" defaultValue="admin123" required className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 rounded focus:outline-none focus:border-[var(--color-secondary)] transition-colors" />
            </div>
            <button type="submit" className="w-full mt-4 bg-white text-black font-semibold py-3 px-4 rounded hover:bg-white/90 transition-colors uppercase tracking-widest text-sm">Authenticate</button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-white/40 text-xs hover:text-white/80 transition-colors">Return to Home</a>
          </div>
        </div>
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
