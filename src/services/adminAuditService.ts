import type { NextRequest } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import type {
	AdminAuditActor,
	AdminAuditLog,
	AdminAuditTarget,
} from "@/types/firestore";

export interface AdminAuditWriteInput {
	action: string;
	actor: AdminAuditActor;
	target: AdminAuditTarget;
	request: Pick<AdminAuditLog["request"], "method" | "route">;
	details?: Record<string, boolean | number | string | string[] | null>;
}

export function buildAdminAuditEntry(
	input: AdminAuditWriteInput,
): Omit<AdminAuditLog, "createdAt"> {
	return {
		action: input.action,
		actor: input.actor,
		target: input.target,
		request: input.request,
		details: input.details,
	};
}

export function buildAdminAuditActor(session: {
	uid: string;
	email: string;
	role: string;
}): AdminAuditActor {
	return {
		uid: session.uid,
		email: session.email,
		role: session.role,
	};
}

export function buildAdminAuditRequest(
	request: NextRequest,
): AdminAuditLog["request"] {
	return {
		method: request.method,
		route: request.nextUrl.pathname,
	};
}

export async function writeAdminAuditLog(
	input: AdminAuditWriteInput,
): Promise<void> {
	await writeAdminAuditLogToCollection(
		db.collection("admin_audit_logs"),
		input,
	);
}

export async function writeAdminAuditLogToCollection(
	collection: Pick<FirebaseFirestore.CollectionReference, "add">,
	input: AdminAuditWriteInput,
	createdAt = new Date(),
): Promise<void> {
	await collection.add({
		...buildAdminAuditEntry(input),
		createdAt,
	});
}

interface AuditDocCollectionLike {
	doc: () => FirebaseFirestore.DocumentReference;
}

interface AuditBatchLike {
	set: (
		documentRef: FirebaseFirestore.DocumentReference,
		data: FirebaseFirestore.DocumentData,
		options?: FirebaseFirestore.SetOptions,
	) => unknown;
	commit: () => Promise<unknown>;
}

export function addAdminAuditLogToBatch(
	batch: AuditBatchLike,
	collection: AuditDocCollectionLike,
	input: AdminAuditWriteInput,
	createdAt = new Date(),
): void {
	batch.set(collection.doc(), {
		...buildAdminAuditEntry(input),
		createdAt,
	});
}

export async function commitAdminAuditBatch(options: {
	apply: (batch: FirebaseFirestore.WriteBatch) => void;
	audit: AdminAuditWriteInput;
	batch?: FirebaseFirestore.WriteBatch;
	auditCollection?: AuditDocCollectionLike;
	createdAt?: Date;
}): Promise<void> {
	const batch = options.batch ?? db.batch();
	options.apply(batch);
	addAdminAuditLogToBatch(
		batch,
		options.auditCollection ?? db.collection("admin_audit_logs"),
		options.audit,
		options.createdAt,
	);
	await batch.commit();
}
