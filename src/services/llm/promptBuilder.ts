import { db } from "../../db";
import { rubrics, rubricDimensions } from "../../db/schema";
import { eq } from "drizzle-orm";

export interface RubricTrackingItem {
  status: "UNCHECKED" | "CHECKED" | "PARTIAL";
  confidence: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  score: number;
  max_score: number;
  weight: number;
  ai_instruction: string;
  evidence_snippet: string | null;
}

/**
 * Fetches a rubric from PostgreSQL and formats it into the exact JSON 
 * structure required by the Gemini System Instruction.
 */
export async function buildGeminiRubricState(rubricId: string): Promise<Record<string, RubricTrackingItem>> {
  // Fetch dimensions for this specific rubric
  const dimensions = await db
    .select()
    .from(rubricDimensions)
    .where(eq(rubricDimensions.rubricId, rubricId));

  // Construct the initial tracking state for the LLM
  const rubricState: Record<string, RubricTrackingItem> = {};

  dimensions.forEach((dim) => {
    // Create a snake_case key from the dimension name (e.g., "sql_optimization")
    const key = dim.dimensionName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    
    rubricState[key] = {
      status: "UNCHECKED",
      confidence: "NONE",
      score: 0,
      max_score: 5,
      weight: dim.weight,
      ai_instruction: dim.evalInstruction,
      evidence_snippet: null
    };
  });

  return rubricState;
}

/**
 * Compiles a system prompt block for Gemini conversational interview context
 * with rubric criteria, evaluation guidelines, and JSON output constraints.
 */
export async function buildGeminiSystemPromptWithRubric(rubricId: string, roleTitle: string): Promise<string> {
  const rubricState = await buildGeminiRubricState(rubricId);
  const rubricKeys = Object.keys(rubricState);

  return `You are the Ravengard AI Recruiter evaluating a candidate for the position: "${roleTitle}".
Conduct a professional, rigorous, and conversational evaluation according to the multi-dimensional scoring rubric below.

### ACTIVE EVALUATION RUBRIC:
${rubricKeys.map((key) => {
  const item = rubricState[key];
  return `- Dimension [${key}] (Weight: ${item.weight}%): ${item.ai_instruction}`;
}).join('\n')}

### EVALUATION PROTOCOL:
1. Ask one probing, scenario-based question at a time.
2. Probe technical depth, edge cases, trade-offs, and failure recovery.
3. Keep tone objective, supportive, yet uncompromising on engineering rigor.
4. Track candidate mastery across all rubric dimensions.`;
}
