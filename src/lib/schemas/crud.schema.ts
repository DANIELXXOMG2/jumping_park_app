/**
 * Schemas Zod para las colecciones CRUD genéricas.
 * Cada colección tiene su schema de creación (POST) definido aquí.
 */
import { z } from "zod";
import { minorSchema } from "./consent.schema";
import { ALPHANUMERIC_DOC_REGEX, UTF8_NAME_REGEX } from "./shared.regex";

// ============================================================================
// ACCESOS - Registro de entradas/salidas al parque
// ============================================================================

export const accesoCreateSchema = z.object({
	/** ID del usuario (documento de identidad) */
	userId: z
		.string()
		.min(5, "El ID de usuario es requerido")
		.max(20, "Máximo 20 caracteres")
		.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números"),

	/** ID del consentimiento asociado */
	consentId: z.string().min(1, "El ID de consentimiento es requerido"),

	/** Tipo de acceso */
	tipo: z.enum(["entrada", "salida"]).default("entrada"),

	/** Punto de acceso (ej. "Puerta Principal", "Kiosko 1") */
	punto: z.string().optional(),

	/** Notas adicionales */
	notas: z.string().max(500).optional(),
});

// ============================================================================
// MENORES - Menores registrados (standalone, fuera de consentimiento)
// ============================================================================

/**
 * Schema de creación de menor standalone.
 * Reutiliza minorSchema y agrega el campo responsableId.
 */
export const menorCreateSchema = minorSchema.extend({
	/** ID del adulto responsable (documento) */
	responsableId: z
		.string()
		.min(5, "ID del responsable es requerido")
		.max(20, "Máximo 20 caracteres")
		.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números"),
});

// ============================================================================
// USUARIOS - Perfil de usuario (para POST directo, no via consentimiento)
// ============================================================================

export const usuarioCreateSchema = z.object({
	/** Documento del usuario (también es el UID): soporta cédulas y pasaportes */
	uid: z
		.string()
		.min(5, "El documento debe tener al menos 5 caracteres")
		.max(20, "Máximo 20 caracteres")
		.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números"),

	/** Nombre completo con soporte UTF-8 */
	fullName: z
		.string()
		.min(3, "El nombre debe tener al menos 3 caracteres")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),

	/** Correo electrónico */
	email: z.string().email("Correo electrónico inválido"),

	/** Teléfono */
	phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),

	/** Dirección (opcional) */
	address: z.string().max(120).optional(),

	/** Lista de menores a cargo (inicialmente vacía) */
	minors: z.array(minorSchema).default([]),
});
