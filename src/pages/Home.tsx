import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { SecretRevealStrip } from '../components/home/SecretRevealStrip';
import { ParallaxStorySection } from '../components/home/ParallaxStorySection';
import { ProjectTeaserGrid } from '../components/home/ProjectTeaserGrid';
import { FinalCtaSection } from '../components/home/FinalCtaSection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-0)]">
      <HeroSection />
      <SecretRevealStrip />
      <ParallaxStorySection />
      <ProjectTeaserGrid />
      <FinalCtaSection />
    </div>
  );
}
