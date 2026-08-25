import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Landing from './../components/Landing.tsx';
import Registration from './../components/Registration.tsx';
import Welcome from './../components/Welcome.tsx';
import Consent from './../components/Consent.tsx';
import ResumeUpload from './../components/ResumeUpload.tsx';
import ResumeAnalysis from './../components/ResumeAnalysis.tsx';
import InterviewInstructions from './../components/InterviewInstructions.tsx';
import DeviceCheck from './../components/DeviceCheck.tsx';
import WaitingRoom from './../components/WaitingRoom.tsx';
import Interview from './../components/Interview.tsx';
import Dashboard from './../components/Dashboard.tsx';
import Layout from './../components/Layout.tsx';
import ErrorBoundary from './../components/ErrorBoundary.tsx';
import CommandPalette from './../components/CommandPalette.tsx';
import { Skeleton } from './../components/ui/Skeleton.tsx';
import { ApiTimeoutFallback } from "../components/layout/ApiTimeoutFallback";
import { useToast } from './../contexts/ToastContext.tsx';

import { ProtectedRoute } from '../components/interview/ProtectedRoute';
import { STAGE_ROUTE_MAP, useInterviewFlow } from '../hooks/useInterviewFlow';


export default function InterviewGateway() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isTimeout, setIsTimeout] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'session'>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(() => {
    return (localStorage.getItem('ravengard_theme') as any) || 'light';
  });
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'high-contrast');
    document.documentElement.classList.add(theme);
    localStorage.setItem('ravengard_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeSession?.locked && activeSession?.status === 'in_progress') {
      setCurrentView('session');
    }
  }, [activeSession]);

  useEffect(() => {
    const uid = localStorage.getItem('ravengard_uid');
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); setIsTimeout(true); }, 8000);
      const res = await fetch('/api/me', {
        signal: controller.signal,
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
            addToast('info', 'Session resumed.');
          } else {
            setCurrentView('dashboard');
          }
        } else if (data.activeSession?.status === 'abandoned' && activeSession?.status === 'in_progress') {
            setCurrentView('dashboard');
            addToast('error', 'Session was abandoned by the system.');
        }
      } else {
        if (!silent) setCandidate(null);
      }
    } catch (e) {
      console.error("Failed to fetch user data", e);
      if (!silent) addToast('error', 'Failed to fetch user data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    let uid = localStorage.getItem('ravengard_uid');
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('ravengard_uid', uid);
      addToast('success', 'Account created successfully.');
    } else {
      addToast('success', 'Signed in successfully.');
    }
    setUser(uid);
    await fetchCandidateData(uid);
  };

  
  const { activeStage } = useInterviewFlow(currentView === 'session' ? activeSession : null, loading || !user || !candidate || currentView === 'dashboard');

  if (isTimeout) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-0)] justify-center">
        <ApiTimeoutFallback onRetry={() => { setIsTimeout(false); fetchCandidateData(user || ""); }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-0)]">
        <div className="h-16 bg-[var(--color-bg-1)] border-b border-[var(--color-glass-highlight)] flex items-center px-6">
          <Skeleton variant="rectangular" width={32} height={32} />
          <Skeleton variant="text" width={120} height={24} className="ml-4" />
        </div>
        <div className="flex-1 p-8 max-w-[800px] w-full mx-auto">
          <Skeleton variant="text" width="40%" height={40} className="mb-4" />
          <Skeleton variant="text" width="60%" height={24} className="mb-10" />
          <div className="glass-panel p-8 rounded-xl space-y-6">
            <div className="flex gap-4 items-start">
              <Skeleton variant="circular" width={48} height={48} className="shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} />
              </div>
            </div>
            <Skeleton variant="rectangular" width="25%" height={40} className="mt-4" />
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
        <Registration user={user} onComplete={(uid) => {
          addToast('success', 'Profile completed.');
          fetchCandidateData(uid);
        }} />
      </Layout>
    );
  }

  const handleBackStep = async () => {
    if (!activeSession) return;
    const flowStages = ['welcome', 'consent', 'resume', 'resume_analysis', 'instructions', 'device_check', 'waiting_room', 'interview_hr_friendly'];
    const currentIndex = flowStages.indexOf(activeStage);
    
    if (currentIndex > 0) {
      const prevStage = flowStages[currentIndex - 1];
      
      try {
        const token = localStorage.getItem('ravengard_uid');
        const res = await fetch(`/api/session/${activeSession.id}/stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ stage: prevStage, version: activeSession.version })
        });
        
        if (!res.ok) {
          const data = await res.json();
          addToast('error', data.error || 'Failed to go back');
        } else {
          const updated = await res.json();
          setActiveSession(updated);
        }
      } catch (e) {
        addToast('error', 'Network error changing stage');
      }
    }
  };

  const displayStage = currentView === 'dashboard' ? 'dashboard' : activeStage;

  return (
    <ErrorBoundary>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen} 
        onNavigate={(view: any) => {
          if (view === 'dashboard' && activeSession?.locked && activeSession?.status === 'in_progress') {
            setCurrentView('session');
            addToast('info', 'Switched to active session.');
          } else if (view === 'dashboard') {
            setCurrentView('dashboard');
            addToast('info', 'Switched to dashboard.');
          } else {
            addToast('error', 'Navigation to ' + view + ' is part of Phase 2!');
          }
        }}
        onThemeChange={(newTheme: any) => {
          setTheme(newTheme);
          addToast('success', `Theme changed to ${newTheme}`);
        }}
      />
      
      <Layout 
        candidate={candidate} 
        session={activeSession} 
        currentStageName={displayStage}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onPauseSession={() => setCurrentView('dashboard')}
        onBackStep={activeStage !== 'welcome' ? handleBackStep : undefined}
      >
        {currentView === 'dashboard' ? (
          <Dashboard
            candidate={candidate}
            session={activeSession}
            resumeText={resumeText}
            onResumeSession={() => {
              setCurrentView('session');
              addToast('info', 'Resuming session...');
            }}
          />
        ) : (
          <Routes>
             <Route path="welcome" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="welcome"><Welcome onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} candidate={candidate} /></ProtectedRoute>} />
             <Route path="consent" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="consent"><Consent session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="upload" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="resume"><ResumeUpload session={activeSession} onNext={(session, text) => { setActiveSession(session); if (text) setResumeText(text); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="analysis" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage={["resume_analysis", "intelligence"]}><ResumeAnalysis session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="instructions" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="instructions"><InterviewInstructions session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="device-check" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="device_check"><DeviceCheck session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="waiting" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="waiting_room"><WaitingRoom session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="active" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="interview_hr_friendly"><Interview session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('dashboard'); addToast('success', 'Interview session complete!'); }} /></ProtectedRoute>} />
             <Route path="*" element={<Navigate to={STAGE_ROUTE_MAP[activeStage] || "/interview/welcome"} replace />} />
          </Routes>
        )}
      </Layout>
    </ErrorBoundary>
  );
}
