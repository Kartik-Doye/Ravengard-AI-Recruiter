import React from 'react';
import { AboutIntroSection } from '../components/about/AboutIntroSection';
import { StoryTimeline } from '../components/about/StoryTimeline';
import { PrinciplesGrid } from '../components/about/PrinciplesGrid';
import { FinalCtaSection } from '../components/home/FinalCtaSection';

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <AboutIntroSection />
      <StoryTimeline />
      <PrinciplesGrid />
      <FinalCtaSection />
    </div>
  );
}
