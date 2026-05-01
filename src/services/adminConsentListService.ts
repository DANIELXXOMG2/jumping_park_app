import { db } from "@/lib/firebaseAdmin";
import {
	applyCreatedAtCursor,
	buildCreatedAtOrderedQuery,
	buildCursorMeta,
	buildCursorPageInfo,
} from "@/lib/adminCursor";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { normalizeText } from "@/lib/utils/searchUtils";
import type { ConsentDocument, Minor } from "@/types/firestore";
import { CURSOR_PAGE_META_SOURCE } from "@/types/pagination";

const SIGNATURE_STATUS = {
	AVAILABLE: "available",
	MISSING: "missing",
} as const;

const CONSENT_LIST_FIELDS = [
	"consecutivo",
	"userId",
	"adultSnapshot",
	"minorsSnapshot",
	"signedAt",
	"createdAt",
	"signaturePath",
	"signatureUrl",
	"policyVersion",
	"ipAddress",
	"validUntil",
] as const;

export interface ConsentListItem {
	id: string;
	consecutivo?: number;
	userId?: string;
	adultName: string;
	adultEmail: string;
	adultPhone: string;
	minorsCount: number;
	minors: Minor[];
	signaturePath: string | null;
	signatureStatus: string;
	signatureUrl: null;
	policyVersion?: string;
	ipAddress?: string;
	createdAt: string | null;
	signedAt: string | null;
	validUntil: string | null;
}

function isConsentListItem(
	value: ConsentListItem | null,
): value is ConsentListItem {
	return value !== null;
}

function mapConsent(
	doc: FirebaseFirestore.DocumentSnapshot,
): ConsentListItem | null {
	const consentData: ConsentDocument | undefined = doc.data();
	if (!consentData) return null;
	const adultSnapshot = consentData.adultSnapshot;
	const minorsSnapshot = consentData.minorsSnapshot ?? [];

	return {
		id: doc.id,
		consecutivo: consentData.consecutivo,
		userId: consentData.userId,
		adultName: adultSnapshot?.fullName || "N/A",
		adultEmail: adultSnapshot?.email || "N/A",
		adultPhone: adultSnapshot?.phone || "N/A",
		minorsCount: minorsSnapshot.length,
		minors: minorsSnapshot,
		signaturePath: consentData.signaturePath ?? null,
		signatureStatus:
			consentData.signaturePath || consentData.signatureUrl
				? SIGNATURE_STATUS.AVAILABLE
				: SIGNATURE_STATUS.MISSING,
		signatureUrl: null,
		policyVersion: consentData.policyVersion,
		ipAddress: consentData.ipAddress,
		createdAt: consentData.createdAt?.toDate?.()?.toISOString() || null,
		signedAt: consentData.signedAt?.toDate?.()?.toISOString() || null,
		validUntil: consentData.validUntil?.toDate?.()?.toISOString() || null,
	};
}

function buildAdminListFreshness() {
	return {
		computedAt: new Date().toISOString(),
		source: "live" as const,
		stale: false,
	};
}

export function buildAdminConsentsListResponse(payload: {
	consents: ConsentListItem[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
	pageInfo: {
		nextCursor: string | null;
		hasNextPage: boolean;
	};
	meta: {
		totalApprox?: number;
		source: "cursor" | "search";
	};
}) {
	return {
		...payload,
		freshness: buildAdminListFreshness(),
	};
}

async function getTotalConsents(userId?: string): Promise<number> {
	if (userId) {
		const countSnap = await db
			.collection("consents")
			.where("userId", "==", userId)
			.count()
			.get();
		return countSnap.data().count;
	}
	const countSnap = await db.collection("consents").count().get();
	return countSnap.data().count;
}

export interface AdminConsentListQuery {
	search?: string;
	limit: number;
	offset: number;
	cursor?: string;
	userId?: string;
}

export async function listAdminConsents(
	query: AdminConsentListQuery,
): Promise<ReturnType<typeof buildAdminConsentsListResponse>> {
	const hardeningPolicy = resolveHardeningPolicy();

	if (query.userId) {
		const snapshot = await db
			.collection("consents")
			.where("userId", "==", query.userId)
			.orderBy("createdAt", "desc")
			.select(...CONSENT_LIST_FIELDS)
			.get();

		const consents = snapshot.docs.map(mapConsent).filter(isConsentListItem);
		return buildAdminConsentsListResponse({
			consents,
			pagination: {
				total: consents.length,
				limit: query.limit,
				offset: 0,
				hasMore: false,
			},
			pageInfo: { nextCursor: null, hasNextPage: false },
			meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.SEARCH, consents.length),
		});
	}

	if (query.search) {
		return searchAdminConsents(query);
	}

	const useCursor = hardeningPolicy.cursorEnabled;
	const baseQuery = buildCreatedAtOrderedQuery(
		db.collection("consents").select(...CONSENT_LIST_FIELDS),
	);
	const dataQuery =
		useCursor && query.cursor
			? applyCreatedAtCursor(baseQuery, {
					collection: "consents",
					cursor: query.cursor,
				})
			: baseQuery;
	const [total, snapshot] = await Promise.all([
		getTotalConsents(),
		(useCursor
			? dataQuery.limit(query.limit + 1)
			: dataQuery.offset(query.offset).limit(query.limit)
		).get(),
	]);

	const pageInfo = useCursor
		? buildCursorPageInfo(snapshot.docs, {
				collection: "consents",
				limit: query.limit,
			})
		: { nextCursor: null, hasNextPage: query.offset + query.limit < total };
	const consents = snapshot.docs
		.slice(0, useCursor ? query.limit : snapshot.docs.length)
		.map(mapConsent)
		.filter(isConsentListItem);

	return buildAdminConsentsListResponse({
		consents,
		pagination: {
			total,
			limit: query.limit,
			offset: query.offset,
			hasMore: pageInfo.hasNextPage,
		},
		pageInfo,
		meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.CURSOR, total),
	});
}

async function searchAdminConsents(
	query: AdminConsentListQuery,
): Promise<ReturnType<typeof buildAdminConsentsListResponse>> {
	const searchTerm = query.search!.trim();
	const searchNormalized = normalizeText(searchTerm);

	const consecutivoMatch = searchTerm.match(/^#?(\d{1,7})$/);
	if (consecutivoMatch) {
		const consecutivo = Number.parseInt(consecutivoMatch[1], 10);
		const snapshot = await db
			.collection("consents")
			.where("consecutivo", "==", consecutivo)
			.select(...CONSENT_LIST_FIELDS)
			.limit(1)
			.get();

		const consents = snapshot.docs.map(mapConsent).filter(isConsentListItem);
		return buildAdminConsentsListResponse({
			consents,
			pagination: {
				total: consents.length,
				limit: query.limit,
				offset: 0,
				hasMore: false,
			},
			pageInfo: { nextCursor: null, hasNextPage: false },
			meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.SEARCH, consents.length),
		});
	}

	if (/^\d{8,}$/.test(searchTerm)) {
		const [adultResult, minorResult] = await Promise.allSettled([
			db
				.collection("consents")
				.where("userId", "==", searchTerm)
				.select(...CONSENT_LIST_FIELDS)
				.limit(20)
				.get(),
			db
				.collection("consents")
				.where("searchTokens", "array-contains", searchTerm)
				.select(...CONSENT_LIST_FIELDS)
				.limit(20)
				.get(),
		]);

		const consentMap = new Map<string, ConsentListItem>();
		for (const result of [adultResult, minorResult]) {
			if (result.status === "fulfilled") {
				for (const doc of result.value.docs) {
					const mapped = mapConsent(doc);
					if (mapped) consentMap.set(doc.id, mapped);
				}
			}
		}

		const consents = Array.from(consentMap.values()).sort((left, right) => {
			const leftDate = left.signedAt ? new Date(left.signedAt) : new Date(0);
			const rightDate = right.signedAt ? new Date(right.signedAt) : new Date(0);
			return rightDate.getTime() - leftDate.getTime();
		});

		return buildAdminConsentsListResponse({
			consents,
			pagination: {
				total: consents.length,
				limit: query.limit,
				offset: 0,
				hasMore: false,
			},
			pageInfo: { nextCursor: null, hasNextPage: false },
			meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.SEARCH, consents.length),
		});
	}

	const searchWords = searchNormalized
		.split(/\s+/)
		.filter((word) => word.length >= 2);
	if (searchWords.length > 0) {
		const termsToSearch = searchWords.slice(0, 10);
		const fullToken = searchWords.join("");
		const fullTokenSnapshot = await db
			.collection("consents")
			.where("searchTokens", "array-contains", fullToken)
			.select(...CONSENT_LIST_FIELDS)
			.limit(Math.max(query.limit * 2, 20))
			.get();

		const consentMap = new Map<string, ConsentListItem>();
		for (const doc of fullTokenSnapshot.docs) {
			const mapped = mapConsent(doc);
			if (mapped) consentMap.set(doc.id, mapped);
		}

		if (consentMap.size < query.limit) {
			const tokenQuery =
				termsToSearch.length === 1
					? db
							.collection("consents")
							.where("searchTokens", "array-contains", termsToSearch[0])
							.select(...CONSENT_LIST_FIELDS)
							.limit(50)
					: db
							.collection("consents")
							.where("searchTokens", "array-contains-any", termsToSearch)
							.select(...CONSENT_LIST_FIELDS)
							.limit(100);

			const snapshot = await tokenQuery.get();
			for (const doc of snapshot.docs) {
				if (!consentMap.has(doc.id)) {
					const mapped = mapConsent(doc);
					if (mapped) consentMap.set(doc.id, mapped);
				}
			}
		}

		let consents = Array.from(consentMap.values());
		if (searchWords.length > 1) {
			consents = consents.filter((consent) => {
				const combinedText = `${normalizeText(consent.adultName)} ${normalizeText(consent.adultEmail)}`;
				return searchWords.every((word) => combinedText.includes(word));
			});
		}

		consents = consents.sort((left, right) => {
			const getScore = (consent: ConsentListItem) => {
				const name = normalizeText(consent.adultName);
				const email = normalizeText(consent.adultEmail);
				let score = 0;
				if (name === searchNormalized) score += 1000;
				else if (name.startsWith(searchNormalized)) score += 500;
				else if (name.includes(searchNormalized)) score += 300;
				if (email === searchNormalized) score += 200;
				else if (email.startsWith(searchNormalized)) score += 100;
				else if (email.includes(searchNormalized)) score += 50;
				for (const word of searchWords) {
					if (name.startsWith(word)) score += 20;
					else if (name.includes(word)) score += 10;
					else if (email.includes(word)) score += 5;
				}
				return score;
			};

			const scoreDifference = getScore(right) - getScore(left);
			if (scoreDifference !== 0) return scoreDifference;
			return (
				normalizeText(left.adultName).length -
				normalizeText(right.adultName).length
			);
		});

		const total = consents.length;
		const paginatedConsents = consents.slice(
			query.offset,
			query.offset + query.limit,
		);
		return buildAdminConsentsListResponse({
			consents: paginatedConsents,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
			pageInfo: {
				nextCursor: null,
				hasNextPage: query.offset + query.limit < total,
			},
			meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.SEARCH, total),
		});
	}

	const snapshot = await db
		.collection("consents")
		.orderBy("createdAt", "desc")
		.select(...CONSENT_LIST_FIELDS)
		.limit(100)
		.get();

	const consents = snapshot.docs
		.map(mapConsent)
		.filter(isConsentListItem)
		.filter(
			(consent) =>
				normalizeText(consent.adultName).includes(searchNormalized) ||
				normalizeText(consent.adultEmail).includes(searchNormalized),
		);

	const total = consents.length;
	const paginatedConsents = consents.slice(
		query.offset,
		query.offset + query.limit,
	);
	return buildAdminConsentsListResponse({
		consents: paginatedConsents,
		pagination: {
			total,
			limit: query.limit,
			offset: query.offset,
			hasMore: query.offset + query.limit < total,
		},
		pageInfo: {
			nextCursor: null,
			hasNextPage: query.offset + query.limit < total,
		},
		meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.SEARCH, total),
	});
}
