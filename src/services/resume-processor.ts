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

export interface ExtractedCandidateProfile {
  name?: string;
  email?: string;
  mobile?: string;
  college?: string;
  degree?: string;
  gradYear?: number;
  rawResumeText: string;
}

export function extractCandidateFieldsHeuristic(rawText: string): ExtractedCandidateProfile {
  const result: ExtractedCandidateProfile = {
    rawResumeText: rawText,
  };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  // 1. Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/;
  const emailMatch = rawText.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0].trim();
  }

  // 2. Mobile/Phone extraction
  const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = rawText.match(phoneRegex);
  if (phoneMatch) {
    const rawPhone = phoneMatch[0].trim();
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) {
      result.mobile = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      result.mobile = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length >= 10) {
      result.mobile = rawPhone;
    }
  }

  // 3. Name extraction
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines.slice(0, 8)) {
    if (/^(resume|curriculum vitae|cv|page\s+\d+|contact|profile|summary|education)/i.test(line)) continue;
    if (line.includes('@') || /^\+?\d/.test(line)) continue;
    const cleanLine = line.replace(/\|.*$/, '').trim();
    if (/^[A-Za-z]+([ .'-][A-Za-z]+){1,4}$/.test(cleanLine) && cleanLine.length <= 40) {
      if (cleanLine === cleanLine.toUpperCase()) {
        result.name = cleanLine.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else {
        result.name = cleanLine;
      }
      break;
    }
  }

  // 4. College / University extraction
  const KNOWN_COLLEGES = [
    "University of California, Berkeley",
    "UC Berkeley",
    "Stanford University",
    "Massachusetts Institute of Technology",
    "MIT",
    "Carnegie Mellon University",
    "CMU",
    "University of Waterloo",
    "Georgia Institute of Technology",
    "Harvard University",
    "California Institute of Technology",
    "Caltech",
    "University of Texas at Austin",
    "University of Washington",
    "University of Illinois Urbana-Champaign",
    "UIUC",
    "University of Michigan",
    "Princeton University",
    "Cornell University",
    "Columbia University",
    "University of Toronto",
    "University of British Columbia",
    "University of Oxford",
    "University of Cambridge",
    "Imperial College London",
    "ETH Zurich",
    "National University of Singapore",
    "Nanyang Technological University",
    "Indian Institute of Technology Bombay",
    "Indian Institute of Technology Delhi",
    "Indian Institute of Technology Madras",
    "Tsinghua University",
    "Peking University"
  ];

  for (const col of KNOWN_COLLEGES) {
    const escaped = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(rawText)) {
      if (col === 'UC Berkeley') result.college = 'University of California, Berkeley';
      else if (col === 'MIT') result.college = 'Massachusetts Institute of Technology';
      else if (col === 'CMU') result.college = 'Carnegie Mellon University';
      else if (col === 'Caltech') result.college = 'California Institute of Technology';
      else if (col === 'UIUC') result.college = 'University of Illinois Urbana-Champaign';
      else result.college = col;
      break;
    }
  }

  if (!result.college) {
    const genericCollegeMatch = rawText.match(/\b([A-Z][a-zA-Z\s]+(?:University|Institute of Technology|College))\b/);
    if (genericCollegeMatch) {
      result.college = genericCollegeMatch[1].trim();
    }
  }

  // 5. Degree extraction
  if (/data science|artificial intelligence|machine learning/i.test(rawText) && /degree|b\.s|bachelor|m\.s|master/i.test(rawText)) {
    result.degree = "B.S. Data Science & Artificial Intelligence";
  } else if (/software engineering/i.test(rawText) && /b\.s|bachelor/i.test(rawText)) {
    result.degree = "B.S. Software Engineering";
  } else if (/eecs|electrical engineering/i.test(rawText)) {
    result.degree = "B.S. Electrical Engineering & Computer Science (EECS)";
  } else if (/m\.s\.|master of science/i.test(rawText) && /distributed systems|cloud/i.test(rawText)) {
    result.degree = "M.S. Distributed Systems & Cloud Architecture";
  } else if (/m\.s\.|master of science/i.test(rawText) && /computer science/i.test(rawText)) {
    result.degree = "M.S. Computer Science";
  } else if (/ph\.?d\.?/i.test(rawText) && /computer science/i.test(rawText)) {
    result.degree = "Ph.D. Computer Science / Engineering";
  } else if (/computer science|b\.s\.|bachelor of science/i.test(rawText)) {
    result.degree = "B.S. Computer Science";
  } else if (/self[- ]taught|developer/i.test(rawText)) {
    result.degree = "Other / Self-Taught Developer";
  } else {
    result.degree = "B.S. Computer Science";
  }

  // 6. Graduation Year extraction
  const eduIndex = rawText.toLowerCase().indexOf('education');
  const searchArea = eduIndex !== -1 ? rawText.slice(eduIndex) : rawText;
  const yearMatchesInEdu = searchArea.match(/\b(20[123]\d)\b/g);
  if (yearMatchesInEdu && yearMatchesInEdu.length > 0) {
    result.gradYear = Number(yearMatchesInEdu[0]);
  } else {
    const allYears = rawText.match(/\b(20[123]\d)\b/g);
    if (allYears && allYears.length > 0) {
      result.gradYear = Number(allYears[allYears.length - 1]);
    } else {
      result.gradYear = 2024;
    }
  }

  return result;
}

export async function extractCandidateFieldsFromResume(rawResumeText: string): Promise<ExtractedCandidateProfile> {
  const heuristicResult = extractCandidateFieldsHeuristic(rawResumeText);

  if (!rawResumeText || rawResumeText.trim().length < 30) {
    return heuristicResult;
  }

  try {
    const CandidateProfileSchema = z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      mobile: z.string().optional(),
      college: z.string().optional(),
      degree: z.string().optional(),
      gradYear: z.number().int().optional(),
    });

    const prompt = `Extract candidate details from this resume text into JSON format:
{
  "name": "Full name of candidate",
  "email": "Email address",
  "mobile": "10-digit or international formatted phone number",
  "college": "University or college attended",
  "degree": "Degree name (e.g. B.S. Computer Science, M.S. Computer Science, B.S. Software Engineering)",
  "gradYear": 2024
}

Resume text:
${rawResumeText.slice(0, 3000)}`;

    const llmResult = await Promise.race([
      llmRouter.structuredOutput<z.infer<typeof CandidateProfileSchema>>(
        {
          model: 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert resume parsing engine. Extract contact and education fields accurately. Return JSON matching the schema.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 500
        },
        CandidateProfileSchema
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500))
    ]);

    if (llmResult) {
      return {
        rawResumeText,
        name: llmResult.name || heuristicResult.name,
        email: llmResult.email || heuristicResult.email,
        mobile: llmResult.mobile || heuristicResult.mobile,
        college: llmResult.college || heuristicResult.college,
        degree: llmResult.degree || heuristicResult.degree,
        gradYear: llmResult.gradYear || heuristicResult.gradYear,
      };
    }
  } catch (err) {
    console.warn('LLM resume profile extraction fallback to heuristics:', err);
  }

  return heuristicResult;
}
