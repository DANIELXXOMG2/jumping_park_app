/**
 * Tipos compartidos para respuestas de API.
 */

/**
 * Respuesta del endpoint /api/usuarios/check
 * Verifica si un usuario existe por cédula (Blind Check - RF-03).
 */
export interface CheckUserResponse {
	exists: boolean;
	userData?: {
		emailMasked: string;
	};
}

/**
 * Respuesta del endpoint /api/otp/validate
 */
export interface OtpValidateResponse {
	success: boolean;
	error?: string;
	userData?: Record<string, unknown>;
}

/**
 * Respuesta genérica de error de API.
 */
export interface ApiErrorResponse {
	error: string;
}

/**
 * Snapshot de un menor en un consentimiento.
 */
export interface MinorSnapshot {
	firstName: string;
	lastName: string;
	idType?: string;
	idNumber?: string;
	medicalCondition?: string;
}

/**
 * Resultado de verificación de consentimiento.
 */
export interface ConsentResult {
	found: boolean;
	consent?: {
		id: string;
		consecutivo: number;
		adultSnapshot: {
			fullName: string;
			uid: string;
		};
		minorsSnapshot: MinorSnapshot[];
		createdAt: string;
		expiresAt?: string;
	};
	isExpired?: boolean;
}
