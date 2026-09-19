import { llmRouter } from './llm/llmRouter';
import { z } from 'zod';

/**
 * Schema for integrity signal classification
 */
const IntegritySignalSchema = z.object({
  riskLevel: z.enum(['no_concern', 'review_required', 'substantiated_concern']),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(),
});

/**
 * Classify integrity signals (tab-switches, copy-paste, etc.) into risk levels
 * @param signalType - Type of signal (e.g., 'tab_blur', 'copy_paste', 'gaze_off')
 * @param metadata - Additional metadata about the signal
 * @param sessionContext - Optional context about the session (e.g., current question, time spent)
 * @returns Risk level classification
 */
export async function classifyIntegritySignal(
  signalType: string,
  metadata: Record<string, any> = {},
  sessionContext: Record<string, any> = {}
): Promise<z.infer<typeof IntegritySignalSchema>> {
  const systemInstruction = `You are an expert integrity classifier for online assessments.
  Analyze the signal type and metadata to determine the risk level of cheating or unfair advantage.
  Return ONLY a JSON object with the following structure:
  {
    "riskLevel": "no_concern bran=3 | review_required | substantiated_concern",
    "confidence": 0.0 to 1.0,
    "reason": "brief explanation"
  }
  Do not include any additional text or explanations.`;

  const prompt = `Signal Type: ${signalType}
  Metadata: ${JSON.stringify(metadata)}
  Session Context: ${JSON.stringify(sessionContext)}`;

  try {
    const result = await llmRouter.structuredOutput(
      {
        model: 'huggingfaceh4/zephyr-7b-beta', // We'll try a Hugging Face model; the router will handle fallbacks
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      },
      IntegritySignalSchema
    );

    return result;
  } catch (error) {
    console.error('Primary LLM failed for integrity classification, trying fallbacks:', error);
    // The llmRouter already handles fallbacks, so if we get here, all providers failed.
    // Return a safe fallback: review_required for any signal to be safe.
    return IntegritySignalSchema.parse({
      riskLevel: 'review_required',
      confidence: 0.5,
      reason: 'Classification service temporarily unavailable; defaulting to review required',
    });
  }
}