export const CURSOR_PAGE_LIMIT = {
	DEFAULT: 20,
	MAX: 50,
} as const;

export const CURSOR_PAGE_LIMIT_OPTIONS = [
	CURSOR_PAGE_LIMIT.DEFAULT,
	CURSOR_PAGE_LIMIT.MAX,
] as const;

export const CURSOR_PAGE_META_SOURCE = {
	CURSOR: "cursor",
	SEARCH: "search",
} as const;

export const CURSOR_TOKEN_VERSION = {
	V1: "v1",
} as const;

export type CursorPageLimit = (typeof CURSOR_PAGE_LIMIT_OPTIONS)[number];
export type CursorPageMetaSource =
	(typeof CURSOR_PAGE_META_SOURCE)[keyof typeof CURSOR_PAGE_META_SOURCE];
export type CursorTokenVersion =
	(typeof CURSOR_TOKEN_VERSION)[keyof typeof CURSOR_TOKEN_VERSION];

export interface CursorPageInfo {
	nextCursor: string | null;
	hasNextPage: boolean;
}

export interface CursorPageMeta {
	totalApprox?: number;
	source: CursorPageMetaSource;
}

export interface CursorTokenPayload {
	version: CursorTokenVersion;
	collection: string;
	orderByField: string;
	orderDirection: string;
	lastDocumentId: string;
	lastOrderedValue: string;
	search?: string;
}

/**
 * Resultado paginado genérico reutilizable en servicios y routes.
 */
export interface PaginatedResult<T> {
	items: T[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
	pageInfo: CursorPageInfo;
	meta: CursorPageMeta;
}
