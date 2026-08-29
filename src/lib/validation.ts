import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  mobile: z.string().optional(),
  college: z.string().optional(),
  degree: z.string().optional(),
  gradYear: z.coerce.number().optional(),
  preferredLanguage: z.string().optional()
});
