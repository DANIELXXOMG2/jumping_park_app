import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db } from "@/lib/firebaseAdmin";
import {
	generateSearchTokens,
	extractEmailTokens,
	normalizeText,
} from "@/lib/utils/searchUtils";
import { getEffectivePermissions, type UserRole } from "@/types/auth";

// ============================================================================
// UTILIDADES DE BÚSQUEDA
// ============================================================================

/**
 * Combina tokens de nombre y email para búsqueda completa.
 * Usa las utilidades centralizadas con normalización de tildes.
 */
export function buildUserSearchTokens(fullName: string, email: string): string[] {
	const nameTokens = generateSearchTokens(fullName);
	const emailTokens = extractEmailTokens(email);
	return [...new Set([...nameTokens, ...emailTokens])];
}

// ============================================================================
// TIPOS
// ============================================================================

export interface UserListQuery {
	search?: string;
	limit: number;
	offset: number;
}

export interface StaffListQuery extends UserListQuery {
	role?: string;
}

export interface UserListResult {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone: string | null;
	role: string;
	customPermissions: string[];
	minorsCount: number;
	minors: unknown[];
	createdAt: string | null;
	updatedAt: string | null;
}

export interface StaffListResult {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone: string | null;
	role: string;
	avatar: string | null;
	customPermissions: string[];
	createdAt: string | null;
	updatedAt: string | null;
}

export interface CreateStaffData {
	email: string;
	password: string;
	fullName: string;
	role: string;
	avatar?: string;
	phone?: string;
	customPermissions?: string[];
}

export interface PaginatedResult<T> {
	items: T[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

// ============================================================================
// SERVICIO DE USUARIOS (VISITANTES)
// ============================================================================

export const userService = {
	/**
	 * Lista usuarios (visitantes) con búsqueda y paginación.
	 * OPTIMIZADO: Usa paginación real de Firestore para reducir lecturas.
	 */
	async list(query: UserListQuery): Promise<PaginatedResult<UserListResult>> {
		// Si hay búsqueda, cargar menos documentos y filtrar
		// Si no hay búsqueda, usar paginación real de Firestore
		if (query.search) {
			return this.listWithSearch(query);
		}

		// Sin búsqueda: paginación real de Firestore
		const [countSnap, snapshot] = await Promise.all([
			db.collection("users").count().get(),
			db.collection("users")
				.orderBy("createdAt", "desc")
				.offset(query.offset)
				.limit(query.limit)
				.get(),
		]);

		const total = countSnap.data().count;
		const users: UserListResult[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				uid: data.uid,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role || "visitor",
				customPermissions: data.customPermissions || [],
				minorsCount: data.minors?.length || 0,
				minors: data.minors || [],
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			};
		});

		return {
			items: users,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Búsqueda de usuarios optimizada con tokenización.
	 *
	 * ESTRATEGIA:
	 * - Si es búsqueda por cédula (solo dígitos): Busca directo por ID (1 lectura)
	 * - Si es búsqueda por nombre/email: Usa array-contains-any en searchTokens
	 * - Sin búsqueda: Paginación real de Firestore
	 *
	 * Los usuarios se guardan con ID = cédula.
	 */
	async listWithSearch(query: UserListQuery): Promise<PaginatedResult<UserListResult>> {
		const searchNormalized = normalizeText(query.search || "");
		const searchTerm = query.search?.trim() || "";

		// CASO 1: Búsqueda por cédula/documento (solo dígitos)
		if (/^\d+$/.test(searchTerm)) {
			const userDoc = await db.collection("users").doc(searchTerm).get();

			if (userDoc.exists) {
				const data = userDoc.data()!;
				const user: UserListResult = {
					id: userDoc.id,
					uid: data.uid,
					fullName: data.fullName,
					email: data.email,
					phone: data.phone || null,
					role: data.role || "visitor",
					customPermissions: data.customPermissions || [],
					minorsCount: data.minors?.length || 0,
					minors: data.minors || [],
					createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
					updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
				};
				return {
					items: [user],
					pagination: {
						total: 1,
						limit: query.limit,
						offset: 0,
						hasMore: false,
					},
				};
			}
			return {
				items: [],
				pagination: {
					total: 0,
					limit: query.limit,
					offset: 0,
					hasMore: false,
				},
			};
		}

		// CASO 2: Búsqueda por nombre/email usando searchTokens
		// Extraer palabras individuales del término de búsqueda (normalizadas sin tildes)
		const searchWords = searchNormalized
			.split(/\s+/)
			.filter((w) => w.length >= 2);

		if (searchWords.length === 0) {
			// Si no hay palabras válidas, usar fallback (cargar recientes)
			return this.listWithSearchFallback(query);
		}

		// Firestore limita array-contains-any a 10 términos
		const termsToSearch = searchWords.slice(0, 10);
		const fullToken = searchWords.join("");

		// Estrategia optimizada: Priorizar token completo, solo query amplia si es necesario
		// Query 1: Buscar token completo concatenado (más preciso, menos lecturas)
		const fullTokenSnapshot = await db
			.collection("users")
			.where("searchTokens", "array-contains", fullToken)
			.limit(Math.max(query.limit * 2, 20))
			.get();

		// Combinar resultados sin duplicados
		const userMap = new Map<string, UserListResult>();
		for (const doc of fullTokenSnapshot.docs) {
			const data = doc.data();
			userMap.set(doc.id, {
				id: doc.id,
				uid: data.uid,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role || "visitor",
				customPermissions: data.customPermissions || [],
				minorsCount: data.minors?.length || 0,
				minors: data.minors || [],
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			});
		}

		// Solo si no hay suficientes resultados del token completo, buscar por palabras individuales
		if (userMap.size < query.limit) {
			let tokenQuery: FirebaseFirestore.Query;

			if (termsToSearch.length === 1) {
				tokenQuery = db
					.collection("users")
					.where("searchTokens", "array-contains", termsToSearch[0])
					.limit(50);
			} else {
				tokenQuery = db
					.collection("users")
					.where("searchTokens", "array-contains-any", termsToSearch)
					.limit(100);
			}

			const snapshot = await tokenQuery.get();

			for (const doc of snapshot.docs) {
				if (!userMap.has(doc.id)) {
					const data = doc.data();
					userMap.set(doc.id, {
						id: doc.id,
						uid: data.uid,
						fullName: data.fullName,
						email: data.email,
						phone: data.phone || null,
						role: data.role || "visitor",
						customPermissions: data.customPermissions || [],
						minorsCount: data.minors?.length || 0,
						minors: data.minors || [],
						createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
						updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
					});
				}
			}
		}

		// Mapear resultados
		let users: UserListResult[] = Array.from(userMap.values());

		// FILTRAR: Solo documentos que contengan TODAS las palabras buscadas (normalizadas)
		if (searchWords.length > 1) {
			users = users.filter((user) => {
				const nameNormalized = normalizeText(user.fullName || "");
				const emailNormalized = normalizeText(user.email || "");
				const combinedText = `${nameNormalized} ${emailNormalized}`;
				return searchWords.every((word) => combinedText.includes(word));
			});
		}

		// Ordenar por relevancia (scoring más preciso, usando texto normalizado)
		users = users.sort((a, b) => {
			const aName = normalizeText(a.fullName || "");
			const bName = normalizeText(b.fullName || "");
			const aEmail = normalizeText(a.email || "");
			const bEmail = normalizeText(b.email || "");

			const getScore = (name: string, email: string): number => {
				let score = 0;

				// Coincidencia exacta del nombre = máxima prioridad
				if (name === searchNormalized) score += 1000;
				else if (name.startsWith(searchNormalized)) score += 500;
				else if (name.includes(searchNormalized)) score += 300;

				// Coincidencia en email
				if (email === searchNormalized) score += 200;
				else if (email.startsWith(searchNormalized)) score += 100;
				else if (email.includes(searchNormalized)) score += 50;

				// Palabras individuales
				for (const word of searchWords) {
					if (name.startsWith(word)) score += 20;
					else if (name.includes(word)) score += 10;
					else if (email.includes(word)) score += 5;
				}

				return score;
			};

			const scoreA = getScore(aName, aEmail);
			const scoreB = getScore(bName, bEmail);

			if (scoreB !== scoreA) return scoreB - scoreA;

			// Desempate: nombre más corto primero
			return aName.length - bName.length;
		});

		const total = users.length;
		const paginatedUsers = users.slice(query.offset, query.offset + query.limit);

		return {
			items: paginatedUsers,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Fallback para búsquedas que no pueden usar searchTokens.
	 * Carga últimos 100 documentos y filtra en memoria.
	 */
	async listWithSearchFallback(query: UserListQuery): Promise<PaginatedResult<UserListResult>> {
		const searchNormalized = normalizeText(query.search || "");
		const searchTerm = query.search || "";

		const snapshot = await db.collection("users")
			.orderBy("createdAt", "desc")
			.limit(100)
			.get();

		let users: UserListResult[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				uid: data.uid,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role || "visitor",
				customPermissions: data.customPermissions || [],
				minorsCount: data.minors?.length || 0,
				minors: data.minors || [],
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			};
		});

		// Filtrar usando normalizeText para ignorar tildes
		users = users.filter(
			(user) =>
				normalizeText(user.fullName || "").includes(searchNormalized) ||
				normalizeText(user.email || "").includes(searchNormalized) ||
				user.phone?.includes(searchTerm),
		);

		const total = users.length;
		const paginatedUsers = users.slice(query.offset, query.offset + query.limit);

		return {
			items: paginatedUsers,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Obtiene un usuario por ID o UID.
	 */
	async getById(id: string): Promise<{
		user: UserListResult;
		docId: string;
	} | null> {
		let userDoc = await db.collection("users").doc(id).get();

		if (!userDoc.exists) {
			const byUid = await db
				.collection("users")
				.where("uid", "==", id)
				.limit(1)
				.get();

			if (byUid.empty) {
				return null;
			}
			userDoc = byUid.docs[0];
		}

		const data = userDoc.data();
		if (!data) return null;

		return {
			docId: userDoc.id,
			user: {
				id: userDoc.id,
				uid: data.uid,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role || "visitor",
				customPermissions: data.customPermissions || [],
				minorsCount: data.minors?.length || 0,
				minors: data.minors || [],
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			},
		};
	},

	/**
	 * Obtiene los consentimientos de un usuario.
	 */
	async getConsents(uid: string): Promise<unknown[]> {
		const consentsSnap = await db
			.collection("consents")
			.where("userId", "==", uid)
			.get();

		return consentsSnap.docs
			.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					consecutivo: data.consecutivo,
					policyVersion: data.policyVersion,
					signatureUrl: data.signatureUrl,
					minorsCount: data.minorsSnapshot?.length || 0,
					minors: data.minorsSnapshot || [],
					adultName: data.adultSnapshot?.fullName,
					adultEmail: data.adultSnapshot?.email,
					adultPhone: data.adultSnapshot?.phone,
					userId: data.userId,
					ipAddress: data.ipAddress || null,
					createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
					signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
					validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
				};
			})
			.sort((a, b) => {
				if (!a.createdAt || !b.createdAt) return 0;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});
	},

	/**
	 * Elimina un usuario por ID.
	 */
	async delete(id: string): Promise<{ success: boolean; deletedId: string } | null> {
		const result = await this.getById(id);
		if (!result) return null;

		await db.collection("users").doc(result.docId).delete();

		return {
			success: true,
			deletedId: result.docId,
		};
	},
};

// ============================================================================
// SERVICIO DE STAFF (ADMIN/TRABAJADORES)
// ============================================================================

const SUPER_ADMIN_EMAIL = "jumpingadmin@gmail.com";

function isSuperAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Helper para mapear documento Firestore a StaffListResult.
 * Evita duplicación de código entre list() y getById().
 */
function mapDocToStaffResult(
	doc: FirebaseFirestore.DocumentSnapshot,
	data: FirebaseFirestore.DocumentData,
): StaffListResult {
	return {
		id: doc.id,
		uid: data.uid || doc.id,
		fullName: data.fullName,
		email: data.email,
		phone: data.phone || null,
		role: data.role,
		avatar: data.avatar || null,
		customPermissions: data.customPermissions || [],
		createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
		updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
	};
}

export const staffService = {
	/**
	 * Lista personal administrativo con búsqueda y paginación.
	 * OPTIMIZADO: Usa paginación real de Firestore.
	 */
	async list(query: StaffListQuery): Promise<PaginatedResult<StaffListResult>> {
		const baseCollection = db.collection("admin_users");

		// Con búsqueda: filtrar en memoria (staff normalmente es pequeño)
		if (query.search) {
			let firestoreQuery = baseCollection.orderBy("createdAt", "desc");
			if (query.role) {
				firestoreQuery = baseCollection
					.where("role", "==", query.role)
					.orderBy("createdAt", "desc");
			}

			const snapshot = await firestoreQuery.limit(50).get();
			const searchLower = query.search.toLowerCase();
			const searchTerm = query.search;

			let staff: StaffListResult[] = snapshot.docs
				.map((doc) => mapDocToStaffResult(doc, doc.data()))
				.filter(
					(user) =>
						user.fullName?.toLowerCase().includes(searchLower) ||
						user.email?.toLowerCase().includes(searchLower) ||
						user.phone?.includes(searchTerm),
				);

			const total = staff.length;
			const paginatedStaff = staff.slice(query.offset, query.offset + query.limit);

			return {
				items: paginatedStaff,
				pagination: {
					total,
					limit: query.limit,
					offset: query.offset,
					hasMore: query.offset + query.limit < total,
				},
			};
		}

		// Sin búsqueda: paginación real
		const countQueryBase = query.role
			? baseCollection.where("role", "==", query.role)
			: baseCollection;

		const dataQueryBase = query.role
			? baseCollection.where("role", "==", query.role).orderBy("createdAt", "desc")
			: baseCollection.orderBy("createdAt", "desc");

		const [countSnap, snapshot] = await Promise.all([
			countQueryBase.count().get(),
			dataQueryBase.offset(query.offset).limit(query.limit).get(),
		]);

		const total = countSnap.data().count;
		const staff: StaffListResult[] = snapshot.docs.map((doc) =>
			mapDocToStaffResult(doc, doc.data()),
		);

		return {
			items: staff,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Obtiene un miembro del staff por ID.
	 */
	async getById(id: string): Promise<StaffListResult | null> {
		const staffDoc = await db.collection("admin_users").doc(id).get();

		if (!staffDoc.exists) return null;

		const data = staffDoc.data();
		if (!data) return null;

		return mapDocToStaffResult(staffDoc, data);
	},

	/**
	 * Crea un nuevo miembro del staff.
	 */
	async create(
		data: CreateStaffData,
		createdByUid: string,
	): Promise<{ staff: StaffListResult } | { error: string; status: number }> {
		// Verificar si el email ya existe
		const existingUser = await db
			.collection("admin_users")
			.where("email", "==", data.email)
			.limit(1)
			.get();

		if (!existingUser.empty) {
			return {
				error: "Ya existe un usuario administrativo con ese email",
				status: 409,
			};
		}

		try {
			// Crear usuario en Firebase Auth
			const userRecord = await adminAuth.createUser({
				email: data.email,
				password: data.password,
				displayName: data.fullName,
			});

			// Asignar custom claims
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				admin: true,
				role: data.role,
			});

			// Crear documento en admin_users
			const now = FieldValue.serverTimestamp();
			const staffData = {
				uid: userRecord.uid,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role,
				avatar: data.avatar || null,
				customPermissions: data.customPermissions || [],
				createdAt: now,
				updatedAt: now,
				createdBy: createdByUid,
			};

			await db.collection("admin_users").doc(userRecord.uid).set(staffData);

			return {
				staff: {
					id: userRecord.uid,
					uid: userRecord.uid,
					fullName: data.fullName,
					email: data.email,
					phone: data.phone || null,
					role: data.role,
					avatar: data.avatar || null,
					customPermissions: data.customPermissions || [],
					createdAt: null, // Se llenará cuando se lea de nuevo
					updatedAt: null,
				},
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("email-already-exists")) {
					return {
						error: "El email ya está registrado en Firebase Auth",
						status: 409,
					};
				}
				if (error.message.includes("invalid-email")) {
					return {
						error: "El formato del email es inválido",
						status: 400,
					};
				}
				if (error.message.includes("weak-password")) {
					return {
						error: "La contraseña es muy débil",
						status: 400,
					};
				}
			}
			throw error;
		}
	},

	/**
	 * Elimina un miembro del staff (solo Super Admin).
	 */
	async delete(
		id: string,
		authUserUid: string,
	): Promise<{ success: boolean; deletedId: string } | { error: string; status: number }> {
		// Obtener email del usuario autenticado
		const authUserDoc = await db.collection("admin_users").doc(authUserUid).get();
		const authUserEmail = authUserDoc.data()?.email;

		// Solo Super Admin puede eliminar
		if (!isSuperAdmin(authUserEmail)) {
			return {
				error: "Solo el Super Admin puede eliminar miembros del equipo",
				status: 403,
			};
		}

		// No permitir auto-eliminación
		if (id === authUserUid) {
			return {
				error: "No puedes eliminarte a ti mismo",
				status: 400,
			};
		}

		// Verificar que existe
		const staffDoc = await db.collection("admin_users").doc(id).get();
		if (!staffDoc.exists) {
			return {
				error: "Miembro del staff no encontrado",
				status: 404,
			};
		}

		const staffEmail = staffDoc.data()?.email;

		// Proteger al Super Admin
		if (isSuperAdmin(staffEmail)) {
			return {
				error: "No se puede eliminar al Super Admin",
				status: 403,
			};
		}

		// Eliminar de Firebase Auth (ignorar si no existe)
		try {
			await adminAuth.deleteUser(id);
		} catch {
			// Usuario no existe en Auth, continuamos
		}

		// Eliminar documento
		await db.collection("admin_users").doc(id).delete();

		return {
			success: true,
			deletedId: id,
		};
	},

	/**
	 * Verifica si un usuario tiene permiso para crear staff.
	 */
	async hasCreatePermission(uid: string): Promise<{
		hasPermission: boolean;
		role: string;
		permissions: string[];
	}> {
		const userDoc = await db.collection("admin_users").doc(uid).get();
		if (!userDoc.exists) {
			return { hasPermission: false, role: "unknown", permissions: [] };
		}

		const userData = userDoc.data();
		const userRole = (userData?.role || "visitor") as UserRole;
		const customPermissions = userData?.customPermissions || [];

		const effectivePermissions = getEffectivePermissions(userRole, customPermissions);

		if (userRole === "admin") {
			return { hasPermission: true, role: userRole, permissions: effectivePermissions };
		}

		const canCreate =
			effectivePermissions.includes("users:create") ||
			effectivePermissions.includes("roles:manage");

		return { hasPermission: canCreate, role: userRole, permissions: effectivePermissions };
	},
};

// ============================================================================
// SERVICIO DE MENORES (Usa colección denormalizada minors_index)
// ============================================================================

export interface MinorWithParent {
	id: string;
	fullName: string;
	firstName?: string;
	lastName?: string;
	birthDate: string;
	relationship: string;
	eps?: string;
	idType?: string;
	idNumber?: string;
	medicalCondition?: string;
	parentId: string;
	parentName: string;
	parentEmail: string;
	parentPhone: string;
}

export const minorService = {
	/**
	 * Lista todos los menores usando la colección optimizada minors_index.
	 * OPTIMIZADO: Evita cargar todos los usuarios.
	 */
	async list(query: UserListQuery): Promise<PaginatedResult<MinorWithParent>> {
		// Importar dinámicamente para evitar dependencias circulares
		const { minorIndexService } = await import("@/services/minorIndexService");

		const result = await minorIndexService.list({
			search: query.search,
			limit: query.limit,
			offset: query.offset,
		});

		// Mapear al formato esperado por la API existente
		const items: MinorWithParent[] = result.items.map((m) => ({
			id: m.idNumber, // Usar idNumber como ID
			fullName: m.fullName,
			firstName: m.firstName,
			lastName: m.lastName,
			birthDate: m.birthDate,
			relationship: m.relationship,
			eps: m.eps,
			idType: m.idType,
			idNumber: m.idNumber,
			medicalCondition: m.medicalCondition,
			parentId: m.parentId,
			parentName: m.parentName,
			parentEmail: m.parentEmail,
			parentPhone: m.parentPhone,
		}));

		return {
			items,
			pagination: result.pagination,
		};
	},

	/**
	 * Obtiene un menor por ID (idNumber).
	 * OPTIMIZADO: Lee un solo documento.
	 */
	async getById(id: string): Promise<{
		minor: Record<string, unknown>;
		parent: Record<string, unknown>;
		userDocId: string;
		minorIndex: number;
	} | null> {
		const { minorIndexService } = await import("@/services/minorIndexService");

		const minorDoc = await minorIndexService.getById(id);
		if (!minorDoc) return null;

		return {
			userDocId: minorDoc.parentId,
			minorIndex: 0, // Ya no usamos índice, usamos idNumber
			minor: {
				id: minorDoc.idNumber,
				fullName: minorDoc.fullName,
				firstName: minorDoc.firstName,
				lastName: minorDoc.lastName,
				birthDate: minorDoc.birthDate,
				relationship: minorDoc.relationship,
				eps: minorDoc.eps,
				idType: minorDoc.idType,
				idNumber: minorDoc.idNumber,
				medicalCondition: minorDoc.medicalCondition,
			},
			parent: {
				id: minorDoc.parentId,
				uid: minorDoc.parentId,
				fullName: minorDoc.parentName,
				email: minorDoc.parentEmail,
				phone: minorDoc.parentPhone,
			},
		};
	},

	/**
	 * Elimina un menor por ID (idNumber).
	 * OPTIMIZADO: Elimina de ambas colecciones.
	 */
	async delete(id: string): Promise<{
		success: boolean;
		deletedMinor: { fullName: string };
	} | { error: string; status: number }> {
		const { minorIndexService } = await import("@/services/minorIndexService");

		// Obtener datos del menor antes de eliminar
		const minorDoc = await minorIndexService.getById(id);
		if (!minorDoc) {
			return { error: "Menor no encontrado", status: 404 };
		}

		// Eliminar de minors_index
		await minorIndexService.delete(id);

		// También eliminar del array embebido en users (para consistencia)
		const userSnap = await db
			.collection("users")
			.where("uid", "==", minorDoc.parentId)
			.limit(1)
			.get();

		if (!userSnap.empty) {
			const userDoc = userSnap.docs[0];
			const userData = userDoc.data();
			if (userData.minors && Array.isArray(userData.minors)) {
				const updatedMinors = userData.minors.filter(
					(m: { idNumber?: string }) => m.idNumber !== id,
				);
				await userDoc.ref.update({
					minors: updatedMinors,
					updatedAt: FieldValue.serverTimestamp(),
				});
			}
		}

		return {
			success: true,
			deletedMinor: {
				fullName: minorDoc.fullName,
			},
		};
	},
};
