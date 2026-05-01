import { dedupeKeysMatch } from "@/lib/offline/idempotency";
import {
	OFFLINE_QUEUE_RETRY_DELAY_MS,
	OFFLINE_QUEUE_SYNC_STATE,
	type OfflineQueueItem,
	type OfflineQueueRetryDelayMs,
} from "@/types/offline";

export function getOfflineQueueRetryDelayMs(
	attempts: number,
): OfflineQueueRetryDelayMs {
	if (attempts <= 1) {
		return OFFLINE_QUEUE_RETRY_DELAY_MS[0];
	}

	if (attempts === 2) {
		return OFFLINE_QUEUE_RETRY_DELAY_MS[1];
	}

	return OFFLINE_QUEUE_RETRY_DELAY_MS[2];
}

function findOfflineQueueItemByDedupeKey<TPayload>(
	queue: Array<OfflineQueueItem<TPayload>>,
	dedupeKey: string,
): OfflineQueueItem<TPayload> | undefined {
	return queue.find((item) => dedupeKeysMatch(item.dedupeKey, dedupeKey));
}

export function upsertOfflineQueueItem<TPayload>(
	queue: Array<OfflineQueueItem<TPayload>>,
	item: OfflineQueueItem<TPayload>,
): Array<OfflineQueueItem<TPayload>> {
	const duplicate = findOfflineQueueItemByDedupeKey(queue, item.dedupeKey);
	const duplicateIndex = duplicate
		? queue.findIndex((existingItem) => existingItem.id === duplicate.id)
		: -1;

	if (duplicateIndex === -1) {
		return [...queue, item];
	}

	const nextQueue = [...queue];
	nextQueue[duplicateIndex] = item;
	return nextQueue;
}

export function createOfflineQueueItem<TPayload>(
	input: Pick<
		OfflineQueueItem<TPayload>,
		"id" | "kind" | "dedupeKey" | "payload" | "createdAt"
	>,
): OfflineQueueItem<TPayload> {
	return {
		...input,
		attempts: 0,
		syncState: OFFLINE_QUEUE_SYNC_STATE.PENDING,
	};
}
