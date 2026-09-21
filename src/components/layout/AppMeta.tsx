import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface PageMetadata {
  title: string;
  description: string;
  keywords?: string;
  type?: 'website' | 'article';
  schema?: Record<string, any>;
}

export function AppMeta() {
  const location = useLocation();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ravengard.ai';
  const canonicalUrl = `${origin}${location.pathname}`;
  const defaultImage = `${origin}/favicon-512.png`;

  const meta = useMemo<PageMetadata>(() => {
    const path = location.pathname;

    if (path === '/') {
      return {
        title: 'RavenGard – Enterprise AI Recruiter & Assessments',
        description: 'Streamline technical hiring with deterministic rubric scoring, verified work sample authenticity, and transparent AI candidate evaluations.',
        keywords: 'AI recruiter, technical assessments, work sample authenticity, rubric scoring, unbiased hiring, ATS integration',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'RavenGard AI Recruiter',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          description: 'Enterprise AI Interview Platform with deterministic rubric scoring and ethical AI governance.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      };
    }

    if (path === '/features') {
      return {
        title: 'Features & Architecture | RavenGard AI Recruiter',
        description: 'Explore real-time competency evaluations, collaborative insights, technical reasoning breakdowns, and automated rubric scoring architecture.',
        keywords: 'interview engine, collaborative insights, rubric scoring, zero-shot extraction, technical assessments',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'RavenGard Platform Architecture',
          applicationCategory: 'RecruitmentSoftware',
          description: 'Modular interview engine featuring real-time competency evaluations and collaborative insights.',
        },
      };
    }

    if (path === '/about') {
      return {
        title: 'About RavenGard – Unbiased AI Technical Hiring',
        description: 'Discover how RavenGard eliminates hiring bias and subjectivity through deterministic evaluation, state-machine integrity, and ethical AI governance.',
        keywords: 'about RavenGard, objective hiring, merit-based recruiting, ethical AI, bias elimination',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About RavenGard',
          description: 'Mission and principles behind RavenGard objective hiring infrastructure.',
        },
      };
    }

    if (path === '/projects') {
      return {
        title: 'Case Studies & Work Samples | RavenGard AI',
        description: 'Learn how engineering teams deploy collaborative work samples, standardized rubrics, and native ATS pipeline integrations to scale hiring.',
        keywords: 'recruitment case studies, collaborative work samples, ATS sync, technical evaluation examples',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'RavenGard Work Samples & Solutions',
          description: 'Examples and architectural breakdowns of enterprise assessment pipelines.',
        },
      };
    }

    if (path === '/contact') {
      return {
        title: 'Contact Sales & Support | RavenGard AI Recruiter',
        description: 'Connect with our engineering and talent solutions team to request an enterprise demo or discuss custom ATS pipeline integrations.',
        keywords: 'contact RavenGard, enterprise demo, recruitment solutions, ATS custom integration',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact RavenGard',
          description: 'Get in touch with RavenGard enterprise recruitment specialists.',
        },
      };
    }

    if (path === '/gateway' || path === '/demo') {
      return {
        title: 'Assessment Gateway & Demo | RavenGard Recruiter',
        description: 'Experience our interactive candidate assessment gateway, hardware device checks, and adaptive technical interview engine in real time.',
        keywords: 'assessment gateway, live demo, candidate experience sandbox, interview engine demo',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'RavenGard Interactive Gateway',
          description: 'Candidate assessment gateway and evaluation preview sandbox.',
        },
      };
    }

    if (path === '/careers' || path === '/jobs') {
      return {
        title: 'Careers & Open Roles | RavenGard AI Recruiter',
        description: 'Join the team building the future of unbiased, merit-based technical hiring. Explore open engineering, product, and AI leadership roles.',
        keywords: 'RavenGard careers, AI engineering jobs, recruitment tech hiring, remote opportunities',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Careers at RavenGard',
          description: 'Open positions and career opportunities at RavenGard.',
        },
      };
    }

    if (path === '/portal' || path.startsWith('/candidate')) {
      return {
        title: 'Candidate Portal | RavenGard Assessment Hub',
        description: 'Track your application progress, complete hardware device checks, and access your single-use locked interview assessment session.',
        keywords: 'candidate portal, assessment status, magic link access, interview session',
        type: 'website',
      };
    }

    if (path === '/assessment-guide') {
      return {
        title: 'Candidate Assessment Guide | RavenGard AI',
        description: 'Complete candidate preparation guide explaining the 7-phase assessment journey, evaluation rubrics, and technical environment tips.',
        keywords: 'candidate guide, interview preparation, rubric dimensions, assessment walkthrough',
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'RavenGard Candidate Assessment Guide',
          description: 'Comprehensive walkthrough of candidate interview and evaluation phases.',
        },
      };
    }

    if (path.startsWith('/interview')) {
      return {
        title: 'Live Interview Session | RavenGard Portal',
        description: 'Secure candidate assessment session featuring interactive technical problem solving and deterministic competency evaluations.',
        keywords: 'live interview, candidate assessment, technical evaluation, secure session',
        type: 'website',
      };
    }

    if (path.startsWith('/admin')) {
      return {
        title: 'Admin & HR Portal | RavenGard AI Recruiter',
        description: 'Enterprise management dashboard for reviewing candidate scorecards, rubric configurations, ATS exports, and security audit logs.',
        keywords: 'admin dashboard, ATS candidate review, scorecard audit, hiring analytics',
        type: 'website',
      };
    }

    // 404 / NotFound
    return {
      title: 'Page Not Found (404) | RavenGard AI Recruiter',
      description: 'The requested page could not be found. Return to the RavenGard home page or access your candidate application portal.',
      type: 'website',
    };
  }, [location.pathname]);

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph Social Tags */}
      <meta property="og:site_name" content="RavenGard AI Recruiter" />
      <meta property="og:type" content={meta.type || 'website'} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={defaultImage} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={defaultImage} />

      {/* Structured Data JSON-LD */}
      {meta.schema && (
        <script type="application/ld+json">
          {JSON.stringify(meta.schema)}
        </script>
      )}
    </Helmet>
  );
}
