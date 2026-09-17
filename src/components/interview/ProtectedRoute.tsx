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
  const location = useLocation();
  const { activeStage, expectedRoute } = useInterviewFlow(activeSession, loading);

  if (loading) {
    return null; // Let the parent component handle loading state
  }

  const isAllowed = Array.isArray(allowedStage) 
    ? allowedStage.includes(activeStage)
    : allowedStage === activeStage;

  if (!isAllowed) {
    if (location.pathname === expectedRoute) {
      // Prevent infinite loop if the expected route itself rejects the stage
      return <div className="p-8 text-center text-red-500">Error: Invalid stage transition detected.</div>;
    }
    return <Navigate to={expectedRoute} replace />;
  }

  return <>{children}</>;
};
