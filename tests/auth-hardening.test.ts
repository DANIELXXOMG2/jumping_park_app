import { describe, expect, it } from 'bun:test'
import type {
	OtpChallengeState,
	OtpValidationContext,
	RequestOtpChallengeDeps,
	SendOtpResult,
	ValidateOtpChallengeRequestDeps,
	ValidateOtpResult,
} from '@/services/authService'
import type { RateLimitResult } from '@/services/rateLimitService'
import type { UserProfile } from '@/types/firestore'

process.env.RESEND_API_KEY ??= 're_test_key'

const { requestOtpChallenge, validateOtpChallengeRequest } =
	await import('@/services/authService')

function createAllowedRateLimitResult(remaining: number): RateLimitResult {
	return {
		success: true,
		remaining,
		resetAt: Date.now() + 300_000,
		retryAfterSeconds: 300,
		reason: 'allowed',
	}
}

function createRateLimitedResult(): RateLimitResult {
	return {
		success: false,
		remaining: 0,
		resetAt: Date.now() + 300_000,
		retryAfterSeconds: 300,
		reason: 'rate_limited',
	}
}

function createLockedChallengeState(): OtpChallengeState {
	return {
		email: 'visitor@example.com',
		code: '123456',
		expiresAt: new Date(Date.now() + 300_000),
		attempts: 5,
		lockedUntil: new Date(Date.now() + 300_000),
		lastSentAt: new Date(),
		remainingMinutes: 5,
		locked: true,
		retryAfterSeconds: 300,
	}
}

async function withEnv<T>(
	key: string,
	value: string | undefined,
	callback: () => Promise<T>,
): Promise<T> {
	const previousValue = process.env[key]

	if (value === undefined) {
		delete process.env[key]
	} else {
		process.env[key] = value
	}

	try {
		return await callback()
	} finally {
		if (previousValue === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = previousValue
		}
	}
}

function createRequestDeps(
	overrides: Partial<RequestOtpChallengeDeps>,
): RequestOtpChallengeDeps {
	return {
		getUserByCedula: async () => ({ email: 'visitor@example.com' }) as UserProfile,
		getActiveOtp: async () => null,
		checkRateLimit: async () => createAllowedRateLimitResult(2),
		saveOtp: async () => undefined,
		sendOtpEmail: async () => ({ success: true }) as SendOtpResult,
		...overrides,
	}
}

function createValidationDeps(
	overrides: Partial<ValidateOtpChallengeRequestDeps>,
): ValidateOtpChallengeRequestDeps {
	return {
		resolveOtpValidationContext: async () =>
			({
				targetEmail: 'visitor@example.com',
				userProfile: { uid: '12345678' } as UserProfile,
			}) as OtpValidationContext,
		getActiveOtp: async () => null,
		checkRateLimit: async () => createAllowedRateLimitResult(4),
		validateOtp: async () => ({ valid: true, message: 'OTP valido' }) as ValidateOtpResult,
		validateOtpPermissive: async () =>
			({ valid: true, message: 'OTP valido' }) as ValidateOtpResult,
		createOtpSession: async () => undefined,
		...overrides,
	}
}

describe('OTP hardening', () => {
	it('rate limits OTP requests after the third request in five minutes', async () => {
		await withEnv('OTP_HARDENING_ENABLED', 'true', async () => {
			let requestCount = 0
			const deps = createRequestDeps({
				checkRateLimit: async (identifier) => {
					if (identifier.startsWith('otp:req:ip:')) {
						return createAllowedRateLimitResult(8)
					}

					requestCount += 1

					if (requestCount <= 3) {
						return createAllowedRateLimitResult(3 - requestCount)
					}

					return createRateLimitedResult()
				},
			})

			const attempts = []

			for (let attempt = 0; attempt < 4; attempt += 1) {
				attempts.push(
					await requestOtpChallenge(
						{
							cedula: '12345678',
							clientIp: '203.0.113.10',
							route: '/api/otp',
							rateLimitMax: 3,
							rateLimitWindowMinutes: 5,
							rateLimitIpMultiplier: 3,
							codeGenerator: () => '123456',
						},
						deps,
					),
				)
			}

			expect(attempts[0]?.httpStatus).toBe(200)
			expect(attempts[1]?.httpStatus).toBe(200)
			expect(attempts[2]?.httpStatus).toBe(200)
			expect(attempts[3]?.httpStatus).toBe(429)
			expect(attempts[3]?.body.code).toBe('OTP_RATE_LIMITED')
			expect(attempts[3]?.body.retryAfter).toBeGreaterThan(0)
			expect(attempts[3]?.headers?.['Retry-After']).toBe('300')
			expect(attempts[3]?.headers?.['X-Hardening-Feature']).toBe('otp-hardening')
			expect(attempts[3]?.headers?.['X-Hardening-Status']).toBe('enabled')
		})
	})

	it('returns OTP_LOCKED after repeated incorrect validation attempts', async () => {
		await withEnv('OTP_HARDENING_ENABLED', 'true', async () => {
			let attemptCount = 0
			const deps = createValidationDeps({
				validateOtp: async () => {
					attemptCount += 1

					if (attemptCount < 5) {
						return {
							valid: false,
							message: 'Codigo incorrecto',
							code: 'OTP_INVALID',
						} satisfies ValidateOtpResult
					}

					return {
						valid: false,
						message: 'Session locked',
						code: 'OTP_LOCKED',
						retryAfterSeconds: 300,
					} satisfies ValidateOtpResult
				},
			})

			const attempts = []

			for (let attempt = 0; attempt < 5; attempt += 1) {
				attempts.push(
					await validateOtpChallengeRequest(
						{
							cedula: '12345678',
							code: '000000',
							route: '/api/otp/validate',
							validationLimit: 5,
							validationWindowMinutes: 5,
						},
						deps,
					),
				)
			}

			expect(attempts[0]?.httpStatus).toBe(404)
			expect(attempts[1]?.httpStatus).toBe(404)
			expect(attempts[2]?.httpStatus).toBe(404)
			expect(attempts[3]?.httpStatus).toBe(404)
			expect(attempts[4]?.httpStatus).toBe(429)
			expect(attempts[4]?.status).toBe('locked')
			expect(attempts[4]?.body.code).toBe('OTP_LOCKED')
			expect(attempts[4]?.body.error).toBe('Session locked')
			expect(attempts[4]?.headers?.['Retry-After']).toBe('300')
			expect(attempts[4]?.headers?.['X-Hardening-Status']).toBe('enabled')
		})
	})

	it('bypasses OTP request throttles when hardening is disabled', async () => {
		await withEnv('OTP_HARDENING_ENABLED', 'false', async () => {
			const originalInfo = console.info
			const events: unknown[][] = []
			console.info = (...args: unknown[]) => {
				events.push(args)
			}

			let savedCount = 0
			let deliveredCount = 0

			try {
				const deps = createRequestDeps({
					getActiveOtp: async () => createLockedChallengeState(),
					checkRateLimit: async () => {
						throw new Error('strict rate limiting should be bypassed')
					},
					saveOtp: async () => {
						savedCount += 1
					},
					sendOtpEmail: async () => {
						deliveredCount += 1
						return { success: true }
					},
				})

				const attempts = []

				for (let attempt = 0; attempt < 4; attempt += 1) {
					attempts.push(
						await requestOtpChallenge(
							{
								cedula: '12345678',
								clientIp: '203.0.113.10',
								route: '/api/otp',
								rateLimitMax: 3,
								rateLimitWindowMinutes: 5,
								rateLimitIpMultiplier: 3,
								codeGenerator: () => '123456',
							},
							deps,
						),
					)
				}

				expect(attempts.every((attempt) => attempt.httpStatus === 200)).toBe(true)
				expect(savedCount).toBe(4)
				expect(deliveredCount).toBe(4)
				expect(attempts[0]?.headers?.['X-Hardening-Feature']).toBe('otp-hardening')
				expect(attempts[0]?.headers?.['X-Hardening-Status']).toBe('disabled')
				expect(events.length).toBe(4)
				expect((events[0]?.[1] as Record<string, unknown>)?.feature_name).toBe(
					'otp-hardening',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.status).toBe(
					'disabled',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.source).toBe(
					'otp-request',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.route).toBe('/api/otp')
			} finally {
				console.info = originalInfo
			}
		})
	})

	it('bypasses OTP validation lockouts when hardening is disabled', async () => {
		await withEnv('OTP_HARDENING_ENABLED', 'false', async () => {
			const originalInfo = console.info
			const events: unknown[][] = []
			console.info = (...args: unknown[]) => {
				events.push(args)
			}

			let permissiveAttempts = 0

			try {
				const deps = createValidationDeps({
					getActiveOtp: async () => createLockedChallengeState(),
					checkRateLimit: async () => {
						throw new Error('strict validation rate limiting should be bypassed')
					},
					validateOtp: async () => {
						throw new Error('strict OTP validation should be bypassed')
					},
					validateOtpPermissive: async () => {
						permissiveAttempts += 1
						return {
							valid: false,
							message: 'Codigo incorrecto',
							code: 'OTP_INVALID',
						} satisfies ValidateOtpResult
					},
				})

				const attempts = []

				for (let attempt = 0; attempt < 5; attempt += 1) {
					attempts.push(
						await validateOtpChallengeRequest(
							{
								cedula: '12345678',
								code: '000000',
								route: '/api/otp/validate',
								validationLimit: 5,
								validationWindowMinutes: 5,
							},
							deps,
						),
					)
				}

				expect(permissiveAttempts).toBe(5)
				expect(attempts.every((attempt) => attempt.httpStatus === 404)).toBe(true)
				expect(attempts[0]?.headers?.['X-Hardening-Feature']).toBe('otp-hardening')
				expect(attempts[0]?.headers?.['X-Hardening-Status']).toBe('disabled')
				expect(events.length).toBe(5)
				expect((events[0]?.[1] as Record<string, unknown>)?.feature_name).toBe(
					'otp-hardening',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.status).toBe(
					'disabled',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.source).toBe(
					'otp-validate',
				)
				expect((events[0]?.[1] as Record<string, unknown>)?.route).toBe(
					'/api/otp/validate',
				)
			} finally {
				console.info = originalInfo
			}
		})
	})
})
