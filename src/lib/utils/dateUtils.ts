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
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  // Es un string ISO o número (timestamp en ms)
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  // Fallback: retornar fecha actual si el valor es inválido
  console.warn("[toJsDate] Valor de fecha no reconocido, usando fecha actual:", value);
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

/**
 * Formatea una fecha de Firestore a un string legible en español (Colombia).
 *
 * @param value - El valor de fecha a formatear
 * @param options - Opciones de formateo (por defecto incluye hora)
 * @returns String formateado en español
 */
export function formatFirestoreDate(
  value: FirestoreDateValue,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const date = toJsDate(value);
  return date.toLocaleDateString("es-CO", options);
}
