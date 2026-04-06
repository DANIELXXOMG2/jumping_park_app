import {
	createDoc,
	deleteDoc,
	getDocById,
	getDocRef,
	runInTransaction,
} from '@/lib/firestoreService'
import { evaluateHardeningFlag, HARDENING_FLAG } from '@/lib/hardeningPolicy'
import { isExpired, toJsDate } from '@/lib/utils/dateUtils'
import { sendOtpEmail as sendOtpViaEmail } from '@/services/emailService'
import { checkRateLimit } from '@/services/rateLimitService'
import type {
	OtpAccessSession,
	OtpChallenge,
	OtpRecord,
	OtpSession,
	UserProfile,
} from '@/types/firestore'

const OTP_CHALLENGES_COLLECTION = 'otp_challenges'
const OTP_ACCESS_SESSIONS_COLLECTION = 'otp_access_sessions'
const LEGACY_OTP_COLLECTION = 'otp_sessions'
const OTP_EXPIRATION_MINUTES = 60
const OTP_SESSION_DURATION_MINUTES = 120
const OTP_LOCKOUT_MINUTES = Number.parseInt(
	process.env.OTP_LOCKOUT_MINUTES ?? '15',
	10,
)
const OTP_MAX_FAILED_ATTEMPTS = 5

export type SendOtpResult = {
	success: boolean
	error?: string
}

export type OtpChallengeState = OtpChallenge & {
	remainingMinutes: number
	locked: boolean
	retryAfterSeconds: number | null
}

export type ValidateOtpResult =
	| { valid: true; message: string }
	| {
			valid: false
			message: string
			code: 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_LOCKED' | 'OTP_ERROR'
			retryAfterSeconds?: number
	  }

export interface OtpValidationContext {
	targetEmail: string
	userProfile: UserProfile | null
}

export interface SendOtpRequestResult {
	status: 'ok' | 'rate_limited' | 'bad_request'
	httpStatus: number
	body: {
		message?: string
		error?: string
		retryAfter?: number
		code?: 'OTP_RATE_LIMITED'
		otpAlreadySent?: boolean
		remainingMinutes?: number
		remaining?: number
	}
	headers?: Record<string, string>
}

export interface ValidateOtpRequestResult {
	status: 'ok' | 'locked' | 'rate_limited' | 'not_found' | 'bad_request'
	httpStatus: number
	body: {
		success: boolean
		error?: string
		userData?: UserProfile | undefined
		retryAfter?: number
		code?: 'OTP_RATE_LIMITED' | 'OTP_LOCKED'
	}
	headers?: Record<string, string>
}

function maskEmail(email: string): string {
	const [localPart, domain = ''] = email.split('@')

	if (!localPart) {
		return '***'
	}

	const visible = localPart.slice(0, 1)
	return `${visible}***@${domain}`
}

function maskIdentifier(identifier: string): string {
	const visiblePrefix = identifier.slice(0, 2)
	const visibleSuffix = identifier.slice(-2)

	if (identifier.length <= 4) {
		return '****'
	}

	return `${visiblePrefix}***${visibleSuffix}`
}

function toSafeErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}

	return 'unknown-error'
}

function isOtpChallenge(value: unknown): value is OtpChallenge {
	if (!value || typeof value !== 'object') {
		return false
	}

	return 'email' in value && 'code' in value && 'attempts' in value
}

function isOtpSession(value: unknown): value is OtpAccessSession {
	if (!value || typeof value !== 'object') {
		return false
	}

	return 'userId' in value && 'validatedAt' in value
}

function getRetryAfterSeconds(resetAt: Date): number {
	return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function getRemainingMinutes(expiresAt: Date): number {
	return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 60000))
}

async function getChallengeDocument(
	email: string,
): Promise<OtpChallenge | null> {
	const challenge = await getDocById<OtpChallenge>(
		OTP_CHALLENGES_COLLECTION,
		email,
	)

	if (challenge && isOtpChallenge(challenge)) {
		return challenge
	}

	const legacy = await getDocById<OtpRecord>(LEGACY_OTP_COLLECTION, email)

	if (legacy && isOtpChallenge(legacy)) {
		return legacy
	}

	return null
}

async function deleteChallenge(email: string): Promise<void> {
	await Promise.allSettled([
		deleteDoc(OTP_CHALLENGES_COLLECTION, email),
		deleteDoc(LEGACY_OTP_COLLECTION, email),
	])
}

export async function getUserByCedula(
	cedula: string,
): Promise<UserProfile | null> {
	return getDocById<UserProfile>('users', cedula)
}

export async function getActiveOtp(
	email: string,
): Promise<OtpChallengeState | null> {
	try {
		const otpDoc = await getChallengeDocument(email)

		if (!otpDoc) {
			return null
		}

		if (isExpired(otpDoc.expiresAt)) {
			await deleteChallenge(email)
			return null
		}

		const expiresAtDate = toJsDate(otpDoc.expiresAt)
		const lockedUntilDate = otpDoc.lockedUntil
			? toJsDate(otpDoc.lockedUntil)
			: null
		const locked = Boolean(
			lockedUntilDate && lockedUntilDate.getTime() > Date.now(),
		)

		return {
			...otpDoc,
			remainingMinutes: getRemainingMinutes(expiresAtDate),
			locked,
			retryAfterSeconds: lockedUntilDate
				? getRetryAfterSeconds(lockedUntilDate)
				: null,
		}
	} catch (error) {
		console.error('[AuthService] Error consultando challenge OTP:', {
			email: maskEmail(email),
			error: toSafeErrorMessage(error),
		})
		return null
	}
}

export async function saveOtp(email: string, code: string): Promise<void> {
	const now = new Date()
	const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000)
	const otpRecord: OtpChallenge = {
		email,
		code,
		expiresAt,
		attempts: 0,
		lockedUntil: null,
		lastSentAt: now,
	}

	try {
		await createDoc(OTP_CHALLENGES_COLLECTION, otpRecord, email)
	} catch (error) {
		console.error('[AuthService] Error guardando challenge OTP:', {
			email: maskEmail(email),
			error: toSafeErrorMessage(error),
		})
		throw new Error('No se pudo guardar el OTP')
	}
}

export async function sendOtpEmail(
	email: string,
	otp: string,
): Promise<SendOtpResult> {
	return sendOtpViaEmail({ to: email, otp })
}

export async function validateOtp(
	email: string,
	code: string,
): Promise<ValidateOtpResult> {
	try {
		const challengeRef = getDocRef(OTP_CHALLENGES_COLLECTION, email)
		const now = Date.now()

		const result = await runInTransaction(async (transaction) => {
			const challengeSnapshot = await transaction.get(challengeRef)

			if (!challengeSnapshot.exists) {
				const legacyChallenge = await getDocById<OtpRecord>(
					LEGACY_OTP_COLLECTION,
					email,
				)

				if (!legacyChallenge || !isOtpChallenge(legacyChallenge)) {
					return {
						valid: false,
						message: 'Codigo no solicitado o expirado',
						code: 'OTP_EXPIRED' as const,
					}
				}

				if (isExpired(legacyChallenge.expiresAt)) {
					await deleteChallenge(email)
					return {
						valid: false,
						message: 'Codigo expirado',
						code: 'OTP_EXPIRED' as const,
					}
				}

				if (legacyChallenge.code !== code) {
					return {
						valid: false,
						message: 'Codigo incorrecto',
						code: 'OTP_INVALID' as const,
					}
				}

				return { valid: true, message: 'OTP valido' } as const
			}

			const challenge = challengeSnapshot.data() as OtpChallenge
			const expiresAtDate = toJsDate(challenge.expiresAt)

			if (isExpired(challenge.expiresAt)) {
				transaction.delete(challengeRef)
				return {
					valid: false,
					message: 'Codigo expirado',
					code: 'OTP_EXPIRED' as const,
				}
			}

			const lockedUntilDate = challenge.lockedUntil
				? toJsDate(challenge.lockedUntil)
				: null

			if (lockedUntilDate && lockedUntilDate.getTime() > now) {
				return {
					valid: false,
					message: 'Session locked',
					code: 'OTP_LOCKED' as const,
					retryAfterSeconds: getRetryAfterSeconds(lockedUntilDate),
				}
			}

			if (challenge.code !== code) {
				const nextAttempts = (challenge.attempts ?? 0) + 1
				const updatePayload: Partial<OtpChallenge> = {
					attempts: nextAttempts,
				}

				if (nextAttempts >= OTP_MAX_FAILED_ATTEMPTS) {
					const lockUntil = new Date(
						Math.min(
							expiresAtDate.getTime(),
							now + OTP_LOCKOUT_MINUTES * 60 * 1000,
						),
					)
					updatePayload.lockedUntil = lockUntil
					transaction.update(challengeRef, updatePayload)
					return {
						valid: false,
						message: 'Session locked',
						code: 'OTP_LOCKED' as const,
						retryAfterSeconds: getRetryAfterSeconds(lockUntil),
					}
				}

				transaction.update(challengeRef, updatePayload)
				return {
					valid: false,
					message: 'Codigo incorrecto',
					code: 'OTP_INVALID' as const,
				}
			}

			transaction.update(challengeRef, {
				attempts: 0,
				lockedUntil: null,
				lastValidatedAt: new Date(),
			})

			return { valid: true, message: 'OTP valido' } as const
		})

		return result
	} catch (error) {
		console.error(
			'[AuthService] Error validando OTP:',
			{ email: maskEmail(email), error: toSafeErrorMessage(error) },
		)
		return {
			valid: false,
			message: 'No se pudo validar el OTP',
			code: 'OTP_ERROR',
		}
	}
}

export async function createOtpSession(
	userId: string,
	email: string,
): Promise<void> {
	const now = new Date()
	const expiresAt = new Date(
		now.getTime() + OTP_SESSION_DURATION_MINUTES * 60 * 1000,
	)

	const session: OtpAccessSession = {
		userId,
		email,
		validatedAt: now,
		expiresAt,
		challengeEmail: email,
	}

	try {
		await createDoc(OTP_ACCESS_SESSIONS_COLLECTION, session, userId)
	} catch (error) {
		console.error(
			'[AuthService] Error creando sesion OTP:',
			{
				email: maskEmail(email),
				userId: maskIdentifier(userId),
				error: toSafeErrorMessage(error),
			},
		)
	}
}

export async function verifyOtpSession(userId: string): Promise<boolean> {
	try {
		const session = await getDocById<OtpAccessSession>(
			OTP_ACCESS_SESSIONS_COLLECTION,
			userId,
		)

		if (session && isOtpSession(session)) {
			if (isExpired(session.expiresAt)) {
				await deleteDoc(OTP_ACCESS_SESSIONS_COLLECTION, userId)
				return false
			}

			return true
		}

		const legacySession = await getDocById<OtpSession>(
			LEGACY_OTP_COLLECTION,
			userId,
		)

		if (!legacySession || !isOtpSession(legacySession)) {
			return false
		}

		if (isExpired(legacySession.expiresAt)) {
			await deleteDoc(LEGACY_OTP_COLLECTION, userId)
			return false
		}

		return true
	} catch (error) {
		console.error('[AuthService] Error verificando sesion OTP:', {
			userId: maskIdentifier(userId),
			error: toSafeErrorMessage(error),
		})
		return false
	}
}

export async function resolveOtpValidationContext(params: {
	email?: string
	cedula?: string
}): Promise<OtpValidationContext | null> {
	let targetEmail = params.email
	let userProfile: UserProfile | null = null

	if (!targetEmail && params.cedula) {
		userProfile = await getUserByCedula(params.cedula)

		if (!userProfile) {
			return null
		}

		targetEmail = userProfile.email
	}

	if (!targetEmail) {
		return null
	}

	return {
		targetEmail,
		userProfile,
	}
}

interface RequestOtpChallengeParams {
	email?: string
	cedula?: string
	clientIp?: string
	route?: string
	rateLimitMax: number
	rateLimitWindowMinutes: number
	rateLimitIpMultiplier: number
	codeGenerator: () => string
}

interface ValidateOtpChallengeRequestParams {
	email?: string
	cedula?: string
	code: string
	route?: string
	validationLimit: number
	validationWindowMinutes: number
}

export interface RequestOtpChallengeDeps {
	getUserByCedula: typeof getUserByCedula
	getActiveOtp: typeof getActiveOtp
	checkRateLimit: typeof checkRateLimit
	saveOtp: typeof saveOtp
	sendOtpEmail: typeof sendOtpEmail
}

export interface ValidateOtpChallengeRequestDeps {
	resolveOtpValidationContext: typeof resolveOtpValidationContext
	getActiveOtp: typeof getActiveOtp
	checkRateLimit: typeof checkRateLimit
	validateOtp: typeof validateOtp
	validateOtpPermissive: typeof validateOtpPermissive
	createOtpSession: typeof createOtpSession
}

function mergeHeaders(
	...headerSets: Array<Record<string, string> | undefined>
): Record<string, string> | undefined {
	const merged = Object.assign({}, ...headerSets.filter(Boolean))

	return Object.keys(merged).length > 0 ? merged : undefined
}

function getRequestOtpChallengeDeps(): RequestOtpChallengeDeps {
	return {
		getUserByCedula,
		getActiveOtp,
		checkRateLimit,
		saveOtp,
		sendOtpEmail,
	}
}

function getValidateOtpChallengeRequestDeps(): ValidateOtpChallengeRequestDeps {
	return {
		resolveOtpValidationContext,
		getActiveOtp,
		checkRateLimit,
		validateOtp,
		validateOtpPermissive,
		createOtpSession,
	}
}

export async function validateOtpPermissive(
	email: string,
	code: string,
): Promise<ValidateOtpResult> {
	try {
		const challengeRef = getDocRef(OTP_CHALLENGES_COLLECTION, email)

		const result = await runInTransaction(async (transaction) => {
			const challengeSnapshot = await transaction.get(challengeRef)

			if (!challengeSnapshot.exists) {
				const legacyChallenge = await getDocById<OtpRecord>(
					LEGACY_OTP_COLLECTION,
					email,
				)

				if (!legacyChallenge || !isOtpChallenge(legacyChallenge)) {
					return {
						valid: false,
						message: 'Codigo no solicitado o expirado',
						code: 'OTP_EXPIRED' as const,
					}
				}

				if (isExpired(legacyChallenge.expiresAt)) {
					await deleteChallenge(email)
					return {
						valid: false,
						message: 'Codigo expirado',
						code: 'OTP_EXPIRED' as const,
					}
				}

				if (legacyChallenge.code !== code) {
					return {
						valid: false,
						message: 'Codigo incorrecto',
						code: 'OTP_INVALID' as const,
					}
				}

				return { valid: true, message: 'OTP valido' } as const
			}

			const challenge = challengeSnapshot.data() as OtpChallenge

			if (isExpired(challenge.expiresAt)) {
				transaction.delete(challengeRef)
				return {
					valid: false,
					message: 'Codigo expirado',
					code: 'OTP_EXPIRED' as const,
				}
			}

			if (challenge.code !== code) {
				return {
					valid: false,
					message: 'Codigo incorrecto',
					code: 'OTP_INVALID' as const,
				}
			}

			transaction.update(challengeRef, {
				attempts: 0,
				lockedUntil: null,
				lastValidatedAt: new Date(),
			})

			return { valid: true, message: 'OTP valido' } as const
		})

		return result
	} catch (error) {
		console.error('[AuthService] Error validando OTP en modo permisivo:', {
			email: maskEmail(email),
			error: toSafeErrorMessage(error),
		})
		return {
			valid: false,
			message: 'No se pudo validar el OTP',
			code: 'OTP_ERROR',
		}
	}
}

export async function requestOtpChallenge(
	params: RequestOtpChallengeParams,
	deps: RequestOtpChallengeDeps = getRequestOtpChallengeDeps(),
): Promise<SendOtpRequestResult> {
	const hardening = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.OTP_HARDENING,
		source: 'otp-request',
		route: params.route ?? '/api/otp',
		details: {
			has_cedula: Boolean(params.cedula),
			has_email: Boolean(params.email),
		},
	})

	let targetEmail = params.email

	if (!targetEmail && params.cedula) {
		const user = await deps.getUserByCedula(params.cedula)

		if (!user) {
			return {
				status: 'bad_request',
				httpStatus: 404,
				body: { error: 'Usuario no encontrado' },
				headers: hardening.headers,
			}
		}

		if (!user.email) {
			return {
				status: 'bad_request',
				httpStatus: 404,
				body: { error: 'Usuario sin email registrado' },
				headers: hardening.headers,
			}
		}

		targetEmail = user.email
	}

	if (!targetEmail) {
		return {
			status: 'bad_request',
			httpStatus: 400,
			body: { error: 'Faltan datos' },
			headers: hardening.headers,
		}
	}

	if (!hardening.enabled) {
		const otp = params.codeGenerator()
		await deps.saveOtp(targetEmail, otp)
		const emailResult = await deps.sendOtpEmail(targetEmail, otp)

		if (!emailResult.success) {
			return {
				status: 'bad_request',
				httpStatus: 500,
				body: { error: emailResult.error ?? 'No se pudo enviar el OTP' },
				headers: hardening.headers,
			}
		}

		return {
			status: 'ok',
			httpStatus: 200,
			body: {
				message: 'OTP enviado',
			},
			headers: hardening.headers,
		}
	}

	const activeOtp = await deps.getActiveOtp(targetEmail)

	if (activeOtp) {
		if (activeOtp.locked && activeOtp.retryAfterSeconds) {
			return {
				status: 'rate_limited',
				httpStatus: 429,
				body: {
					error: 'Demasiados intentos fallidos. Solicita un nuevo codigo luego del enfriamiento.',
					retryAfter: activeOtp.retryAfterSeconds,
					code: 'OTP_RATE_LIMITED',
				},
				headers: mergeHeaders(
					{ 'Retry-After': String(activeOtp.retryAfterSeconds) },
					hardening.headers,
				),
			}
		}

		return {
			status: 'rate_limited',
			httpStatus: 429,
			body: {
				error: `Ya se envio un codigo de verificacion. Reintenta en ${activeOtp.remainingMinutes} minuto(s).`,
				retryAfter: activeOtp.remainingMinutes * 60,
				code: 'OTP_RATE_LIMITED',
				otpAlreadySent: true,
				remainingMinutes: activeOtp.remainingMinutes,
			},
			headers: mergeHeaders(
				{ 'Retry-After': String(activeOtp.remainingMinutes * 60) },
				hardening.headers,
			),
		}
	}

	const primaryIdentifier = params.cedula
		? `otp:req:doc:${params.cedula}`
		: `otp:req:email:${targetEmail}`
	const primaryRateLimit = await deps.checkRateLimit(
		primaryIdentifier,
		params.rateLimitMax,
		params.rateLimitWindowMinutes,
	)

	if (!primaryRateLimit.success) {
		return {
			status: 'rate_limited',
			httpStatus: 429,
			body: {
				error: 'Demasiados intentos. Espera antes de solicitar otro codigo.',
				retryAfter: primaryRateLimit.retryAfterSeconds,
				code: 'OTP_RATE_LIMITED',
			},
			headers: mergeHeaders(
				{ 'Retry-After': String(primaryRateLimit.retryAfterSeconds) },
				hardening.headers,
			),
		}
	}

	if (params.clientIp && params.clientIp !== 'unknown') {
		const ipRateLimit = await deps.checkRateLimit(
			`otp:req:ip:${params.clientIp}`,
			params.rateLimitMax * params.rateLimitIpMultiplier,
			params.rateLimitWindowMinutes,
		)

		if (!ipRateLimit.success) {
			return {
				status: 'rate_limited',
				httpStatus: 429,
				body: {
					error: 'Demasiadas solicitudes desde esta ubicacion.',
					retryAfter: ipRateLimit.retryAfterSeconds,
					code: 'OTP_RATE_LIMITED',
				},
				headers: mergeHeaders(
					{ 'Retry-After': String(ipRateLimit.retryAfterSeconds) },
					hardening.headers,
				),
			}
		}
	}

	const otp = params.codeGenerator()
	await deps.saveOtp(targetEmail, otp)
	const emailResult = await deps.sendOtpEmail(targetEmail, otp)

	if (!emailResult.success) {
		return {
			status: 'bad_request',
			httpStatus: 500,
			body: { error: emailResult.error ?? 'No se pudo enviar el OTP' },
			headers: hardening.headers,
		}
	}

	return {
		status: 'ok',
		httpStatus: 200,
		body: {
			message: 'OTP enviado',
			remaining: primaryRateLimit.remaining,
		},
		headers: hardening.headers,
	}
}

export async function validateOtpChallengeRequest(
	params: ValidateOtpChallengeRequestParams,
	deps: ValidateOtpChallengeRequestDeps =
		getValidateOtpChallengeRequestDeps(),
): Promise<ValidateOtpRequestResult> {
	const hardening = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.OTP_HARDENING,
		source: 'otp-validate',
		route: params.route ?? '/api/otp/validate',
		details: {
			has_cedula: Boolean(params.cedula),
			has_email: Boolean(params.email),
		},
	})

	const context = await deps.resolveOtpValidationContext({
		email: params.email,
		cedula: params.cedula,
	})

	if (!context) {
		if (params.cedula) {
			return {
				status: 'not_found',
				httpStatus: 404,
				body: { success: false, error: 'Usuario no encontrado' },
				headers: hardening.headers,
			}
		}

		return {
			status: 'bad_request',
			httpStatus: 400,
			body: { success: false, error: 'Faltan datos (Email no encontrado)' },
			headers: hardening.headers,
		}
	}

	if (!hardening.enabled) {
		const result = await deps.validateOtpPermissive(context.targetEmail, params.code)

		if (!result.valid) {
			return {
				status: 'not_found',
				httpStatus: 404,
				body: { success: false, error: result.message },
				headers: hardening.headers,
			}
		}

		if (params.cedula || context.userProfile?.uid) {
			const userId = params.cedula || context.userProfile?.uid || ''
			await deps.createOtpSession(userId, context.targetEmail)
		}

		return {
			status: 'ok',
			httpStatus: 200,
			body: {
				success: true,
				userData: context.userProfile ?? undefined,
			},
			headers: hardening.headers,
		}
	}

	const activeChallenge = await deps.getActiveOtp(context.targetEmail)

	if (activeChallenge?.locked) {
		const retryAfter =
			activeChallenge.retryAfterSeconds ?? params.validationWindowMinutes * 60
		return {
			status: 'locked',
			httpStatus: 429,
			body: {
				success: false,
				error: 'Session locked',
				retryAfter,
				code: 'OTP_LOCKED',
			},
			headers: mergeHeaders(
				{ 'Retry-After': String(retryAfter) },
				hardening.headers,
			),
		}
	}

	const primaryIdentifier = params.cedula
		? `otp:validate:doc:${params.cedula}`
		: `otp:validate:email:${context.targetEmail}`
	const validationBudget = await deps.checkRateLimit(
		primaryIdentifier,
		params.validationLimit,
		params.validationWindowMinutes,
	)

	if (!validationBudget.success) {
		return {
			status: 'rate_limited',
			httpStatus: 429,
			body: {
				success: false,
				error: 'Demasiados intentos de validacion.',
				retryAfter: validationBudget.retryAfterSeconds,
				code: 'OTP_RATE_LIMITED',
			},
			headers: mergeHeaders(
				{ 'Retry-After': String(validationBudget.retryAfterSeconds) },
				hardening.headers,
			),
		}
	}

	const result = await deps.validateOtp(context.targetEmail, params.code)

	if (!result.valid) {
		if (result.code === 'OTP_LOCKED') {
			const retryAfter =
				result.retryAfterSeconds ?? params.validationWindowMinutes * 60
			return {
				status: 'locked',
				httpStatus: 429,
				body: {
					success: false,
					error: 'Session locked',
					retryAfter,
					code: 'OTP_LOCKED',
				},
				headers: mergeHeaders(
					{ 'Retry-After': String(retryAfter) },
					hardening.headers,
				),
			}
		}

		return {
			status: 'not_found',
			httpStatus: 404,
			body: { success: false, error: result.message },
			headers: hardening.headers,
		}
	}

	if (params.cedula || context.userProfile?.uid) {
		const userId = params.cedula || context.userProfile?.uid || ''
		await deps.createOtpSession(userId, context.targetEmail)
	}

	return {
		status: 'ok',
		httpStatus: 200,
		body: {
			success: true,
			userData: context.userProfile ?? undefined,
		},
		headers: hardening.headers,
	}
}
