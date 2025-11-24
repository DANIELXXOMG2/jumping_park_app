import { z } from "zod";

export const visitorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ingresá al menos 3 caracteres")
    .max(80, "Máximo 80 caracteres"),
  email: z
    .string()
    .trim()
    .email("Correo no válido"),
  phone: z
    .string()
    .trim()
    .min(7, "Ingresá al menos 7 dígitos")
    .max(15, "Máximo 15 caracteres")
    .regex(/^[0-9+\s-]+$/, "Solo números, espacios o + -"),
  address: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .optional(),
  cedula: z
    .string()
    .trim()
    .min(6, "Mínimo 6 dígitos")
    .max(15, "Máximo 15 dígitos")
    .regex(/^\d+$/, "Solo números"),
});

export type VisitorFormValues = z.infer<typeof visitorSchema>;
