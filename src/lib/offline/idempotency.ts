import { createHash } from "node:crypto";

export interface ConsentIdempotencyInput {
	userId: string;
	policyVersion: string;
	signedAtLocal: string;
}

function normalizeIdempotencySegment(value: string): string {
	return value.trim();
}

export function buildConsentIdempotencySeed(
	input: ConsentIdempotencyInput,
): string {
	return [
		normalizeIdempotencySegment(input.userId),
		normalizeIdempotencySegment(input.policyVersion),
		normalizeIdempotencySegment(input.signedAtLocal),
	].join("|");
}

export function createSha256Hex(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

export function createConsentDedupeKey(input: ConsentIdempotencyInput): string {
	return createSha256Hex(buildConsentIdempotencySeed(input));
}

export function dedupeKeysMatch(left: string, right: string): boolean {
	return left.trim().toLowerCase() === right.trim().toLowerCase();
}
