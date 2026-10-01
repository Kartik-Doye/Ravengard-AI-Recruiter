import { Router } from "express";
import { db } from "../db/index";
import { personaConfigs, rubricTemplates, promptVersions, jobs } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { authAdmin, requireRole, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../lib/auditLogger";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

router.use(requireAuth);
router.use(authAdmin as any);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ─── GET /api/admin/studio/persona ──────────────────────────────────────────
router.get("/persona", async (req, res) => {
  try {
    let [config] = await db.select().from(personaConfigs).limit(1);
    if (!config) {
      const [seeded] = await db
        .insert(personaConfigs)
        .values({
          id: "persona_default",
          organizationId: "default_org",
          personaName: "Sarah",
          strictnessLevel: 4,
          interruptionPolicy: "ADAPTIVE",
          cadenceWordsPerMinute: 165,
          probingSensitivity: 4,
        })
        .returning();
      config = seeded;
    }

    res.json({
      success: true,
      persona: config,
    });
  } catch (err: any) {
    console.error("Get persona config error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch persona configuration." });
  }
});

// ─── PUT /api/admin/studio/persona ──────────────────────────────────────────
router.put("/persona", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const { personaName, strictnessLevel, interruptionPolicy, cadenceWordsPerMinute, probingSensitivity } = req.body;

    const [updated] = await db
      .insert(personaConfigs)
      .values({
        id: "persona_default",
        organizationId: "default_org",
        personaName: personaName || "Sarah",
        strictnessLevel: Number(strictnessLevel || 3),
        interruptionPolicy: interruptionPolicy || "ADAPTIVE",
        cadenceWordsPerMinute: Number(cadenceWordsPerMinute || 165),
        probingSensitivity: Number(probingSensitivity || 4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: personaConfigs.id,
        set: {
          personaName: personaName || "Sarah",
          strictnessLevel: Number(strictnessLevel || 3),
          interruptionPolicy: interruptionPolicy || "ADAPTIVE",
          cadenceWordsPerMinute: Number(cadenceWordsPerMinute || 165),
          probingSensitivity: Number(probingSensitivity || 4),
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "UPDATE_AI_PERSONA_CONFIG",
      target: "persona_default",
      metadata: { personaName, strictnessLevel, interruptionPolicy, cadenceWordsPerMinute, probingSensitivity },
    });

    res.json({
      success: true,
      persona: updated,
      message: "Interviewer persona parameters saved successfully.",
    });
  } catch (err: any) {
    console.error("Update persona config error:", err);
    res.status(500).json({ success: false, error: "Failed to update persona configuration." });
  }
});

// ─── POST /api/admin/studio/rubrics/generate ────────────────────────────────
router.post("/rubrics/generate", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const { jobId, jobTitle, descriptionText } = req.body;

    if (!jobTitle || !descriptionText) {
      return res.status(400).json({ success: false, error: "Job title and description are required for rubric generation." });
    }

    let generatedDimensions: Array<{
      name: string;
      weight: number;
      description: string;
      score1: string;
      score3: string;
      score5: string;
    }> = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Analyze this job posting and generate a structured 5-dimension evaluation rubric tailored specifically for technical/role competency.
Job Title: ${jobTitle}
Job Description:
${descriptionText}

Generate 5 distinct dimensions (e.g., Technical Depth, System Execution, Problem Solving, Code Quality, Communication).
Ensure the weights sum to exactly 100.
Provide clear evaluation criteria for 1-point (Unsatisfactory), 3-point (Competent), and 5-point (Exceptional) performance.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Dimension name" },
                  weight: { type: Type.INTEGER, description: "Integer weight percentage" },
                  description: { type: Type.STRING, description: "Detailed description of the competency" },
                  score1: { type: Type.STRING, description: "Criteria for 1-point score (Novice/Unsatisfactory)" },
                  score3: { type: Type.STRING, description: "Criteria for 3-point score (Competent/Standard)" },
                  score5: { type: Type.STRING, description: "Criteria for 5-point score (Staff/Exceptional)" },
                },
                required: ["name", "weight", "description", "score1", "score3", "score5"],
              },
            },
          },
        });

        if (response.text) {
          generatedDimensions = JSON.parse(response.text.trim());
        }
      } catch (aiErr) {
        console.warn("Gemini Rubric generation fallback:", aiErr);
      }
    }

    // High quality deterministic fallback if LLM is unavailable
    if (!generatedDimensions || generatedDimensions.length === 0) {
      generatedDimensions = [
        {
          name: "Technical Depth & Core Foundations",
          weight: 30,
          description: `Mastery of languages, algorithms, and core design principles relevant to ${jobTitle}.`,
          score1: "Struggles with basic syntax and core complexity trade-offs.",
          score3: "Demonstrates solid understanding of standard libraries and idiomatic patterns.",
          score5: "Deep mastery of runtime internals, memory layout, and concurrency models.",
        },
        {
          name: "System Execution & Scalability",
          weight: 25,
          description: "Capacity to design resilient microservices, handle distributed state, and minimize latency.",
          score1: "Designs monolithic components without failure handling or backpressure.",
          score3: "Applies standard architectural patterns with reasonable cache and DB considerations.",
          score5: "Designs fault-tolerant, horizontally scalable topologies with explicit failure recovery.",
        },
        {
          name: "Problem Solving & Boundary Analysis",
          weight: 20,
          description: "Approach to unconstrained problems, edge case discovery, and structured decomposition.",
          score1: "Freezes on ambiguous constraints or misses critical edge cases.",
          score3: "Decomposes problems methodically and verifies edge cases under guidance.",
          score5: "Proactively identifies adversarial edge conditions and delivers optimal solutions.",
        },
        {
          name: "Code Quality & Engineering Hygiene",
          weight: 15,
          description: "Clarity, testability, defensive programming, and maintainable structure.",
          score1: "Writes fragile, unformatted code with missing error branches.",
          score3: "Clean, readable code with sensible abstractions and standard unit tests.",
          score5: "Exceptional elegance, comprehensive test coverage, and self-documenting code.",
        },
        {
          name: "Technical Communication & Articulation",
          weight: 10,
          description: "Clarity of explanation, structured thinking, and collaborative responsiveness.",
          score1: "Incoherent or defensive when questioned on technical decisions.",
          score3: "Clearly explains reasoning and adapts constructively to feedback.",
          score5: "Executive-level clarity; articulates trade-offs with crisp mathematical precision.",
        },
      ];
    }

    const templateId = `rubric_${Date.now()}`;
    const [newRubric] = await db
      .insert(rubricTemplates)
      .values({
        id: templateId,
        jobId: jobId || "job_global",
        version: 1,
        title: `${jobTitle} Evaluation Rubric`,
        dimensions: generatedDimensions,
        status: "DRAFT",
        createdBy: adminReq.user?.email || "admin@ravengard.com",
      })
      .returning();

    // Generate initial prompt version record
    const systemPromptInitial = `You are Sarah, an exacting technical interviewer at Ravengard.
Evaluate the candidate for the position of ${jobTitle}.
Your evaluation must strictly calibrate against the following 5 dimensions:
${generatedDimensions.map((d, i) => `${i + 1}. ${d.name} (${d.weight}%): ${d.description}`).join("\n")}

Conduct multi-turn adaptive probing, require candidates to justify architectural trade-offs, and flag unverified assertions.`;

    await db.insert(promptVersions).values({
      id: `pv_${Date.now()}`,
      rubricTemplateId: templateId,
      version: 1,
      systemPrompt: systemPromptInitial,
      diffSummary: "Initial baseline prompt generated from job description.",
      createdBy: adminReq.user?.email || "admin@ravengard.com",
    });

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "GENERATE_AI_RUBRIC",
      target: templateId,
      metadata: { jobTitle, dimensionsCount: generatedDimensions.length },
    });

    res.json({
      success: true,
      rubric: newRubric,
      message: "Rubric successfully synthesized and versioned.",
    });
  } catch (err: any) {
    console.error("Generate rubric error:", err);
    res.status(500).json({ success: false, error: "Failed to generate rubric." });
  }
});

// ─── GET /api/admin/studio/rubrics ──────────────────────────────────────────
router.get("/rubrics", async (req, res) => {
  try {
    const rubrics = await db.select().from(rubricTemplates).orderBy(desc(rubricTemplates.createdAt));
    res.json({
      success: true,
      rubrics,
    });
  } catch (err: any) {
    console.error("List rubrics error:", err);
    res.status(500).json({ success: false, error: "Failed to list rubrics." });
  }
});

// ─── POST /api/admin/studio/prompts/version ─────────────────────────────────
router.post("/prompts/version", requireRole("admin", "hr_admin"), async (req, res) => {
  try {
    const adminReq = req as AdminAuthRequest;
    const { rubricTemplateId, systemPrompt, diffSummary } = req.body;

    if (!rubricTemplateId || !systemPrompt) {
      return res.status(400).json({ success: false, error: "rubricTemplateId and systemPrompt are required." });
    }

    const existing = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.rubricTemplateId, rubricTemplateId))
      .orderBy(desc(promptVersions.version))
      .limit(1);

    const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

    const [versionRecord] = await db
      .insert(promptVersions)
      .values({
        id: `pv_${Date.now()}`,
        rubricTemplateId,
        version: nextVersion,
        systemPrompt,
        diffSummary: diffSummary || `Version ${nextVersion} update published.`,
        createdBy: adminReq.user?.email || "admin@ravengard.com",
      })
      .returning();

    await logAdminAction({
      adminId: adminReq.admin?.id || "system",
      role: adminReq.admin?.role || "admin",
      action: "PUBLISH_PROMPT_VERSION",
      target: rubricTemplateId,
      metadata: { version: nextVersion, diffSummary },
    });

    res.json({
      success: true,
      version: versionRecord,
      message: `Prompt version ${nextVersion} published successfully.`,
    });
  } catch (err: any) {
    console.error("Publish prompt version error:", err);
    res.status(500).json({ success: false, error: "Failed to publish prompt version." });
  }
});

// ─── GET /api/admin/studio/prompts/:rubricTemplateId/history ────────────────
router.get("/prompts/:rubricTemplateId/history", async (req, res) => {
  try {
    const { rubricTemplateId } = req.params;
    const history = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.rubricTemplateId, rubricTemplateId))
      .orderBy(desc(promptVersions.version));

    res.json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error("Get prompt history error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch prompt history." });
  }
});

export default router;
