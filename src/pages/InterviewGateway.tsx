import { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Landing from './../components/Landing.tsx';
import Registration from './../components/Registration.tsx';
import Welcome from './../components/Welcome.tsx';
import Consent from './../components/Consent.tsx';
import ResumeUpload from './../components/ResumeUpload.tsx';
import ResumeAnalysis from './../components/ResumeAnalysis.tsx';
import InterviewInstructions from './../components/InterviewInstructions.tsx';
import DeviceCheck from './../components/DeviceCheck.tsx';

import InterviewEngine from "./InterviewEngine";
import WaitingRoom from './WaitingRoom.tsx';
import FinalReport from './FinalReport';
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
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isInterviewSubRoute = location.pathname.startsWith('/interview/') && location.pathname !== '/interview/dashboard';
  const initialStage = location.pathname.includes('/consent') ? 'consent' : 'welcome';
  const [preSessionStage, setPreSessionStage] = useState<'welcome' | 'consent'>(initialStage);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'session'>(() => isInterviewSubRoute ? 'session' : 'dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Flag to ensure session resumption toast executes exactly once across mounts/renders
  const hasRestoredRef = useRef(false);
  
  useEffect(() => {
    if (activeSession?.locked && activeSession?.status === 'active') {
      setCurrentView('session');
      if (!hasRestoredRef.current) {
        hasRestoredRef.current = true;
        addToast('info', 'Resuming session...');
      }
    }
  }, [activeSession?.id, activeSession?.locked, activeSession?.status]);

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
    if (!user || !candidate) return;
    const interval = setInterval(() => {
      fetchCandidateData(user, true); // silent fetch
    }, 60000); 
    return () => clearInterval(interval);
  }, [user, candidate?.id]);

  const fetchCandidateData = async (uid: string, silent = false) => {
    let timeoutId: any;
    try {
      if (!silent) setLoading(true);
      const controller = new AbortController();
      timeoutId = setTimeout(() => { controller.abort(); if (!silent) setIsTimeout(true); }, 600000);
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
          if (data.activeSession?.locked && data.activeSession?.status === 'active') {
            setCurrentView('session');
            if (!hasRestoredRef.current) {
              hasRestoredRef.current = true;
              addToast('info', 'Resuming session...');
            }
          } else if (location.pathname.startsWith('/interview/') && location.pathname !== '/interview/dashboard') {
            setCurrentView('session');
          } else {
            setCurrentView('dashboard');
          }
        } else if (data.activeSession?.status === 'abandoned' && activeSession?.status === 'active') {
            setCurrentView('dashboard');
            addToast('error', 'Session was abandoned by the system.');
        }
      } else {
        if (!silent) setCandidate(null);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Failed to fetch user data", e);
        if (!silent) addToast('error', 'Failed to fetch user data');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (!silent) setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    let token = localStorage.getItem('ravengard_uid');
    
    if (!token) {
      try {
        const res = await fetch('/api/auth/candidate-mock-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: `test-${crypto.randomUUID().slice(0,8)}@example.com`, name: 'Test Candidate' })
        });
        const data = await res.json();
        if (data.success && data.token) {
          token = data.token;
          localStorage.setItem('ravengard_uid', token);
          addToast('success', 'Account created successfully.');
        } else {
           addToast('error', 'Login failed');
           setLoading(false);
           return;
        }
      } catch(e) {
          addToast('error', 'Login failed');
          setLoading(false);
          return;
      }
    } else {
      addToast('success', 'Signed in successfully.');
    }
    
    setUser(token);
    await fetchCandidateData(token);
  };

  
  const effectiveSession = useMemo(() => {
    if (activeSession) return activeSession;
    return { currentStage: preSessionStage, currentPhase: preSessionStage, locked: false, status: 'pending' };
  }, [activeSession, preSessionStage]);
  
  const { activeStage } = useInterviewFlow(
    currentView === 'session' ? effectiveSession : null,
    loading || !user || !candidate || currentView === 'dashboard'
  );

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
    const flowStages = ['welcome', 'consent', 'resume', 'resume_analysis'];
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
          if (view === 'dashboard' && activeSession?.locked && activeSession?.status === 'active') {
            setCurrentView('session');
            addToast('info', 'Switched to active session.');
          } else if (view === 'dashboard') {
            setCurrentView('dashboard');
            addToast('info', 'Switched to dashboard.');
          } else {
            addToast('error', 'Navigation to ' + view + ' is part of Phase 2!');
          }
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
              if (!hasRestoredRef.current) {
                hasRestoredRef.current = true;
                addToast('info', 'Resuming session...');
              }
            }}
          />
        ) : (
          <Routes>
             <Route path="welcome" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage="welcome"><Welcome onNext={(session) => { if(session.currentStage === 'consent') setPreSessionStage('consent'); else setActiveSession(session); setCurrentView('session'); }} candidate={candidate} /></ProtectedRoute>} />
             <Route path="consent" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage="consent"><Consent session={effectiveSession} onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="upload" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage={["resume", "resume_upload"]}><ResumeUpload session={activeSession} onNext={(session, text) => { setActiveSession(session); if (text) setResumeText(text); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="analysis" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage={["resume_analysis", "intelligence"]}><ResumeAnalysis session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="device-check" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage="device_check"><DeviceCheck session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="waiting-room" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage="waiting_room"><WaitingRoom session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="engine" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage={["interview_hr_friendly", "interview_technical", "interview_cto"]}><InterviewEngine session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="report" element={<ProtectedRoute activeSession={effectiveSession} loading={loading} allowedStage={["report_generation", "completed"]}><FinalReport session={activeSession} /></ProtectedRoute>} />
             <Route path="*" element={<Navigate to={STAGE_ROUTE_MAP[activeStage] || "/interview/welcome"} replace />} />
          </Routes>
        )}
      </Layout>
    </ErrorBoundary>
  );
}
