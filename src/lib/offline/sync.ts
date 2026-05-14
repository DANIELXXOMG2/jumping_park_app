import { getOfflineQueueRetryDelayMs } from "@/lib/offline/queue";
import {
	type OfflineConsentQueueItem,
	readOfflineConsentQueue,
	writeOfflineConsentQueue,
} from "@/lib/offline/storage";
import { OFFLINE_QUEUE_SYNC_STATE } from "@/types/offline";

const CONSENT_SYNC_ENDPOINT = "/api/consentimientos";

export const OFFLINE_SYNC_ERROR_KIND = {
	TRANSIENT: "transient",
	PERMANENT: "permanent",
	IDEMPOTENT: "idempotent",
} as const;

type OfflineSyncErrorKind =
	(typeof OFFLINE_SYNC_ERROR_KIND)[keyof typeof OFFLINE_SYNC_ERROR_KIND];

class OfflineSyncError extends Error {
	readonly kind: OfflineSyncErrorKind;

	constructor(kind: OfflineSyncErrorKind, message: string) {
		super(message);
		this.name = "OfflineSyncError";
		this.kind = kind;
	}
}

export function createOfflineSyncError(input: {
	kind: OfflineSyncErrorKind;
	message: string;
}): OfflineSyncError {
	return new OfflineSyncError(input.kind, input.message);
}

function isOfflineSyncError(error: unknown): error is OfflineSyncError {
	return error instanceof OfflineSyncError;
}

export interface SyncOfflineConsentQueueResult {
	attempted: number;
	synced: number;
	failed: number;
	remaining: number;
	lastError?: string;
	rejected?: number;
	lastRejectedError?: string;
}

export interface SyncOfflineConsentQueueOptions {
	force?: boolean;
	beforeSync?: () => void;
	afterSync?: (result: SyncOfflineConsentQueueResult) => void;
}

export interface OfflineConsentSyncRuntime {
	canSync?: () => boolean;
	now?: () => number;
	postQueuedConsent?: (item: OfflineConsentQueueItem) => Promise<void>;
	readQueue?: () => Promise<OfflineConsentQueueItem[]>;
	writeQueue?: (queue: OfflineConsentQueueItem[]) => Promise<void>;
}

function canSyncOfflineQueue(): boolean {
	return typeof navigator !== "undefined" ? navigator.onLine : false;
}

function shouldAttemptSync(
	item: OfflineConsentQueueItem,
	force: boolean,
	now: number,
): boolean {
	if (force) {
		return true;
	}

	if (item.syncState === OFFLINE_QUEUE_SYNC_STATE.PENDING) {
		return true;
	}

	if (
		item.syncState !== OFFLINE_QUEUE_SYNC_STATE.FAILED ||
		!item.lastAttemptAt
	) {
		return false;
	}

	return (
		Date.parse(item.lastAttemptAt) +
			getOfflineQueueRetryDelayMs(item.attempts) <=
		now
	);
}

async function postQueuedConsent(item: OfflineConsentQueueItem): Promise<void> {
	const response = await fetch(CONSENT_SYNC_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(item.payload),
	});

	if (!response.ok) {
		const data: unknown = await response.json().catch(() => null);
		const message =
			typeof data === "object" &&
			data !== null &&
			"error" in data &&
			typeof data.error === "string"
				? data.error
				: "No pudimos sincronizar el consentimiento";

		if (response.status === 409) {
			throw createOfflineSyncError({
				kind: OFFLINE_SYNC_ERROR_KIND.IDEMPOTENT,
				message,
			});
		}

		if ([400, 401, 403, 404, 422].includes(response.status)) {
			throw createOfflineSyncError({
				kind: OFFLINE_SYNC_ERROR_KIND.PERMANENT,
				message,
			});
		}

		throw createOfflineSyncError({
			kind: OFFLINE_SYNC_ERROR_KIND.TRANSIENT,
			message,
		});
	}
}

export async function syncOfflineConsentQueueWithRuntime(
	options: SyncOfflineConsentQueueOptions = {},
	runtime: OfflineConsentSyncRuntime = {},
): Promise<SyncOfflineConsentQueueResult> {
	const readQueue = runtime.readQueue ?? readOfflineConsentQueue;
	const writeQueue = runtime.writeQueue ?? writeOfflineConsentQueue;
	const canSync = runtime.canSync ?? canSyncOfflineQueue;
	const getNow = runtime.now ?? Date.now;
	const postConsent = runtime.postQueuedConsent ?? postQueuedConsent;

	if (!canSync()) {
		const queue = await readQueue();
		return {
			attempted: 0,
			synced: 0,
			failed: 0,
			remaining: queue.length,
		};
	}

	const queue = await readQueue();
	const now = getNow();
	const workingQueue = [...queue];
	let attempted = 0;
	let synced = 0;
	let failed = 0;
	let lastError: string | undefined;
	let rejected = 0;
	let lastRejectedError: string | undefined;

	options.beforeSync?.();

	for (const item of queue) {
		if (!shouldAttemptSync(item, options.force ?? false, now)) {
			continue;
		}

		attempted += 1;
		const queueIndex = workingQueue.findIndex(
			(queueItem) => queueItem.id === item.id,
		);

		if (queueIndex === -1) {
			continue;
		}

		const attemptTimestamp = new Date().toISOString();
		workingQueue[queueIndex] = {
			...workingQueue[queueIndex],
			attempts: workingQueue[queueIndex].attempts + 1,
			syncState: OFFLINE_QUEUE_SYNC_STATE.SYNCING,
			lastAttemptAt: attemptTimestamp,
			lastError: undefined,
		};
		await writeQueue(workingQueue);

		try {
			await postConsent(workingQueue[queueIndex]);
			workingQueue.splice(queueIndex, 1);
			synced += 1;
			await writeQueue(workingQueue);
		} catch (error) {
			if (isOfflineSyncError(error)) {
				if (error.kind === OFFLINE_SYNC_ERROR_KIND.IDEMPOTENT) {
					workingQueue.splice(queueIndex, 1);
					synced += 1;
					await writeQueue(workingQueue);
					continue;
				}

				if (error.kind === OFFLINE_SYNC_ERROR_KIND.PERMANENT) {
					workingQueue.splice(queueIndex, 1);
					rejected += 1;
					lastRejectedError = error.message;
					await writeQueue(workingQueue);
					continue;
				}
			}

			const message =
				error instanceof Error
					? error.message
					: "No pudimos sincronizar el consentimiento";
			workingQueue[queueIndex] = {
				...workingQueue[queueIndex],
				syncState: OFFLINE_QUEUE_SYNC_STATE.FAILED,
				lastError: message,
			};
			failed += 1;
			lastError = message;
			await writeQueue(workingQueue);
		}
	}

	const result = {
		attempted,
		synced,
		failed,
		remaining: workingQueue.length,
		lastError,
		...(rejected > 0
			? {
					rejected,
					lastRejectedError,
				}
			: {}),
	};

	options.afterSync?.(result);

	return result;
}

export async function syncOfflineConsentQueue(
	options: SyncOfflineConsentQueueOptions = {},
): Promise<SyncOfflineConsentQueueResult> {
	return syncOfflineConsentQueueWithRuntime(options);
}
