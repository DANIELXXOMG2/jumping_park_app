/**
 * Schemas Zod para las colecciones CRUD genéricas.
 * Cada colección tiene su schema de creación (POST) definido aquí.
 */
import { z } from "zod";
import { birthDateSchema, epsSchema } from "./consent.schema";

// ============================================================================
// REGEX PARA VALIDACIONES INTERNACIONALES
// ============================================================================

/**
 * Regex para validar nombres con soporte UTF-8 completo.
 * Permite: letras (incluyendo tildes, ñ, ü, caracteres internacionales), espacios, apóstrofes y guiones.
 */
const UTF8_NAME_REGEX = /^[\p{L}\p{M}'\-\s]+$/u;

/**
 * Regex para validar documentos alfanuméricos (soporta pasaportes).
 * Permite: letras mayúsculas/minúsculas y números.
 */
const ALPHANUMERIC_DOC_REGEX = /^[a-zA-Z0-9]+$/;

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

export type AccesoCreate = z.infer<typeof accesoCreateSchema>;

// ============================================================================
// MENORES - Menores registrados (standalone, fuera de consentimiento)
// ============================================================================

export const menorCreateSchema = z.object({
	/** Nombre del menor */
	firstName: z
		.string()
		.min(2, "El nombre es requerido")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),

	/** Apellidos del menor */
	lastName: z
		.string()
		.min(2, "Los apellidos son requeridos")
		.regex(
			UTF8_NAME_REGEX,
			"Solo letras (incluyendo tildes y ñ), espacios, apóstrofes y guiones",
		),

	/** Fecha de nacimiento con validación robusta */
	birthDate: birthDateSchema,

	/** EPS validada contra lista oficial de Colombia */
	eps: epsSchema,

	/** Tipo de identificación */
	idType: z.enum(["rc", "ti", "cc", "ce", "pa", "ppt", "otro"]),

	/** Número de identificación: soporta cédulas y pasaportes alfanuméricos */
	idNumber: z
		.string()
		.min(3, "Número de identificación es requerido")
		.max(20, "Máximo 20 caracteres")
		.regex(
			ALPHANUMERIC_DOC_REGEX,
			"Solo letras y números (sin espacios ni caracteres especiales)",
		),

	/** Parentesco con el responsable */
	relationship: z.enum(["hijo", "sobrino", "nieto", "otro"]),

	/** ID del adulto responsable (documento) */
	responsableId: z
		.string()
		.min(5, "ID del responsable es requerido")
		.max(20, "Máximo 20 caracteres")
		.regex(ALPHANUMERIC_DOC_REGEX, "Solo letras y números"),
});

export type MenorCreate = z.infer<typeof menorCreateSchema>;

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
	minors: z.array(z.any()).default([]),
});

export type UsuarioCreate = z.infer<typeof usuarioCreateSchema>;
