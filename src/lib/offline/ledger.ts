import {
	OFFLINE_IDEMPOTENCY_SOURCE,
	OFFLINE_SYNC_LEDGER_STATUS,
	type OfflineSyncLedgerRecord,
} from "@/types/offline";

export interface CreateOfflineSyncLedgerInput {
	dedupeKey: string;
	consentId: string;
	consecutivo: number;
	userId: string;
	policyVersion: string;
	signedAtLocal: string;
	acknowledgedAt: string;
}

export function createOfflineSyncLedgerRecord(
	input: CreateOfflineSyncLedgerInput,
): OfflineSyncLedgerRecord {
	const timestamp = input.acknowledgedAt;

	return {
		dedupeKey: input.dedupeKey,
		consentId: input.consentId,
		consecutivo: input.consecutivo,
		userId: input.userId,
		policyVersion: input.policyVersion,
		signedAtLocal: input.signedAtLocal,
		status: OFFLINE_SYNC_LEDGER_STATUS.COMPLETED,
		acknowledgedAt: input.acknowledgedAt,
		source: OFFLINE_IDEMPOTENCY_SOURCE.SERVER,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function isRecordCandidate(
	value: unknown,
): value is Partial<OfflineSyncLedgerRecord> {
	return Boolean(value) && typeof value === "object";
}

export function readOfflineSyncLedgerRecord(
	value: unknown,
): OfflineSyncLedgerRecord | null {
	if (!isRecordCandidate(value)) {
		return null;
	}

	const candidate = value;
	if (
		typeof candidate.dedupeKey !== "string" ||
		typeof candidate.consentId !== "string" ||
		typeof candidate.consecutivo !== "number" ||
		typeof candidate.userId !== "string" ||
		typeof candidate.policyVersion !== "string" ||
		typeof candidate.signedAtLocal !== "string"
	) {
		return null;
	}

	const acknowledgedAt =
		typeof candidate.acknowledgedAt === "string"
			? candidate.acknowledgedAt
			: typeof candidate.updatedAt === "string"
				? candidate.updatedAt
				: typeof candidate.createdAt === "string"
					? candidate.createdAt
					: candidate.signedAtLocal;

	return {
		dedupeKey: candidate.dedupeKey,
		consentId: candidate.consentId,
		consecutivo: candidate.consecutivo,
		userId: candidate.userId,
		policyVersion: candidate.policyVersion,
		signedAtLocal: candidate.signedAtLocal,
		status: OFFLINE_SYNC_LEDGER_STATUS.COMPLETED,
		acknowledgedAt,
		source:
			candidate.source === OFFLINE_IDEMPOTENCY_SOURCE.CLIENT
				? OFFLINE_IDEMPOTENCY_SOURCE.CLIENT
				: OFFLINE_IDEMPOTENCY_SOURCE.SERVER,
		createdAt:
			typeof candidate.createdAt === "string"
				? candidate.createdAt
				: acknowledgedAt,
		updatedAt:
			typeof candidate.updatedAt === "string"
				? candidate.updatedAt
				: acknowledgedAt,
	};
}

export function isOfflineSyncLedgerRecord(
	value: unknown,
): value is OfflineSyncLedgerRecord {
	return readOfflineSyncLedgerRecord(value) !== null;
}
