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
import {
	extractEmailTokens,
	generateSearchTokens,
} from "@/lib/utils/searchUtils";
import type { Consent, Minor, UserProfile } from "@/types/firestore";

export const CONSENT_ASSET_LIMITS = {
	SIGNED_URL_TTL_MINUTES: 15,
} as const

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
}

export interface CreateConsentResult {
	success: boolean;
	consentId?: string;
	consecutivo?: number;
	error?: string;
}

interface StoredSignatureAsset {
	buffer: Buffer
	path: string
	signedUrl: string
}

function getConsentSignedUrlExpirationDate(): Date {
	return new Date(
		Date.now() + CONSENT_ASSET_LIMITS.SIGNED_URL_TTL_MINUTES * 60 * 1000,
	)
}

function isStoragePath(reference: string): boolean {
	return reference.startsWith('signatures/')
}

function isDataUrl(reference: string): boolean {
	return reference.startsWith('data:image')
}

function isHttpUrl(reference: string): boolean {
	return reference.startsWith('http://') || reference.startsWith('https://')
}

function getStoragePathFromLegacyReference(reference: string): string | null {
	if (reference.startsWith('gs://')) {
		const [, ...parts] = reference.replace('gs://', '').split('/')
		return parts.length > 0 ? parts.join('/') : null
	}

	if (isStoragePath(reference)) {
		return reference
	}

	return null
}

export async function getSignedConsentAssetUrl(path: string): Promise<string> {
	if (!bucket) {
		throw new Error('Firebase Storage no está configurado')
	}

	const [signedUrl] = await bucket.file(path).getSignedUrl({
		action: 'read',
		expires: getConsentSignedUrlExpirationDate(),
	})

	return signedUrl
}

export async function getConsentSignatureAccessUrl(
	consent: Pick<Consent, 'signaturePath' | 'signatureUrl'>,
): Promise<string | null> {
	if (consent.signaturePath) {
		return getSignedConsentAssetUrl(consent.signaturePath)
	}

	if (!consent.signatureUrl) {
		return null
	}

	const storagePath = getStoragePathFromLegacyReference(consent.signatureUrl)
	if (storagePath) {
		return getSignedConsentAssetUrl(storagePath)
	}

	return consent.signatureUrl
}

export async function loadConsentSignatureBuffer(
	consent: Pick<Consent, 'signaturePath' | 'signatureUrl'>,
): Promise<Buffer | undefined> {
	if (consent.signaturePath) {
		if (!bucket) {
			throw new Error('Firebase Storage no está configurado')
		}

		const [buffer] = await bucket.file(consent.signaturePath).download()
		return buffer
	}

	if (!consent.signatureUrl) {
		return undefined
	}

	if (isDataUrl(consent.signatureUrl)) {
		const base64Data = consent.signatureUrl.split(',')[1]
		return base64Data ? Buffer.from(base64Data, 'base64') : undefined
	}

	const storagePath = getStoragePathFromLegacyReference(consent.signatureUrl)
	if (storagePath) {
		if (!bucket) {
			throw new Error('Firebase Storage no está configurado')
		}

		const [buffer] = await bucket.file(storagePath).download()
		return buffer
	}

	if (!isHttpUrl(consent.signatureUrl)) {
		return undefined
	}

	const response = await fetch(consent.signatureUrl)
	if (!response.ok) {
		throw new Error('No se pudo descargar la firma del consentimiento')
	}

	const arrayBuffer = await response.arrayBuffer()
	return Buffer.from(arrayBuffer)
}

/**
 * Construye tokens de búsqueda para consentimientos incluyendo menores.
 * Usa las utilidades centralizadas con normalización de tildes.
 */
function buildConsentSearchTokens(
	fullName: string,
	email: string,
	consecutivo: number,
	minors: Minor[]
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
			minorTokens.forEach((token) => allTokens.add(token));
		}

		// Agregar cédula del menor para búsqueda directa
		if (minor.idNumber) {
			allTokens.add(minor.idNumber);
		}

		// Nombre combinado si tiene firstName/lastName
		if (minor.firstName || minor.lastName) {
			const combinedName = `${minor.firstName || ""} ${minor.lastName || ""}`.trim();
			if (combinedName) {
				const combinedTokens = generateSearchTokens(combinedName);
				combinedTokens.forEach((token) => allTokens.add(token));
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
				console.log(
					"[ConsentService] Inicializando contador de consecutivos en 1000",
				);
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

		console.log(`[ConsentService] Consecutivo generado: ${newConsecutivo}`);
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
		base64Data: string,
	): Promise<StoredSignatureAsset> {
		if (!bucket) {
			throw new Error("Firebase Storage no está configurado");
		}

		const timestamp = Date.now();
		const path = `signatures/${documentId}/${timestamp}.png`;
		const file = bucket.file(path);

		// Limpiar el prefijo base64 si existe
		const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(cleanBase64, "base64");

		console.log(`[ConsentService] Subiendo firma: ${path}`);

		await file.save(buffer, {
			metadata: {
				contentType: "image/png",
				customMetadata: {
					userId: documentId,
					uploadedAt: new Date().toISOString(),
				},
			},
		});

		const [signedUrl] = await file.getSignedUrl({
			action: 'read',
			expires: getConsentSignedUrlExpirationDate(),
		})

		console.log(`[ConsentService] Firma subida exitosamente`);
		return { path, signedUrl, buffer }
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
			console.log(
				`[ConsentService] Menores combinados: ${existingMinors.length} existentes + ${normalizedMinors.length} nuevos = ${allMinors.length} únicos`,
			);
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

		console.log(
			`[ConsentService] Usuario upserted: ${responsibleAdult.documentId}`,
		);
		return userProfile;
	}

	// --------------------------------------------------------------------------
	// CREAR CONSENTIMIENTO
	// --------------------------------------------------------------------------

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
		const now = new Date();
		const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

		// Generar tokens de búsqueda incluyendo menores
		const searchTokens = buildConsentSearchTokens(
			userProfile.fullName,
			userProfile.email,
			consecutivo,
			normalizedMinors,
		);

		const consent: Consent & { searchTokens: string[]; adultNameLower: string } = {
			id: consentRef.id,
			consecutivo,
			userId: userProfile.uid,
			adultSnapshot: userProfile,
			minorsSnapshot: normalizedMinors,
			signaturePath,
			policyVersion: "1.0",
			ipAddress,
			signedAt: now,
			validUntil: oneYearFromNow,
			createdAt: now,
			// Campos de búsqueda optimizada
			searchTokens,
			adultNameLower: userProfile.fullName.toLowerCase(),
		};

		await consentRef.set(consent);

		console.log(
			`[ConsentService] Consentimiento creado: ${consent.id} (Consecutivo: ${consecutivo})`,
		);
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
		const { responsibleAdult, minors, signatureBase64, ipAddress } = input;

		console.log(
			`[ConsentService] Iniciando creación de consentimiento para: ${responsibleAdult.documentId}`,
		);

		try {
			// 1. Subir firma a Storage
			const { path: signaturePath } =
				await this.uploadSignature(
					responsibleAdult.documentId,
					signatureBase64,
				);

			// 2. Normalizar menores
			const normalizedMinors = this.normalizeMinors(minors);

			// 3. Upsert usuario
			const userProfile = await this.upsertUser(
				responsibleAdult,
				normalizedMinors,
			);

			// 4. Generar consecutivo atómico (RF-08 - CRÍTICO)
			const consecutivo = await this.generateConsecutivo();

			// 5. Crear documento de consentimiento
			const consent = await this.createConsentDocument(
				consecutivo,
				userProfile,
				normalizedMinors,
				signaturePath,
				ipAddress,
			);

			// 6. Sincronizar menores a colección optimizada (minors_index)
			// Esto permite listar menores sin cargar todos los usuarios
			try {
				const { minorIndexService } = await import("@/services/minorIndexService");
				await minorIndexService.syncMinors(
					responsibleAdult.documentId,
					responsibleAdult.fullName,
					responsibleAdult.email,
					responsibleAdult.phone,
					normalizedMinors,
				);
				console.log(
					`[ConsentService] Menores sincronizados a minors_index: ${normalizedMinors.length}`,
				);
			} catch (syncError) {
				// No fallar el consentimiento si falla la sincronización
				console.warn("[ConsentService] Error sincronizando minors_index:", syncError);
			}

			// 7. NOTA: El PDF NO se guarda en Storage. Se genera bajo demanda
			// cuando el admin lo solicita a través de /api/admin/consents/{id}/pdf.
			// Esto reduce costos de Storage y evita datos duplicados
			// (la información ya persiste en Firestore).
			console.log(
				`[ConsentService] PDF se generará bajo demanda para consecutivo: ${consecutivo}`,
			);

			console.log(
				`[ConsentService] Consentimiento completado. ID: ${consent.id}, Consecutivo: ${consecutivo}`,
			);

			return {
				success: true,
				consentId: consent.id,
				consecutivo,
			};
		} catch (error) {
			console.error("[ConsentService] Error creando consentimiento:", error);

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
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const consentService = new ConsentService();
