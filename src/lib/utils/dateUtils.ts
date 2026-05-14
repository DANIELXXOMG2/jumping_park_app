/**
 * Utilidades para manejo de fechas, especialmente conversión de Firestore Timestamps.
 * Centraliza la lógica de conversión para evitar código duplicado.
 */

/**
 * Tipo que representa un valor de fecha de Firestore.
 * Puede ser un Date nativo, un Firestore Timestamp, o un string ISO.
 */
export type FirestoreDateValue =
	| Date
	| { toDate: () => Date }
	| { toDate?: () => Date }
	| string
	| number;

/**
 * Convierte un valor de fecha de Firestore (Timestamp) a un objeto Date nativo de JavaScript.
 * Maneja múltiples formatos de entrada de forma segura.
 *
 * @param value - El valor a convertir (Date, Firestore Timestamp, string ISO, o número)
 * @returns Un objeto Date nativo
 *
 * @example
 * // Desde Firestore Timestamp
 * const date = toJsDate(doc.data().createdAt);
 *
 * @example
 * // Desde Date nativo (pass-through)
 * const date = toJsDate(new Date());
 *
 * @example
 * // Desde string ISO
 * const date = toJsDate("2024-12-16T10:30:00Z");
 */
export function toJsDate(value: FirestoreDateValue): Date {
	// Ya es un Date nativo
	if (value instanceof Date) {
		return value;
	}

	// Es un Firestore Timestamp (tiene método toDate)
	if (
		value &&
		typeof value === "object" &&
		"toDate" in value &&
		typeof value.toDate === "function"
	) {
		return value.toDate();
	}

	// Es un string ISO o número (timestamp en ms)
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
	}

	// Fallback: retornar fecha actual si el valor es inválido
	console.warn(
		"[toJsDate] Valor de fecha no reconocido, usando fecha actual:",
		value,
	);
	return new Date();
}

/**
 * Verifica si una fecha ha expirado (es anterior o igual a la fecha actual).
 *
 * @param value - El valor de fecha a verificar
 * @returns true si la fecha ha expirado, false si aún es válida
 */
export function isExpired(value: FirestoreDateValue): boolean {
	const date = toJsDate(value);
	return date <= new Date();
}

// ============================================================================
// ZONA HORARIA DE COLOMBIA
// ============================================================================

/**
 * Offset de Colombia en horas respecto a UTC.
 * Colombia no tiene horario de verano, siempre es UTC-5.
 */
const COLOMBIA_OFFSET_HOURS = -5;

/**
 * Obtiene el inicio del día actual (medianoche) en zona horaria de Colombia,
 * retornando un Date que puede ser usado en queries de Firestore.
 *
 * CRÍTICO: Esta función es esencial para que los reportes de "hoy" funcionen
 * correctamente tanto en desarrollo local como en producción (Vercel usa UTC).
 *
 * @returns Date object representando la medianoche de Colombia en formato UTC
 *
 * @example
 * // En un API route
 * const todayStart = getTodayStartColombia();
 * const snapshot = await db.collection("consents")
 *   .where("signedAt", ">=", todayStart)
 *   .get();
 */
export function getTodayStartColombia(): Date {
	const utcTimestamp = Date.now();

	// Ajustar a zona horaria de Colombia (UTC-5)
	const colombiaTimestamp = utcTimestamp + COLOMBIA_OFFSET_HOURS * 3600000;

	// Calcular inicio del día en Colombia (truncate a día)
	const colombiaDayStart = Math.floor(colombiaTimestamp / 86400000) * 86400000;

	// Convertir de vuelta a UTC
	const utcDayStart = colombiaDayStart - COLOMBIA_OFFSET_HOURS * 3600000;

	return new Date(utcDayStart);
}

/**
 * Obtiene un rango de fechas ajustado a la zona horaria de Colombia.
 *
 * @param period - El período a calcular ('today', 'week', 'month', 'year', 'all')
 * @returns Objeto con fechas start y end en formato UTC compatible con Firestore
 */
export function getDateRangeColombia(
	period: "today" | "week" | "month" | "year" | "all",
): { start: Date; end: Date } {
	const utcTimestamp = Date.now();

	// Ajustar a zona horaria de Colombia (UTC-5)
	const colombiaTimestamp = utcTimestamp + COLOMBIA_OFFSET_HOURS * 3600000;

	// Calcular fin del día en Colombia y convertir a UTC
	const colombiaDayEnd = Math.ceil(colombiaTimestamp / 86400000) * 86400000 - 1;
	const end = new Date(colombiaDayEnd - COLOMBIA_OFFSET_HOURS * 3600000);

	// Calcular inicio según el período
	let colombiaStartTimestamp: number;

	switch (period) {
		case "today":
			colombiaStartTimestamp =
				Math.floor(colombiaTimestamp / 86400000) * 86400000;
			break;
		case "week":
			colombiaStartTimestamp =
				Math.floor(colombiaTimestamp / 86400000) * 86400000 - 7 * 86400000;
			break;
		case "month": {
			const colombiaDate = new Date(colombiaTimestamp);
			colombiaDate.setUTCMonth(colombiaDate.getUTCMonth() - 1);
			colombiaStartTimestamp =
				Math.floor(colombiaDate.getTime() / 86400000) * 86400000;
			break;
		}
		case "year": {
			const colombiaDate = new Date(colombiaTimestamp);
			colombiaDate.setUTCFullYear(colombiaDate.getUTCFullYear() - 1);
			colombiaStartTimestamp =
				Math.floor(colombiaDate.getTime() / 86400000) * 86400000;
			break;
		}
		default:
			colombiaStartTimestamp =
				Math.floor(new Date("2020-01-01").getTime() / 86400000) * 86400000;
			break;
	}

	// Convertir start de Colombia a UTC
	const start = new Date(
		colombiaStartTimestamp - COLOMBIA_OFFSET_HOURS * 3600000,
	);

	return { start, end };
}

// ============================================================================
// CÁLCULO DE EDAD
// ============================================================================

/**
 * Calcula la edad en años a partir de una fecha de nacimiento.
 *
 * @param birthDate - Fecha de nacimiento (string ISO, Date, o Firestore Timestamp)
 * @returns La edad en años como número
 *
 * @example
 * calculateAge("2015-06-15") // => 10 (si hoy es 2026)
 * calculateAge(new Date("2010-03-20")) // => 15
 */
export function calculateAge(
	birthDate: string | Date | FirestoreDateValue,
): number {
	if (!birthDate) return 0;

	const birth =
		birthDate instanceof Date
			? birthDate
			: typeof birthDate === "string"
				? new Date(birthDate)
				: toJsDate(birthDate);

	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
}
