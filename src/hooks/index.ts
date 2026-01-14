// Hooks personalizados de la aplicación

export type {
	Consent,
	ConsentsResponse,
	Minor,
	Pagination,
} from "./useConsents";
export { useConsents } from "./useConsents";
export type { OCRResult, OCRScannerState } from "./useOCRScanner";
export { useOCRScanner } from "./useOCRScanner";
export type {
	ConnectionState,
	OfflineQueryOptions,
	RecentRegistrationsResult,
} from "./useOfflineData";
export {
	useOfflineAwareQuery,
	useOfflineConnection,
	useRecentRegistrations,
} from "./useOfflineData";
export { usePWAInstall } from "./usePWAInstall";
export type { SoundType } from "./useUISound";
export { useUISound } from "./useUISound";
