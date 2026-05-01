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
import {
	applyCreatedAtCursor,
	buildCreatedAtOrderedQuery,
	buildCursorMeta,
	buildCursorPageInfo,
} from "@/lib/adminCursor";
import { db } from "@/lib/firebaseAdmin";
import { generateSearchTokens, normalizeText } from "@/lib/utils/searchUtils";
import type { Minor, MinorDocument, UserProfile } from "@/types/firestore";
import { CURSOR_PAGE_META_SOURCE } from "@/types/pagination";

const MINORS_INDEX_COLLECTION = "minors_index";
const COUNTERS_COLLECTION = "_counters";

// ============================================================================
// UTILIDADES DE BÚSQUEDA
// ============================================================================

/**
 * Combina tokens de menor y padre usando normalización de tildes.
 */
function buildMinorSearchTokens(
	minorName: string,
	parentName: string,
): string[] {
	const minorTokens = generateSearchTokens(minorName);
	const parentTokens = generateSearchTokens(parentName);
	return [...new Set([...minorTokens, ...parentTokens])];
}

// ============================================================================
// TIPOS
// ============================================================================

export interface MinorIndexQuery {
	search?: string;
	limit: number;
	offset: number;
	parentId?: string;
	cursor?: string;
	useCursor?: boolean;
}

export interface PaginatedMinorResult {
	items: MinorDocument[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
	pageInfo?: {
		nextCursor: string | null;
		hasNextPage: boolean;
	};
	meta?: {
		totalApprox?: number;
		source: "cursor" | "search";
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

			// Generar tokens de búsqueda
			const searchTokens = buildMinorSearchTokens(fullName, parentName);

			const minorDoc: Omit<MinorDocument, "id"> & { searchTokens: string[] } = {
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
				searchTokens,
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
	 *
	 * ESTRATEGIA:
	 * - Si es búsqueda por idNumber (solo dígitos): Busca directo por ID (1 lectura)
	 * - Si es búsqueda por nombre: Usa array-contains-any en searchTokens
	 * - Sin búsqueda: Paginación directa
	 */
	async list(query: MinorIndexQuery): Promise<PaginatedMinorResult> {
		let firestoreQuery = buildCreatedAtOrderedQuery(
			db.collection(MINORS_INDEX_COLLECTION),
		);

		// Filtrar por padre si se especifica
		if (query.parentId) {
			firestoreQuery = buildCreatedAtOrderedQuery(
				db
					.collection(MINORS_INDEX_COLLECTION)
					.where("parentId", "==", query.parentId),
			);
		}

		// Obtener total para paginación
		let total: number;
		if (!query.search && !query.parentId) {
			total = await this.getMinorsCount();
		} else if (query.parentId && !query.search) {
			const countSnap = await db
				.collection(MINORS_INDEX_COLLECTION)
				.where("parentId", "==", query.parentId)
				.count()
				.get();
			total = countSnap.data().count;
		} else {
			total = 0;
		}

		let items: MinorDocument[] = [];

		if (query.search) {
			const searchLower = query.search.toLowerCase().trim();
			const searchNormalized = normalizeText(query.search);

			// CASO 1: Búsqueda por idNumber (solo dígitos)
			if (/^\d+$/.test(query.search)) {
				const minorDoc = await db
					.collection(MINORS_INDEX_COLLECTION)
					.doc(query.search)
					.get();

				if (minorDoc.exists) {
					items = [{ id: minorDoc.id, ...minorDoc.data() } as MinorDocument];
					total = 1;
				} else {
					items = [];
					total = 0;
				}
			} else {
				// CASO 2: Búsqueda por nombre usando searchTokens + fallback a fullNameLower
				// Acepta palabras de 1+ caracteres (antes era 2+)
				// Normalizar tildes en las palabras de búsqueda
				const searchWords = searchLower
					.split(/\s+/)
					.filter((w) => w.length >= 1)
					.map((w) => normalizeText(w));

				if (searchWords.length === 0) {
					return this.listWithSearchFallback(query);
				}

				// Estrategia optimizada: Priorizar token completo, solo hacer query amplia si es necesario
				let allItems: MinorDocument[] = [];

				// Buscar por searchTokens (máximo 10 palabras)
				const termsToSearch = searchWords.slice(0, 10);
				const fullToken = searchWords.join("");

				if (termsToSearch.length > 0) {
					// Query 1: Buscar token completo concatenado (más preciso, menos lecturas)
					// Ejemplo: "mariajosecubides" para "Maria Jose Cubides"
					const fullTokenSnapshot = await db
						.collection(MINORS_INDEX_COLLECTION)
						.where("searchTokens", "array-contains", fullToken)
						.limit(Math.max(query.limit * 2, 20))
						.get();

					allItems = fullTokenSnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as MinorDocument[];

					// Solo si no hay suficientes resultados del token completo, buscar por palabras individuales
					if (allItems.length < query.limit) {
						let tokenQuery: FirebaseFirestore.Query;

						if (termsToSearch.length === 1) {
							tokenQuery = db
								.collection(MINORS_INDEX_COLLECTION)
								.where("searchTokens", "array-contains", termsToSearch[0])
								.limit(50);
						} else {
							tokenQuery = db
								.collection(MINORS_INDEX_COLLECTION)
								.where("searchTokens", "array-contains-any", termsToSearch)
								.limit(100);
						}

						const snapshot = await tokenQuery.get();

						// Combinar resultados sin duplicados
						const itemMap = new Map<string, MinorDocument>();
						for (const item of allItems) {
							itemMap.set(item.idNumber, item);
						}
						for (const doc of snapshot.docs) {
							if (!itemMap.has(doc.id)) {
								itemMap.set(doc.id, {
									id: doc.id,
									...doc.data(),
								} as MinorDocument);
							}
						}
						allItems = Array.from(itemMap.values());
					}
				}

				// Si no hay resultados con tokens, hacer fallback a búsqueda por fullNameLower
				if (allItems.length === 0) {
					return this.listWithSearchFallback(query);
				}

				// Filtrar: debe contener TODAS las palabras buscadas (usando normalizeText)
				items = allItems.filter((item) => {
					const nameNormalized = normalizeText(item.fullName || "");
					const parentNormalized = normalizeText(item.parentName || "");
					const combinedText = `${nameNormalized} ${parentNormalized}`;
					return searchWords.every((word) => combinedText.includes(word));
				});

				// Ordenar por relevancia (usando normalizeText)
				items = items.sort((a, b) => {
					const aName = normalizeText(a.fullName || "");
					const bName = normalizeText(b.fullName || "");
					const aParent = normalizeText(a.parentName || "");
					const bParent = normalizeText(b.parentName || "");

					const getScore = (name: string, parent: string): number => {
						let score = 0;
						if (name === searchNormalized) score += 1000;
						else if (name.startsWith(searchNormalized)) score += 500;
						else if (name.includes(searchNormalized)) score += 300;
						if (parent === searchNormalized) score += 200;
						else if (parent.startsWith(searchNormalized)) score += 100;
						else if (parent.includes(searchNormalized)) score += 50;
						for (const word of searchWords) {
							if (name.startsWith(word)) score += 20;
							else if (name.includes(word)) score += 10;
							else if (parent.includes(word)) score += 5;
						}
						return score;
					};

					const scoreA = getScore(aName, aParent);
					const scoreB = getScore(bName, bParent);

					if (scoreB !== scoreA) return scoreB - scoreA;
					return aName.length - bName.length;
				});

				total = items.length;
				items = items.slice(query.offset, query.offset + query.limit);
			}
		} else {
			// Sin búsqueda: paginación directa
			const snapshot = await (query.useCursor
				? (query.cursor
						? applyCreatedAtCursor(firestoreQuery, {
								collection: MINORS_INDEX_COLLECTION,
								cursor: query.cursor,
							})
						: firestoreQuery
					)
						.limit(query.limit + 1)
						.get()
				: firestoreQuery.offset(query.offset).limit(query.limit).get());

			items = snapshot.docs
				.slice(0, query.useCursor ? query.limit : snapshot.docs.length)
				.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as MinorDocument[];

			const pageInfo = query.useCursor
				? buildCursorPageInfo(snapshot.docs, {
						collection: MINORS_INDEX_COLLECTION,
						limit: query.limit,
					})
				: {
						nextCursor: null,
						hasNextPage: query.offset + query.limit < total,
					};

			return {
				items,
				pagination: {
					total,
					limit: query.limit,
					offset: query.offset,
					hasMore: pageInfo.hasNextPage,
				},
				pageInfo,
				meta: buildCursorMeta(CURSOR_PAGE_META_SOURCE.CURSOR, total),
			};
		}

		return {
			items,
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
		};
	},

	/**
	 * Fallback para búsquedas que no pueden usar searchTokens.
	 * Busca en fullNameLower y parentName directamente.
	 */
	async listWithSearchFallback(
		query: MinorIndexQuery,
	): Promise<PaginatedMinorResult> {
		const searchNormalized = normalizeText(query.search || "");
		const searchWords = searchNormalized
			.split(/\s+/)
			.filter((w) => w.length >= 1);

		// Buscar en documentos recientes (200 es suficiente para la mayoría de casos)
		const snapshot = await db
			.collection(MINORS_INDEX_COLLECTION)
			.orderBy("createdAt", "desc")
			.limit(200)
			.get();

		const allItems = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as MinorDocument[];

		// Filtrar por nombre del menor o del padre (usando normalizeText)
		let items = allItems.filter((m) => {
			const nameNormalized = normalizeText(m.fullName || "");
			const parentNormalized = normalizeText(m.parentName || "");

			const nameMatch = nameNormalized.includes(searchNormalized);
			const parentMatch = parentNormalized.includes(searchNormalized);

			// Si hay múltiples palabras, todas deben coincidir
			if (searchWords.length > 1) {
				const combinedText = `${nameNormalized} ${parentNormalized}`;
				return searchWords.every((word) => combinedText.includes(word));
			}

			return nameMatch || parentMatch;
		});

		// Ordenar por relevancia (usando normalizeText)
		items = items.sort((a, b) => {
			const aName = normalizeText(a.fullName || "");
			const bName = normalizeText(b.fullName || "");

			// Priorizar nombres que empiezan con la búsqueda
			const aStartsWith = aName.startsWith(searchNormalized);
			const bStartsWith = bName.startsWith(searchNormalized);

			if (aStartsWith && !bStartsWith) return -1;
			if (!aStartsWith && bStartsWith) return 1;

			// Luego por coincidencia exacta
			const aExact = aName === searchNormalized;
			const bExact = bName === searchNormalized;

			if (aExact && !bExact) return -1;
			if (!aExact && bExact) return 1;

			return 0;
		});

		const total = items.length;
		items = items.slice(query.offset, query.offset + query.limit);

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
		const doc = await db
			.collection(MINORS_INDEX_COLLECTION)
			.doc(idNumber)
			.get();
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
		updates: Partial<
			Pick<MinorDocument, "parentName" | "parentEmail" | "parentPhone">
		>,
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
		const countSnap = await db
			.collection(MINORS_INDEX_COLLECTION)
			.count()
			.get();
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
		const countSnap = await db
			.collection(MINORS_INDEX_COLLECTION)
			.count()
			.get();
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
