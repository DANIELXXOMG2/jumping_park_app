import { z } from "zod";
import { ALPHANUMERIC_DOC_REGEX } from "./shared.regex";

export const sendOtpSchema = z
	.object({
		email: z.string().email("Correo no válido").optional(),
		/** Documento: soporta cédulas numéricas y pasaportes alfanuméricos */
		cedula: z
			.string()
			.min(5, "El documento debe tener al menos 5 caracteres")
			.max(20, "El documento no puede exceder 20 caracteres")
			.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números")
			.optional(),
	})
	.refine((data) => data.email || data.cedula, {
		message: "Debe proporcionar email o documento",
		path: ["email"],
	});

export const validateOtpSchema = z
	.object({
		email: z.string().email("Correo no válido").optional(),
		cedula: z
			.string()
			.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números")
			.optional(),
		code: z.string().length(6, "El código debe tener 6 dígitos"),
	})
	.refine((data) => data.email || data.cedula, {
		message: "Debe proporcionar email o documento",
		path: ["email"],
	});
