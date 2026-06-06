#!/usr/bin/env bun
/**
 * ============================================================================
 * BACKUP - Exporta colecciones críticas de Firestore a JSON
 * ============================================================================
 *
 * Ejecutar con: bun run backup
 *
 * Crea archivos JSON con timestamp en la carpeta backups/
 * - backups/users_2024-01-15_143022.json
 * - backups/minors_index_2024-01-15_143022.json
 * - backups/consents_2024-01-15_143022.json
 */

import { initFirebaseAdmin } from "./lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Inicializar Firebase Admin mediante la lib compartida
const app = initFirebaseAdmin();
const db = getFirestore(app);

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BACKUP_DIR = "backups";
const COLLECTIONS = ["users", "minors_index", "consents"];

// Crear carpeta de backups si no existe
if (!existsSync(BACKUP_DIR)) {
	mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generar timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

// ============================================================================
// FUNCIONES
// ============================================================================

async function backupCollection(collectionName: string): Promise<{ count: number; file: string }> {
	console.log(`\n📦 Respaldando colección '${collectionName}'...`);

	const snapshot = await db.collection(collectionName).get();
	const docs: Array<{ id: string; data: unknown }> = [];

	snapshot.forEach((doc) => {
		docs.push({
			id: doc.id,
			data: doc.data(),
		});
	});

	const backup = {
		collection: collectionName,
		exportedAt: now.toISOString(),
		count: docs.length,
		docs,
	};

	const filename = `${collectionName}_${timestamp}.json`;
	const filepath = join(BACKUP_DIR, filename);

	writeFileSync(filepath, JSON.stringify(backup, null, 2));

	console.log(`   ✅ ${docs.length} documentos guardados en ${filename}`);

	return { count: docs.length, file: filename };
}

async function backupMetadata(): Promise<void> {
	console.log(`\n📋 Respaldando metadatos...`);

	const metadata = {
		exportedAt: now.toISOString(),
		projectId: process.env.FIREBASE_PROJECT_ID,
		collections: COLLECTIONS,
		version: "1.0",
	};

	const filename = `metadata_${timestamp}.json`;
	const filepath = join(BACKUP_DIR, filename);

	writeFileSync(filepath, JSON.stringify(metadata, null, 2));

	console.log(`   ✅ Metadatos guardados en ${filename}`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
	console.log("╔═══════════════════════════════════════════════════════════════╗");
	console.log("║  💾 BACKUP - Exportación de Firestore                         ║");
	console.log("╚═══════════════════════════════════════════════════════════════╝");
	console.log(`\n📁 Directorio: ${BACKUP_DIR}/`);
	console.log(`🕐 Timestamp: ${timestamp}`);

	const results: Array<{ collection: string; count: number; file: string }> = [];

	try {
		for (const collection of COLLECTIONS) {
			const result = await backupCollection(collection);
			results.push({ collection, ...result });
		}

		await backupMetadata();

		console.log("\n" + "=".repeat(65));
		console.log("✅ BACKUP COMPLETADO EXITOSAMENTE");
		console.log("=".repeat(65));
		console.log("\n📊 Resumen:");
		results.forEach((r) => {
			console.log(`   • ${r.collection}: ${r.count} documentos → ${r.file}`);
		});
		console.log(`\n💡 Para restaurar (no implementado aún):`);
		console.log(`   Los archivos están en: ${BACKUP_DIR}/`);

	} catch (error) {
		console.error("\n❌ Error durante el backup:", error);
		process.exit(1);
	}
}

main();
