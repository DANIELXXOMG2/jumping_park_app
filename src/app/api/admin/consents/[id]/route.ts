import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import {
	buildAdminAuditActor,
	buildAdminAuditRequest,
	commitAdminAuditBatch,
} from "@/services/adminAuditService";
import { getConsentSignatureAccessUrl } from "@/services/consentService";
import type { Consent } from "@/types/firestore";

interface RouteParams {
	params: Promise<{ id: string }>;
}

interface ConsentDocSnapshotLike {
	exists: boolean;
}

interface ConsentDeleteRefLike {
	id: string;
	parent?: {
		id: string;
	};
}

interface ConsentDeleteBatchDeps {
	readConsent?: (id: string) => Promise<ConsentDocSnapshotLike>;
	commitAuditBatch?: typeof commitAdminAuditBatch;
	getConsentRef?: (id: string) => ConsentDeleteRefLike;
}

export async function buildAdminConsentDeleteResponse(
	request: NextRequest,
	session: {
		uid: string;
		email: string;
		role: string;
	},
	params: { id: string },
	deps: ConsentDeleteBatchDeps = {},
) {
	const readConsent =
		deps.readConsent ??
		((id: string) => db.collection("consents").doc(id).get());
	const commitAuditBatch = deps.commitAuditBatch ?? commitAdminAuditBatch;
	const getConsentRef =
		deps.getConsentRef ?? ((id: string) => db.collection("consents").doc(id));
	const consentDoc = await readConsent(params.id);

	if (!consentDoc.exists) {
		return null;
	}

	await commitAuditBatch({
		apply: (batch) => {
			batch.delete(
				getConsentRef(params.id) as FirebaseFirestore.DocumentReference,
			);
		},
		audit: {
			action: "consent.delete",
			actor: buildAdminAuditActor(session),
			target: {
				collection: "consents",
				id: params.id,
				label: `consent:${params.id}`,
			},
			request: buildAdminAuditRequest(request),
		},
	});

	return {
		success: true,
		message: "Consentimiento eliminado correctamente",
		deletedId: params.id,
	};
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso consents:view
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"consents:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		const consentDoc = await db.collection("consents").doc(id).get();

		if (!consentDoc.exists) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		const data = consentDoc.data();
		if (!data) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		const signatureUrl = await getConsentSignatureAccessUrl(data as Consent);

		let currentUser = null;
		if (data.userId) {
			const userSnap = await db
				.collection("users")
				.where("uid", "==", data.userId)
				.limit(1)
				.get();

			if (!userSnap.empty) {
				const userData = userSnap.docs[0].data();
				currentUser = {
					id: userSnap.docs[0].id,
					uid: userData.uid,
					fullName: userData.fullName,
					email: userData.email,
					phone: userData.phone,
					minorsCount: userData.minors?.length || 0,
				};
			}
		}

		return NextResponse.json({
			consent: {
				id: consentDoc.id,
				consecutivo: data.consecutivo,
				userId: data.userId,
				adultSnapshot: data.adultSnapshot,
				minorsSnapshot: data.minorsSnapshot || [],
				signaturePath: data.signaturePath || null,
				signatureUrl,
				policyVersion: data.policyVersion,
				ipAddress: data.ipAddress,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
				validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
			},
			currentUser,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener detalles del consentimiento" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/consents/[id]
 * Elimina un consentimiento.
 * Solo accesible por usuarios con rol 'admin'.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso roles:manage (solo admin puede eliminar)
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"roles:manage",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;
		const payload = await buildAdminConsentDeleteResponse(request, authResult, {
			id,
		});

		if (!payload) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json(payload);
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar el consentimiento" },
			{ status: 500 },
		);
	}
}
