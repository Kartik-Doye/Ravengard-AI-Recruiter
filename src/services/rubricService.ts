import { db } from "../db/index";
import { rubrics, rubricCriteria } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface RubricCriterionItem {
  id: string;
  rubricId: string;
  name: string;
  weight: number;
  description: string;
}

export interface RubricWithCriteria {
  id: string;
  jobId: string | null;
  version: string;
  createdAt: Date | null;
  criteria: RubricCriterionItem[];
}

export const DEFAULT_RUBRIC_VERSION = "v1.0";

export const DEFAULT_CRITERIA_DEFINITIONS = [
  {
    name: "technical",
    weight: 40,
    description: "Depth of domain expertise, distributed systems knowledge, algorithms, and architectural safety."
  },
  {
    name: "problem_solving",
    weight: 30,
    description: "Analytical rigor, concurrency management, trade-off reasoning, and edge-case handling."
  },
  {
    name: "communication",
    weight: 20,
    description: "Clarity, succinct structured answers, precision, and absence of evasive filler."
  },
  {
    name: "behavioral",
    weight: 10,
    description: "Engineering integrity, acknowledgment of constraints, and collaborative professional alignment."
  }
];

/**
 * Ensures the default rubric and its weighted criteria exist in the database.
 * Reuses existing records if present.
 */
export async function ensureDefaultRubric(version: string = DEFAULT_RUBRIC_VERSION): Promise<RubricWithCriteria> {
  const existingRubrics = await db.select().from(rubrics).where(eq(rubrics.version, version)).limit(1);
  let rubricRecord = existingRubrics[0];

  if (!rubricRecord) {
    const rubricId = `rubric-${version.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const [insertedRubric] = await db.insert(rubrics).values({
      id: rubricId,
      jobId: "software-engineer-core",
      version,
    }).returning();
    rubricRecord = insertedRubric;
  }

  const existingCriteria = await db.select().from(rubricCriteria).where(eq(rubricCriteria.rubricId, rubricRecord.id));
  
  if (existingCriteria.length === 0) {
    const insertedList: RubricCriterionItem[] = [];
    for (const def of DEFAULT_CRITERIA_DEFINITIONS) {
      const criterionId = `crit-${rubricRecord.id}-${def.name}`;
      const [newCrit] = await db.insert(rubricCriteria).values({
        id: criterionId,
        rubricId: rubricRecord.id,
        name: def.name,
        weight: def.weight,
        description: def.description
      }).returning();
      insertedList.push({
        id: newCrit.id,
        rubricId: newCrit.rubricId!,
        name: newCrit.name,
        weight: newCrit.weight,
        description: newCrit.description || ""
      });
    }
    return {
      id: rubricRecord.id,
      jobId: rubricRecord.jobId,
      version: rubricRecord.version || version,
      createdAt: rubricRecord.createdAt,
      criteria: insertedList
    };
  }

  return {
    id: rubricRecord.id,
    jobId: rubricRecord.jobId,
    version: rubricRecord.version || version,
    createdAt: rubricRecord.createdAt,
    criteria: existingCriteria.map(c => ({
      id: c.id,
      rubricId: c.rubricId!,
      name: c.name,
      weight: c.weight,
      description: c.description || ""
    }))
  };
}

/**
 * Retrieves a rubric by version (defaults to v1.0), provisioning it if missing.
 */
export async function getRubricByVersion(version: string = DEFAULT_RUBRIC_VERSION): Promise<RubricWithCriteria> {
  return ensureDefaultRubric(version);
}

export interface GeneratedRubricCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface GeneratedRubricResult {
  title: string;
  department?: string;
  criteria: GeneratedRubricCriterion[];
  rationale: string;
}

/**
 * Parses a raw Job Description and generates 3-5 weighted rubric criteria summing to exactly 100%.
 */
export async function generateRubricFromJobDescription(
  jobDescription: string,
  roleTitle?: string,
  department?: string
): Promise<GeneratedRubricResult> {
  const { LLMRouter } = await import("./llm/llmRouter");

  const systemPrompt = `You are a Principal Engineering Hiring Architect. 
Your job is to convert a raw Job Description into a highly objective, 3-5 criterion hiring evaluation rubric.
CRITICAL RULES:
1. Criteria weights MUST be integers and MUST sum up to exactly 100.
2. Each criterion should have a clear technical or behavioral boundary and a concise evaluation description.
3. Return strict JSON matching the schema:
{
  "title": string,
  "department": string,
  "criteria": [
    { "name": string, "weight": number, "description": string }
  ],
  "rationale": string
}`;

  const userPrompt = `Role Title: ${roleTitle || "Senior Software Engineer"}
Department: ${department || "Engineering"}

Job Description:
${jobDescription.slice(0, 4000)}

Generate the weighted rubric criteria.`;

  try {
    const result = await LLMRouter.structuredOutput<GeneratedRubricResult>({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    });

    if (result && Array.isArray(result.criteria) && result.criteria.length > 0) {
      // Normalize weights so they sum to 100%
      let total = result.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      if (total !== 100 && total > 0) {
        result.criteria = result.criteria.map((c, i) => {
          if (i === result.criteria.length - 1) {
            const currentSum = result.criteria.slice(0, -1).reduce((s, x) => s + Math.round((Number(x.weight) / total) * 100), 0);
            return { ...c, weight: 100 - currentSum };
          }
          return { ...c, weight: Math.round((Number(c.weight) / total) * 100) };
        });
      }
      return result;
    }
  } catch (err) {
    console.warn("[RubricService] Failed to generate AI rubric, returning fallback:", err);
  }

  // Fallback defaults
  return {
    title: roleTitle || "Technical Specialist",
    department: department || "Engineering",
    criteria: [
      { name: "Technical Architecture & Design", weight: 35, description: "System decomposition, scalability, and framework proficiency." },
      { name: "Problem Solving & Algorithmic Rigor", weight: 30, description: "Edge-case handling, data structures, and debugging efficiency." },
      { name: "Code Quality & Best Practices", weight: 20, description: "Maintainability, testability, and error handling." },
      { name: "Communication & Collaboration", weight: 15, description: "Clarity of thought, articulation, and trade-off justification." }
    ],
    rationale: "Default engineering rubric with standardized balanced weighting."
  };
}

