/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Landing from './components/Landing.tsx';
import Registration from './components/Registration.tsx';
import Welcome from './components/Welcome.tsx';
import Consent from './components/Consent.tsx';
import ResumeUpload from './components/ResumeUpload.tsx';
import ResumeAnalysis from './components/ResumeAnalysis.tsx';
import InterviewInstructions from './components/InterviewInstructions.tsx';
import DeviceCheck from './components/DeviceCheck.tsx';
import WaitingRoom from './components/WaitingRoom.tsx';
import Interview from './components/Interview.tsx';
import Dashboard from './components/Dashboard.tsx';
import Layout from './components/Layout.tsx';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import CommandPalette from './components/CommandPalette.tsx';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'session'>('dashboard');

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(() => {
    return (localStorage.getItem('traineer_theme') as any) || 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'high-contrast');
    document.documentElement.classList.add(theme);
    localStorage.setItem('traineer_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeSession?.locked && activeSession?.status === 'in_progress') {
      setCurrentView('session');
    }
  }, [activeSession]);

  useEffect(() => {
    const uid = localStorage.getItem('traineer_uid');
    if (uid) {
      setUser(uid);
      fetchCandidateData(uid);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchCandidateData(user, true); // silent fetch
    }, 10000); // Polling every 10 seconds for real-time like experience
    return () => clearInterval(interval);
  }, [user]);

  const fetchCandidateData = async (uid: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidate(data.candidate);
        setActiveSession(data.activeSession);
        setResumeText(data.resumeText || null);
        
        if (!silent) {
          if (data.activeSession?.locked && data.activeSession?.status === 'in_progress') {
            setCurrentView('session');
          } else {
            setCurrentView('dashboard');
          }
        } else if (data.activeSession?.status === 'abandoned' && activeSession?.status === 'in_progress') {
            setCurrentView('dashboard');
        }
      } else {
        if (!silent) setCandidate(null);
      }
    } catch (e) {
      console.error("Failed to fetch user data", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    let uid = localStorage.getItem('traineer_uid');
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('traineer_uid', uid);
    }
    setUser(uid);
    await fetchCandidateData(uid);
  };


  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="w-24 h-6 bg-slate-200 rounded ml-4 animate-pulse"></div>
        </div>
        <div className="flex-1 p-8 max-w-[800px] w-full mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-10 animate-pulse"></div>
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0 animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-slate-200 rounded w-1/4 mt-4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing onSignIn={handleSignIn} />;
  }

  if (!candidate) {
    return (
      <Layout currentStageName="registration">
        <Registration user={user} onComplete={fetchCandidateData} />
      </Layout>
    );
  }

  const activeStage = activeSession?.currentStage || 'welcome';
  const displayStage = currentView === 'dashboard' ? 'dashboard' : activeStage;

  return (
    <ErrorBoundary>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen} 
        onNavigate={(view: any) => {
          if (view === 'dashboard' && activeSession?.locked && activeSession?.status === 'in_progress') {
            setCurrentView('session');
          } else if (view === 'dashboard') {
            setCurrentView('dashboard');
          } else {
            alert('Navigation to ' + view + ' is part of Phase 2!');
          }
        }}
        onThemeChange={(newTheme: any) => setTheme(newTheme)}
      />
      <Layout 
        candidate={candidate} 
        session={activeSession} 
        currentStageName={displayStage}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onPauseSession={() => setCurrentView('dashboard')}
      >
        {currentView === 'dashboard' ? (
          <Dashboard
            candidate={candidate}
            session={activeSession}
            resumeText={resumeText}
            onResumeSession={() => setCurrentView('session')}
          />
        ) : (
          <>
            {!activeSession || activeStage === 'welcome' ? (
              <Welcome onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} candidate={candidate} />
            ) : activeStage === 'consent' ? (
              <Consent session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} />
) : activeStage === 'resume' ? (
              <ResumeUpload session={activeSession} onNext={(session, text) => { 
                 setActiveSession(session); 
                 if (text) setResumeText(text);
                setCurrentView('session'); 
               }} />
            ) : activeStage === 'resume_analysis' ? (
              <ResumeAnalysis session={activeSession} onNext={(session) => { setActiveSession(session); }} />
            ) : activeStage === 'instructions' ? (
              <InterviewInstructions session={activeSession} onNext={(session) => { setActiveSession(session); }} />
            ) : activeStage === 'device_check' ? (
              <DeviceCheck session={activeSession} onNext={(session) => { setActiveSession(session); }} />
            ) : activeStage === 'waiting_room' ? (
              <WaitingRoom session={activeSession} onNext={(session) => { setActiveSession(session); }} />
            ) : activeStage === 'interview' || activeStage.startsWith('interview_') ? (
              <Interview session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('dashboard'); }} />
            ) : (
              <Dashboard 
                candidate={candidate} 
                session={activeSession} 
                resumeText={resumeText}
                onResumeSession={() => setCurrentView('session')} 
              />
            )}
          </>
        )}
      </Layout>
    </ErrorBoundary>
  );
}

