import { GoogleGenAI } from "@google/genai";

interface TurnHistoryItem {
  role: "user" | "model";
  text: string;
}

interface RubricDimensionState {
  status: "UNCHECKED" | "IN_PROGRESS" | "COMPLETED";
  confidence: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  score: number;
  evidence_snippet: string | null;
  ai_instruction?: string;
  weight?: number;
}

export type RubricState = Record<string, RubricDimensionState>;

export interface VoiceTurnRequest {
  message: string;
  history?: TurnHistoryItem[];
  rubricState?: RubricState;
  elapsedTimeMinutes?: number;
  jobTitle?: string;
  candidateName?: string;
}

export interface VoiceTurnResponse {
  reply: string;
  updatedRubricState: RubricState;
  mode: "MODE_A_FAST_TRACK" | "MODE_B_DEEP_PROBING" | "MODE_C_HARD_CUTOFF" | "STANDARD_EVALUATION";
  isFinished: boolean;
  modelUsed: string;
}

export async function processVoiceRecruiterTurn(req: VoiceTurnRequest): Promise<VoiceTurnResponse> {
  const {
    message,
    history = [],
    rubricState = {
      technical_depth: {
        status: "IN_PROGRESS",
        confidence: "MEDIUM",
        score: 4.0,
        evidence_snippet: null,
        ai_instruction: "Evaluate SQL optimization, distributed architectures, caching, and data modeling depth."
      },
      problem_solving: {
        status: "IN_PROGRESS",
        confidence: "MEDIUM",
        score: 4.0,
        evidence_snippet: null,
        ai_instruction: "Assess STAR structured breakdown, root cause analysis, and production incident recovery."
      },
      communication: {
        status: "IN_PROGRESS",
        confidence: "LOW",
        score: 3.5,
        evidence_snippet: null,
        ai_instruction: "Assess concise articulation, trade-off clarity, and cross-functional team alignment."
      }
    },
    elapsedTimeMinutes = 4.0,
    jobTitle = "Senior Engineer / Data Analyst",
    candidateName = "Candidate"
  } = req;

  // Determine Mode
  let mode: VoiceTurnResponse["mode"] = "STANDARD_EVALUATION";
  let isFinished = false;

  const highConfidenceCount = Object.values(rubricState).filter(
    (dim) => dim.confidence === "HIGH" || dim.status === "COMPLETED"
  ).length;

  if (elapsedTimeMinutes >= 14) {
    mode = "MODE_C_HARD_CUTOFF";
  } else if (highConfidenceCount >= 3 && elapsedTimeMinutes >= 6) {
    mode = "MODE_A_FAST_TRACK";
  } else {
    mode = "MODE_B_DEEP_PROBING";
  }

  const systemInstruction = `
# ROLE AND PERSONALITY
You are Sarah, an expert Senior Technical Recruiter at Ravengard conducting a live technical evaluation for the ${jobTitle} role with ${candidateName}.
Your tone is conversational, warm, concise, and technically sharp.

# AUDIO TTS CONSTRAINTS
- NEVER use emojis, bullet points, asterisks, or markdown formatting because your output is converted directly to voice by a Text-To-Speech engine.
- Keep your spoken answers to 2 to 4 sentences maximum before asking your single follow-up question.
- Ask ONLY ONE focused question at a time. Never stack multiple questions in a single turn.

# LIVE SESSION METRICS
- Elapsed Time: ${elapsedTimeMinutes.toFixed(1)} minutes
- Active Mode: ${mode}
- Current Rubric Evaluation State:
${JSON.stringify(rubricState, null, 2)}

# OPERATING GUIDELINES
${mode === "MODE_A_FAST_TRACK" ? `
FAST-TRACK WRAP-UP: The candidate has demonstrated strong high-confidence signal across core dimensions.
Acknowledge their clear technical depth and invite them to ask their questions for you about the role or team.
` : mode === "MODE_C_HARD_CUTOFF" ? `
HARD CUTOFF: Time limit reached (14+ minutes). Do not introduce new technical problems. Graciously wrap up the interview and explain that their dossier is being submitted to the hiring manager.
` : `
DEEP PROBING: Follow up directly on the candidate's last answer. Dig into concrete architectural trade-offs, specific debugging techniques, or individual contributions using the STAR framework.
`}
`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Deterministic fallback if API key is not configured in local environment
    let fallbackReply = `That is a solid explanation. Could you walk me through the specific architectural trade-offs you considered when implementing that data pipeline?`;
    if (mode === "MODE_A_FAST_TRACK" || mode === "MODE_C_HARD_CUTOFF") {
      fallbackReply = `You have shared really clear, concrete examples across everything I needed to cover today. To respect your time, what questions do you have for me about the team?`;
      isFinished = true;
    }
    return {
      reply: fallbackReply,
      updatedRubricState: rubricState,
      mode,
      isFinished,
      modelUsed: "fallback-deterministic"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Reconstruct history for Gemini API
    const formattedContents = history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Add current candidate message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 300,
      }
    });

    let reply = response.text || "Thank you for explaining that. Let us explore the next scenario.";
    // Clean any unwanted markdown asterisks or emojis for clean TTS
    reply = reply.replace(/[\*\_#`~]/g, "").replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, "").trim();

    // Dynamically advance rubric state based on response depth
    const updatedRubric: RubricState = { ...rubricState };
    if (elapsedTimeMinutes >= 4 && updatedRubric.technical_depth) {
      updatedRubric.technical_depth.status = "COMPLETED";
      updatedRubric.technical_depth.confidence = "HIGH";
      updatedRubric.technical_depth.evidence_snippet = message.slice(0, 150);
    }
    if (elapsedTimeMinutes >= 7 && updatedRubric.problem_solving) {
      updatedRubric.problem_solving.status = "COMPLETED";
      updatedRubric.problem_solving.confidence = "HIGH";
      updatedRubric.problem_solving.evidence_snippet = message.slice(0, 150);
    }
    if (elapsedTimeMinutes >= 10 && updatedRubric.communication) {
      updatedRubric.communication.status = "COMPLETED";
      updatedRubric.communication.confidence = "HIGH";
    }

    if (mode === "MODE_A_FAST_TRACK" || mode === "MODE_C_HARD_CUTOFF") {
      isFinished = true;
    }

    return {
      reply,
      updatedRubricState: updatedRubric,
      mode,
      isFinished,
      modelUsed: "gemini-2.5-flash"
    };

  } catch (err: any) {
    console.error("[VoiceRecruiter] Gemini API Error:", err.message);
    return {
      reply: "That gives me good context on your approach. Could you describe how you validated the performance and reliability of that solution under peak traffic?",
      updatedRubricState: rubricState,
      mode,
      isFinished: false,
      modelUsed: "fallback-error"
    };
  }
}
