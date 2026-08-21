import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout.tsx';
import { LenisProvider } from './components/layout/LenisProvider.tsx';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Features from './pages/Features.tsx';
import Projects from './pages/Projects.tsx';
import Contact from './pages/Contact.tsx';
import Gateway from './pages/Gateway.tsx';
import AssessmentGuide from './pages/AssessmentGuide.tsx';
import InterviewGateway from './pages/InterviewGateway.tsx';
import NotFound from './pages/NotFound.tsx';

export default function App() {
  return (
    <LenisProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </LenisProvider>
  );
}
