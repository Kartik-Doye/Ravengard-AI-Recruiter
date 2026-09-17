import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  college: z.string().min(1, "College is required"),
  degree: z.string().min(1, "Degree is required"),
  gradYear: z.coerce.number().int().min(1900, "Valid graduation year is required"),
  preferredLanguage: z.string().min(1, "Preferred language is required")
});

export const reportSchema = z.object({
  overallScore: z.number().min(0).max(100).default(0),
  breakdown: z.record(z.string(), z.number().min(0).max(100)).default({}),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendation: z.enum(['strong_hire', 'hire', 'weak_hire', 'no_hire']).default('no_hire'),
  evidence: z.array(z.any()).default([]) // Assuming evidence has a varied structure for now
});
