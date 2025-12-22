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
import type { Consent, Minor, UserProfile } from "@/types/firestore";

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
		idType?: "cc" | "ti" | "passport" | "otro";
		idNumber?: string;
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
	 * Sube la firma digital a Firebase Storage y retorna la URL firmada.
	 */
	private async uploadSignature(
		documentId: string,
		base64Data: string,
	): Promise<{ url: string; buffer: Buffer }> {
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

		// Generar URL firmada con expiración larga (para MVP)
		const [signedUrl] = await file.getSignedUrl({
			action: "read",
			expires: "03-01-2500", // Expiración lejana para MVP
		});

		console.log(`[ConsentService] Firma subida exitosamente`);
		return { url: signedUrl, buffer };
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
		signatureUrl: string,
		ipAddress: string,
	): Promise<Consent> {
		const consentRef = db.collection(this.CONSENTS_COLLECTION).doc();
		const now = new Date();
		const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

		const consent: Consent = {
			id: consentRef.id,
			consecutivo,
			userId: userProfile.uid,
			adultSnapshot: userProfile,
			minorsSnapshot: normalizedMinors,
			signatureUrl,
			policyVersion: "1.0",
			ipAddress,
			signedAt: now,
			validUntil: oneYearFromNow,
			createdAt: now,
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
			const { url: signatureUrl } =
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
				signatureUrl,
				ipAddress,
			);

			// 6. NOTA: El PDF NO se guarda en Storage. Se genera bajo demanda
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
