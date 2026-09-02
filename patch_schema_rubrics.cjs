const fs = require('fs');
let file = fs.readFileSync('src/db/schema.ts', 'utf8');

const newTables = `
export const rubrics = pgTable('rubrics', {
  id: text('id').primaryKey(),
  jobId: text('job_id'),
  version: text('version').default('v1.0'),
  createdAt: timestamp('created_at').defaultNow()
});

export const rubricCriteria = pgTable('rubric_criteria', {
  id: text('id').primaryKey(),
  rubricId: text('rubric_id').references(() => rubrics.id),
  name: text('name').notNull(),
  weight: integer('weight').notNull(),
  description: text('description')
});

export const questionScores = pgTable('question_scores', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  questionId: text('question_id').references(() => interviewQuestions.id),
  criterionId: text('criterion_id').references(() => rubricCriteria.id),
  score: integer('score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});
`;

file = file + "\n" + newTables;
fs.writeFileSync('src/db/schema.ts', file);
