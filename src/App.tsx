import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalErrorBoundary } from "./components/layout/GlobalErrorBoundary";
import { ReducedMotionProvider } from "./components/layout/ReducedMotionProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import RootLayout from './components/layout/RootLayout';
import { LenisProvider } from './components/layout/LenisProvider';
import { SmoothLoader } from './components/layout/SmoothLoader';
import { HelmetProvider } from 'react-helmet-async';
import { AppMeta } from './components/layout/AppMeta';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Gateway from './pages/Gateway';
import AssessmentGuide from './pages/AssessmentGuide';
import InterviewGateway from './pages/InterviewGateway';
import AdminGateway from './pages/admin/AdminGateway';
import Careers from './pages/Careers';
import CandidatePortal from './pages/CandidatePortal';
import NotFound from './pages/NotFound';


export default function App() {
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoad) {
    return <SmoothLoader duration={1500} />;
  }

  return (
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ReducedMotionProvider>
          <ThemeProvider>
            <LenisProvider>
              <BrowserRouter>
                <AppMeta />
                <Suspense fallback={<SmoothLoader />}>
                  <Routes>
                    <Route element={<RootLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/gateway" element={<Gateway />} />
                      <Route path="/demo" element={<Gateway />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/jobs" element={<Careers />} />
                      <Route path="/portal" element={<CandidatePortal />} />
                      <Route path="/candidate/portal" element={<CandidatePortal />} />
                      <Route path="/assessment-guide" element={<AssessmentGuide />} />
                      {/* Interview Gateway renders without standard layout wrappers based on location in RootLayout */}
                      
                      <Route path="/interview/*" element={<InterviewGateway />} />
                      <Route path="/admin/*" element={<AdminGateway />} />
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
