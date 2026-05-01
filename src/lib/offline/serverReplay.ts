import {
	createOfflineSyncLedgerRecord,
	readOfflineSyncLedgerRecord,
} from "@/lib/offline/ledger";

export const OFFLINE_REPLAY_OUTCOME = {
	CREATED: "created",
	REPLAYED: "replayed",
	REJECTED: "rejected",
} as const;

export const OFFLINE_REPLAY_REJECTION_REASON = {
	MALFORMED_LEDGER: "malformed-ledger",
} as const;

type OfflineReplayOutcome =
	(typeof OFFLINE_REPLAY_OUTCOME)[keyof typeof OFFLINE_REPLAY_OUTCOME];
type OfflineReplayRejectionReason =
	(typeof OFFLINE_REPLAY_REJECTION_REASON)[keyof typeof OFFLINE_REPLAY_REJECTION_REASON];

export interface OfflineReplayResolutionInput<TConsentDocument> {
	acknowledgedAt: string;
	consentDocument: TConsentDocument;
	consentId: string;
	dedupeKey: string;
	existingLedger: unknown;
	previousConsecutivo: number;
	policyVersion: string;
	signedAtLocal: string;
	userId: string;
}

interface OfflineReplayResolutionSuccessResult<TConsentDocument> {
	consecutivo: number;
	consentId: string;
	consentWrite?: TConsentDocument;
	counterWrite?: {
		updatedAt: Date;
		value: number;
	};
	ledgerWrite?: ReturnType<typeof createOfflineSyncLedgerRecord>;
	outcome: OfflineReplayOutcome;
	replayed: boolean;
	success: true;
}

interface OfflineReplayResolutionRejectedResult {
	consecutivo: number;
	consentId: string;
	outcome: typeof OFFLINE_REPLAY_OUTCOME.REJECTED;
	reason: OfflineReplayRejectionReason;
	replayed: false;
	success: false;
}

export type OfflineReplayResolutionResult<TConsentDocument> =
	| OfflineReplayResolutionSuccessResult<TConsentDocument>
	| OfflineReplayResolutionRejectedResult;

function hasStoredLedgerDocument(value: unknown): boolean {
	return Boolean(value) && typeof value === "object";
}

export function resolveOfflineReplayMutation<TConsentDocument>(
	input: OfflineReplayResolutionInput<TConsentDocument>,
): OfflineReplayResolutionResult<TConsentDocument> {
	const existingLedger = readOfflineSyncLedgerRecord(input.existingLedger);

	if (existingLedger) {
		if (existingLedger.dedupeKey !== input.dedupeKey) {
			return {
				success: false,
				replayed: false,
				outcome: OFFLINE_REPLAY_OUTCOME.REJECTED,
				reason: OFFLINE_REPLAY_REJECTION_REASON.MALFORMED_LEDGER,
				consentId: input.consentId,
				consecutivo: input.previousConsecutivo,
			};
		}

		return {
			success: true,
			consentId: existingLedger.consentId,
			consecutivo: existingLedger.consecutivo,
			outcome: OFFLINE_REPLAY_OUTCOME.REPLAYED,
			replayed: true,
		};
	}

	if (hasStoredLedgerDocument(input.existingLedger)) {
		return {
			success: false,
			replayed: false,
			outcome: OFFLINE_REPLAY_OUTCOME.REJECTED,
			reason: OFFLINE_REPLAY_REJECTION_REASON.MALFORMED_LEDGER,
			consentId: input.consentId,
			consecutivo: input.previousConsecutivo,
		};
	}

	const consecutivo = input.previousConsecutivo + 1;

	return {
		success: true,
		consentId: input.consentId,
		consecutivo,
		outcome: OFFLINE_REPLAY_OUTCOME.CREATED,
		replayed: false,
		consentWrite: input.consentDocument,
		counterWrite: {
			value: consecutivo,
			updatedAt: new Date(),
		},
		ledgerWrite: createOfflineSyncLedgerRecord({
			dedupeKey: input.dedupeKey,
			consentId: input.consentId,
			consecutivo,
			userId: input.userId,
			policyVersion: input.policyVersion,
			signedAtLocal: input.signedAtLocal,
			acknowledgedAt: input.acknowledgedAt,
		}),
	};
}
