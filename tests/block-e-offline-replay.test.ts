import { describe, expect, it } from 'bun:test'
import { createOfflineQueueItem, upsertOfflineQueueItem } from '@/lib/offline/queue'
import { resolveOfflineReplayMutation } from '@/lib/offline/serverReplay'
import {
	createOfflineSyncError,
	OFFLINE_SYNC_ERROR_KIND,
	syncOfflineConsentQueueWithRuntime,
} from '@/lib/offline/sync'
import type { ConsentSubmission } from '@/lib/schemas/consent.schema'
import type { OfflineConsentQueueItem } from '@/lib/offline/storage'
import type { OfflineSyncLedgerRecord } from '@/types/offline'

function createQueuedConsent(dedupeKey: string): OfflineConsentQueueItem {
	const payload: ConsentSubmission = {
		acceptedPolicy: true,
		minors: [],
		signature: 'data:image/png;base64,signature',
		responsibleAdult: {
			fullName: 'Ada Lovelace',
			documentId: '1032456789',
			email: 'ada@jumpingpark.test',
			phone: '3000000000',
		},
		offlineSync: {
			dedupeKey,
			policyVersion: 'v2',
			signedAtLocal: '2026-04-07T10:00:00.000Z',
		},
	}

	return createOfflineQueueItem({
		id: dedupeKey,
		kind: 'consent.create',
		dedupeKey,
		payload,
		createdAt: '2026-04-07T10:00:00.000Z',
	})
}

describe('block e offline replay proof', () => {
	it('proves offline submit queues, reconnect syncs, and server dedupes to one consent', async () => {
		let queue: OfflineConsentQueueItem[] = []
		let ledger: OfflineSyncLedgerRecord | null = null
		let latestConsecutivo = 1000
		const persistedConsentIds: string[] = []
		const persistedDedupeKeys: string[] = []

		const queuedItem = createQueuedConsent('dedupe-123')
		queue = upsertOfflineQueueItem(queue, queuedItem)

		const offlineResult = await syncOfflineConsentQueueWithRuntime(
			{},
			{
				canSync: () => false,
				readQueue: async () => queue,
				writeQueue: async (nextQueue) => {
					queue = nextQueue
				},
			},
		)

		expect(offlineResult).toEqual({
			attempted: 0,
			synced: 0,
			failed: 0,
			remaining: 1,
		})
		expect(queue.length).toBe(1)

		const serverReplay = async (item: OfflineConsentQueueItem) => {
			const resolution = resolveOfflineReplayMutation({
				dedupeKey: item.dedupeKey,
				existingLedger: ledger,
				previousConsecutivo: latestConsecutivo,
				consentDocument: {
					id: `consent-${latestConsecutivo + 1}`,
					userId: item.payload.responsibleAdult.documentId,
					policyVersion: item.payload.offlineSync?.policyVersion ?? 'v2',
				},
				consentId: `consent-${latestConsecutivo + 1}`,
				userId: item.payload.responsibleAdult.documentId,
				policyVersion: item.payload.offlineSync?.policyVersion ?? 'v2',
				signedAtLocal:
					item.payload.offlineSync?.signedAtLocal ?? item.createdAt,
				acknowledgedAt: '2026-04-07T10:00:05.000Z',
			})

			if (!resolution.success) {
				throw new Error(`Unexpected replay rejection: ${resolution.reason}`)
			}

			if (!resolution.replayed) {
				persistedConsentIds.push(resolution.consentId)
				persistedDedupeKeys.push(item.dedupeKey)
				latestConsecutivo = resolution.consecutivo
				ledger = resolution.ledgerWrite ?? null
			}
		}

		const reconnectResult = await syncOfflineConsentQueueWithRuntime(
			{ force: true },
			{
				canSync: () => true,
				readQueue: async () => queue,
				writeQueue: async (nextQueue) => {
					queue = nextQueue
				},
				postQueuedConsent: serverReplay,
				now: () => Date.parse('2026-04-07T10:01:00.000Z'),
			},
		)

		expect(reconnectResult).toEqual({
			attempted: 1,
			synced: 1,
			failed: 0,
			remaining: 0,
			lastError: undefined,
		})
		expect(queue.length).toBe(0)
		expect(persistedConsentIds).toEqual(['consent-1001'])
		expect(persistedDedupeKeys).toEqual(['dedupe-123'])
		const ledgerAfterReconnect = ledger as OfflineSyncLedgerRecord | null
		expect(ledgerAfterReconnect === null).toBe(false)
		if (!ledgerAfterReconnect) {
			throw new Error('Expected offline ledger to be written after reconnect')
		}
		expect(ledgerAfterReconnect.consecutivo).toBe(1001)

		queue = [createQueuedConsent('dedupe-123')]

		const replayResult = await syncOfflineConsentQueueWithRuntime(
			{ force: true },
			{
				canSync: () => true,
				readQueue: async () => queue,
				writeQueue: async (nextQueue) => {
					queue = nextQueue
				},
				postQueuedConsent: serverReplay,
				now: () => Date.parse('2026-04-07T10:02:00.000Z'),
			},
		)

		expect(replayResult.synced).toBe(1)
		expect(queue.length).toBe(0)
		expect(persistedConsentIds).toEqual(['consent-1001'])
		expect(persistedDedupeKeys).toEqual(['dedupe-123'])
		const finalLedger = ledger as OfflineSyncLedgerRecord | null
		if (!finalLedger) {
			throw new Error('Expected offline ledger to be written')
		}
		expect(finalLedger.consentId).toBe('consent-1001')
		expect(finalLedger.consecutivo).toBe(1001)
	})

	it('treats stale completed ledgers as authoritative after the consent document is deleted', () => {
		const resolution = resolveOfflineReplayMutation({
			dedupeKey: 'dedupe-123',
			existingLedger: {
				dedupeKey: 'dedupe-123',
				consentId: 'consent-1001',
				consecutivo: 1001,
				userId: '1032456789',
				policyVersion: 'v2',
				signedAtLocal: '2026-04-07T10:00:00.000Z',
			},
			previousConsecutivo: 1001,
			consentDocument: {
				id: 'consent-1002',
				userId: '1032456789',
				policyVersion: 'v2',
			},
			consentId: 'consent-1002',
			userId: '1032456789',
			policyVersion: 'v2',
			signedAtLocal: '2026-04-07T10:05:00.000Z',
			acknowledgedAt: '2026-04-07T10:05:05.000Z',
		})

		expect(resolution.success).toBe(true)
		if (!resolution.success) {
			throw new Error('Expected stale ledger replay resolution to succeed')
		}
		expect(resolution.replayed).toBe(true)
		expect(resolution.consentId).toBe('consent-1001')
		expect(resolution.consecutivo).toBe(1001)
		expect(resolution.consentWrite).toBe(undefined)
		expect(resolution.ledgerWrite).toBe(undefined)
	})

	it('rejects malformed ledgers instead of overwriting append-only dedupe history', () => {
		const resolution = resolveOfflineReplayMutation({
			dedupeKey: 'dedupe-123',
			existingLedger: {
				dedupeKey: 'dedupe-123',
				status: 'completed',
			},
			previousConsecutivo: 1001,
			consentDocument: {
				id: 'consent-1002',
				userId: '1032456789',
				policyVersion: 'v2',
			},
			consentId: 'consent-1002',
			userId: '1032456789',
			policyVersion: 'v2',
			signedAtLocal: '2026-04-07T10:05:00.000Z',
			acknowledgedAt: '2026-04-07T10:05:05.000Z',
		})

		expect(resolution.success).toBe(false)
		if (resolution.success) {
			throw new Error('Expected malformed ledger replay resolution to be rejected')
		}
		expect(resolution.replayed).toBe(false)
		expect(resolution.reason).toBe('malformed-ledger')
		expect('consentWrite' in resolution).toBe(false)
		expect('counterWrite' in resolution).toBe(false)
		expect('ledgerWrite' in resolution).toBe(false)
	})

	it('removes permanently rejected queue items and records deterministic telemetry', async () => {
		let queue = [createQueuedConsent('reject-401')]

		const result = await syncOfflineConsentQueueWithRuntime(
			{ force: true },
			{
				canSync: () => true,
				readQueue: async () => queue,
				writeQueue: async (nextQueue) => {
					queue = nextQueue
				},
				postQueuedConsent: async () => {
					throw createOfflineSyncError({
						kind: OFFLINE_SYNC_ERROR_KIND.PERMANENT,
						message: 'OTP session invalid',
					})
				},
				now: () => Date.parse('2026-04-07T10:03:00.000Z'),
			},
		)

		expect(result).toEqual({
			attempted: 1,
			synced: 0,
			rejected: 1,
			failed: 0,
			remaining: 0,
			lastError: undefined,
			lastRejectedError: 'OTP session invalid',
		})
		expect(queue).toEqual([])
	})
})
