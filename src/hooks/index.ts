// Hooks personalizados de la aplicación

export type {
	Consent,
	ConsentsResponse,
	Minor,
	Pagination,
} from "./useConsents";
export { useConsents } from "./useConsents";
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
