import { useState, useEffect } from 'react';
import { ShieldAlert, Zap, BookOpen } from 'lucide-react';
import { Card, CardBody, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Loader } from './ui/Loader';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { motion } from 'motion/react';

export default function ResumeAnalysis({ session, onNext }: { session: any, onNext: (session: any) => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const token = localStorage.getItem('ravengard_uid');
        const res = await fetch(`/api/session/${session.id}/resume-analysis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [session.id]);

  const handleNext = async () => {
    setTransitioning(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(`/api/session/${session.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: 'instructions', version: session.version })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        onNext(updatedSession);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader size="lg" className="mb-6 text-[var(--color-primary)]" />
        <h2 className="text-xl font-medium text-white tracking-wide">Analyzing Profile Architecture...</h2>
        <p className="text-white/50 mt-2">Extracting skills, projects, and benchmarks.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-[800px] mx-auto py-10">
        <EmptyState 
          title="Analysis Failed" 
          description="We couldn't parse the profile data correctly. You can still proceed with the interview."
          icon={<ShieldAlert className="w-12 h-12 text-red-500/50" />}
          action={
            <Button onClick={handleNext} variant="primary">
              Continue to Instructions
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-white tracking-wide">Intelligence Report</h1>
      <p className="text-white/50 mb-10">We've parsed your profile. Your interview will dynamically adapt to explore these areas.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="glass" className="flex flex-col items-center justify-center text-center p-8 border-[var(--color-primary)]/20">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-3xl shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            {analysis.atsScore}
          </motion.div>
          <h3 className="font-medium tracking-wide text-white">ATS Score</h3>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Industry Benchmark</p>
        </Card>
        
        <Card variant="glass" className="col-span-2">
          <CardHeader>
            <h3 className="font-medium tracking-wide text-white flex items-center gap-3 text-lg">
              <Zap className="w-5 h-5 text-amber-400" />
              Identified Strengths
            </h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-4">
              {analysis.strengths?.slice(0, 3).map((s: string, i: number) => (
                <motion.li 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="text-sm text-white/80 flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5"
                >
                  <span className="text-[var(--color-primary)] mt-0.5 shrink-0">❖</span>
                  <span className="leading-relaxed">{s}</span>
                </motion.li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card variant="glass">
          <CardHeader>
            <h3 className="font-medium tracking-wide text-white flex items-center gap-3 text-lg">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Areas for Discussion
            </h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-4">
              {analysis.weaknesses?.slice(0, 3).map((w: string, i: number) => (
                <motion.li 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  key={i} 
                  className="text-sm text-white/80 flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5"
                >
                  <span className="text-rose-400 mt-0.5 shrink-0">❖</span>
                  <span className="leading-relaxed">{w}</span>
                </motion.li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h3 className="font-medium tracking-wide text-white flex items-center gap-3 text-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Missing Keywords
            </h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywords?.map((k: string, i: number) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  key={i}
                >
                  <Badge variant="neutral">{k}</Badge>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={transitioning}
          isLoading={transitioning}
          size="lg"
        >
          Acknowledge & Continue
        </Button>
      </div>
    </div>
  );
}
