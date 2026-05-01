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
