/**
 * ConsentService - Servicio de dominio para gestión de consentimientos.
 *
 * Orquesta el proceso completo de creación de consentimientos:
 * 1. Upload de firma a Storage
 * 2. Upsert de usuario en Firestore
 * 3. Generación de consecutivo atómico (RF-08)
 * 4. Creación del documento de consentimiento
 *
 * NOTA: El PDF NO se guarda en Storage. Se genera bajo demanda via API.
 * NOTA: El envío de email ha sido deshabilitado (diciembre 2025).
 */
import { bucket, db } from "@/lib/firebaseAdmin";
import { HARDENING_FLAG, resolveHardeningFlag } from "@/lib/hardeningPolicy";
import { createLogger } from "@/lib/logger";
import { isOfflineSyncLedgerRecord } from "@/lib/offline/ledger";
import {
	OFFLINE_REPLAY_OUTCOME,
	OFFLINE_REPLAY_REJECTION_REASON,
	resolveOfflineReplayMutation,
} from "@/lib/offline/serverReplay";
import {
	extractEmailTokens,
	generateSearchTokens,
} from "@/lib/utils/searchUtils";
import type { Consent, Minor, UserProfile } from "@/types/firestore";
import { OFFLINE_IDEMPOTENCY_SOURCE } from "@/types/offline";

export const CONSENT_ASSET_LIMITS = {
	SIGNED_URL_TTL_MINUTES: 15,
} as const;

const logger = createLogger("ConsentService");

// ============================================================================
// TYPES
// ============================================================================

export interface CreateConsentInput {
	responsibleAdult: {
		fullName: string;
		documentId: string; // cédula
		email: string;
		phone: string;
	};
	minors: Array<{
		firstName?: string;
		lastName?: string;
		fullName?: string;
		birthDate: string;
		relationship: "hijo" | "sobrino" | "nieto" | "otro";
		eps?: string;
		idType?: "rc" | "ti" | "cc" | "ce" | "pa" | "ppt" | "otro";
		idNumber?: string;
		medicalCondition?: string;
	}>;
	signatureBase64: string;
	ipAddress: string;
	offlineSync?: {
		dedupeKey: string;
		policyVersion: string;
		signedAtLocal: string;
	};
}

export interface CreateConsentResult {
	success: boolean;
	consentId?: string;
	consecutivo?: number;
	error?: string;
	errorCode?: string;
	replayed?: boolean;
	statusCode?: number;
}

interface StoredSignatureAsset {
	buffer: Buffer;
	path: string;
	signedUrl: string;
	uploadedThisAttempt: boolean;
}

interface ConsentSignatureUploadPlan {
	path: string;
	reuseExistingAsset: boolean;
	cleanupOnRejectedReplay: boolean;
	dedupeKey?: string;
}

export const OFFLINE_CONSENT_ASSET_CLEANUP_REASON = {
	DUPLICATE_LEDGER: "duplicate-ledger",
	POST_UPLOAD_FAILURE: "post-upload-failure",
	REJECTED_LEDGER: "rejected-ledger",
} as const;

type OfflineConsentAssetCleanupReason =
	(typeof OFFLINE_CONSENT_ASSET_CLEANUP_REASON)[keyof typeof OFFLINE_CONSENT_ASSET_CLEANUP_REASON];

export function resolveOfflineConsentAssetCleanup(input: {
	assetUploadedThisAttempt: boolean;
	hasOfflineSync: boolean;
	replayOutcome: (typeof OFFLINE_REPLAY_OUTCOME)[keyof typeof OFFLINE_REPLAY_OUTCOME];
}): { reason?: OfflineConsentAssetCleanupReason; shouldDelete: boolean } {
	if (!input.hasOfflineSync) {
		return { shouldDelete: false };
	}

	if (!input.assetUploadedThisAttempt) {
		return { shouldDelete: false };
	}

	if (input.replayOutcome === OFFLINE_REPLAY_OUTCOME.REPLAYED) {
		return {
			shouldDelete: true,
			reason: OFFLINE_CONSENT_ASSET_CLEANUP_REASON.DUPLICATE_LEDGER,
		};
	}

	if (input.replayOutcome === OFFLINE_REPLAY_OUTCOME.REJECTED) {
		return {
			shouldDelete: true,
			reason: OFFLINE_CONSENT_ASSET_CLEANUP_REASON.REJECTED_LEDGER,
		};
	}

	return { shouldDelete: false };
}

export function resolveConsentSignatureUploadPlan(input: {
	documentId: string;
	nowMs?: number;
	offlineSync?: CreateConsentInput["offlineSync"];
}): ConsentSignatureUploadPlan {
	if (input.offlineSync) {
		return {
			path: `signatures/${input.documentId}/offline/${input.offlineSync.dedupeKey}.png`,
			reuseExistingAsset: true,
			cleanupOnRejectedReplay: true,
			dedupeKey: input.offlineSync.dedupeKey,
		};
	}

	return {
		path: `signatures/${input.documentId}/${input.nowMs ?? Date.now()}.png`,
		reuseExistingAsset: false,
		cleanupOnRejectedReplay: true,
	};
}

function getConsentSignedUrlExpirationDate(): Date {
	return new Date(
		Date.now() + CONSENT_ASSET_LIMITS.SIGNED_URL_TTL_MINUTES * 60 * 1000,
	);
}

function isStoragePath(reference: string): boolean {
	return reference.startsWith("signatures/");
}

function isDataUrl(reference: string): boolean {
	return reference.startsWith("data:image");
}

function isHttpUrl(reference: string): boolean {
	return reference.startsWith("http://") || reference.startsWith("https://");
}

function getStoragePathFromLegacyReference(reference: string): string | null {
	if (reference.startsWith("gs://")) {
		const [, ...parts] = reference.replace("gs://", "").split("/");
		return parts.length > 0 ? parts.join("/") : null;
	}

	if (isStoragePath(reference)) {
		return reference;
	}

	return null;
}

export async function getSignedConsentAssetUrl(path: string): Promise<string> {
	if (!bucket) {
		throw new Error("Firebase Storage no está configurado");
	}

	const [signedUrl] = await bucket.file(path).getSignedUrl({
		action: "read",
		expires: getConsentSignedUrlExpirationDate(),
	});

	return signedUrl;
}

export async function getConsentSignatureAccessUrl(
	consent: Pick<Consent, "signaturePath" | "signatureUrl">,
): Promise<string | null> {
	if (consent.signaturePath) {
		return getSignedConsentAssetUrl(consent.signaturePath);
	}

	if (!consent.signatureUrl) {
		return null;
	}

	const storagePath = getStoragePathFromLegacyReference(consent.signatureUrl);
	if (storagePath) {
		return getSignedConsentAssetUrl(storagePath);
	}

	return consent.signatureUrl;
}

export async function loadConsentSignatureBuffer(
	consent: Pick<Consent, "signaturePath" | "signatureUrl">,
): Promise<Buffer | undefined> {
	if (consent.signaturePath) {
		if (!bucket) {
			throw new Error("Firebase Storage no está configurado");
		}

		const [buffer] = await bucket.file(consent.signaturePath).download();
		return buffer;
	}

	if (!consent.signatureUrl) {
		return undefined;
	}

	if (isDataUrl(consent.signatureUrl)) {
		const base64Data = consent.signatureUrl.split(",")[1];
		return base64Data ? Buffer.from(base64Data, "base64") : undefined;
	}

	const storagePath = getStoragePathFromLegacyReference(consent.signatureUrl);
	if (storagePath) {
		if (!bucket) {
			throw new Error("Firebase Storage no está configurado");
		}

		const [buffer] = await bucket.file(storagePath).download();
		return buffer;
	}

	if (!isHttpUrl(consent.signatureUrl)) {
		return undefined;
	}

	const response = await fetch(consent.signatureUrl);
	if (!response.ok) {
		throw new Error("No se pudo descargar la firma del consentimiento");
	}

	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

/**
 * Construye tokens de búsqueda para consentimientos incluyendo menores.
 * Usa las utilidades centralizadas con normalización de tildes.
 */
function buildConsentSearchTokens(
	fullName: string,
	email: string,
	consecutivo: number,
	minors: Minor[],
): string[] {
	const nameTokens = generateSearchTokens(fullName);
	const emailTokens = extractEmailTokens(email);
	const allTokens = new Set<string>([...nameTokens, ...emailTokens]);

	// Agregar consecutivo para buscar por #1047
	allTokens.add(consecutivo.toString());

	// Agregar tokens de los menores (nombres y cédulas)
	for (const minor of minors) {
		// Tokens del nombre del menor
		if (minor.fullName) {
			const minorTokens = generateSearchTokens(minor.fullName);
			minorTokens.forEach((token) => {
				allTokens.add(token);
			});
		}

		// Agregar cédula del menor para búsqueda directa
		if (minor.idNumber) {
			allTokens.add(minor.idNumber);
		}

		// Nombre combinado si tiene firstName/lastName
		if (minor.firstName || minor.lastName) {
			const combinedName =
				`${minor.firstName || ""} ${minor.lastName || ""}`.trim();
			if (combinedName) {
				const combinedTokens = generateSearchTokens(combinedName);
				combinedTokens.forEach((token) => {
					allTokens.add(token);
				});
			}
		}
	}

	return Array.from(allTokens);
}

// ============================================================================
// CONSENT SERVICE CLASS
// ============================================================================

class ConsentService {
	private readonly USERS_COLLECTION = "users";
	private readonly CONSENTS_COLLECTION = "consents";
	private readonly OFFLINE_SYNC_COLLECTION = "offline_sync";
	private readonly COUNTERS_COLLECTION = "_counters";
	private readonly COUNTER_DOC = "consents";

	// --------------------------------------------------------------------------
	// CONSECUTIVO ATÓMICO (RF-08)
	// --------------------------------------------------------------------------

	/**
	 * Genera un consecutivo único usando transacciones atómicas de Firestore.
	 *
	 * Cumple con RF-08: Generación única de ID de consentimiento.
	 * Garantiza que no haya colisiones ni huecos en la secuencia.
	 *
	 * @returns Número consecutivo único (1001, 1002, 1003...)
	 */
	private async generateConsecutivo(): Promise<number> {
		const counterRef = db
			.collection(this.COUNTERS_COLLECTION)
			.doc(this.COUNTER_DOC);

		const newConsecutivo = await db.runTransaction(async (transaction) => {
			const counterDoc = await transaction.get(counterRef);

			let currentValue: number;

			if (!counterDoc.exists) {
				// Primera vez: inicializar en 1000 (el primer consecutivo será 1001)
				currentValue = 1000;
				logger.info("Inicializando contador de consecutivos");
			} else {
				currentValue = counterDoc.data()?.value ?? 1000;
			}

			const nextValue = currentValue + 1;

			// Actualizar el contador atómicamente
			transaction.set(counterRef, {
				value: nextValue,
				updatedAt: new Date(),
			});

			return nextValue;
		});

		logger.info("Consecutivo generado", { consecutivo: newConsecutivo });
		return newConsecutivo;
	}

	// --------------------------------------------------------------------------
	// UPLOAD DE FIRMA
	// --------------------------------------------------------------------------

	/**
	 * Sube la firma digital a Firebase Storage y retorna la referencia persistida.
	 */
	private async uploadSignature(
		documentId: string,
		plan: ConsentSignatureUploadPlan,
		base64Data: string,
	): Promise<StoredSignatureAsset> {
		if (!bucket) {
			throw new Error("Firebase Storage no está configurado");
		}

		const file = bucket.file(plan.path);

		// Limpiar el prefijo base64 si existe
		const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(cleanBase64, "base64");

		const [fileExists] = plan.reuseExistingAsset
			? await file.exists()
			: [false];

		if (!fileExists) {
			logger.info("Subiendo firma de consentimiento", {
				reuseExistingAsset: plan.reuseExistingAsset,
			});

			await file.save(buffer, {
				metadata: {
					contentType: "image/png",
					customMetadata: {
						userId: documentId,
						uploadedAt: new Date().toISOString(),
						offlineDedupeKey: plan.dedupeKey,
						uploadStrategy: plan.reuseExistingAsset
							? "deterministic-offline"
							: "timestamped-online",
					},
				},
			});
		} else {
			logger.info("Reutilizando firma offline existente", {
				dedupeKey: plan.dedupeKey,
				path: plan.path,
			});
		}

		const [signedUrl] = await file.getSignedUrl({
			action: "read",
			expires: getConsentSignedUrlExpirationDate(),
		});

		logger.info("Firma subida exitosamente");
		return {
			path: plan.path,
			signedUrl,
			buffer,
			uploadedThisAttempt: !fileExists,
		};
	}

	private async cleanupUploadedSignature(
		signaturePath: string,
		reason: OfflineConsentAssetCleanupReason,
	): Promise<void> {
		if (!bucket) {
			return;
		}

		try {
			await bucket.file(signaturePath).delete({ ignoreNotFound: true });
			logger.info("Firma offline huerfana eliminada", {
				reason,
				signaturePath,
			});
		} catch (error) {
			logger.warn("No se pudo limpiar firma offline huerfana", {
				reason,
				signaturePath,
				error,
			});
		}
	}

	// --------------------------------------------------------------------------
	// NORMALIZACIÓN DE MENORES
	// --------------------------------------------------------------------------

	/**
	 * Normaliza la estructura de menores para consistencia.
	 * Genera fullName si no existe a partir de firstName/lastName.
	 */
	private normalizeMinors(minors: CreateConsentInput["minors"]): Minor[] {
		return minors.map((m) => ({
			fullName:
				m.firstName || m.lastName
					? `${m.firstName || ""} ${m.lastName || ""}`.trim()
					: m.fullName || "",
			firstName: m.firstName,
			lastName: m.lastName,
			birthDate: m.birthDate,
			relationship: m.relationship,
			eps: m.eps,
			idType: m.idType,
			idNumber: m.idNumber,
			medicalCondition: m.medicalCondition,
		}));
	}

	// --------------------------------------------------------------------------
	// UPSERT DE USUARIO
	// --------------------------------------------------------------------------

	/**
	 * Crea o actualiza el perfil del usuario responsable.
	 * Los menores se ACUMULAN (no se reemplazan) para mantener historial completo.
	 */
	private async upsertUser(
		responsibleAdult: CreateConsentInput["responsibleAdult"],
		normalizedMinors: Minor[],
	): Promise<UserProfile> {
		const userRef = db
			.collection(this.USERS_COLLECTION)
			.doc(responsibleAdult.documentId);
		const now = new Date();

		// Obtener usuario existente para preservar menores anteriores
		const existingDoc = await userRef.get();
		let allMinors: Minor[] = normalizedMinors;

		if (existingDoc.exists) {
			const existingData = existingDoc.data() as UserProfile;
			const existingMinors = existingData.minors || [];

			// Crear un mapa de menores existentes por idNumber
			const minorsMap = new Map<string, Minor>();

			// Primero agregar los existentes
			for (const minor of existingMinors) {
				if (minor.idNumber) {
					minorsMap.set(minor.idNumber, minor);
				}
			}

			// Luego actualizar/agregar los nuevos (sobrescriben si ya existen)
			for (const minor of normalizedMinors) {
				if (minor.idNumber) {
					minorsMap.set(minor.idNumber, minor);
				}
			}

			allMinors = Array.from(minorsMap.values());
			logger.info("Menores combinados para actualizar perfil", {
				existingCount: existingMinors.length,
				incomingCount: normalizedMinors.length,
				mergedCount: allMinors.length,
			});
		}

		const userProfile: UserProfile = {
			uid: responsibleAdult.documentId,
			fullName: responsibleAdult.fullName,
			email: responsibleAdult.email,
			phone: responsibleAdult.phone,
			minors: allMinors,
			createdAt: existingDoc.exists
				? (existingDoc.data() as UserProfile).createdAt
				: now,
			updatedAt: now,
		};

		await userRef.set(userProfile);

		logger.info("Perfil del responsable actualizado");
		return userProfile;
	}

	// --------------------------------------------------------------------------
	// CREAR CONSENTIMIENTO
	// --------------------------------------------------------------------------

	private buildConsentDocumentPayload(
		consentId: string,
		consecutivo: number,
		userProfile: UserProfile,
		normalizedMinors: Minor[],
		signaturePath: string,
		ipAddress: string,
		offlineSync?: CreateConsentInput["offlineSync"],
	): Consent & { searchTokens: string[]; adultNameLower: string } {
		const now = new Date();
		const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

		const searchTokens = buildConsentSearchTokens(
			userProfile.fullName,
			userProfile.email,
			consecutivo,
			normalizedMinors,
		);

		return {
			id: consentId,
			consecutivo,
			userId: userProfile.uid,
			adultSnapshot: userProfile,
			minorsSnapshot: normalizedMinors,
			signaturePath,
			policyVersion: offlineSync?.policyVersion ?? "1.0",
			ipAddress,
			signedAt: now,
			validUntil: oneYearFromNow,
			createdAt: now,
			searchTokens,
			adultNameLower: userProfile.fullName.toLowerCase(),
			offlineSync: offlineSync
				? {
						dedupeKey: offlineSync.dedupeKey,
						source: OFFLINE_IDEMPOTENCY_SOURCE.SERVER,
						recordId: offlineSync.dedupeKey,
						acknowledgedAt: now.toISOString(),
					}
				: undefined,
		};
	}

	private async getExistingOfflineSyncResult(
		dedupeKey: string,
	): Promise<CreateConsentResult | null> {
		const ledgerSnapshot = await db
			.collection(this.OFFLINE_SYNC_COLLECTION)
			.doc(dedupeKey)
			.get();

		if (!ledgerSnapshot.exists) {
			return null;
		}

		const ledgerData = ledgerSnapshot.data();
		if (!isOfflineSyncLedgerRecord(ledgerData)) {
			return null;
		}

		return {
			success: true,
			consentId: ledgerData.consentId,
			consecutivo: ledgerData.consecutivo,
			replayed: true,
		};
	}

	private async createConsentWithOfflineLedger(
		userProfile: UserProfile,
		normalizedMinors: Minor[],
		signaturePath: string,
		ipAddress: string,
		offlineSync: NonNullable<CreateConsentInput["offlineSync"]>,
	): Promise<CreateConsentResult> {
		const consentRef = db.collection(this.CONSENTS_COLLECTION).doc();
		const ledgerRef = db
			.collection(this.OFFLINE_SYNC_COLLECTION)
			.doc(offlineSync.dedupeKey);

		const result = await db.runTransaction(async (transaction) => {
			const existingLedgerSnapshot = await transaction.get(ledgerRef);
			const existingLedgerData = existingLedgerSnapshot.data();

			const counterRef = db.collection("_counters").doc("consents");
			const counterSnapshot = await transaction.get(counterRef);
			const previousValue = counterSnapshot.exists
				? Number(counterSnapshot.data()?.value ?? 1000)
				: 1000;

			const consentDocument = this.buildConsentDocumentPayload(
				consentRef.id,
				previousValue + 1,
				userProfile,
				normalizedMinors,
				signaturePath,
				ipAddress,
				offlineSync,
			);
			const resolution = resolveOfflineReplayMutation({
				dedupeKey: offlineSync.dedupeKey,
				existingLedger: existingLedgerData,
				previousConsecutivo: previousValue,
				consentDocument,
				consentId: consentRef.id,
				userId: userProfile.uid,
				policyVersion: offlineSync.policyVersion,
				signedAtLocal: offlineSync.signedAtLocal,
				acknowledgedAt: new Date().toISOString(),
			});

			if (!resolution.success) {
				return resolution;
			}

			if (resolution.counterWrite) {
				transaction.set(counterRef, resolution.counterWrite, { merge: true });
			}

			if (resolution.consentWrite) {
				transaction.set(consentRef, resolution.consentWrite);
			}

			if (resolution.ledgerWrite) {
				transaction.set(ledgerRef, resolution.ledgerWrite);
			}

			return resolution;
		});

		if (!result.success) {
			logger.warn("Ledger offline invalido; se rechaza replay", {
				dedupeKey: offlineSync.dedupeKey,
				reason: result.reason,
			});

			return {
				success: false,
				error:
					result.reason === OFFLINE_REPLAY_REJECTION_REASON.MALFORMED_LEDGER
						? "El ledger offline existente es inválido y no se puede sobrescribir"
						: "No pudimos sincronizar el consentimiento offline",
				errorCode: "OFFLINE_SYNC_LEDGER_CONFLICT",
				statusCode: 409,
			};
		}

		logger.info("Consentimiento offline sincronizado", {
			replayed: result.replayed === true,
			consecutivo: result.consecutivo ?? null,
		});

		return result;
	}

	/**
	 * Crea el documento de consentimiento en Firestore.
	 */
	private async createConsentDocument(
		consecutivo: number,
		userProfile: UserProfile,
		normalizedMinors: Minor[],
		signaturePath: string,
		ipAddress: string,
	): Promise<Consent> {
		const consentRef = db.collection(this.CONSENTS_COLLECTION).doc();
		const consent = this.buildConsentDocumentPayload(
			consentRef.id,
			consecutivo,
			userProfile,
			normalizedMinors,
			signaturePath,
			ipAddress,
		);

		await consentRef.set(consent);

		logger.info("Consentimiento creado", { consecutivo });
		return consent;
	}

	// --------------------------------------------------------------------------
	// ORQUESTADOR PRINCIPAL
	// --------------------------------------------------------------------------

	/**
	 * Crea un consentimiento completo con todas sus dependencias.
	 *
	 * Flujo:
	 * 1. Upload firma a Storage
	 * 2. Normalizar datos de menores
	 * 3. Upsert usuario en Firestore
	 * 4. Generar consecutivo atómico (RF-08)
	 * 5. Crear documento de consentimiento
	 * 6. Sincronizar menores a colección optimizada
	 *
	 * NOTA: El PDF se genera bajo demanda via /api/admin/consents/{id}/pdf
	 *
	 * @param input - Datos del consentimiento
	 * @returns Resultado con consentId y consecutivo
	 */
	async createConsent(input: CreateConsentInput): Promise<CreateConsentResult> {
		const {
			responsibleAdult,
			minors,
			signatureBase64,
			ipAddress,
			offlineSync,
		} = input;

		logger.info("Iniciando creación de consentimiento", {
			hasOfflineSync: Boolean(offlineSync),
			minorCount: minors.length,
		});

		let uploadedSignaturePath: string | undefined;
		let uploadedThisAttempt = false;

		try {
			const offlineQueueEnabled = resolveHardeningFlag(
				HARDENING_FLAG.OFFLINE_QUEUE,
			).enabled;
			const uploadPlan = resolveConsentSignatureUploadPlan({
				documentId: responsibleAdult.documentId,
				offlineSync,
			});

			if (offlineQueueEnabled && offlineSync) {
				const existingResult = await this.getExistingOfflineSyncResult(
					offlineSync.dedupeKey,
				);
				if (existingResult) {
					return existingResult;
				}
			}

			// 1. Subir firma a Storage
			const uploadedSignature = await this.uploadSignature(
				responsibleAdult.documentId,
				uploadPlan,
				signatureBase64,
			);
			uploadedSignaturePath = uploadedSignature.path;
			uploadedThisAttempt = uploadedSignature.uploadedThisAttempt;
			const signaturePath = uploadedSignature.path;

			// 2. Normalizar menores
			const normalizedMinors = this.normalizeMinors(minors);

			// 3. Upsert usuario
			const userProfile = await this.upsertUser(
				responsibleAdult,
				normalizedMinors,
			);

			let consentId: string | undefined;
			let consecutivo: number | undefined;
			let replayed = false;

			if (offlineQueueEnabled && offlineSync) {
				const offlineResult = await this.createConsentWithOfflineLedger(
					userProfile,
					normalizedMinors,
					signaturePath,
					ipAddress,
					offlineSync,
				);

				if (!offlineResult.success) {
					const cleanup = resolveOfflineConsentAssetCleanup({
						assetUploadedThisAttempt: uploadedThisAttempt,
						hasOfflineSync: true,
						replayOutcome: OFFLINE_REPLAY_OUTCOME.REJECTED,
					});

					if (
						uploadPlan.cleanupOnRejectedReplay &&
						cleanup.shouldDelete &&
						cleanup.reason
					) {
						await this.cleanupUploadedSignature(signaturePath, cleanup.reason);
					}

					return offlineResult;
				}

				consentId = offlineResult.consentId;
				consecutivo = offlineResult.consecutivo;
				replayed = offlineResult.replayed === true;

				const cleanup = resolveOfflineConsentAssetCleanup({
					assetUploadedThisAttempt: uploadedThisAttempt,
					hasOfflineSync: true,
					replayOutcome: replayed
						? OFFLINE_REPLAY_OUTCOME.REPLAYED
						: OFFLINE_REPLAY_OUTCOME.CREATED,
				});

				if (
					uploadPlan.cleanupOnRejectedReplay &&
					cleanup.shouldDelete &&
					cleanup.reason
				) {
					await this.cleanupUploadedSignature(signaturePath, cleanup.reason);
				}
			} else {
				// 4. Generar consecutivo atómico (RF-08 - CRÍTICO)
				consecutivo = await this.generateConsecutivo();

				// 5. Crear documento de consentimiento
				const consent = await this.createConsentDocument(
					consecutivo,
					userProfile,
					normalizedMinors,
					signaturePath,
					ipAddress,
				);
				consentId = consent.id;
			}

			// 6. Sincronizar menores a colección optimizada (minors_index)
			// Esto permite listar menores sin cargar todos los usuarios
			try {
				const { minorIndexService } = await import(
					"@/services/minorIndexService"
				);
				await minorIndexService.syncMinors(
					responsibleAdult.documentId,
					responsibleAdult.fullName,
					responsibleAdult.email,
					responsibleAdult.phone,
					normalizedMinors,
				);
				logger.info("Menores sincronizados a minors_index", {
					count: normalizedMinors.length,
				});
			} catch (syncError) {
				// No fallar el consentimiento si falla la sincronización
				logger.warn("Error sincronizando minors_index", syncError);
			}

			// 7. NOTA: El PDF NO se guarda en Storage. Se genera bajo demanda
			// cuando el admin lo solicita a través de /api/admin/consents/{id}/pdf.
			// Esto reduce costos de Storage y evita datos duplicados
			// (la información ya persiste en Firestore).
			logger.info("PDF configurado para generacion bajo demanda", {
				consecutivo,
			});

			logger.info("Consentimiento completado", {
				replayed,
				consecutivo,
			});

			return {
				success: true,
				consentId,
				consecutivo,
				replayed,
			};
		} catch (error) {
			if (uploadedThisAttempt && uploadedSignaturePath) {
				await this.cleanupUploadedSignature(
					uploadedSignaturePath,
					OFFLINE_CONSENT_ASSET_CLEANUP_REASON.POST_UPLOAD_FAILURE,
				);
			}

			logger.error("Error creando consentimiento", error);

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error desconocido al crear consentimiento",
			};
		}
	}

	// --------------------------------------------------------------------------
	// MÉTODOS ADICIONALES (Para futuras implementaciones)
	// --------------------------------------------------------------------------

	/**
	 * Verifica si un usuario tiene un consentimiento vigente.
	 * Útil para RF-10 (Bloqueo de Venta).
	 */
	async hasValidConsent(userId: string): Promise<boolean> {
		const now = new Date();

		const snapshot = await db
			.collection(this.CONSENTS_COLLECTION)
			.where("userId", "==", userId)
			.where("validUntil", ">", now)
			.limit(1)
			.get();

		return !snapshot.empty;
	}

	/**
	 * Obtiene el último consentimiento de un usuario.
	 */
	async getLastConsent(userId: string): Promise<Consent | null> {
		const snapshot = await db
			.collection(this.CONSENTS_COLLECTION)
			.where("userId", "==", userId)
			.orderBy("signedAt", "desc")
			.limit(1)
			.get();

		if (snapshot.empty) return null;

		return snapshot.docs[0].data() as Consent;
	}

	/**
	 * Busca el consentimiento más reciente por cédula (adulto o menor).
	 * Retorna null si no se encuentra.
	 */
	async findConsentByCedula(cedula: string): Promise<{
		consentDoc: FirebaseFirestore.DocumentSnapshot;
		consentData: FirebaseFirestore.DocumentData;
		isExpired: boolean;
		expiresAt: string | null;
		signedAt: string | null;
	} | null> {
		const [adultResult, minorResult] = await Promise.allSettled([
			db
				.collection(this.CONSENTS_COLLECTION)
				.where("userId", "==", cedula)
				.orderBy("signedAt", "desc")
				.limit(1)
				.get(),
			db
				.collection(this.CONSENTS_COLLECTION)
				.where("searchTokens", "array-contains", cedula)
				.limit(50)
				.get(),
		]);

		let consentDoc: FirebaseFirestore.DocumentSnapshot | null = null;
		let consentData: FirebaseFirestore.DocumentData | null = null;
		let latestSignedAt: Date | null = null;

		if (adultResult.status === "fulfilled" && !adultResult.value.empty) {
			consentDoc = adultResult.value.docs[0];
			consentData = consentDoc.data() || null;
			latestSignedAt = consentData?.signedAt?.toDate?.() || null;
		}

		if (minorResult.status === "fulfilled" && !minorResult.value.empty) {
			const sortedDocs = minorResult.value.docs.sort((a, b) => {
				const aDate = a.data().signedAt?.toDate?.() || new Date(0);
				const bDate = b.data().signedAt?.toDate?.() || new Date(0);
				return bDate.getTime() - aDate.getTime();
			});

			const minorDoc = sortedDocs[0];
			const minorData = minorDoc.data() || null;
			const minorSignedAt = minorData?.signedAt?.toDate?.() || null;

			if (!consentDoc) {
				consentDoc = minorDoc;
				consentData = minorData;
			} else if (
				minorSignedAt &&
				(!latestSignedAt || minorSignedAt > latestSignedAt)
			) {
				consentDoc = minorDoc;
				consentData = minorData;
			}
		}

		if (adultResult.status === "rejected") {
			logger.error("Error buscando consentimiento por userId", adultResult.reason);
		}
		if (minorResult.status === "rejected") {
			logger.error(
				"Error buscando consentimiento por searchTokens",
				minorResult.reason,
			);
		}

		if (!consentDoc || !consentData) {
			return null;
		}

		const now = new Date();
		let isExpired = true;
		let expiresAt: string | null = null;

		if (consentData.validUntil) {
			const validUntilDate = consentData.validUntil.toDate?.()
				? consentData.validUntil.toDate()
				: new Date(consentData.validUntil);
			expiresAt = validUntilDate.toISOString();
			isExpired = now > validUntilDate;
		}

		const signedAt =
			consentData.signedAt?.toDate?.()?.toISOString() ||
			consentData.createdAt?.toDate?.()?.toISOString() ||
			null;

		return {
			consentDoc,
			consentData,
			isExpired,
			expiresAt,
			signedAt,
		};
	}

	/**
	 * Obtiene un consentimiento por su ID.
	 * Retorna null si no existe.
	 */
	async getConsentById(id: string): Promise<Consent | null> {
		const doc = await db.collection(this.CONSENTS_COLLECTION).doc(id).get();
		if (!doc.exists) return null;
		return doc.data() as Consent;
	}

	/**
	 * Obtiene la configuración de contenido de consentimiento desde Firestore.
	 * Retorna null si no existe.
	 */
	async getConsentSettings(language: string): Promise<unknown | null> {
		const docId = language === "en" ? "consent_v1_en" : "consent_v1";
		const doc = await db.collection("settings").doc(docId).get();
		if (!doc.exists) return null;
		return doc.data();
	}
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const consentService = new ConsentService();
