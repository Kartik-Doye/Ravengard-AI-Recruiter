import { z } from 'zod';

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  mobile: z.string().regex(/^\+?[0-9\s\-]+$/, "Invalid mobile number."),
  email: z.string().email("Email format is invalid."),
  college: z.string().min(1, "College name is required."),
  degree: z.string().min(1, "Degree is required."),
  gradYear: z.coerce.number().int().max(new Date().getFullYear(), "Graduation year cannot be in the future."),
  preferredLanguage: z.enum(['English', 'Spanish', 'French', 'Hindi'], {
    errorMap: () => ({ message: "Invalid preferred language." })
  }),
});

export type RegistrationData = z.infer<typeof registrationSchema>;
