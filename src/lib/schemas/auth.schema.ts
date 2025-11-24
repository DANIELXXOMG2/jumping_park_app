import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email("Correo no válido"),
  cedula: z
    .string()
    .min(6, "La cedula debe tener al menos 6 caracteres")
    .max(12, "La cedula no puede exceder 12 caracteres"),
});

export const validateOtpSchema = z.object({
  email: z.string().email("Correo no válido"),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
