import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function validateRegistration(data: any) {
  const prompt = `
You are Ravengard AI Recruiter’s Registration Validation Engine.
Validate the candidate profile for completeness and correctness.

You must:
1. Check whether all required fields are present.
2. Detect invalid formats such as a future graduation year or malformed email.
3. Return a strict JSON object.
4. If valid, generate a short welcome message in a warm professional tone.
5. If invalid, return only validation errors and no welcome message.

Rules:
- Do not invent any data.
- Do not repeat sensitive data such as mobile numbers.
- Do not output extra commentary.
- Keep the response schema stable.

Data:
${JSON.stringify(data, null, 2)}
`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            errors: { type: Type.ARRAY, items: { type: Type.STRING } },
            welcomeMessage: { type: Type.STRING, nullable: true },
          },
          required: ['valid', 'errors'],
        }
      }
    });
    const result = JSON.parse(response.text);
    return {
      valid: result.valid,
      errors: result.errors || [],
      welcomeMessage: result.welcomeMessage || null
    };
  } catch (e) {
    return {
      valid: false,
      errors: ["Unable to validate registration right now. Please check your input and try again."],
      welcomeMessage: null
    };
  }
}

export async function generateWelcomeChecklist(candidate: any) {
  const prompt = `
You are Ravengard AI Recruiter’s Readiness Coach. Your job is to:
1. Assess the candidate’s profile to personalize the welcome text.
2. Generate a short explanation of what Ravengard AI Recruiter does (guided, sequential interview).
3. State the estimated time required for the full session (e.g. 60-90 minutes).
4. Explain that they will move to policy consent next.
5. Provide a readiness checklist.

Rules:
- Include the candidate's name.
- Keep the message concise and direct.
- Do not use technical jargon.
- Do not invent profile data.
- Return a strictly formatted JSON object.

Candidate Data:
${JSON.stringify(candidate, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['message', 'checklist']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Welcome Generation Error:", error);
    return null;
  }
}

export async function validatePolicyConsent(question: string) {
  const prompt = `
You are Ravengard AI Recruiter’s Compliance Assistant. Your job is to:
1. Summarize the Policy & Consent terms in 3–4 simple bullet points (no legalese).
2. Emphasize the “one-time acceptance, no restart” rule clearly.
3. Ask for explicit confirmation (e.g., “Type ‘I Agree’ to proceed”).
4. If candidate confirms, generate a session lock confirmation message.

Rules:
- Use plain language (Grade 8 reading level).
- Highlight consequences of acceptance (locked session, no skip/restart).
- If candidate hesitates, offer to clarify specific points.
- Never proceed without explicit “I Agree”.

Candidate Input: "${question}"
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

export async function analyzeResume(resumeText: string, targetRole: string = "Software Engineer") {
  const prompt = `
You are Ravengard AI Recruiter’s Resume Intelligence Engine. Perform the following tasks in one pass:

Task 1: Resume Parser
1. Extract candidate’s name, email, phone from the resume.
2. Parse skills into a flat list.
3. Extract projects: { title, description, technologies, duration }.
4. Extract work experience: { company, role, duration, responsibilities[] }.
5. Extract education: { degree, college, year }.
6. Extract certifications: { name, issuer, year }.

Task 2: ATS Scoring Engine
1. Score the resume from 0–100 based on completeness, formatting, keyword richness, quantifiable achievements. Average is 60-75.
2. Identify 3–5 specific strengths.
3. Identify 3–5 specific weaknesses.
4. List 5–10 missing keywords relevant to target role (${targetRole}).

Task 3: Recruiter Review Assistant
1. Write a 3–4 sentence summary of the candidate’s resume as a recruiter would.
2. Highlight key strengths, notable projects, and red flags.
3. Mention ATS score and top 3 missing keywords.
4. Keep tone professional but approachable. Max 80 words.

Raw Resume Text:
"""
${resumeText.substring(0, 30000)}
"""
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          projects: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                duration: { type: Type.STRING }
              }
            } 
          },
          experience: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                duration: { type: Type.STRING },
                responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            } 
          },
          education: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                degree: { type: Type.STRING },
                college: { type: Type.STRING },
                year: { type: Type.INTEGER }
              }
            } 
          },
          certifications: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                name: { type: Type.STRING },
                issuer: { type: Type.STRING },
                year: { type: Type.INTEGER }
              }
            } 
          },
          atsScore: { type: Type.INTEGER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          recruiterReviewText: { type: Type.STRING }
        },
        required: ['atsScore']
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateInstructionsResponse(candidateProfile: any, text: string = "") {
  const prompt = `
You are Ravengard AI Recruiter’s Interview Guide. Your job is to:
1. Summarize the interview process in 4–6 bullet points (max 60 words total).
2. Highlight key rules: no restarts, auto-save, Think Again (2 uses), timer, anti-cheat.
3. Mention the 8 rounds briefly (HR → Aptitude → Technical → Senior SWE → Tech Lead → Behavior → Startup → Strict).
4. End with a clear call-to-action: “Type ‘I Understand’ to proceed to Device Check.”

Rules:
- Use simple, encouraging language (Grade 8 reading level).
- Do not use jargon like “proctoring” or “latency.”
- If candidate asks for clarification, explain specific rules in 1–2 sentences.
- Never proceed without explicit “I Understand” confirmation.

Candidate profile: ${JSON.stringify(candidateProfile)}
Candidate says: "${text}"
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

export async function validateDeviceCheck(results: any) {
  const prompt = `
You are Ravengard AI Recruiter’s Device Support Assistant. Your job is to:
1. Review the device check results (camera, mic, speaker, browser, internet).
2. If all pass: Generate a short success message (max 20 words).
3. If any fail: Provide specific, actionable troubleshooting steps (max 3 bullets).
4. Keep tone supportive, not technical.

Rules:
- Do not mention APIs or error codes.
- Suggest browser switches (Chrome/Edge) if unsupported.
- For mic/camera issues, suggest checking OS permissions.
- If internet is slow, suggest moving closer to router or using mobile hotspot.
- End with a JSON output.

Device check results: ${JSON.stringify(results)}
`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          allPassed: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
        },
        required: ['allPassed', 'message'],
      }
    }
  });

  return JSON.parse(response.text);
}

export async function confirmReadiness(candidateName: string, sessionId: string, text: string) {
  const prompt = `
You are Ravengard AI Recruiter’s Readiness Confirmer. Your job is to:
1. Confirm all device checks passed.
2. Remind candidate of the “no restart” rule one final time.
3. Ask for explicit confirmation: “Type ‘I’m Ready’ to enter the Waiting Room.”
4. If confirmed, generate a session lock message with session ID and start time.

Rules:
- Keep message under 40 words.
- Use encouraging tone (“You’ve got this!”).
- Do not proceed without “I’m Ready” confirmation.

Candidate Name: ${candidateName}
Session ID: ${sessionId}
Candidate says: "${text}"
`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}
