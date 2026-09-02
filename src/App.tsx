import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalErrorBoundary } from "./components/layout/GlobalErrorBoundary.tsx";
import { ReducedMotionProvider } from "./components/layout/ReducedMotionProvider.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import RootLayout from './components/layout/RootLayout.tsx';
import { LenisProvider } from './components/layout/LenisProvider.tsx';
import { SmoothLoader } from './components/layout/SmoothLoader.tsx';
import { HelmetProvider } from 'react-helmet-async';

const Home = lazy(() => import('./pages/Home.tsx'));
const About = lazy(() => import('./pages/About.tsx'));
const Features = lazy(() => import('./pages/Features.tsx'));
const Projects = lazy(() => import('./pages/Projects.tsx'));
const Contact = lazy(() => import('./pages/Contact.tsx'));
const Gateway = lazy(() => import('./pages/Gateway.tsx'));
const AssessmentGuide = lazy(() => import('./pages/AssessmentGuide.tsx'));
const InterviewGateway = lazy(() => import('./pages/InterviewGateway.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));


export default function App() {
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoad) {
    return <SmoothLoader duration={5000} />;
  }

  return (
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ReducedMotionProvider>
          <ThemeProvider>
            <LenisProvider>
              <BrowserRouter>
                <Suspense fallback={<SmoothLoader />}>
                  <Routes>
                    <Route element={<RootLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/gateway" element={<Gateway />} />
                      <Route path="/assessment-guide" element={<AssessmentGuide />} />
                      {/* Interview Gateway renders without standard layout wrappers based on location in RootLayout */}
                      
                      <Route path="/interview/*" element={<InterviewGateway />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </LenisProvider>
          </ThemeProvider>
        </ReducedMotionProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}
