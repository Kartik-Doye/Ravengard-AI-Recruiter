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
