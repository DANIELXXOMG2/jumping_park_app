const OTP_TIMING_DEFAULTS = {
	otpExpirationMinutes: 60,
	sessionDurationMinutes: 120,
} as const;

export interface OtpTimingConfig {
	otpExpirationMinutes: number;
	sessionDurationMinutes: number;
}

function resolvePositiveIntegerMinutes(
	rawValue: string | undefined,
	fallbackValue: number,
): number {
	if (typeof rawValue !== "string") {
		return fallbackValue;
	}

	const trimmedValue = rawValue.trim();

	if (!/^\d+$/.test(trimmedValue)) {
		return fallbackValue;
	}

	const parsedValue = Number.parseInt(trimmedValue, 10);

	if (parsedValue <= 0) {
		return fallbackValue;
	}

	return parsedValue;
}

export function getOtpTimingConfig(): OtpTimingConfig {
	return {
		otpExpirationMinutes: resolvePositiveIntegerMinutes(
			process.env.OTP_EXPIRATION_MINUTES,
			OTP_TIMING_DEFAULTS.otpExpirationMinutes,
		),
		sessionDurationMinutes: resolvePositiveIntegerMinutes(
			process.env.OTP_SESSION_DURATION_MINUTES,
			OTP_TIMING_DEFAULTS.sessionDurationMinutes,
		),
	};
}
