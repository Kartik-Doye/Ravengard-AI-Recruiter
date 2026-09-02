import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const STAGE_ROUTE_MAP: Record<string, string> = {
  'welcome': '/interview/welcome',
  'consent': '/interview/consent',
  'resume': '/interview/upload',
  'resume_upload': '/interview/upload',
  'intelligence': '/interview/analysis',
  'resume_analysis': '/interview/analysis',
  'device_check': '/interview/device-check',
  'waiting_room': '/interview/waiting-room',
  'interview_hr_friendly': '/interview/engine',
  'interview_technical': '/interview/engine',
  'interview_cto': '/interview/engine',
  'report_generation': '/interview/report',

};

export function useInterviewFlow(activeSession: any, loading: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeStage = activeSession?.currentPhase || activeSession?.currentStage || 'welcome';
  const expectedRoute = STAGE_ROUTE_MAP[activeStage] || '/interview/welcome';

  const enforceFlow = useCallback(() => {
    if (loading || !activeSession) return;
    
    // If we're on a route that doesn't match our allowed stage, redirect
    if (location.pathname !== expectedRoute && location.pathname.startsWith('/interview')) {
      navigate(expectedRoute, { replace: true });
    }
  }, [activeSession, loading, location.pathname, expectedRoute, navigate]);

  useEffect(() => {
    enforceFlow();
  }, [enforceFlow]);

  return {
    activeStage,
    expectedRoute,
    isLocked: !!activeSession?.locked
  };
}
