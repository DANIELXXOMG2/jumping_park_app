import { z } from "zod";

export const minorSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido (mínimo 3 caracteres)"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD"),
  relationship: z.enum(["hijo", "sobrino", "nieto", "otro"], {
    errorMap: () => ({ message: "Parentesco inválido" }),
  }),
});

export const consentSchema = z.object({
  acceptedPolicy: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
  minors: z.array(minorSchema),
  signature: z.string().min(1, "La firma es obligatoria"), // Base64 string
});

export const consentSubmissionSchema = consentSchema.extend({
  responsibleAdult: z.object({
    fullName: z.string(),
    documentId: z.string(), // This corresponds to uid in UserProfile
    email: z.string().email(),
    phone: z.string(),
  }),
});

export type Minor = z.infer<typeof minorSchema>;
export type ConsentFormData = z.infer<typeof consentSchema>;
export type ConsentSubmission = z.infer<typeof consentSubmissionSchema>;
