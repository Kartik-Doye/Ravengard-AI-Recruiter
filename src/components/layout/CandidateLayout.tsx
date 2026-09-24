import React from 'react';
import Layout from '../Layout';

export interface CandidateLayoutProps {
  children: React.ReactNode;
  candidate?: any;
  session?: any;
  currentStageName?: string;
  onOpenCommandPalette?: () => void;
  onPauseSession?: () => void;
  onBackStep?: () => void;
}

export function CandidateLayout(props: CandidateLayoutProps) {
  return <Layout {...props} />;
}

export default CandidateLayout;
