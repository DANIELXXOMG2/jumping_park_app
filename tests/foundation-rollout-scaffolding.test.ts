import { describe, expect, it } from 'bun:test'
import {
	createConsentDedupeKey,
	buildConsentIdempotencySeed,
} from '@/lib/offline/idempotency'
import {
	createOfflineQueueItem,
	getOfflineQueueRetryDelayMs,
	upsertOfflineQueueItem,
} from '@/lib/offline/queue'
import { OFFLINE_QUEUE_ITEM_KIND } from '@/types/offline'

process.env.FIREBASE_PROJECT_ID ??= 'test-project'
process.env.FIREBASE_CLIENT_EMAIL ??= 'firebase-adminsdk@test-project.iam.gserviceaccount.com'
process.env.FIREBASE_PRIVATE_KEY ??=
	'-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n'

const {
	decodeFirestoreCursor,
	encodeFirestoreCursor,
	resolveCursorPageLimit,
} = await import('@/lib/firestoreService')

describe('phase 1 rollout scaffolding', () => {
	it('normalizes cursor page limits to the supported contract', () => {
		expect(resolveCursorPageLimit()).toBe(20)
		expect(resolveCursorPageLimit(20)).toBe(20)
		expect(resolveCursorPageLimit(50)).toBe(50)
		expect(resolveCursorPageLimit(35)).toBe(20)
		expect(resolveCursorPageLimit(999)).toBe(50)
	})

	it('round-trips opaque Firestore cursors', () => {
		const cursor = encodeFirestoreCursor({
			collection: 'users',
			orderByField: 'createdAt',
			orderDirection: 'desc',
			lastDocumentId: 'user-42',
			lastOrderedValue: '2026-04-06T12:00:00.000Z',
			search: 'suma',
		})

		expect(cursor).not.toContain('user-42')
		expect(decodeFirestoreCursor(cursor)).toEqual({
			version: 'v1',
			collection: 'users',
			orderByField: 'createdAt',
			orderDirection: 'desc',
			lastDocumentId: 'user-42',
			lastOrderedValue: '2026-04-06T12:00:00.000Z',
			search: 'suma',
		})
	})

	it('rejects malformed Firestore cursors', () => {
		let errorMessage = ''

		try {
			decodeFirestoreCursor('not-a-valid-cursor')
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'unknown-error'
		}

		expect(errorMessage).toBe('Invalid Firestore cursor token')
	})

	it('builds deterministic idempotency seeds and dedupe keys', () => {
		const seed = buildConsentIdempotencySeed({
			userId: ' 123 ',
			policyVersion: ' v2 ',
			signedAtLocal: ' 2026-04-06T10:00:00.000Z ',
		})

		expect(seed).toBe('123|v2|2026-04-06T10:00:00.000Z')

		const firstKey = createConsentDedupeKey({
			userId: '123',
			policyVersion: 'v2',
			signedAtLocal: '2026-04-06T10:00:00.000Z',
		})
		const secondKey = createConsentDedupeKey({
			userId: '123',
			policyVersion: 'v2',
			signedAtLocal: '2026-04-06T10:00:00.000Z',
		})
		const changedKey = createConsentDedupeKey({
			userId: '123',
			policyVersion: 'v2',
			signedAtLocal: '2026-04-06T10:05:00.000Z',
		})

		expect(firstKey).toBe(secondKey)
		expect(firstKey).not.toBe(changedKey)
		expect(firstKey.length).toBe(64)
	})

	it('dedupes offline queue items by dedupe key and exposes staged retry delays', () => {
		const originalItem = createOfflineQueueItem({
			id: 'queue-1',
			kind: OFFLINE_QUEUE_ITEM_KIND.CONSENT_CREATE,
			dedupeKey: 'ABC123',
			payload: { userId: '123' },
			createdAt: '2026-04-06T10:00:00.000Z',
		})
		const replacementItem = {
			...originalItem,
			id: 'queue-2',
			dedupeKey: 'abc123',
			attempts: 2,
		}

		const queue = upsertOfflineQueueItem([], originalItem)
		const dedupedQueue = upsertOfflineQueueItem(queue, replacementItem)

		expect(originalItem.attempts).toBe(0)
		expect(originalItem.syncState).toBe('pending')
		expect(dedupedQueue.length).toBe(1)
		expect(dedupedQueue[0]?.id).toBe('queue-2')
		expect(getOfflineQueueRetryDelayMs(0)).toBe(30_000)
		expect(getOfflineQueueRetryDelayMs(2)).toBe(120_000)
		expect(getOfflineQueueRetryDelayMs(5)).toBe(600_000)
	})
})
