import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type FirestoreIndexField = {
	fieldPath: string
	arrayConfig?: string
	order?: string
}

type FirestoreIndex = {
	collectionGroup: string
	queryScope: string
	fields: FirestoreIndexField[]
}

type FirestoreIndexesFile = {
	indexes: FirestoreIndex[]
}

type AuditedCompositeQuery = {
	name: string
	source: string
	expectedIndex: FirestoreIndex
}

function readProjectFile(relativePath: string): string {
	return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function isFirestoreIndexField(value: unknown): value is FirestoreIndexField {
	return (
		isRecord(value) &&
		typeof value.fieldPath === 'string' &&
		(typeof value.order === 'string' || typeof value.order === 'undefined') &&
		(typeof value.arrayConfig === 'string' ||
			typeof value.arrayConfig === 'undefined')
	)
}

function isFirestoreIndex(value: unknown): value is FirestoreIndex {
	return (
		isRecord(value) &&
		typeof value.collectionGroup === 'string' &&
		typeof value.queryScope === 'string' &&
		Array.isArray(value.fields) &&
		value.fields.every(isFirestoreIndexField)
	)
}

function parseIndexesFile(): FirestoreIndexesFile {
	const parsed = JSON.parse(
		readProjectFile('firebase/firestore.indexes.json'),
	) as unknown

	if (
		!isRecord(parsed) ||
		!Array.isArray(parsed.indexes) ||
		!parsed.indexes.every(isFirestoreIndex)
	) {
		throw new Error('firebase/firestore.indexes.json does not match the expected shape')
	}

	return {
		indexes: parsed.indexes,
	}
}

function hasCompositeIndex(
	indexes: FirestoreIndex[],
	expected: FirestoreIndex,
): boolean {
	return indexes.some((index) => {
		if (
			index.collectionGroup !== expected.collectionGroup ||
			index.queryScope !== expected.queryScope ||
			index.fields.length !== expected.fields.length
		) {
			return false
		}

		return expected.fields.every((field, indexPosition) => {
			const currentField = index.fields[indexPosition]
			return (
				currentField?.fieldPath === field.fieldPath &&
				currentField.order === field.order &&
				currentField.arrayConfig === field.arrayConfig
			)
		})
	})
}

const auditedCompositeQueries: AuditedCompositeQuery[] = [
	{
		name: 'admin consents user filter with createdAt ordering',
		source: 'src/app/api/admin/consents/route.ts',
		expectedIndex: {
			collectionGroup: 'consents',
			queryScope: 'COLLECTION',
			fields: [
				{ fieldPath: 'userId', order: 'ASCENDING' },
				{ fieldPath: 'createdAt', order: 'DESCENDING' },
				{ fieldPath: '__name__', order: 'DESCENDING' },
			],
		},
	},
	{
		name: 'latest consent lookup by user',
		source: 'src/services/consentService.ts',
		expectedIndex: {
			collectionGroup: 'consents',
			queryScope: 'COLLECTION',
			fields: [
				{ fieldPath: 'userId', order: 'ASCENDING' },
				{ fieldPath: 'signedAt', order: 'DESCENDING' },
			],
		},
	},
	{
		name: 'active consent lookup by user and expiry',
		source: 'src/services/consentService.ts',
		expectedIndex: {
			collectionGroup: 'consents',
			queryScope: 'COLLECTION',
			fields: [
				{ fieldPath: 'userId', order: 'ASCENDING' },
				{ fieldPath: 'validUntil', order: 'ASCENDING' },
			],
		},
	},
	{
		name: 'kiosk minors history by parent and recency',
		source: 'src/app/api/usuarios/[uid]/menores/route.ts',
		expectedIndex: {
			collectionGroup: 'minors_index',
			queryScope: 'COLLECTION',
			fields: [
				{ fieldPath: 'parentId', order: 'ASCENDING' },
				{ fieldPath: 'updatedAt', order: 'DESCENDING' },
			],
		},
	},
	{
		name: 'admin staff list filtered by role and recency',
		source: 'src/services/userService.ts',
		expectedIndex: {
			collectionGroup: 'admin_users',
			queryScope: 'COLLECTION',
			fields: [
				{ fieldPath: 'role', order: 'ASCENDING' },
				{ fieldPath: 'createdAt', order: 'DESCENDING' },
			],
		},
	},
]

describe('phase 4 infra parity', () => {
	it('captures the composite indexes required by the current cursor and consent lookup queries', () => {
		const { indexes } = parseIndexesFile()

		expect(
			hasCompositeIndex(indexes, {
				collectionGroup: 'consents',
				queryScope: 'COLLECTION',
				fields: [
					{ fieldPath: 'userId', order: 'ASCENDING' },
					{ fieldPath: 'createdAt', order: 'DESCENDING' },
					{ fieldPath: '__name__', order: 'DESCENDING' },
				],
			}),
		).toBe(true)

		expect(
			hasCompositeIndex(indexes, {
				collectionGroup: 'consents',
				queryScope: 'COLLECTION',
				fields: [
					{ fieldPath: 'userId', order: 'ASCENDING' },
					{ fieldPath: 'signedAt', order: 'DESCENDING' },
				],
			}),
		).toBe(true)

		expect(
			hasCompositeIndex(indexes, {
				collectionGroup: 'minors_index',
				queryScope: 'COLLECTION',
				fields: [
					{ fieldPath: 'parentId', order: 'ASCENDING' },
					{ fieldPath: 'createdAt', order: 'DESCENDING' },
					{ fieldPath: '__name__', order: 'DESCENDING' },
				],
			}),
		).toBe(true)
	})

	it('maps audited multi-field runtime queries to explicit composite indexes in source control', () => {
		const { indexes } = parseIndexesFile()

		expect(auditedCompositeQueries.length).toBe(5)

		for (const query of auditedCompositeQueries) {
			expect(hasCompositeIndex(indexes, query.expectedIndex)).toBe(true)
		}
	})

	it('hardens Firestore and Storage rules around split OTP, audit/read-model collections, and nested signature paths', () => {
		const firestoreRules = readProjectFile('firebase/firestore.rules')
		const storageRules = readProjectFile('firebase/storage.rules')

		expect(firestoreRules).toContain('match /otp_challenges/{documentId}')
		expect(firestoreRules).toContain('match /otp_access_sessions/{documentId}')
		expect(firestoreRules).toContain('match /offline_sync/{documentId}')
		expect(firestoreRules).toContain('match /admin_metrics/{documentId}')
		expect(firestoreRules).toContain('match /admin_audit_logs/{documentId}')

		expect(storageRules).toContain('match /signatures/{userId}/{assetPath=**}')
		expect(storageRules).toContain('match /generated-pdfs/{documentPath=**}')
		expect(storageRules).toContain('allow write: if false;')
	})
})

describe('phase 4 docs and ci parity', () => {
	it('keeps rollout order, rollback guidance, and CI artifact proof aligned in the primary docs', () => {
		const readme = readProjectFile('README.md')
		const architecture = readProjectFile('docs/ARQUITECTURA.md')
		const productionHardening = readProjectFile(
			'docs/runbooks/production-hardening.md',
		)
		const rollbackFlags = readProjectFile('docs/runbooks/rollback-flags.md')
		const offlineReplayDrill = readProjectFile(
			'docs/runbooks/offline-replay-drill.md',
		)
		const adminCostChecklist = readProjectFile(
			'docs/runbooks/admin-cost-smoke-checklist.md',
		)

		expect(readme).toContain('Deploy Firebase indexes/rules before enabling `ADMIN_AGGREGATES_ENABLED`, `CURSOR_PAGINATION_ENABLED`, or the offline queue flags.')
		expect(readme).toContain('Exact Firestore index parity still needs emulator/query-log evidence or production deploy feedback before Phase 5 can claim a final PASS.')

		expect(architecture).toContain('IaC rollout boundary: deploy Firebase indexes/rules first, then prewarm aggregates, then enable flags.')
		expect(architecture).toContain('Exact composite-index parity is still a best-effort proof until emulator/query logs or deploy feedback confirm every live query shape.')

		expect(productionHardening).toContain('Firebase IaC parity: review `firebase/firestore.indexes.json`, `firebase/firestore.rules`, and `firebase/storage.rules` before any flag enablement.')
		expect(rollbackFlags).toContain('Si hay drift de indices/reglas, redeploy de `firestore.indexes.json`, `firestore.rules` y `storage.rules` antes de reactivar flags.')
		expect(offlineReplayDrill).toContain('No correr este drill en produccion con los flags por defecto apagados; primero habilitarlo de forma controlada en preview o staging.')
		expect(adminCostChecklist).toContain('Si algun query exige un indice nuevo o distinto, no habilitar el flag: primero actualizar IaC y volver a validar contra emulator/query logs.')
	})

	it('keeps CI focused on reproducible static gates plus artifact parity proof before build verification', () => {
		const workflow = readProjectFile('.github/workflows/ci.yml')

		expect(workflow).toContain('run: bun run check')
		expect(workflow).toContain('name: Run production-readiness artifact parity proof')
		expect(workflow).toContain('run: bun test tests/phase4-production-artifacts.test.ts')
	})
})
