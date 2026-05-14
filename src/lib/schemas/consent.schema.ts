import { z } from "zod";
import { getTranslation, type Language } from "@/lib/i18n/dictionary";
import { ALPHANUMERIC_DOC_REGEX, UTF8_NAME_REGEX } from "./shared.regex";

// ============================================================================
// VALIDACIÓN DE FECHA DE NACIMIENTO
// ============================================================================

/**
 * Schema de fecha de nacimiento con validaciones robustas:
 * - Formato YYYY-MM-DD
 * - No puede ser fecha futura
 * - No puede ser anterior a 1900
 * - Año debe ser lógico (no 200006, etc.)
 */
export const birthDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD")
	.refine(
		(dateStr) => {
			const year = parseInt(dateStr.split("-")[0], 10);
			return year >= 1900;
		},
		{ message: "El año de nacimiento no puede ser anterior a 1900" },
	)
	.refine(
		(dateStr) => {
			const year = parseInt(dateStr.split("-")[0], 10);
			const currentYear = new Date().getFullYear();
			return year <= currentYear;
		},
		{ message: "El año de nacimiento no puede ser en el futuro" },
	)
	.refine(
		(dateStr) => {
			const date = new Date(dateStr);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return date <= today;
		},
		{ message: "La fecha de nacimiento no puede ser futura" },
	)
	.refine(
		(dateStr) => {
			// Rechaza fechas normalizadas por JS (ej. 2024-02-30 → 2024-03-01)
			const date = new Date(dateStr);
			const [year, month, day] = dateStr.split("-").map(Number);
			return (
				date.getUTCFullYear() === year &&
				date.getUTCMonth() + 1 === month &&
				date.getUTCDate() === day
			);
		},
		{ message: "La fecha ingresada no es válida" },
	);

// ============================================================================
// VALIDACIÓN DE EPS
// ============================================================================

/**
 * Schema de EPS como texto libre.
 * Acepta cualquier string (ej: "Sura", "Sanitas", "No tengo", etc.)
 * Compatible con datos legacy en Firebase que usan strings simples.
 */
export const epsSchema = z.string().min(3, "Ingresa el nombre de tu EPS");

// ============================================================================
// SCHEMA DE MENOR
// ============================================================================

export const minorSchema = z.object({
	firstName: z
		.string()
		.min(2, "El nombre es requerido (mínimo 2 caracteres)")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),
	lastName: z
		.string()
		.min(2, "Los apellidos son requeridos (mínimo 2 caracteres)")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),
	birthDate: birthDateSchema,
	eps: epsSchema,
	idType: z.enum(["rc", "ti", "cc", "ce", "pa", "ppt", "otro"], {
		message: "Tipo de identificación inválido",
	}),
	/** Número de documento: soporta cédulas numéricas y pasaportes alfanuméricos */
	idNumber: z
		.string()
		.min(3, "Número de identificación es requerido")
		.max(20, "Máximo 20 caracteres")
		.regex(
			ALPHANUMERIC_DOC_REGEX,
			"Solo letras y números (sin espacios ni caracteres especiales)",
		),
	relationship: z.enum(["hijo", "sobrino", "nieto", "otro"], {
		message: "Parentesco inválido",
	}),
	medicalCondition: z.string().max(200, "Máximo 200 caracteres").optional(),
});

/**
 * Genera el schema de consentimiento con mensajes traducidos
 */
export function getConsentSchema(language: Language = "es") {
	return z.object({
		acceptedPolicy: z.boolean().refine((val) => val === true, {
			message: getTranslation("validation.consent.acceptRequired", language),
		}),
		minors: z.array(minorSchema),
		signature: z
			.string()
			.min(1, getTranslation("validation.consent.signatureRequired", language)),
	});
}

// Schema por defecto (español) para compatibilidad
export const consentSchema = getConsentSchema("es");

export const consentSubmissionSchema = consentSchema.extend({
	responsibleAdult: z.object({
		fullName: z
			.string()
			.min(3, "El nombre debe tener al menos 3 caracteres")
			.regex(
				UTF8_NAME_REGEX,
				"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
			),
		documentId: z
			.string()
			.min(5, "El documento debe tener al menos 5 caracteres")
			.max(20, "Máximo 20 caracteres")
			.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números"),
		email: z.string().email(),
		phone: z.string(),
	}),
	offlineSync: z
		.object({
			dedupeKey: z.string().min(1),
			policyVersion: z.string().min(1),
			signedAtLocal: z.string().datetime(),
		})
		.optional(),
});

export type Minor = z.infer<typeof minorSchema>;
export type ConsentFormData = z.infer<typeof consentSchema>;
export type ConsentSubmission = z.infer<typeof consentSubmissionSchema>;
