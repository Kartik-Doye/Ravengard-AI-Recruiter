import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useInterviewFlow, STAGE_ROUTE_MAP } from '../../hooks/useInterviewFlow';

interface ProtectedRouteProps {
  children: React.ReactNode;
  activeSession: any;
  loading: boolean;
  allowedStage: string | string[]; // Which stage(s) is this route for
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  activeSession, 
  loading, 
  allowedStage 
}) => {
  const { activeStage, expectedRoute } = useInterviewFlow(activeSession, loading);

  if (loading) {
    return null; // Let the parent component handle loading state
  }

  const isAllowed = Array.isArray(allowedStage) 
    ? allowedStage.includes(activeStage)
    : allowedStage === activeStage;

  if (!isAllowed) {
    return <Navigate to={expectedRoute} replace />;
  }

  return <>{children}</>;
};
