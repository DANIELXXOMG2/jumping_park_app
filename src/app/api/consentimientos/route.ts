import type { NextRequest } from "next/server";
import {
	ApiError,
	apiHandler,
	getValidatedBody,
	successResponse,
} from "@/lib/apiHandler";
import {
	type ConsentSubmission,
	consentSubmissionSchema,
} from "@/lib/schemas/consent.schema";
import { verifyOtpSession } from "@/services/authService";
import { consentService } from "@/services/consentService";

interface ConsentPostHandlerDeps {
	verifyOtpSession: typeof verifyOtpSession;
	createConsent: typeof consentService.createConsent;
}

function getConsentPostHandlerDeps(): ConsentPostHandlerDeps {
	return {
		verifyOtpSession,
		createConsent: consentService.createConsent.bind(consentService),
	};
}

export async function buildConsentCreationResponse(
	body: ConsentSubmission,
	request: NextRequest,
	deps: ConsentPostHandlerDeps,
) {
	const sessionIsValid = await deps.verifyOtpSession(
		body.responsibleAdult.documentId,
	);

	if (!sessionIsValid) {
		throw new ApiError(
			"La sesión OTP es inválida o expiró",
			401,
			"OTP_SESSION_INVALID",
		);
	}

	const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
	const result = await deps.createConsent({
		responsibleAdult: body.responsibleAdult,
		minors: body.minors,
		signatureBase64: body.signature,
		ipAddress,
		offlineSync: body.offlineSync,
	});

	if (!result.success) {
		throw new ApiError(
			result.error ?? "No pudimos crear el consentimiento",
			result.statusCode ?? 500,
			result.errorCode ?? "CONSENT_CREATE_FAILED",
		);
	}

	return {
		success: true,
		consentId: result.consentId,
		consecutivo: result.consecutivo,
		replayed: result.replayed ?? false,
	};
}

export function createConsentPostHandler(
	deps: ConsentPostHandlerDeps = getConsentPostHandlerDeps(),
) {
	return apiHandler<ConsentSubmission>(
		async (request: NextRequest) => {
			const body = getValidatedBody<ConsentSubmission>(request);
			const payload = await buildConsentCreationResponse(body, request, deps);

			return successResponse(payload, 201);
		},
		{ bodySchema: consentSubmissionSchema },
	);
}

/**
 * POST /api/consentimientos
 * Crea un nuevo consentimiento informado
 */
export const POST = createConsentPostHandler();
