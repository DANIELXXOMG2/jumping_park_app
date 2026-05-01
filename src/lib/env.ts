/**
 * Configuración centralizada del servidor.
 * Todas las variables de entorno se leen aquí para evitar
 * acceso disperso en business logic.
 */

export const env = {
	get SUPER_ADMIN_EMAIL(): string {
		return process.env.SUPER_ADMIN_EMAIL ?? "";
	},
};
