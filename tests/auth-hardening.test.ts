import { describe, expect, it } from 'bun:test'
import {
	requestOtpChallenge,
	type RequestOtpChallengeDeps,
	validateOtpChallengeRequest,
	type ValidateOtpChallengeRequestDeps,
} from '@/services/authService'
import type { OtpValidationContext, SendOtpResult, ValidateOtpResult } from '@/services/authService'
import type { RateLimitResult } from '@/services/rateLimitService'
import type { UserProfile } from '@/types/firestore'

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
		createOtpSession: async () => undefined,
		...overrides,
	}
}

describe('OTP hardening', () => {
	it('rate limits OTP requests after the third request in five minutes', async () => {
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
	})

	it('returns OTP_LOCKED after repeated incorrect validation attempts', async () => {
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
	})
})
