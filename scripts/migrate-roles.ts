#!/usr/bin/env bun
/**
 * ============================================================================
 * MIGRATE ROLES - Migración de roles a Firestore
 * ============================================================================
 *
 * Migra los roles existentes (hardcodeados en auth.ts) a la colección
 * 'roles' de Firestore para habilitar la gestión dinámica de roles.
 *
 * Ejecutar con: bun run scripts/migrate-roles.ts
 *
 * Este script:
 * - Crea la colección 'roles' si no existe
 * - Inserta los roles 'admin', 'cashier' y 'visitor' con sus permisos actuales
 * - Marca 'admin', 'cashier' y 'visitor' como roles de sistema
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ============================================================================
// DATOS DE ROLES A MIGRAR (de src/types/auth.ts)
// ============================================================================

const ROLES_TO_MIGRATE = [
	{
		name: "admin",
		displayName: "Administrador",
		description: "Acceso completo al panel de administración. Puede gestionar usuarios, roles, configuración y ver todas las estadísticas.",
		permissions: [
			"dashboard:view",
			"users:view",
			"users:create",
			"users:edit",
			"users:delete",
			"consents:view",
			"consents:export",
			"minors:view",
			"minors:edit",
			"statistics:view",
			"settings:manage",
			"roles:manage",
		],
		isSystem: true,
	},
	{
		name: "cashier",
		displayName: "Cajero",
		description: "Acceso limitado para personal de caja. Puede ver reportes, usuarios y gestionar ingresos básicos.",
		permissions: [
			"dashboard:view",
			"users:view",
			"consents:view",
			"minors:view",
			"statistics:view",
		],
		isSystem: true,
	},
	{
		name: "visitor",
		displayName: "Visitante",
		description: "Usuario final del kiosco. Solo puede firmar consentimientos para sí mismo y sus menores a cargo.",
		permissions: [
			"kiosk:access",
			"consent:sign",
		],
		isSystem: true,
	},
];

// ============================================================================
// INICIALIZACIÓN FIREBASE ADMIN
// ============================================================================

function initFirebase() {
	if (getApps().length === 0) {
		const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

		if (serviceAccountJson) {
			const serviceAccount = JSON.parse(serviceAccountJson);
			initializeApp({
				credential: cert(serviceAccount),
			});
			console.log("🔑 Usando Service Account Key");
		} else {
			// Intentar con variables de entorno individuales
			const projectId = process.env.FIREBASE_PROJECT_ID;
			const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
			const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
			const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");

			if (projectId && clientEmail && privateKey) {
				initializeApp({
					credential: cert({ projectId, clientEmail, privateKey }),
				});
				console.log("🔑 Usando variables de entorno individuales");
			} else if (process.env.FIRESTORE_EMULATOR_HOST) {
				initializeApp({ projectId: "jumping-park-demo" });
				console.log("🧪 Conectando a Firestore Emulator en", process.env.FIRESTORE_EMULATOR_HOST);
			} else {
				console.error("❌ No se encontraron credenciales de Firebase.");
				console.log("   Configura FIREBASE_SERVICE_ACCOUNT_KEY o las variables individuales:");
				console.log("   - FIREBASE_PROJECT_ID");
				console.log("   - FIREBASE_CLIENT_EMAIL");
				console.log("   - FIREBASE_PRIVATE_KEY");
				console.log("   O usa FIRESTORE_EMULATOR_HOST para el emulador");
				process.exit(1);
			}
		}
	}

	return getFirestore();
}

// ============================================================================
// MIGRACIÓN
// ============================================================================

async function migrateRoles() {
	console.log("🚀 Iniciando migración de roles a Firestore...\n");

	const db = initFirebase();
	const rolesCollection = db.collection("roles");

	let created = 0;
	let skipped = 0;
	let errors = 0;

	for (const role of ROLES_TO_MIGRATE) {
		try {
			// Verificar si el rol ya existe
			const existingRole = await rolesCollection.doc(role.name).get();

			if (existingRole.exists) {
				console.log(`⏭️  Rol '${role.name}' ya existe - Omitiendo`);
				skipped++;
				continue;
			}

			// Crear el rol
			await rolesCollection.doc(role.name).set({
				name: role.name,
				displayName: role.displayName,
				description: role.description,
				permissions: role.permissions,
				isSystem: role.isSystem,
				createdAt: FieldValue.serverTimestamp(),
				updatedAt: FieldValue.serverTimestamp(),
				createdBy: "migration-script",
			});

			console.log(`✅ Rol '${role.name}' creado con ${role.permissions.length} permisos`);
			created++;
		} catch (error) {
			console.error(`❌ Error al crear rol '${role.name}':`, error);
			errors++;
		}
	}

	console.log("\n📊 Resumen de migración:");
	console.log(`   - Roles creados: ${created}`);
	console.log(`   - Roles omitidos (ya existían): ${skipped}`);
	console.log(`   - Errores: ${errors}`);

	if (errors === 0) {
		console.log("\n✅ Migración completada exitosamente!");
	} else {
		console.log("\n⚠️  Migración completada con errores.");
	}
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

migrateRoles()
	.then(() => {
		console.log("\n👋 Proceso finalizado.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Error fatal durante la migración:", error);
		process.exit(1);
	});
