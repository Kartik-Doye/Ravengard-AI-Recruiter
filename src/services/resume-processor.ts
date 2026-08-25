import { extractText } from 'unpdf';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

export async function extractTextFromFile(buffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string> {
  if (fileType === 'pdf') {
    const { text } = await extractText(buffer);
    return text || '';
  } else if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type');
}

export async function analyzeResumeWithAI(rawText: string): Promise<{ skills: string[], strengths: string[], missingKeywords: string[] }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are an expert HR Technical Recruiter. Extract the candidate's core skills, top strengths, and missing critical keywords based on the following resume text. Respond ONLY with a JSON object.
Schema: { "skills": ["skill1", "skill2"], "strengths": ["strength1", "strength2"], "missingKeywords": ["keyword1"] }

Resume Text:
${rawText.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      skills: parsed.skills || [],
      strengths: parsed.strengths || [],
      missingKeywords: parsed.missingKeywords || []
    };
  } catch (err) {
    console.error("Gemini Analysis failed:", err);
    return { skills: [], strengths: [], missingKeywords: [] };
  }
}
