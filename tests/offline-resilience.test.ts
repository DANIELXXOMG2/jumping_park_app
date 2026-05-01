import { describe, expect, it } from 'bun:test'
import {
	HARDENING_FLAG,
	resolveHardeningFlag,
} from '@/lib/hardeningPolicy'
import { buildConsentSubmissionPayload, CONSENT_POLICY_VERSION } from '@/lib/offline/consentPayload'
import { createOfflineSyncLedgerRecord, isOfflineSyncLedgerRecord } from '@/lib/offline/ledger'
import { consentSubmissionSchema } from '@/lib/schemas/consent.schema'
import {
	resolveConsentSignatureUploadPlan,
	resolveOfflineConsentAssetCleanup,
} from '@/services/consentService'

describe('offline resilience rollout', () => {
	it('accepts offline sync metadata in consent submissions', () => {
		const parsed = consentSubmissionSchema.safeParse({
			acceptedPolicy: true,
			minors: [],
			signature: 'data:image/png;base64,abc',
			responsibleAdult: {
				fullName: 'Ada Lovelace',
			documentId: '12345',
				email: 'ada@example.com',
				phone: '3001234567',
			},
			offlineSync: {
				dedupeKey: 'dedupe-123',
				policyVersion: CONSENT_POLICY_VERSION,
				signedAtLocal: '2026-04-06T10:00:00.000Z',
			},
		})

		expect(parsed.success).toBe(true)
	})

	it('builds completed offline ledger records for idempotent replays', () => {
		const record = createOfflineSyncLedgerRecord({
			dedupeKey: 'dedupe-123',
			consentId: 'consent-1',
			consecutivo: 1001,
			userId: '123',
			policyVersion: CONSENT_POLICY_VERSION,
			signedAtLocal: '2026-04-06T10:00:00.000Z',
			acknowledgedAt: '2026-04-06T10:00:05.000Z',
		})

		expect(isOfflineSyncLedgerRecord(record)).toBe(true)
		expect(record.status).toBe('completed')
		expect(record.source).toBe('server')
		expect(record.createdAt).toBe('2026-04-06T10:00:05.000Z')
		expect(record.updatedAt).toBe('2026-04-06T10:00:05.000Z')
	})

	it('plans explicit orphaned asset cleanup for replayed or rejected offline writes', () => {
		expect(
			resolveOfflineConsentAssetCleanup({
				hasOfflineSync: true,
				assetUploadedThisAttempt: true,
				replayOutcome: 'created',
			}),
		).toEqual({ shouldDelete: false })

		expect(
			resolveOfflineConsentAssetCleanup({
				hasOfflineSync: true,
				assetUploadedThisAttempt: true,
				replayOutcome: 'replayed',
			}),
		).toEqual({
			shouldDelete: true,
			reason: 'duplicate-ledger',
		})

		expect(
			resolveOfflineConsentAssetCleanup({
				hasOfflineSync: true,
				assetUploadedThisAttempt: true,
				replayOutcome: 'rejected',
			}),
		).toEqual({
			shouldDelete: true,
			reason: 'rejected-ledger',
		})
	})

	it('preserves a reused deterministic offline asset when malformed or duplicate replays reject later attempts', () => {
		expect(
			resolveOfflineConsentAssetCleanup({
				hasOfflineSync: true,
				assetUploadedThisAttempt: false,
				replayOutcome: 'replayed',
			}),
		).toEqual({ shouldDelete: false })

		expect(
			resolveOfflineConsentAssetCleanup({
				hasOfflineSync: true,
				assetUploadedThisAttempt: false,
				replayOutcome: 'rejected',
			}),
		).toEqual({ shouldDelete: false })
	})

	it('reuses a deterministic offline signature path across retries before the ledger exists', () => {
		const firstAttempt = resolveConsentSignatureUploadPlan({
			documentId: '123',
			nowMs: 1_700_000_000_000,
			offlineSync: {
				dedupeKey: 'dedupe-123',
				policyVersion: CONSENT_POLICY_VERSION,
				signedAtLocal: '2026-04-06T10:00:00.000Z',
			},
		})

		const retryAttempt = resolveConsentSignatureUploadPlan({
			documentId: '123',
			nowMs: 1_800_000_000_000,
			offlineSync: {
				dedupeKey: 'dedupe-123',
				policyVersion: CONSENT_POLICY_VERSION,
				signedAtLocal: '2026-04-06T10:00:00.000Z',
			},
		})

		expect(firstAttempt.path).toBe('signatures/123/offline/dedupe-123.png')
		expect(retryAttempt.path).toBe(firstAttempt.path)
		expect(firstAttempt.reuseExistingAsset).toBe(true)
		expect(firstAttempt.cleanupOnRejectedReplay).toBe(true)
	})

	it('keeps non-offline signature uploads timestamped and disposable', () => {
		const plan = resolveConsentSignatureUploadPlan({
			documentId: '123',
			nowMs: 1_700_000_000_000,
		})

		expect(plan.path).toBe('signatures/123/1700000000000.png')
		expect(plan.reuseExistingAsset).toBe(false)
		expect(plan.cleanupOnRejectedReplay).toBe(true)
	})

	it('resolves the offline queue flag from a public client env fallback', () => {
		const previousServerValue = process.env.OFFLINE_QUEUE_ENABLED
		const previousClientValue = process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED

		delete process.env.OFFLINE_QUEUE_ENABLED
		process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED = 'true'

		const resolution = resolveHardeningFlag(HARDENING_FLAG.OFFLINE_QUEUE)

		expect(resolution.enabled).toBe(true)
		expect(resolution.status).toBe('enabled')
		expect(resolution.fallbackApplied).toBe(false)

		if (previousServerValue === undefined) {
			delete process.env.OFFLINE_QUEUE_ENABLED
		} else {
			process.env.OFFLINE_QUEUE_ENABLED = previousServerValue
		}

		if (previousClientValue === undefined) {
			delete process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED
		} else {
			process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED = previousClientValue
		}
	})

	it('builds consent payloads that preserve offline sync metadata', () => {
		const payload = buildConsentSubmissionPayload({
			formData: {
				acceptedPolicy: true,
				minors: [],
				signature: 'signed',
			},
			visitorData: {
				uid: '123',
				fullName: 'Ada Lovelace',
				email: 'ada@example.com',
				phone: '3001234567',
			},
			signatureBase64: 'data:image/png;base64,abc',
			offlineSync: {
				dedupeKey: 'dedupe-123',
				policyVersion: CONSENT_POLICY_VERSION,
				signedAtLocal: '2026-04-06T10:00:00.000Z',
			},
		})

		expect(payload.signature).toBe('data:image/png;base64,abc')
		expect(payload.offlineSync?.dedupeKey).toBe('dedupe-123')
		expect(payload.responsibleAdult.documentId).toBe('123')
	})
})
