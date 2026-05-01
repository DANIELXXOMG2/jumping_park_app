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
