import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

export const flowRouteMap: Record<string, string> = {
  'welcome': '/interview/welcome',
  'consent': '/interview/consent',
  'resume': '/interview/upload',
  'resume_analysis': '/interview/analysis',
  'instructions': '/interview/instructions',
  'device_check': '/interview/device-check',
  'waiting_room': '/interview/waiting',
  'interview_hr_friendly': '/interview/active',
  'completed': '/interview/report'
};

export function CandidateFlowGuard({ activeSession, loading }: { activeSession: any, loading: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!activeSession) {
      // If no session, candidate should start at welcome
      if (location.pathname !== '/interview/welcome' && location.pathname !== '/interview/register') {
        navigate('/interview/welcome', { replace: true });
      }
      return;
    }

    const currentPhase = activeSession.currentPhase || activeSession.currentStage || 'welcome';
    const targetRoute = flowRouteMap[currentPhase] || '/interview/welcome';
    
    // Check if the current route matches the expected target route for the phase
    if (location.pathname !== targetRoute) {
      // Specifically allow dashboard anytime
      if (location.pathname === '/interview/dashboard') return;
      
      // Auto-advance/correct route to enforce state machine
      addToast('info', 'Routing to current phase...');
      navigate(targetRoute, { replace: true });
    }
  }, [activeSession, location.pathname, loading, navigate, addToast]);

  if (loading) {
    return null; // Gateway handles the loader
  }

  return <Outlet />;
}
