// Hooks personalizados de la aplicación

export type {
	ActivityData,
	ActivityStats,
	HourlyDataPoint,
	LatestConsent,
} from "./useActivity";
export { useActivity } from "./useActivity";
export type {
	Consent,
	ConsentsResponse,
	Minor,
	Pagination,
} from "./useConsents";
export { useConsents } from "./useConsents";
export { useConsentsTable } from "./useConsentsTable";
export type {
	ConnectionState,
	RecentRegistrationsResult,
} from "./useOfflineData";
export {
	useOfflineConnection,
	useRecentRegistrations,
} from "./useOfflineData";
export { usePWAInstall } from "./usePWAInstall";
export type { SoundType } from "./useUISound";
export { useUISound } from "./useUISound";
