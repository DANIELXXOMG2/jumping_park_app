#!/usr/bin/env bun
/**
 * ============================================================================
 * MIGRACIÓN: Regenerar searchTokens para menores en minors_index
 * ============================================================================
 *
 * Este script actualiza todos los documentos en minors_index para asegurar
 * que tengan los searchTokens correctamente generados.
 *
 * Ejecutar con: bun run migrate:minor-search-tokens
 */

import { config } from "dotenv";
config();

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Inicializar Firebase Admin
if (getApps().length === 0) {
	const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

	if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
		console.error("❌ Error: Faltan variables de entorno de Firebase");
		process.exit(1);
	}

	initializeApp({
		credential: cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: privateKey,
		}),
	});
}

const db = getFirestore();

// ============================================================================
// UTILIDADES (copiadas de minorIndexService)
// ============================================================================

function generateSearchTokens(fullName: string): string[] {
	if (!fullName) return [];

	const normalized = fullName.toLowerCase().trim();
	const words = normalized.split(/\s+/).filter((w) => w.length > 0);

	if (words.length === 0) return [];

	const tokens = new Set<string>();

	words.forEach((word) => tokens.add(word));

	for (let i = 0; i < words.length - 1; i++) {
		tokens.add(words[i] + words[i + 1]);
	}

	if (words.length > 2) {
		tokens.add(words.join(""));
	}

	return Array.from(tokens);
}

function buildMinorSearchTokens(minorName: string, parentName: string): string[] {
	const minorTokens = generateSearchTokens(minorName);
	const parentTokens = generateSearchTokens(parentName);
	return [...new Set([...minorTokens, ...parentTokens])];
}

// ============================================================================
// MIGRACIÓN
// ============================================================================

async function migrateMinorSearchTokens(): Promise<{
	processed: number;
	updated: number;
	skipped: number;
	errors: number;
}> {
	console.log("🔄 Regenerando searchTokens para menores...\n");

	let processed = 0;
	let updated = 0;
	let skipped = 0;
	let errors = 0;

	const BATCH_SIZE = 500;
	let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

	while (true) {
		let query = db.collection("minors_index").orderBy("createdAt", "desc").limit(BATCH_SIZE);

		if (lastDoc) {
			query = query.startAfter(lastDoc);
		}

		const snapshot = await query.get();
		if (snapshot.empty) break;

		console.log(`📦 Procesando lote de ${snapshot.size} menores...`);

		const batch = db.batch();
		let batchCount = 0;

		for (const doc of snapshot.docs) {
			processed++;
			const data = doc.data();

			try {
				const fullName = data.fullName || "Sin nombre";
				const parentName = data.parentName || "";

				// Generar nuevos tokens
				const newSearchTokens = buildMinorSearchTokens(fullName, parentName);
				const existingTokens = data.searchTokens || [];

				// Verificar si necesita actualización
				const needsUpdate =
					!data.searchTokens ||
					!data.fullNameLower ||
					newSearchTokens.length !== existingTokens.length ||
					!newSearchTokens.every((t) => existingTokens.includes(t));

				if (needsUpdate) {
					batch.update(doc.ref, {
						searchTokens: newSearchTokens,
						fullNameLower: fullName.toLowerCase(),
						updatedAt: FieldValue.serverTimestamp(),
					});
					batchCount++;
					updated++;
				} else {
					skipped++;
				}
			} catch (err) {
				errors++;
				console.error(`   ❌ Error en ${doc.id}:`, err);
			}
		}

		if (batchCount > 0) {
			await batch.commit();
			console.log(`   ✓ ${batchCount} menores actualizados`);
		}

		lastDoc = snapshot.docs[snapshot.docs.length - 1];

		if (snapshot.size < BATCH_SIZE) break;
	}

	return { processed, updated, skipped, errors };
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
	console.log("╔═══════════════════════════════════════════════════════════════╗");
	console.log("║  🔍 MIGRACIÓN: Regenerar searchTokens de menores             ║");
	console.log("╚═══════════════════════════════════════════════════════════════╝");
	console.log("\nEste script actualiza los tokens de búsqueda de todos los menores");
	console.log("para asegurar que la búsqueda por nombre funcione correctamente.\n");

	const startTime = Date.now();

	try {
		const result = await migrateMinorSearchTokens();

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);

		console.log("\n" + "=".repeat(65));
		console.log("✅ MIGRACIÓN COMPLETADA");
		console.log("=".repeat(65));
		console.log(`\n📊 Estadísticas:`);
		console.log(`   - Procesados: ${result.processed}`);
		console.log(`   - Actualizados: ${result.updated}`);
		console.log(`   - Sin cambios: ${result.skipped}`);
		console.log(`   - Errores: ${result.errors}`);
		console.log(`\n⏱️  Duración: ${duration}s`);

		if (result.errors > 0) {
			console.log(`\n⚠️  Hubo ${result.errors} errores durante la migración`);
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Error durante la migración:", error);
		process.exit(1);
	}
}

main();
