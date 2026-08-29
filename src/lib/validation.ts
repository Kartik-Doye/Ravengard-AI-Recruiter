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
