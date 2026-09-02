const fs = require('fs');
let file = fs.readFileSync('src/db/schema.ts', 'utf8');

file = file.replace(/export const interviewReports = pgTable\('interview_reports', \{([\s\S]*?)\}\);/, `export const interviewReports = pgTable('interview_reports', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  overallScore: integer('overall_score'),
  breakdown: jsonb('breakdown'),
  strengths: jsonb('strengths'),
  weaknesses: jsonb('weaknesses'),
  recommendation: text('recommendation'),
  rubricVersion: text('rubric_version').default('v1.0'),
  evidence: jsonb('evidence'),
  generatedAt: timestamp('generated_at').defaultNow(),
});`);

fs.writeFileSync('src/db/schema.ts', file);
