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

/**
 * Periodos disponibles para estadísticas.
 */
export type StatsPeriod = "today" | "week" | "month" | "year" | "all";

/**
 * KPI individual para estadísticas.
 */
export interface KPI {
	value: number;
	change?: number;
	previousValue?: number;
	label?: string;
}

/**
 * Datos de estadísticas del dashboard admin.
 */
export interface StatsData {
	period: StatsPeriod;
	dateRange: {
		start: string;
		end: string;
	};
	kpis: {
		consents: KPI;
		users: KPI;
		minors: KPI;
		uniqueMinors: KPI;
		activeConsents: KPI;
		expiredConsents: KPI;
	};
	totals: {
		users: number;
		consents: number;
		minors: number;
	};
	chartData: Array<{
		date: string;
		consents: number;
		users: number;
		minors: number;
	}>;
	topDays: Array<{
		date: string;
		count: number;
	}>;
	averages: {
		consentsPerDay: number;
		minorsPerConsent: number;
	};
	freshness?: {
		computedAt: string;
		source: "aggregate" | "live";
		stale?: boolean;
	};
}
