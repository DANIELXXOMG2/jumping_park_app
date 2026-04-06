export const HARDENING_FLAG = {
	OTP_HARDENING: 'otp-hardening',
	EXPORT_BOUNDS: 'export-bounds',
	PUBLIC_SEO: 'public-seo',
} as const

export const HARDENING_FLAG_ENV_KEY = {
	[HARDENING_FLAG.OTP_HARDENING]: 'OTP_HARDENING_ENABLED',
	[HARDENING_FLAG.EXPORT_BOUNDS]: 'EXPORT_BOUNDS_ENFORCED',
	[HARDENING_FLAG.PUBLIC_SEO]: 'PUBLIC_SEO_ENABLED',
} as const

export const HARDENING_POLICY_HEADER_VALUE = 'hardening.policy'

export type HardeningFeatureName =
	(typeof HARDENING_FLAG)[keyof typeof HARDENING_FLAG]

export type HardeningStatus = 'enabled' | 'disabled' | 'defaulted'

export type HardeningSource =
	| 'otp-request'
	| 'otp-validate'
	| 'admin-export-users'
	| 'admin-export-consents'
	| 'robots'
	| 'sitemap'
	| 'public-metadata'

export interface HardeningPolicy {
	otpHardeningEnabled: boolean
	exportBoundsEnabled: boolean
	publicSeoEnabled: boolean
}

export interface HardeningFlagResolution {
	enabled: boolean
	featureName: HardeningFeatureName
	envKey: (typeof HARDENING_FLAG_ENV_KEY)[HardeningFeatureName]
	status: HardeningStatus
	fallbackApplied: boolean
	rawValue?: string
}

export interface HardeningEvent {
	event_name: 'hardening.policy.evaluated'
	feature_name: HardeningFeatureName
	status: HardeningStatus
	source: HardeningSource
	env_key: string
	fallback_applied: boolean
	request_id?: string
	route?: string
	details?: Record<string, string | number | boolean>
}

export interface HardeningEvaluation extends HardeningFlagResolution {
	headers: Record<string, string>
	event: HardeningEvent
}

interface EvaluateHardeningFlagOptions {
	featureName: HardeningFeatureName
	source: HardeningSource
	route?: string
	requestId?: string
	details?: Record<string, string | number | boolean>
}

const SECURE_DEFAULT_ENABLED = true

function parseBooleanFlag(rawValue: string | undefined): boolean | null {
	if (rawValue === undefined) {
		return null
	}

	const normalizedValue = rawValue.trim().toLowerCase()

	if (normalizedValue === 'true') {
		return true
	}

	if (normalizedValue === 'false') {
		return false
	}

	return null
}

function buildFallbackWarningPayload(
	resolution: HardeningFlagResolution,
): Record<string, string | boolean | null> {
	return {
		event_name: 'hardening.policy.defaulted',
		feature_name: resolution.featureName,
		status: resolution.status,
		env_key: resolution.envKey,
		fallback_applied: resolution.fallbackApplied,
		default_enabled: SECURE_DEFAULT_ENABLED,
		raw_value: resolution.rawValue ?? null,
	}
}

export function resolveHardeningFlag(
	featureName: HardeningFeatureName,
): HardeningFlagResolution {
	const envKey = HARDENING_FLAG_ENV_KEY[featureName]
	const rawValue = process.env[envKey]
	const parsedValue = parseBooleanFlag(rawValue)

	if (parsedValue === null) {
		const resolution: HardeningFlagResolution = {
			enabled: SECURE_DEFAULT_ENABLED,
			featureName,
			envKey,
			status: 'defaulted',
			fallbackApplied: true,
			rawValue,
		}

		console.warn(
			'[HardeningPolicy] Falling back to secure default',
			buildFallbackWarningPayload(resolution),
		)

		return resolution
	}

	return {
		enabled: parsedValue,
		featureName,
		envKey,
		status: parsedValue ? 'enabled' : 'disabled',
		fallbackApplied: false,
		rawValue,
	}
}

export function buildHardeningHeaders(
	resolution: HardeningFlagResolution,
): Record<string, string> {
	return {
		'X-Hardening-Policy': HARDENING_POLICY_HEADER_VALUE,
		'X-Hardening-Feature': resolution.featureName,
		'X-Hardening-Status': resolution.status,
	}
}

export function buildHardeningEvent(
	resolution: HardeningFlagResolution,
	options: Omit<EvaluateHardeningFlagOptions, 'featureName'>,
): HardeningEvent {
	return {
		event_name: 'hardening.policy.evaluated',
		feature_name: resolution.featureName,
		status: resolution.status,
		source: options.source,
		env_key: resolution.envKey,
		fallback_applied: resolution.fallbackApplied,
		request_id: options.requestId,
		route: options.route,
		details: options.details,
	}
}

export function evaluateHardeningFlag(
	options: EvaluateHardeningFlagOptions,
): HardeningEvaluation {
	const resolution = resolveHardeningFlag(options.featureName)
	const event = buildHardeningEvent(resolution, {
		source: options.source,
		route: options.route,
		requestId: options.requestId,
		details: options.details,
	})

	console.info('[HardeningPolicy] Evaluated feature policy', event)

	return {
		...resolution,
		headers: buildHardeningHeaders(resolution),
		event,
	}
}

export function resolveHardeningPolicy(): HardeningPolicy {
	return {
		otpHardeningEnabled: resolveHardeningFlag(HARDENING_FLAG.OTP_HARDENING)
			.enabled,
		exportBoundsEnabled: resolveHardeningFlag(HARDENING_FLAG.EXPORT_BOUNDS)
			.enabled,
		publicSeoEnabled: resolveHardeningFlag(HARDENING_FLAG.PUBLIC_SEO).enabled,
	}
}
