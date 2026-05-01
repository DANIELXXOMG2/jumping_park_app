import { describe, expect, it } from 'bun:test'
import { getOtpTimingConfig } from '@/lib/utils/otpConfig'

async function withEnv<T>(
	overrides: Record<string, string | undefined>,
	callback: () => Promise<T> | T,
): Promise<T> {
	const previousValues = new Map<string, string | undefined>()

	for (const [key, value] of Object.entries(overrides)) {
		previousValues.set(key, process.env[key])

		if (value === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = value
		}
	}

	try {
		return await callback()
	} finally {
		for (const [key, value] of previousValues.entries()) {
			if (value === undefined) {
				delete process.env[key]
			} else {
				process.env[key] = value
			}
		}
	}
}

describe('getOtpTimingConfig', () => {
	it('returns 60/120 defaults when env values are missing', async () => {
		await withEnv(
			{
				OTP_EXPIRATION_MINUTES: undefined,
				OTP_SESSION_DURATION_MINUTES: undefined,
			},
			() => {
				expect(getOtpTimingConfig()).toEqual({
					otpExpirationMinutes: 60,
					sessionDurationMinutes: 120,
				})
			},
		)
	})

	it('returns configured positive integer values', async () => {
		await withEnv(
			{
				OTP_EXPIRATION_MINUTES: '30',
				OTP_SESSION_DURATION_MINUTES: '240',
			},
			() => {
				expect(getOtpTimingConfig()).toEqual({
					otpExpirationMinutes: 30,
					sessionDurationMinutes: 240,
				})
			},
		)
	})

	it('falls back when values are blank, non-numeric, or decimal', async () => {
		await withEnv(
			{
				OTP_EXPIRATION_MINUTES: '  ',
				OTP_SESSION_DURATION_MINUTES: '12.5',
			},
			() => {
				expect(getOtpTimingConfig()).toEqual({
					otpExpirationMinutes: 60,
					sessionDurationMinutes: 120,
				})
			},
		)

		await withEnv(
			{
				OTP_EXPIRATION_MINUTES: 'abc',
				OTP_SESSION_DURATION_MINUTES: '24 minutes',
			},
			() => {
				expect(getOtpTimingConfig()).toEqual({
					otpExpirationMinutes: 60,
					sessionDurationMinutes: 120,
				})
			},
		)
	})

	it('falls back when values are zero or negative', async () => {
		await withEnv(
			{
				OTP_EXPIRATION_MINUTES: '0',
				OTP_SESSION_DURATION_MINUTES: '-5',
			},
			() => {
				expect(getOtpTimingConfig()).toEqual({
					otpExpirationMinutes: 60,
					sessionDurationMinutes: 120,
				})
			},
		)
	})
})
