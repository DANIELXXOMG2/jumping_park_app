import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email("Correo no válido").optional(),
  cedula: z
    .string()
    .min(6, "La cedula debe tener al menos 6 caracteres")
    .max(15, "La cedula no puede exceder 15 caracteres")
    .optional(),
}).refine((data) => data.email || data.cedula, {
  message: "Debe proporcionar email o cédula",
  path: ["email"],
});

export const validateOtpSchema = z.object({
  email: z.string().email("Correo no válido").optional(),
  cedula: z.string().optional(),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
}).refine((data) => data.email || data.cedula, {
  message: "Debe proporcionar email o cédula",
  path: ["email"],
});
