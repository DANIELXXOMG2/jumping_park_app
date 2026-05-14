/**
 * Regex compartidas para validaciones de schemas Zod.
 * Centralizadas para evitar duplicación entre módulos.
 */

/**
 * Regex para validar nombres con soporte UTF-8 completo.
 * Permite: letras (incluyendo tildes, ñ, ü, caracteres internacionales), espacios, apóstrofes y guiones.
 */
export const UTF8_NAME_REGEX = /^[\p{L}\p{M}'\-\s]+$/u;

/**
 * Regex para validar documentos alfanuméricos (soporta pasaportes).
 * Permite: letras mayúsculas/minúsculas y números.
 */
export const ALPHANUMERIC_DOC_REGEX = /^[a-zA-Z0-9]+$/;
