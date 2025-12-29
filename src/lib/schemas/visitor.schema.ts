import { z } from "zod";

/**
 * Regex para validar nombres con soporte UTF-8 completo.
 * Permite: letras (incluyendo tildes, ñ, ü, etc.), espacios, apóstrofes y guiones.
 * Ejemplos válidos: "María José", "O'Brien", "Jean-Pierre", "Müller", "José Ñoño"
 */
const UTF8_NAME_REGEX = /^[\p{L}\p{M}'\-\s]+$/u;

/**
 * Regex para validar documentos alfanuméricos (soporta pasaportes).
 * Permite: letras mayúsculas/minúsculas y números.
 * Sin espacios ni caracteres especiales.
 * Ejemplos válidos: "AB123456", "12345678", "PA1234567"
 */
const ALPHANUMERIC_DOC_REGEX = /^[a-zA-Z0-9]+$/;

export const visitorSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(3, "Ingresá al menos 3 caracteres")
		.max(80, "Máximo 80 caracteres")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),
	email: z.string().trim().email("Correo no válido"),
	phone: z
		.string()
		.trim()
		.min(7, "Ingresá al menos 7 dígitos")
		.max(15, "Máximo 15 caracteres")
		.regex(/^[0-9+\s-]+$/, "Solo números, espacios o + -"),
	address: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
	/** Documento de identidad: soporta cédulas numéricas y pasaportes alfanuméricos */
	cedula: z
		.string()
		.trim()
		.min(5, "Mínimo 5 caracteres")
		.max(20, "Máximo 20 caracteres")
		.regex(
			ALPHANUMERIC_DOC_REGEX,
			"Solo letras y números (sin espacios ni caracteres especiales)",
		),
});

export type VisitorFormValues = z.infer<typeof visitorSchema>;
