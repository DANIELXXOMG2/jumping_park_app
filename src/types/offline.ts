export const OFFLINE_QUEUE_ITEM_KIND = {
	CONSENT_CREATE: "consent.create",
} as const;

export const OFFLINE_QUEUE_SYNC_STATE = {
	PENDING: "pending",
	SYNCING: "syncing",
	FAILED: "failed",
	REJECTED: "rejected",
} as const;

export const OFFLINE_SYNC_LEDGER_STATUS = {
	COMPLETED: "completed",
} as const;

export const OFFLINE_IDEMPOTENCY_SOURCE = {
	CLIENT: "client",
	SERVER: "server",
} as const;

export const OFFLINE_QUEUE_RETRY_DELAY_MS = [30_000, 120_000, 600_000] as const;

export type OfflineQueueItemKind =
	(typeof OFFLINE_QUEUE_ITEM_KIND)[keyof typeof OFFLINE_QUEUE_ITEM_KIND];
export type OfflineQueueSyncState =
	(typeof OFFLINE_QUEUE_SYNC_STATE)[keyof typeof OFFLINE_QUEUE_SYNC_STATE];
export type OfflineIdempotencySource =
	(typeof OFFLINE_IDEMPOTENCY_SOURCE)[keyof typeof OFFLINE_IDEMPOTENCY_SOURCE];
export type OfflineQueueRetryDelayMs =
	(typeof OFFLINE_QUEUE_RETRY_DELAY_MS)[number];
export type OfflineSyncLedgerStatus =
	(typeof OFFLINE_SYNC_LEDGER_STATUS)[keyof typeof OFFLINE_SYNC_LEDGER_STATUS];

export interface OfflineIdempotencyDescriptor {
	dedupeKey: string;
	source: OfflineIdempotencySource;
	acknowledgedAt?: string;
	recordId?: string;
}

export interface OfflineSyncRequestMetadata {
	dedupeKey: string;
	policyVersion: string;
	signedAtLocal: string;
}

export interface OfflineSyncLedgerRecord {
	dedupeKey: string;
	consentId: string;
	consecutivo: number;
	userId: string;
	policyVersion: string;
	signedAtLocal: string;
	status: OfflineSyncLedgerStatus;
	acknowledgedAt: string;
	source: OfflineIdempotencySource;
	createdAt?: string;
	updatedAt?: string;
}

export interface OfflineQueueItem<TPayload = unknown> {
	id: string;
	kind: OfflineQueueItemKind;
	dedupeKey: string;
	payload: TPayload;
	createdAt: string;
	attempts: number;
	lastError?: string;
	syncState: OfflineQueueSyncState;
	lastAttemptAt?: string;
}
