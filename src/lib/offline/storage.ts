import type { ConsentSubmission } from "@/lib/schemas/consent.schema";
import type { OfflineQueueItem } from "@/types/offline";

const OFFLINE_DB_NAME = "jumping-park-offline";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_QUEUE_STORE = "consentQueue";
const OFFLINE_QUEUE_STORAGE_KEY = "jumping-park.offline.queue";
export const OFFLINE_QUEUE_UPDATED_EVENT = "jumping-park:offline-queue-updated";

export type OfflineConsentQueueItem = OfflineQueueItem<ConsentSubmission>;

function canUseWindow(): boolean {
	return typeof window !== "undefined";
}

function canUseIndexedDb(): boolean {
	return canUseWindow() && typeof window.indexedDB !== "undefined";
}

function notifyOfflineQueueUpdated() {
	if (!canUseWindow()) {
		return;
	}

	window.dispatchEvent(new Event(OFFLINE_QUEUE_UPDATED_EVENT));
}

function readFallbackQueue(): OfflineConsentQueueItem[] {
	if (!canUseWindow()) {
		return [];
	}

	try {
		const storedValue = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
		if (!storedValue) {
			return [];
		}

		const parsedValue = JSON.parse(storedValue) as OfflineConsentQueueItem[];
		return Array.isArray(parsedValue) ? parsedValue : [];
	} catch {
		return [];
	}
}

function writeFallbackQueue(queue: OfflineConsentQueueItem[]) {
	if (!canUseWindow()) {
		return;
	}

	window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
	notifyOfflineQueueUpdated();
}

function openOfflineDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
				database.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: "id" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function withOfflineStore<T>(
	mode: IDBTransactionMode,
	callback: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
	const database = await openOfflineDb();

	try {
		const transaction = database.transaction(OFFLINE_QUEUE_STORE, mode);
		const store = transaction.objectStore(OFFLINE_QUEUE_STORE);
		const result = await callback(store);

		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});

		return result;
	} finally {
		database.close();
	}
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function readOfflineConsentQueue(): Promise<
	OfflineConsentQueueItem[]
> {
	if (!canUseIndexedDb()) {
		return readFallbackQueue().sort((left, right) =>
			left.createdAt.localeCompare(right.createdAt),
		);
	}

	try {
		const queue = await withOfflineStore("readonly", async (store) => {
			return requestToPromise(
				store.getAll() as IDBRequest<OfflineConsentQueueItem[]>,
			);
		});

		return queue.sort((left, right) =>
			left.createdAt.localeCompare(right.createdAt),
		);
	} catch {
		return readFallbackQueue().sort((left, right) =>
			left.createdAt.localeCompare(right.createdAt),
		);
	}
}

export async function writeOfflineConsentQueue(
	queue: OfflineConsentQueueItem[],
): Promise<void> {
	if (!canUseIndexedDb()) {
		writeFallbackQueue(queue);
		return;
	}

	try {
		await withOfflineStore("readwrite", async (store) => {
			const existingItems = await requestToPromise(
				store.getAllKeys() as IDBRequest<IDBValidKey[]>,
			);

			for (const key of existingItems) {
				store.delete(key);
			}

			for (const item of queue) {
				store.put(item);
			}
		});
		notifyOfflineQueueUpdated();
	} catch {
		writeFallbackQueue(queue);
	}
}

export async function getOfflineConsentQueueSize(): Promise<number> {
	const queue = await readOfflineConsentQueue();
	return queue.length;
}
