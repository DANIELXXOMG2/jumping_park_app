import {
	getDocRef,
	runInTransaction,
	serverTimestamp,
} from '@/lib/firestoreService'

const COLLECTION = 'rate_limits'

export interface RateLimitResult {
	success: boolean
	remaining: number
	resetAt: number
	retryAfterSeconds: number
	reason: 'allowed' | 'rate_limited' | 'unavailable'
}

function sanitizeDocId(input: string): string {
	return Buffer.from(input).toString('base64url')
}

function secondsUntil(timestamp: number): number {
	return Math.max(1, Math.ceil((timestamp - Date.now()) / 1000))
}

export async function checkRateLimit(
	identifier: string,
	limit: number,
	windowMinutes: number,
): Promise<RateLimitResult> {
	const docId = sanitizeDocId(identifier)
	const docRef = getDocRef(COLLECTION, docId)
	const windowMs = windowMinutes * 60 * 1000
	const ttlExtraMs = 60 * 60 * 1000

	try {
		return await runInTransaction(async (transaction) => {
			const doc = await transaction.get(docRef)
			const now = Date.now()

			if (!doc.exists) {
				const resetAt = now + windowMs
				transaction.set(docRef, {
					count: 1,
					resetAt,
					expireAt: new Date(resetAt + ttlExtraMs),
					identifier,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				})

				return {
					success: true,
					remaining: limit - 1,
					resetAt,
					retryAfterSeconds: secondsUntil(resetAt),
					reason: 'allowed' as const,
				}
			}

			const data = doc.data()
			const storedResetAt = data?.resetAt ?? 0

			if (now > storedResetAt) {
				const resetAt = now + windowMs
				transaction.set(docRef, {
					count: 1,
					resetAt,
					expireAt: new Date(resetAt + ttlExtraMs),
					identifier,
					createdAt: data?.createdAt ?? serverTimestamp(),
					updatedAt: serverTimestamp(),
				})

				return {
					success: true,
					remaining: limit - 1,
					resetAt,
					retryAfterSeconds: secondsUntil(resetAt),
					reason: 'allowed' as const,
				}
			}

			const currentCount = data?.count ?? 0

			if (currentCount >= limit) {
				return {
					success: false,
					remaining: 0,
					resetAt: storedResetAt,
					retryAfterSeconds: secondsUntil(storedResetAt),
					reason: 'rate_limited' as const,
				}
			}

			transaction.update(docRef, {
				count: currentCount + 1,
				updatedAt: serverTimestamp(),
			})

			return {
				success: true,
				remaining: limit - currentCount - 1,
				resetAt: storedResetAt,
				retryAfterSeconds: secondsUntil(storedResetAt),
				reason: 'allowed' as const,
			}
		})
	} catch (error) {
		console.error('[RateLimit] Error en transaccion:', error)
		const resetAt = Date.now() + windowMs
		return {
			success: false,
			remaining: 0,
			resetAt,
			retryAfterSeconds: secondsUntil(resetAt),
			reason: 'unavailable',
		}
	}
}
