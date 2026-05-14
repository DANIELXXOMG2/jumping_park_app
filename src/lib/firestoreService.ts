import type {
	DocumentData,
	DocumentReference,
	DocumentSnapshot,
	OrderByDirection,
	QueryDocumentSnapshot,
	Transaction,
} from "firebase-admin/firestore";
import { admin, db } from "@/lib/firebaseAdmin";
import type {
	Access,
	Consent,
	Invoice,
	Minor,
	MinorDocument,
	OfflineSyncLedger,
	OtpAccessSession,
	OtpChallenge,
	OtpSession,
	RateLimitBucket,
	Sale,
	Service,
	UserProfile,
} from "@/types/firestore";
import {
	CURSOR_PAGE_LIMIT,
	CURSOR_PAGE_LIMIT_OPTIONS,
	CURSOR_TOKEN_VERSION,
	type CursorPageLimit,
	type CursorTokenPayload,
} from "@/types/pagination";

type BaseDoc = DocumentData;
type WithId<T extends BaseDoc> = T & { id: string };

function isCursorPageLimit(value: number): value is CursorPageLimit {
	return CURSOR_PAGE_LIMIT_OPTIONS.includes(value as CursorPageLimit);
}

export function resolveCursorPageLimit(limit?: number): CursorPageLimit {
	if (typeof limit !== "number" || Number.isNaN(limit)) {
		return CURSOR_PAGE_LIMIT.DEFAULT;
	}

	if (limit >= CURSOR_PAGE_LIMIT.MAX) {
		return CURSOR_PAGE_LIMIT.MAX;
	}

	if (isCursorPageLimit(limit)) {
		return limit;
	}

	return CURSOR_PAGE_LIMIT.DEFAULT;
}

export function encodeFirestoreCursor(
	payload: Omit<CursorTokenPayload, "version"> & {
		version?: CursorTokenPayload["version"];
	},
): string {
	return Buffer.from(
		JSON.stringify({
			version: payload.version ?? CURSOR_TOKEN_VERSION.V1,
			collection: payload.collection,
			orderByField: payload.orderByField,
			orderDirection: payload.orderDirection,
			lastDocumentId: payload.lastDocumentId,
			lastOrderedValue: payload.lastOrderedValue,
			search: payload.search,
		}),
	).toString("base64url");
}

export function decodeFirestoreCursor(cursor: string): CursorTokenPayload {
	try {
		const decodedValue = Buffer.from(cursor, "base64url").toString("utf-8");
		const parsedValue = JSON.parse(decodedValue) as Partial<CursorTokenPayload>;

		if (
			typeof parsedValue.version !== "string" ||
			typeof parsedValue.collection !== "string" ||
			typeof parsedValue.orderByField !== "string" ||
			typeof parsedValue.orderDirection !== "string" ||
			typeof parsedValue.lastDocumentId !== "string" ||
			typeof parsedValue.lastOrderedValue !== "string"
		) {
			throw new Error("invalid-firestore-cursor");
		}

		return {
			version: parsedValue.version,
			collection: parsedValue.collection,
			orderByField: parsedValue.orderByField,
			orderDirection: parsedValue.orderDirection,
			lastDocumentId: parsedValue.lastDocumentId,
			lastOrderedValue: parsedValue.lastOrderedValue,
			search: parsedValue.search,
		};
	} catch {
		throw new Error("Invalid Firestore cursor token");
	}
}

/**
 * Mapa de colecciones conocidas con sus tipos.
 * ESTANDARIZADO EN INGLÉS para consistencia global.
 * Los tipos provienen de @/types/firestore.ts (fuente de verdad).
 */
type FirestoreCollectionMap = {
	// Core collections
	users: UserProfile;
	consents: Consent;
	otp_sessions: OtpSession;
	otp_challenges: OtpChallenge;
	otp_access_sessions: OtpAccessSession;
	rate_limits: RateLimitBucket;
	minors: Minor;
	minors_index: MinorDocument; // Colección denormalizada para optimización
	offline_sync: OfflineSyncLedger;
	// Business collections
	accesses: Access;
	invoices: Invoice;
	services: Service;
	sales: Sale;
};

type KnownCollection = keyof FirestoreCollectionMap;
type Snapshot = DocumentSnapshot<BaseDoc> | QueryDocumentSnapshot<BaseDoc>;

const snapshotWithId = <T extends BaseDoc>(snapshot: Snapshot): WithId<T> => {
	const data = snapshot.data();
	if (!data) {
		throw new Error(`Documento sin datos en la ruta ${snapshot.ref.path}`);
	}
	return { id: snapshot.id, ...(data as T) };
};

export function createDoc<C extends KnownCollection>(
	collection: C,
	data: FirestoreCollectionMap[C],
	id?: string,
): Promise<WithId<FirestoreCollectionMap[C]>>;
export function createDoc<T extends BaseDoc>(
	collection: string,
	data: T,
	id?: string,
): Promise<WithId<T>>;
export async function createDoc<T extends BaseDoc>(
	collection: string,
	data: T,
	id?: string,
): Promise<WithId<T>> {
	const colRef = db.collection(collection);
	const docRef = id ? colRef.doc(id) : colRef.doc();
	const payload: BaseDoc = {
		...data,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};
	await docRef.set(payload);
	const freshSnap = await docRef.get();
	return snapshotWithId<T>(freshSnap);
}

export async function getDocs<C extends KnownCollection>(
	collection: C,
	limit?: number,
): Promise<Array<WithId<FirestoreCollectionMap[C]>>>;
export async function getDocs<T extends BaseDoc>(
	collection: string,
	limit?: number,
): Promise<Array<WithId<T>>>;
export async function getDocs<T extends BaseDoc>(
	collection: string,
	limit = 100,
): Promise<Array<WithId<T>>> {
	const colRef = db.collection(collection);
	const query = colRef.orderBy("createdAt", "desc").limit(limit);
	const snap = await query.get();
	return snap.docs.map((docSnap) => snapshotWithId<T>(docSnap));
}

export async function getDocsByDateRange<C extends KnownCollection>(
	collection: C,
	options: {
		field: string;
		from: Date;
		to: Date;
		orderBy?: string;
		orderDirection?: OrderByDirection;
		limit?: number;
	},
): Promise<Array<WithId<FirestoreCollectionMap[C]>>>;
export async function getDocsByDateRange<T extends BaseDoc>(
	collection: string,
	options: {
		field: string;
		from: Date;
		to: Date;
		orderBy?: string;
		orderDirection?: OrderByDirection;
		limit?: number;
	},
): Promise<Array<WithId<T>>>;
export async function getDocsByDateRange<T extends BaseDoc>(
	collection: string,
	options: {
		field: string;
		from: Date;
		to: Date;
		orderBy?: string;
		orderDirection?: OrderByDirection;
		limit?: number;
	},
): Promise<Array<WithId<T>>> {
	const orderBy = options.orderBy ?? options.field;
	const orderDirection = options.orderDirection ?? "desc";
	const limit = options.limit ?? 5000;

	const snap = await db
		.collection(collection)
		.where(options.field, ">=", options.from)
		.where(options.field, "<=", options.to)
		.orderBy(orderBy, orderDirection)
		.limit(limit)
		.get();

	return snap.docs.map((docSnap) => snapshotWithId<T>(docSnap));
}

export function getDocById<C extends KnownCollection>(
	collection: C,
	id: string,
): Promise<WithId<FirestoreCollectionMap[C]> | null>;
export function getDocById<T extends BaseDoc>(
	collection: string,
	id: string,
): Promise<WithId<T> | null>;
export async function getDocById<T extends BaseDoc>(
	collection: string,
	id: string,
): Promise<WithId<T> | null> {
	const doc = await db.collection(collection).doc(id).get();
	if (!doc.exists) return null;
	return snapshotWithId<T>(doc);
}

export async function deleteDoc(collection: string, id: string) {
	await db.collection(collection).doc(id).delete();
	return { id };
}

export function getDocRef(
	collection: string,
	id: string,
): DocumentReference<DocumentData> {
	return db.collection(collection).doc(id);
}

export async function runInTransaction<T>(
	updateFn: (transaction: Transaction) => Promise<T>,
): Promise<T> {
	return db.runTransaction(updateFn);
}

export function serverTimestamp() {
	return admin.firestore.FieldValue.serverTimestamp();
}
