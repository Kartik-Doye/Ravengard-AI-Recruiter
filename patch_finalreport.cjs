const fs = require('fs');
let file = fs.readFileSync('src/pages/FinalReport.tsx', 'utf8');

// We want to replace the single Recommendation block with a prettier recommendation badge and evidence section.
const oldRecBlock = /<Card className="p-8 bg-white\/5 border-\[var\(--color-secondary\)\]\/30 border">[\s\S]*?<\/Card>/;

const newRecBlock = `
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-8 bg-white/5 border-[var(--color-secondary)]/30 border md:col-span-1 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm text-white/50 mb-4 uppercase tracking-wider">Decision</h3>
          {report.recommendation === 'strong_hire' && (
            <div className="bg-green-500/20 text-green-400 px-6 py-3 rounded-full font-display text-xl border border-green-500/30">Strong Hire</div>
          )}
          {report.recommendation === 'hire' && (
            <div className="bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full font-display text-xl border border-emerald-500/30">Hire</div>
          )}
          {report.recommendation === 'weak_hire' && (
            <div className="bg-amber-500/20 text-amber-400 px-6 py-3 rounded-full font-display text-xl border border-amber-500/30">Weak Hire</div>
          )}
          {report.recommendation === 'no_hire' && (
            <div className="bg-red-500/20 text-red-400 px-6 py-3 rounded-full font-display text-xl border border-red-500/30">No Hire</div>
          )}
          {!['strong_hire', 'hire', 'weak_hire', 'no_hire'].includes(report.recommendation) && (
            <div className="bg-white/10 text-white/80 px-6 py-3 rounded-full font-display text-xl border border-white/20 capitalize">{report.recommendation?.replace('_', ' ')}</div>
          )}
        </Card>

        <Card className="p-8 bg-white/5 border-white/10 md:col-span-2">
          <h3 className="text-lg text-white mb-4 border-b border-white/10 pb-2">Scoring Evidence</h3>
          {(!report.evidence || report.evidence.length === 0) ? (
            <p className="text-white/50 font-light text-sm italic">Detailed evidence is unavailable for this session.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {report.evidence.map((ev: any, i: number) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-[var(--color-secondary)] uppercase tracking-wider">{ev.competency}</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">Score: {ev.score}/100</span>
                  </div>
                  <p className="text-sm text-white/80 font-light leading-relaxed">{ev.notes}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
`;

file = file.replace(oldRecBlock, newRecBlock);

// Replace the hardcoded spinner with the enhanced SmoothLoader
const oldLoader = /if \(loading \|\| !report\) \{[\s\S]*?return \([\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/;

const newLoader = `
  if (loading || !report) {
    return <SmoothLoader isLoading={true} messages={["Fetching interview transcript...", "Evaluating competencies against rubric...", "Computing score breakdowns...", "Finalizing report..."]} />;
  }
`;
file = file.replace(oldLoader, newLoader);

// Also we need to import SmoothLoader at the top
if (!file.includes("SmoothLoader")) {
  file = file.replace("import { Card }", "import { Card } from '../components/ui/Card';\nimport { SmoothLoader } from '../components/layout/SmoothLoader';");
}

fs.writeFileSync('src/pages/FinalReport.tsx', file);
