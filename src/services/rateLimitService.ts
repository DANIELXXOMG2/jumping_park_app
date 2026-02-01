/**
 * Servicio de Rate Limiting usando Firestore.
 *
 * Implementa un sistema de límite de peticiones basado en ventanas de tiempo
 * para mitigar ataques de fuerza bruta (ej: OTP spam).
 *
 * Usa la colección `rate_limits` con TTL automático de Firestore.
 * Requiere configurar TTL policy en Firestore para el campo `expireAt`.
 */

import { db } from "@/lib/firebaseAdmin";

const COLLECTION = "rate_limits";

export interface RateLimitResult {
	/** Si la petición está permitida */
	success: boolean;
	/** Intentos restantes en la ventana actual */
	remaining: number;
	/** Timestamp (ms) cuando se resetea el límite */
	resetAt: number;
}

/**
 * Verifica y actualiza el rate limit para un identificador.
 *
 * @param identifier - Identificador único (ej: email, IP, o combinación)
 * @param limit - Número máximo de intentos permitidos
 * @param windowMinutes - Duración de la ventana en minutos
 * @returns Resultado con estado y metadatos
 *
 * @example
 * ```ts
 * const result = await checkRateLimit("user@email.com", 5, 15);
 * if (!result.success) {
 *   return res.status(429).json({ error: "Too many requests" });
 * }
 * ```
 */
export async function checkRateLimit(
	identifier: string,
	limit: number,
	windowMinutes: number,
): Promise<RateLimitResult> {
	// Sanitizar identifier para usarlo como document ID
	const docId = sanitizeDocId(identifier);
	const docRef = db.collection(COLLECTION).doc(docId);
	const windowMs = windowMinutes * 60 * 1000;
	const ttlExtraMs = 60 * 60 * 1000; // 1 hora extra para TTL

	try {
		const result = await db.runTransaction(async (transaction) => {
			const doc = await transaction.get(docRef);
			const now = Date.now();

			// Caso 1: No existe o ventana expirada → crear/resetear
			if (!doc.exists) {
				const resetAt = now + windowMs;
				const expireAt = new Date(resetAt + ttlExtraMs);

				transaction.set(docRef, {
					count: 1,
					resetAt,
					expireAt, // Para TTL de Firestore
					identifier, // Guardamos el original para debug
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return {
					success: true,
					remaining: limit - 1,
					resetAt,
				};
			}

			const data = doc.data();
			const storedResetAt = data?.resetAt ?? 0;

			// Caso 2: Ventana expirada → resetear
			if (now > storedResetAt) {
				const resetAt = now + windowMs;
				const expireAt = new Date(resetAt + ttlExtraMs);

				transaction.set(docRef, {
					count: 1,
					resetAt,
					expireAt,
					identifier,
					createdAt: data?.createdAt ?? new Date(),
					updatedAt: new Date(),
				});

				return {
					success: true,
					remaining: limit - 1,
					resetAt,
				};
			}

			// Caso 3: Dentro de ventana válida
			const currentCount = data?.count ?? 0;

			// Límite alcanzado
			if (currentCount >= limit) {
				return {
					success: false,
					remaining: 0,
					resetAt: storedResetAt,
				};
			}

			// Incrementar contador
			transaction.update(docRef, {
				count: currentCount + 1,
				updatedAt: new Date(),
			});

			return {
				success: true,
				remaining: limit - currentCount - 1,
				resetAt: storedResetAt,
			};
		});

		return result;
	} catch (error) {
		console.error("[RateLimit] Error en transacción:", error);
		// En caso de error, permitimos la petición para no bloquear usuarios
		// (fail-open para mejor UX, pero logueamos para monitoreo)
		return {
			success: true,
			remaining: limit,
			resetAt: Date.now() + windowMs,
		};
	}
}

/**
 * Sanitiza un string para usarlo como document ID en Firestore.
 * Reemplaza caracteres no permitidos.
 */
function sanitizeDocId(input: string): string {
	// Firestore no permite: /, ., #, $, [, ]
	// Usamos base64url-safe encoding para emails/IPs
	return Buffer.from(input).toString("base64url");
}


