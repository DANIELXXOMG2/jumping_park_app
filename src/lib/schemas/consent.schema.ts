import { z } from "zod";

export const minorSchema = z.object({
  firstName: z.string().min(2, "El nombre es requerido (mínimo 2 caracteres)"),
  lastName: z.string().min(2, "Los apellidos son requeridos (mínimo 2 caracteres)"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD"),
  eps: z.string().min(2, "La EPS es requerida"),
  idType: z.enum(["cc", "ti", "passport", "otro"], { message: "Tipo de identificación inválido" }),
  idNumber: z.string().min(3, "Número de identificación es requerido"),
  relationship: z.enum(["hijo", "sobrino", "nieto", "otro"], {
    message: "Parentesco inválido",
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
