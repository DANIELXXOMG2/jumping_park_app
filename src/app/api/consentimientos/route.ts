import { NextRequest } from "next/server";
import { apiHandler, successResponse, getValidatedBody } from "@/lib/apiHandler";
import { consentSubmissionSchema, ConsentSubmission } from "@/lib/schemas/consent.schema";
import { consentService } from "@/services/consentService";

/**
 * POST /api/consentimientos
 * Crea un nuevo consentimiento informado
 */
export const POST = apiHandler<ConsentSubmission>(
  async (request: NextRequest) => {
    const body = getValidatedBody<ConsentSubmission>(request);
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    
    const result = await consentService.createConsent({
      responsibleAdult: body.responsibleAdult,
      minors: body.minors,
      signatureBase64: body.signature,
      ipAddress,
    });

    return successResponse({ 
      success: true, 
      consentId: result.consentId,
      consecutivo: result.consecutivo,
    });
  },
  { bodySchema: consentSubmissionSchema }
);
