import { z } from "zod";

/**
 * Esquemas Zod para validar la estructura del contenido legal.
 * 
 * IMPORTANTE: Estos esquemas validan ESTRUCTURA, no CANTIDAD.
 * El admin puede agregar o eliminar cláusulas/reglas libremente.
 * Solo se rechaza si la estructura está corrupta (campos faltantes).
 */

// ============================================================================
// SCHEMA: Cláusula del Consentimiento
// ============================================================================

export const consentClauseSchema = z.object({
	/** ID único de la cláusula (requerido) */
	id: z.number(),
	/** Texto de la cláusula (requerido, no vacío) */
	text: z.string().min(1, "El texto de la cláusula no puede estar vacío"),
	/** Resaltar como importante (opcional) */
	highlight: z.boolean().optional(),
	/** Icono/emoji para highlights (opcional) */
	icon: z.string().optional(),
	/** Etiqueta del highlight (opcional) */
	highlightLabel: z.string().optional(),
});

// ============================================================================
// SCHEMA: Regla del Parque
// ============================================================================

export const parkRuleSchema = z.object({
	/** ID único de la regla (requerido) */
	id: z.number(),
	/** Texto de la regla (requerido, no vacío) */
	text: z.string().min(1, "El texto de la regla no puede estar vacío"),
	/** Resaltar como importante (opcional) */
	highlight: z.boolean().optional(),
	/** Icono/emoji para highlights (opcional) */
	icon: z.string().optional(),
	/** Etiqueta del highlight (opcional) */
	highlightLabel: z.string().optional(),
});

// ============================================================================
// SCHEMA: Metadatos del documento
// ============================================================================

export const consentMetaSchema = z.object({
	version: z.string().min(1),
	lastUpdated: z.string().min(1),
	companyName: z.string().min(1, "El nombre de la empresa es requerido"),
});

// ============================================================================
// SCHEMA: Sección de Consentimiento
// ============================================================================

export const consentSectionSchema = z.object({
	title: z.string().min(1, "El título es requerido"),
	subtitle: z.string().min(1, "El subtítulo es requerido"),
	introduction: z.string().min(1, "La introducción es requerida"),
	/** Array de cláusulas - puede tener cualquier cantidad (incluso 0) */
	clauses: z.array(consentClauseSchema),
	closingStatement: z.string().min(1, "La declaración de cierre es requerida"),
});

// ============================================================================
// SCHEMA: Sección de Reglas
// ============================================================================

export const rulesSectionSchema = z.object({
	title: z.string().min(1, "El título es requerido"),
	introduction: z.string().min(1, "La introducción es requerida"),
	/** Array de reglas - puede tener cualquier cantidad (incluso 0) */
	items: z.array(parkRuleSchema),
	closingMessage: z.string().min(1, "El mensaje de cierre es requerido"),
});

// ============================================================================
// SCHEMA: Estructura Localizada del Consentimiento (por idioma)
// ============================================================================

/**
 * Esquema para el contenido de un idioma específico.
 * Contiene meta, consent y rules para UN idioma.
 */
export const localizedConsentSchema = z.object({
	meta: consentMetaSchema,
	consent: consentSectionSchema,
	rules: rulesSectionSchema,
});

// ============================================================================
// SCHEMA: Estructura Multilenguaje del Consentimiento
// ============================================================================

/**
 * Esquema principal que soporta múltiples idiomas.
 * Estructura: { es: {...}, en: {...}, fr: {...}, ... }
 * 
 * Usa z.record para permitir claves de idioma dinámicas (ISO 639-1).
 * Ejemplo de claves válidas: "es", "en", "fr", "pt", etc.
 */
export const consentContentStructureSchema = z.record(
	z.string().min(2).max(5), // Claves ISO 639-1 (ej: "es", "en", "pt-BR")
	localizedConsentSchema
).refine(
	(data) => Object.keys(data).length > 0,
	{ message: "Debe existir al menos un idioma configurado" }
);

/**
 * Esquema alternativo con idiomas obligatorios (ES) y opcionales.
 * Útil si se quiere forzar que siempre exista español.
 */
export const consentContentWithRequiredLanguagesSchema = z.object({
	es: localizedConsentSchema, // Español es obligatorio
}).catchall(localizedConsentSchema); // Otros idiomas son opcionales

// ============================================================================
// TIPOS INFERIDOS
// ============================================================================

export type ConsentClauseValidated = z.infer<typeof consentClauseSchema>;
export type ParkRuleValidated = z.infer<typeof parkRuleSchema>;
/** Tipo para el contenido de UN idioma */
export type LocalizedConsentValidated = z.infer<typeof localizedConsentSchema>;
/** Tipo para el documento completo multilenguaje */
export type ConsentContentStructureValidated = z.infer<typeof consentContentStructureSchema>;
/** Tipo alternativo con español obligatorio */
export type ConsentContentWithRequiredLanguages = z.infer<typeof consentContentWithRequiredLanguagesSchema>;

// ============================================================================
// FUNCIÓN DE VALIDACIÓN
// ============================================================================

/**
 * Valida que los datos de Firestore tengan la estructura multilenguaje correcta.
 * NO valida cantidad de elementos, solo estructura.
 * 
 * @param data - Datos a validar (estructura multilenguaje)
 * @returns { success: true, data } si es válido, { success: false, error } si no
 */
export function validateConsentContent(data: unknown): 
	| { success: true; data: ConsentContentStructureValidated }
	| { success: false; error: string } {
	try {
		const validated = consentContentStructureSchema.parse(data);
		return { success: true, data: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
			return { success: false, error: `Estructura inválida: ${messages}` };
		}
		return { success: false, error: "Error desconocido al validar estructura" };
	}
}

/**
 * Valida el contenido de UN idioma específico.
 * 
 * @param data - Datos a validar (estructura de un solo idioma)
 * @returns { success: true, data } si es válido, { success: false, error } si no
 */
export function validateLocalizedContent(data: unknown): 
	| { success: true; data: LocalizedConsentValidated }
	| { success: false; error: string } {
	try {
		const validated = localizedConsentSchema.parse(data);
		return { success: true, data: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
			return { success: false, error: `Estructura de idioma inválida: ${messages}` };
		}
		return { success: false, error: "Error desconocido al validar estructura de idioma" };
	}
}

/**
 * Type Guard para verificar si un objeto tiene la estructura multilenguaje.
 * Usa validación Zod internamente.
 */
export function isValidConsentContent(data: unknown): data is ConsentContentStructureValidated {
	return validateConsentContent(data).success;
}

/**
 * Type Guard para verificar si un objeto tiene la estructura de UN idioma.
 */
export function isValidLocalizedContent(data: unknown): data is LocalizedConsentValidated {
	return validateLocalizedContent(data).success;
}

/**
 * Detecta si los datos están en formato antiguo (plano) o nuevo (multilenguaje).
 * Formato antiguo: tiene 'meta', 'consent', 'rules' en la raíz.
 * Formato nuevo: tiene claves de idioma ('es', 'en', etc.) en la raíz.
 * 
 * @param data - Datos a analizar
 * @returns 'legacy' | 'multilang' | 'unknown'
 */
export function detectConsentFormat(data: unknown): 'legacy' | 'multilang' | 'unknown' {
	if (!data || typeof data !== 'object') return 'unknown';
	
	const obj = data as Record<string, unknown>;
	
	// Formato antiguo: tiene meta, consent, rules en la raíz
	if ('meta' in obj && 'consent' in obj && 'rules' in obj) {
		return 'legacy';
	}
	
	// Formato nuevo: las claves son códigos de idioma
	const keys = Object.keys(obj);
	if (keys.length > 0 && keys.every(k => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) {
		return 'multilang';
	}
	
	return 'unknown';
}
