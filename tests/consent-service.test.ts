import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	consentService,
	type CreateConsentInput,
} from '@/services/consentService'
import type { Minor, UserProfile } from '@/types/firestore'
import { OFFLINE_IDEMPOTENCY_SOURCE } from '@/types/offline'

type ConsentPayload = {
	policyVersion: string
	offlineSync?: {
		dedupeKey: string
		source: string
		recordId: string
		acknowledgedAt: string
	}
} & Record<string, unknown>

type ConsentServicePayloadBuilder = {
	buildConsentDocumentPayload: (
		consentId: string,
		consecutivo: number,
		userProfile: UserProfile,
		normalizedMinors: Minor[],
		signaturePath: string,
		ipAddress: string,
		offlineSync?: CreateConsentInput['offlineSync'],
	) => ConsentPayload
}

const payloadBuilder = consentService as unknown as ConsentServicePayloadBuilder

const validMinors: Minor[] = []

const validUserProfile: UserProfile = {
	uid: '12345',
	fullName: 'Ada Lovelace',
	email: 'ada@example.com',
	phone: '3001234567',
	minors: validMinors,
	createdAt: new Date('2026-05-16T12:00:00.000Z'),
	updatedAt: new Date('2026-05-16T12:00:00.000Z'),
}

function buildPayload(offlineSync?: CreateConsentInput['offlineSync']): ConsentPayload {
	return payloadBuilder.buildConsentDocumentPayload(
		'consent-123',
		1001,
		validUserProfile,
		validMinors,
		'signatures/12345/example.png',
		'127.0.0.1',
		offlineSync,
	)
}

describe('consent service payload builder', () => {
	it('omits offlineSync entirely when offline replay metadata is absent', () => {
		const payload = buildPayload()

		expect('offlineSync' in payload).toBe(false)
		expect(Object.prototype.hasOwnProperty.call(payload, 'offlineSync')).toBe(
			false,
		)
		expect(payload.policyVersion).toBe('1.0')
	})

	it('preserves offlineSync for offline replay writes when metadata is present', () => {
		const payload = buildPayload({
			dedupeKey: 'dedupe-123',
			policyVersion: 'v2',
			signedAtLocal: '2026-05-16T12:00:00.000Z',
		})

		expect(payload.policyVersion).toBe('v2')
		expect(payload.offlineSync?.dedupeKey).toBe('dedupe-123')
		expect(payload.offlineSync?.source).toBe(
			OFFLINE_IDEMPOTENCY_SOURCE.SERVER,
		)
		expect(payload.offlineSync?.recordId).toBe('dedupe-123')
		expect(typeof payload.offlineSync?.acknowledgedAt).toBe('string')
	})

	it('keeps Firestore initialization strict without ignoreUndefinedProperties', () => {
		const firebaseAdminSource = readFileSync(
			join(process.cwd(), 'src/lib/firebaseAdmin.ts'),
			'utf8',
		)
		const firebaseClientSource = readFileSync(
			join(process.cwd(), 'src/lib/firebaseClient.ts'),
			'utf8',
		)

		expect(firebaseAdminSource).not.toContain('ignoreUndefinedProperties')
		expect(firebaseClientSource).not.toContain('ignoreUndefinedProperties')
	})
})
