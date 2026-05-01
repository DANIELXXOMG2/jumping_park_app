import { FieldPath } from "firebase-admin/firestore";
import {
	decodeFirestoreCursor,
	encodeFirestoreCursor,
	resolveCursorPageLimit,
} from "@/lib/firestoreService";
import type {
	CursorPageInfo,
	CursorPageLimit,
	CursorPageMeta,
	CursorPageMetaSource,
} from "@/types/pagination";

export const ADMIN_CURSOR_ORDER = {
	FIELD: "createdAt",
	DIRECTION: "desc",
} as const;

export interface AdminCursorRequest {
	cursor?: string;
	limit?: number;
	offset?: number;
	search?: string;
}

export interface AdminCursorResponseMeta {
	limit: CursorPageLimit;
	offset: number;
}

export function resolveAdminCursorRequest(
	request: AdminCursorRequest,
): AdminCursorResponseMeta {
	return {
		limit: resolveCursorPageLimit(request.limit),
		offset:
			typeof request.offset === "number" && request.offset > 0
				? request.offset
				: 0,
	};
}

export function applyCreatedAtCursor(
	query: FirebaseFirestore.Query,
	options: {
		collection: string;
		cursor: string;
		search?: string;
	},
): FirebaseFirestore.Query {
	const payload = decodeFirestoreCursor(options.cursor);

	if (
		payload.collection !== options.collection ||
		payload.orderByField !== ADMIN_CURSOR_ORDER.FIELD ||
		payload.orderDirection !== ADMIN_CURSOR_ORDER.DIRECTION ||
		(payload.search ?? undefined) !== (options.search ?? undefined)
	) {
		throw new Error("Invalid Firestore cursor token");
	}

	const lastOrderedDate = new Date(payload.lastOrderedValue);
	if (Number.isNaN(lastOrderedDate.getTime())) {
		throw new Error("Invalid Firestore cursor token");
	}

	return query.startAfter(lastOrderedDate, payload.lastDocumentId);
}

export function buildCreatedAtCursor(
	collection: string,
	lastDocument: FirebaseFirestore.QueryDocumentSnapshot,
	search?: string,
): string | null {
	const createdAtValue = lastDocument.get(ADMIN_CURSOR_ORDER.FIELD);
	const createdAtDate =
		createdAtValue instanceof Date
			? createdAtValue
			: typeof createdAtValue?.toDate === "function"
				? createdAtValue.toDate()
				: null;

	if (!createdAtDate) {
		return null;
	}

	return encodeFirestoreCursor({
		collection,
		orderByField: ADMIN_CURSOR_ORDER.FIELD,
		orderDirection: ADMIN_CURSOR_ORDER.DIRECTION,
		lastDocumentId: lastDocument.id,
		lastOrderedValue: createdAtDate.toISOString(),
		search,
	});
}

export function buildCursorPageInfo(
	documents: FirebaseFirestore.QueryDocumentSnapshot[],
	options: {
		collection: string;
		limit: number;
		search?: string;
	},
): CursorPageInfo {
	const hasNextPage = documents.length > options.limit;
	const pageDocuments = hasNextPage
		? documents.slice(0, options.limit)
		: documents;
	const lastDocument = pageDocuments.at(-1);

	return {
		hasNextPage,
		nextCursor:
			hasNextPage && lastDocument
				? buildCreatedAtCursor(options.collection, lastDocument, options.search)
				: null,
	};
}

export function buildCursorMeta(
	source: CursorPageMetaSource,
	totalApprox?: number,
): CursorPageMeta {
	return {
		source,
		...(typeof totalApprox === "number" ? { totalApprox } : {}),
	};
}

export function buildCreatedAtOrderedQuery(
	collection: FirebaseFirestore.Query,
): FirebaseFirestore.Query {
	return collection
		.orderBy(ADMIN_CURSOR_ORDER.FIELD, ADMIN_CURSOR_ORDER.DIRECTION)
		.orderBy(FieldPath.documentId(), ADMIN_CURSOR_ORDER.DIRECTION);
}
