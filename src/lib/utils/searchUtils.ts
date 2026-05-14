/**
 * Utilidades para búsqueda de texto optimizadas para español.
 *
 * Incluye:
 * - Normalización de tildes (acentos)
 * - Generación de tokens de búsqueda
 * - Normalización de texto para comparación
 */

/**
 * Normaliza un texto quitando tildes y convirtiendo a minúsculas.
 *
 * Ejemplo: "María José" → "maria jose"
 */
export function normalizeText(text: string): string {
	if (!text) return "";

	return text
		.toLowerCase()
		.trim()
		.normalize("NFD") // Descompone caracteres acentuados (á → a + ´)
		.replace(/[\u0300-\u036f]/g, ""); // Elimina los diacríticos (tildes)
}

/**
 * Genera tokens de búsqueda a partir de un nombre completo.
 *
 * Normaliza tildes y genera variaciones para búsqueda flexible.
 *
 * Ejemplo: "María José Cubides" → ["maria", "jose", "cubides", "mariajose", "josecubides", "mariajosecubides"]
 */
export function generateSearchTokens(fullName: string): string[] {
	if (!fullName) return [];

	// Normalizar tildes antes de generar tokens
	const normalized = normalizeText(fullName);
	const words = normalized.split(/\s+/).filter((w) => w.length > 0);

	if (words.length === 0) return [];

	const tokens = new Set<string>();

	// Agregar cada palabra individual
	words.forEach((word) => {
		tokens.add(word);
	});

	// Combinaciones de 2 palabras consecutivas
	for (let i = 0; i < words.length - 1; i++) {
		tokens.add(words[i] + words[i + 1]);
	}

	// Si hay más de 2 palabras, agregar todas juntas
	if (words.length > 2) {
		tokens.add(words.join(""));
	}

	return Array.from(tokens);
}

/**
 * Extrae tokens de email para búsqueda.
 *
 * Ejemplo: "maria@gmail.com" → ["maria@gmail.com", "maria", "gmail"]
 */
export function extractEmailTokens(email: string): string[] {
	if (!email) return [];

	const normalized = email.toLowerCase().trim();
	const tokens = new Set<string>();

	tokens.add(normalized);

	const localPart = normalized.split("@")[0];
	if (localPart) {
		tokens.add(localPart);
		localPart.split(/[._-]/).forEach((part) => {
			if (part.length > 2) tokens.add(part);
		});
	}

	return Array.from(tokens);
}
