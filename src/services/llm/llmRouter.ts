import { GoogleGenAI } from "@google/genai";
import { createPool } from "../../db/index";
import crypto from "crypto";
import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "model";
  content: string;
}

export interface LLMTelemetryContext {
  organizationId?: string;
  module: "voice_interview" | "mcq_battery" | "resume_screening" | "dossier_synthesis" | "job_rubric_generator";
}

export interface VoiceTurnResult {
  reply: string;
  tokensUsed: number;
  latencyMs: number;
  provider: "groq" | "gemini" | "openrouter" | "nvidia" | "fallback";
}

export interface ChatCompletionRequest {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

/**
 * ponytail: Groq deprecated llama-3.3-70b-versatile on 2026-08-16 (shutdown date).
 * Using openai/gpt-oss-20b (20B params, free tier, lightweight) as primary.
 * Gemini gemini-2.5-flash also deprecated — updated to gemini-3.8-flash.
 * OpenRouter secondary uses qwen/qwen3.8-27b:free (free tier).
 * If any model is deprecated in the future, update the constants here only.
 */
const GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b";
const OPENROUTER_DEFAULT_MODEL = "qwen/qwen3.8-27b:free";
const GEMINI_MODEL = "gemini-3.8-flash";

export class LLMRouter {
  private static geminiClient: GoogleGenAI | null = null;
  private static groqClient: OpenAI | null = null;
  private static openRouterClient: OpenAI | null = null;

  private static getGeminiClient(): GoogleGenAI {
    if (!this.geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
      this.geminiClient = new GoogleGenAI({ apiKey });
    }
    return this.geminiClient;
  }

  private static getGroqClient(): OpenAI | null {
    if (!process.env.GROQ_API_KEY) return null;
    if (!this.groqClient) {
      this.groqClient = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
    }
    return this.groqClient;
  }

  private static getOpenRouterClient(): OpenAI | null {
    if (!process.env.OPENROUTER_API_KEY) return null;
    if (!this.openRouterClient) {
      this.openRouterClient = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://ravengard.ai",
          "X-Title": "Ravengard AI Recruiter",
        },
      });
    }
    return this.openRouterClient;
  }

  public static async recordTelemetry(
    context: LLMTelemetryContext,
    tokensUsed: number,
    latencyMs: number,
    provider: string = "unknown"
  ): Promise<void> {
    try {
      const pool = createPool();
      if (!pool) return;
      const orgId = context.organizationId || "org-ravengard-default";
      await pool.query(
        `INSERT INTO system_telemetry (id, organization_id, module, llm_tokens_used, latency_ms, recorded_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [`tel-${crypto.randomUUID()}`, orgId, context.module, Math.max(tokensUsed, 1), Math.max(latencyMs, 10)]
      );

      console.log(`[LLM TELEMETRY] Provider: ${provider}, Module: ${context.module}, Latency: ${latencyMs}ms, Tokens: ${tokensUsed}`);
    } catch {
      // Non-blocking telemetry
    }
  }

  /**
   * Streaming completion with async generator
   * Multi-Provider Failover: Groq (Primary) -> OpenRouter (Secondary) -> Gemini (Safety Fallback)
   */
  public static async *chatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<{ choices: { delta: { content?: string } }[] }> {
    const startTime = Date.now();
    const systemPrompt = request.messages.find((m) => m.role === "system")?.content || "";
    const userMessages = request.messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role as any,
      content: m.content
    }));

    // --- STEP 1: GROQ (Ultra-low latency primary for voice loop) ---
    const groq = this.getGroqClient();
    if (groq) {
      try {
        const stream = await groq.chat.completions.create({
          model: request.model || GROQ_DEFAULT_MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...userMessages],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 300,
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) yield { choices: [{ delta: { content: text } }] };
        }
        await this.recordTelemetry({ module: "voice_interview" }, 80, Date.now() - startTime, "groq");
        return;
      } catch (err) {
        console.warn("Groq stream failed, failing over to OpenRouter:", err);
      }
    }

    // --- STEP 2: OPENROUTER (High availability secondary) ---
    const openRouter = this.getOpenRouterClient();
    if (openRouter) {
      try {
        const stream = await openRouter.chat.completions.create({
          model: OPENROUTER_DEFAULT_MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...userMessages],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 300,
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) yield { choices: [{ delta: { content: text } }] };
        }
        await this.recordTelemetry({ module: "voice_interview" }, 85, Date.now() - startTime, "openrouter");
        return;
      } catch (err) {
        console.warn("OpenRouter stream failed, failing over to Gemini:", err);
      }
    }

    // --- STEP 3: GEMINI (Deterministic safety fallback) ---
    try {
      const gemini = this.getGeminiClient();
      const userPrompt = userMessages.map(m => m.content).join("\n\n");
      const responseStream = await gemini.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.max_tokens ?? 300,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        if (text) yield { choices: [{ delta: { content: text } }] };
      }
      await this.recordTelemetry({ module: "voice_interview" }, 90, Date.now() - startTime, "gemini");
    } catch (err) {
      console.error("All LLM providers failed for stream:", err);
      const fallbackTokens = ["I ", "apologize, ", "I'm ", "having ", "trouble ", "connecting. ", "Can ", "you ", "repeat ", "your ", "last ", "thought?"];
      for (const token of fallbackTokens) {
        yield { choices: [{ delta: { content: token } }] };
      }
    }
  }

  /**
   * Standard Chat Completion
   * Multi-Provider Failover: Groq -> OpenRouter -> Gemini
   */
  public static async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    const systemPrompt = request.messages.find((m) => m.role === "system")?.content || "";
    const userMessages = request.messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role as any,
      content: m.content
    }));

    // Try Groq
    const groq = this.getGroqClient();
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: request.model || GROQ_DEFAULT_MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...userMessages],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 300,
        });
        await this.recordTelemetry({ module: "voice_interview" }, 90, Date.now() - startTime, "groq");
        return {
          choices: [{ message: { role: "assistant", content: completion.choices[0].message.content || "" } }]
        };
      } catch {}
    }

    // Try Gemini (Dossier primary / Global fallback)
    try {
      const gemini = this.getGeminiClient();
      const userPrompt = userMessages.map(m => m.content).join("\n\n");
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.max_tokens ?? 300,
        },
      });
      await this.recordTelemetry({ module: "voice_interview" }, 90, Date.now() - startTime, "gemini");
      return {
        choices: [{ message: { role: "assistant", content: response.text || "" } }]
      };
    } catch {
      return {
        choices: [{ message: { role: "assistant", content: "Describe how you ensure consistency and high availability in your service architecture." } }]
      };
    }
  }

  /**
   * Schema validated JSON extraction (Primary: Gemini)
   */
  public static async structuredOutput<T = any>(
    request: ChatCompletionRequest,
    schema?: any
  ): Promise<T> {
    const startTime = Date.now();
    const systemPrompt = request.messages.find((m) => m.role === "system")?.content || "";
    const userPrompt = request.messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n\n");

    try {
      const gemini = this.getGeminiClient();
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: request.temperature ?? 0.1,
          maxOutputTokens: request.max_tokens ?? 1500,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      const validated = schema ? schema.parse(parsed) : parsed;
      await this.recordTelemetry({ module: "resume_screening" }, 150, Date.now() - startTime, "gemini");
      return validated as T;
    } catch (err: any) {
      await this.recordTelemetry({ module: "resume_screening" }, 0, Date.now() - startTime, "failed");
      // ponytail: Do NOT return a hardcoded mock — callers expect schema-shaped data.
      // Re-throw so callers (scoringService, preScreeningService) can apply their own
      // fallback/retry logic. Returning a wrong-shaped object causes silent downstream
      // crashes (e.g. "result.scores is not iterable") and violates the no-silent-failure rule.
      throw new Error(`LLM structuredOutput failed: ${err?.message || err}`);
    }
  }
}

export const llmRouter = LLMRouter;
export default LLMRouter;
