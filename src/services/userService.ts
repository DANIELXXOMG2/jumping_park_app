import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db } from "@/lib/firebaseAdmin";
import { getEffectivePermissions, type UserRole } from "@/types/auth";

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
	 */
	async list(query: UserListQuery): Promise<PaginatedResult<UserListResult>> {
		const usersQuery = db.collection("users").orderBy("createdAt", "desc");
		const snapshot = await usersQuery.limit(500).get();

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

		// Filtrar por búsqueda
		if (query.search) {
			const searchLower = query.search.toLowerCase();
			const searchTerm = query.search;
			users = users.filter(
				(user) =>
					user.fullName?.toLowerCase().includes(searchLower) ||
					user.email?.toLowerCase().includes(searchLower) ||
					user.phone?.includes(searchTerm) ||
					user.uid?.includes(searchTerm),
			);
		}

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
	 */
	async list(query: StaffListQuery): Promise<PaginatedResult<StaffListResult>> {
		let usersQuery = db.collection("admin_users").orderBy("createdAt", "desc");

		if (query.role) {
			usersQuery = db
				.collection("admin_users")
				.where("role", "==", query.role)
				.orderBy("createdAt", "desc");
		}

		const snapshot = await usersQuery.limit(500).get();

		let staff: StaffListResult[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return mapDocToStaffResult(doc, data);
		});

		if (query.search) {
			const searchLower = query.search.toLowerCase();
			const searchTerm = query.search;
			staff = staff.filter(
				(user) =>
					user.fullName?.toLowerCase().includes(searchLower) ||
					user.email?.toLowerCase().includes(searchLower) ||
					user.phone?.includes(searchTerm),
			);
		}

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
// SERVICIO DE MENORES
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
	 * Lista todos los menores con información del padre.
	 */
	async list(query: UserListQuery): Promise<PaginatedResult<MinorWithParent>> {
		const usersSnap = await db.collection("users").get();

		let allMinors: MinorWithParent[] = [];

		usersSnap.docs.forEach((doc) => {
			const data = doc.data();
			if (data.minors && Array.isArray(data.minors)) {
				data.minors.forEach((minor: Record<string, unknown>, index: number) => {
					allMinors.push({
						id: `${doc.id}_${index}`,
						fullName:
							(minor.fullName as string) ||
							`${minor.firstName || ""} ${minor.lastName || ""}`.trim(),
						firstName: minor.firstName as string | undefined,
						lastName: minor.lastName as string | undefined,
						birthDate: minor.birthDate as string,
						relationship: minor.relationship as string,
						eps: minor.eps as string | undefined,
						idType: minor.idType as string | undefined,
						idNumber: minor.idNumber as string | undefined,
						medicalCondition: minor.medicalCondition as string | undefined,
						parentId: data.uid,
						parentName: data.fullName,
						parentEmail: data.email,
						parentPhone: data.phone,
					});
				});
			}
		});

		if (query.search) {
			const searchLower = query.search.toLowerCase();
			const searchTerm = query.search;
			allMinors = allMinors.filter(
				(minor) =>
					minor.fullName?.toLowerCase().includes(searchLower) ||
					minor.idNumber?.includes(searchTerm) ||
					minor.parentName?.toLowerCase().includes(searchLower) ||
					minor.parentId?.includes(searchTerm),
			);
		}

		const total = allMinors.length;
		const paginatedMinors = allMinors.slice(query.offset, query.offset + query.limit);

		return {
			items: paginatedMinors,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		};
	},

	/**
	 * Obtiene un menor por ID compuesto (userId_index).
	 */
	async getById(id: string): Promise<{
		minor: Record<string, unknown>;
		parent: Record<string, unknown>;
		userDocId: string;
		minorIndex: number;
	} | null> {
		const [userId, indexStr] = id.split("_");
		const minorIndex = Number.parseInt(indexStr, 10);

		if (!userId || Number.isNaN(minorIndex)) {
			return null;
		}

		const userSnap = await db
			.collection("users")
			.where("uid", "==", userId)
			.limit(1)
			.get();

		if (userSnap.empty) {
			return null;
		}

		const userDoc = userSnap.docs[0];
		const userData = userDoc.data();

		if (!userData.minors || !userData.minors[minorIndex]) {
			return null;
		}

		const minor = userData.minors[minorIndex];

		return {
			userDocId: userDoc.id,
			minorIndex,
			minor: {
				id,
				fullName: minor.fullName || `${minor.firstName || ""} ${minor.lastName || ""}`.trim(),
				firstName: minor.firstName,
				lastName: minor.lastName,
				birthDate: minor.birthDate,
				relationship: minor.relationship,
				eps: minor.eps,
				idType: minor.idType,
				idNumber: minor.idNumber,
			},
			parent: {
				id: userDoc.id,
				uid: userData.uid,
				fullName: userData.fullName,
				email: userData.email,
				phone: userData.phone,
			},
		};
	},

	/**
	 * Elimina un menor por ID compuesto (userId_index).
	 */
	async delete(id: string): Promise<{
		success: boolean;
		deletedMinor: { fullName: string };
	} | { error: string; status: number }> {
		const [userId, indexStr] = id.split("_");
		const minorIndex = Number.parseInt(indexStr, 10);

		if (!userId || Number.isNaN(minorIndex)) {
			return { error: "ID de menor inválido", status: 400 };
		}

		const userSnap = await db
			.collection("users")
			.where("uid", "==", userId)
			.limit(1)
			.get();

		if (userSnap.empty) {
			return { error: "Usuario padre no encontrado", status: 404 };
		}

		const userDoc = userSnap.docs[0];
		const userData = userDoc.data();

		if (!userData.minors || !userData.minors[minorIndex]) {
			return { error: "Menor no encontrado", status: 404 };
		}

		const deletedMinor = userData.minors[minorIndex];
		const updatedMinors = [...userData.minors];
		updatedMinors.splice(minorIndex, 1);

		await userDoc.ref.update({
			minors: updatedMinors,
			updatedAt: FieldValue.serverTimestamp(),
		});

		return {
			success: true,
			deletedMinor: {
				fullName:
					deletedMinor.fullName ||
					`${deletedMinor.firstName || ""} ${deletedMinor.lastName || ""}`.trim(),
			},
		};
	},
};
