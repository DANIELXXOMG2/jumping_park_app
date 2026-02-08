/**
 * MinorIndexService - Servicio para gestión de la colección denormalizada minors_index.
 *
 * Esta colección optimiza las lecturas de menores evitando cargar todos los usuarios.
 * Cada documento contiene datos del menor + datos denormalizados del padre.
 *
 * IMPORTANTE: Esta colección debe sincronizarse cuando:
 * 1. Se crea un consentimiento (crea/actualiza menores)
 * 2. Se actualiza información del padre (email, phone, name)
 * 3. Se elimina un menor
 */
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import type { Minor, MinorDocument, UserProfile } from "@/types/firestore";

const MINORS_INDEX_COLLECTION = "minors_index";
const COUNTERS_COLLECTION = "_counters";

// ============================================================================
// TIPOS
// ============================================================================

export interface MinorIndexQuery {
	search?: string;
	limit: number;
	offset: number;
	parentId?: string;
}

export interface PaginatedMinorResult {
	items: MinorDocument[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

// ============================================================================
// SERVICIO
// ============================================================================

export const minorIndexService = {
	/**
	 * Sincroniza menores de un usuario a la colección minors_index.
	 * Llamar después de crear/actualizar consentimiento o usuario.
	 */
	async syncMinors(
		parentId: string,
		parentName: string,
		parentEmail: string,
		parentPhone: string,
		minors: Minor[],
	): Promise<{ synced: number; errors: string[] }> {
		const batch = db.batch();
		let synced = 0;
		const errors: string[] = [];

		for (const minor of minors) {
			// Solo sincronizar menores con idNumber (clave única)
			if (!minor.idNumber) {
				errors.push(`Menor sin idNumber: ${minor.fullName || "sin nombre"}`);
				continue;
			}

			const docRef = db.collection(MINORS_INDEX_COLLECTION).doc(minor.idNumber);
			const fullName =
				minor.fullName ||
				`${minor.firstName || ""} ${minor.lastName || ""}`.trim() ||
				"Sin nombre";

			const minorDoc: Omit<MinorDocument, "id"> = {
				fullName,
				firstName: minor.firstName,
				lastName: minor.lastName,
				birthDate: minor.birthDate,
				relationship: minor.relationship,
				eps: minor.eps,
				idType: minor.idType,
				idNumber: minor.idNumber,
				medicalCondition: minor.medicalCondition,
				parentId,
				parentName,
				parentEmail,
				parentPhone,
				fullNameLower: fullName.toLowerCase(),
				updatedAt: FieldValue.serverTimestamp() as unknown as Date,
			};

			// Usar merge para no sobrescribir createdAt si ya existe
			batch.set(
				docRef,
				{
					...minorDoc,
					createdAt: FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
			synced++;
		}

		if (synced > 0) {
			await batch.commit();
			// Actualizar contador
			await this.updateMinorsCount();
		}

		return { synced, errors };
	},

	/**
	 * Lista menores con paginación y búsqueda optimizada.
	 * Usa la colección denormalizada para evitar cargar todos los usuarios.
	 */
	async list(query: MinorIndexQuery): Promise<PaginatedMinorResult> {
		let firestoreQuery = db
			.collection(MINORS_INDEX_COLLECTION)
			.orderBy("createdAt", "desc");

		// Filtrar por padre si se especifica
		if (query.parentId) {
			firestoreQuery = db
				.collection(MINORS_INDEX_COLLECTION)
				.where("parentId", "==", query.parentId)
				.orderBy("createdAt", "desc");
		}

		// Obtener total para paginación (usar contador cacheado si no hay búsqueda)
		let total: number;
		if (!query.search && !query.parentId) {
			total = await this.getMinorsCount();
		} else if (query.parentId && !query.search) {
			// Contar solo los del padre específico
			const countSnap = await db
				.collection(MINORS_INDEX_COLLECTION)
				.where("parentId", "==", query.parentId)
				.count()
				.get();
			total = countSnap.data().count;
		} else {
			// Con búsqueda, obtener total después de filtrar
			total = 0;
		}

		// Si hay búsqueda, usar fullNameLower para filtro parcial
		// Firestore no soporta búsqueda de texto parcial, así que:
		// - Para búsquedas exactas o prefijo: usar >= y <
		// - Para búsquedas parciales: cargar más docs y filtrar

		let items: MinorDocument[] = [];

		if (query.search) {
			const searchLower = query.search.toLowerCase();

			// Intentar búsqueda por prefijo primero (más eficiente)
			const prefixEnd = searchLower.slice(0, -1) + String.fromCharCode(searchLower.charCodeAt(searchLower.length - 1) + 1);

			const prefixQuery = db
				.collection(MINORS_INDEX_COLLECTION)
				.where("fullNameLower", ">=", searchLower)
				.where("fullNameLower", "<", prefixEnd)
				.orderBy("fullNameLower")
				.limit(query.limit + query.offset);

			const prefixSnap = await prefixQuery.get();

			if (!prefixSnap.empty) {
				items = prefixSnap.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as MinorDocument[];
				total = items.length;
			} else {
				// Fallback: búsqueda en más documentos (limitado)
				const fallbackSnap = await firestoreQuery.limit(200).get();
				const allItems = fallbackSnap.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as MinorDocument[];

				items = allItems.filter(
					(m) =>
						m.fullNameLower?.includes(searchLower) ||
						m.idNumber?.includes(query.search!) ||
						m.parentName?.toLowerCase().includes(searchLower) ||
						m.parentId?.includes(query.search!),
				);
				total = items.length;
			}

			// Aplicar paginación manual
			items = items.slice(query.offset, query.offset + query.limit);
		} else {
			// Sin búsqueda: paginación directa en Firestore
			const snapshot = await firestoreQuery
				.offset(query.offset)
				.limit(query.limit)
				.get();

			items = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as MinorDocument[];
		}

		return {
			items,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Obtiene un menor por idNumber.
	 */
	async getById(idNumber: string): Promise<MinorDocument | null> {
		const doc = await db.collection(MINORS_INDEX_COLLECTION).doc(idNumber).get();
		if (!doc.exists) return null;
		return { id: doc.id, ...doc.data() } as MinorDocument;
	},

	/**
	 * Elimina un menor del índice.
	 */
	async delete(idNumber: string): Promise<boolean> {
		const docRef = db.collection(MINORS_INDEX_COLLECTION).doc(idNumber);
		const doc = await docRef.get();
		if (!doc.exists) return false;

		await docRef.delete();
		await this.decrementMinorsCount();
		return true;
	},

	/**
	 * Actualiza datos del padre en todos sus menores.
	 * Útil cuando se actualiza el perfil del usuario.
	 */
	async updateParentInfo(
		parentId: string,
		updates: Partial<Pick<MinorDocument, "parentName" | "parentEmail" | "parentPhone">>,
	): Promise<number> {
		const snapshot = await db
			.collection(MINORS_INDEX_COLLECTION)
			.where("parentId", "==", parentId)
			.get();

		if (snapshot.empty) return 0;

		const batch = db.batch();
		for (const doc of snapshot.docs) {
			batch.update(doc.ref, {
				...updates,
				updatedAt: FieldValue.serverTimestamp(),
			});
		}
		await batch.commit();
		return snapshot.size;
	},

	// ============================================================================
	// CONTADORES (Optimización de count queries)
	// ============================================================================

	/**
	 * Obtiene el contador cacheado de menores.
	 */
	async getMinorsCount(): Promise<number> {
		const counterDoc = await db
			.collection(COUNTERS_COLLECTION)
			.doc("minors_index")
			.get();

		if (!counterDoc.exists) {
			// Inicializar contador
			const count = await this.recalculateMinorsCount();
			return count;
		}

		return counterDoc.data()?.count ?? 0;
	},

	/**
	 * Recalcula el contador de menores (usar con cuidado).
	 */
	async recalculateMinorsCount(): Promise<number> {
		const countSnap = await db.collection(MINORS_INDEX_COLLECTION).count().get();
		const count = countSnap.data().count;

		await db.collection(COUNTERS_COLLECTION).doc("minors_index").set({
			count,
			updatedAt: FieldValue.serverTimestamp(),
		});

		return count;
	},

	/**
	 * Actualiza el contador de menores después de sync.
	 */
	async updateMinorsCount(): Promise<void> {
		const countSnap = await db.collection(MINORS_INDEX_COLLECTION).count().get();
		await db.collection(COUNTERS_COLLECTION).doc("minors_index").set({
			count: countSnap.data().count,
			updatedAt: FieldValue.serverTimestamp(),
		});
	},

	/**
	 * Decrementa el contador de menores.
	 */
	async decrementMinorsCount(): Promise<void> {
		const counterRef = db.collection(COUNTERS_COLLECTION).doc("minors_index");
		await counterRef.update({
			count: FieldValue.increment(-1),
			updatedAt: FieldValue.serverTimestamp(),
		});
	},

	// ============================================================================
	// MIGRACIÓN
	// ============================================================================

	/**
	 * Migra todos los menores embebidos en users a la colección minors_index.
	 * USAR SOLO UNA VEZ para migración inicial.
	 */
	async migrateFromUsers(): Promise<{
		usersProcessed: number;
		minorsMigrated: number;
		errors: string[];
	}> {
		const errors: string[] = [];
		let usersProcessed = 0;
		let minorsMigrated = 0;

		// Procesar en lotes de 100 usuarios
		const BATCH_SIZE = 100;
		let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

		while (true) {
			let usersQuery = db
				.collection("users")
				.orderBy("createdAt", "desc")
				.limit(BATCH_SIZE);

			if (lastDoc) {
				usersQuery = usersQuery.startAfter(lastDoc);
			}

			const usersSnap = await usersQuery.get();

			if (usersSnap.empty) break;

			for (const userDoc of usersSnap.docs) {
				const userData = userDoc.data() as UserProfile;
				usersProcessed++;

				if (!userData.minors || userData.minors.length === 0) continue;

				const result = await this.syncMinors(
					userData.uid,
					userData.fullName,
					userData.email,
					userData.phone,
					userData.minors,
				);

				minorsMigrated += result.synced;
				errors.push(...result.errors);
			}

			lastDoc = usersSnap.docs[usersSnap.docs.length - 1];

			// Si obtuvimos menos del batch size, terminamos
			if (usersSnap.size < BATCH_SIZE) break;
		}

		// Recalcular contador final
		await this.recalculateMinorsCount();

		return { usersProcessed, minorsMigrated, errors };
	},
};
