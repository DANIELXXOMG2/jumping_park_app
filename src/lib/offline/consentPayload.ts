import type {
	ConsentFormData,
	ConsentSubmission,
} from "@/lib/schemas/consent.schema";
import type { UserProfile } from "@/types/firestore";
import type { OfflineSyncRequestMetadata } from "@/types/offline";

export const CONSENT_POLICY_VERSION = "1.0" as const;

export interface BuildConsentSubmissionInput {
	formData: ConsentFormData;
	visitorData: Partial<UserProfile>;
	signatureBase64: string;
	offlineSync?: OfflineSyncRequestMetadata;
}

export function buildConsentSubmissionPayload(
	input: BuildConsentSubmissionInput,
): ConsentSubmission {
	return {
		...input.formData,
		signature: input.signatureBase64,
		responsibleAdult: {
			fullName: input.visitorData.fullName || "",
			documentId: input.visitorData.uid || "",
			email: input.visitorData.email || "",
			phone: input.visitorData.phone || "",
		},
		offlineSync: input.offlineSync,
	};
}
