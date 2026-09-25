import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const STAGE_ROUTE_MAP: Record<string, string> = {
  'welcome': '/interview/welcome',
  'consent': '/interview/consent',
  'resume': '/interview/upload',
  'resume_upload': '/interview/upload',
  'intelligence': '/interview/analysis',
  'resume_analysis': '/interview/analysis',
  'interview_instructions': '/interview/instructions',
  'instructions': '/interview/instructions',
  'device_check': '/interview/device-check',
  'waiting_room': '/interview/waiting-room',
  'interview_hr_friendly': '/interview/engine',
  'interview_technical': '/interview/engine',
  'interview_cto': '/interview/engine',
  'report_generation': '/interview/report',
  'completed': '/interview/report',
};

export function useInterviewFlow(activeSession: any, loading: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeStage = activeSession?.currentPhase || activeSession?.currentStage || 'welcome';
  const expectedRoute = STAGE_ROUTE_MAP[activeStage] || '/interview/welcome';

  const enforceFlow = useCallback(() => {
    if (loading || !activeSession) return;
    
    // Exempt non-stage routes like schedule and dashboard
    const isExempt = location.pathname === '/interview/dashboard' || location.pathname === '/interview/schedule';
    if (!isExempt && location.pathname !== expectedRoute && location.pathname.startsWith('/interview')) {
      navigate(expectedRoute, { replace: true });
    }
  }, [activeStage, loading, location.pathname, expectedRoute, navigate, !activeSession]);

  useEffect(() => {
    enforceFlow();
  }, [enforceFlow]);

  return {
    activeStage,
    expectedRoute,
    isLocked: !!activeSession?.locked
  };
}
