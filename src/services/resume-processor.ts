import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { z } from 'zod';
import { llmRouter } from './llm/llmRouter';

/**
 * Extract text from PDF or DOCX file
 */
export async function extractTextFromFile(buffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string> {
  if (fileType === 'pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (typeof text === 'string' ? text : (text as string[]).join('\n')) || '';
  } else if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type');
}

/**
 * Schema for resume analysis output
 */
const ResumeAnalysisSchema = z.object({
  skills: z.array(z.string()),
  strengths: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  summary: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
});

type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisSchema>;

/**
 * Analyze resume text to extract structured metadata using LLM
 * @param rawResumeText - The extracted text from the resume
 * @returns Structured analysis of the resume
 */
export async function analyzeResume(rawResumeText: string): Promise<z.infer<typeof ResumeAnalysisSchema>> {
  if (!rawResumeText || rawResumeText.trim().length === 0) {
    // Return empty analysis if no text
    return ResumeAnalysisSchema.parse({
      skills: [],
      strengths: [],
      missingKeywords: [],
    });
  }

  const systemInstruction = `You are an expert HR analyst and resume parser. Extract structured information from the resume text provided.
  Focus on technical skills, strengths, and missing keywords for a software engineering role.
  Return ONLY a JSON object with the following structure:
  {
    "skills": ["skill1", "skill2", ...],
    "strengths": ["strength1", "strength2", ...],
    "missingKeywords": ["keyword1", "keyword2", ...],
    "summary": "Brief professional summary",
    "experienceLevel": "entry" | "mid" | "senior" | "executive"
  }
  Do not include any additional text or explanations.`;

  const prompt = `Resume Text:
  ${rawResumeText}`;

  try {
    const result = await llmRouter.structuredOutput<ResumeAnalysisResult>(
      {
        model: 'gemini-2.5-flash', // Primary model
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      },
      ResumeAnalysisSchema
    );

    return result;
  } catch (error) {
    console.error('Primary LLM failed for resume analysis, trying fallbacks:', error);
    // The llmRouter already handles fallbacks, so if we get here, all providers failed
    // Return a safe fallback analysis
    return ResumeAnalysisSchema.parse({
      skills: ['Unable to extract skills due to processing error'],
      strengths: ['Analysis failed'],
      missingKeywords: ['Please try again later'],
      summary: 'Resume analysis temporarily unavailable',
      experienceLevel: 'mid',
    });
  }
}