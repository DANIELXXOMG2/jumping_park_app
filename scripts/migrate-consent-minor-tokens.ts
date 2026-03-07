#!/usr/bin/env bun
/**
 * ============================================================================
 * MIGRACIÓN: Agregar tokens de menores a consentimientos existentes
 * ============================================================================
 *
 * Este script actualiza los consentimientos existentes para incluir
 * los searchTokens de los menores, permitiendo búsqueda por nombre/cédula
 * de los participantes.
 *
 * Ejecutar con: bun run migrate:consent-minor-tokens
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
// UTILIDADES (copiadas de consentService)
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

function extractEmailTokens(email: string): string[] {
	if (!email) return [];

	const normalized = email.toLowerCase().trim();
	const tokens = new Set<string>();

	tokens.add(normalized);

	const localPart = normalized.split("@")[0];
	if (localPart) {
		tokens.add(localPart);
		localPart.split(/[._-]/).forEach((part) => {
			if (part.length > 2) tokens.add(part);
		});
	}

	return Array.from(tokens);
}

interface Minor {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	idNumber?: string;
}

interface AdultSnapshot {
	fullName?: string;
	email?: string;
}

function buildConsentSearchTokens(
	fullName: string,
	email: string,
	consecutivo: number,
	minors: Minor[]
): string[] {
	const nameTokens = generateSearchTokens(fullName);
	const emailTokens = extractEmailTokens(email);
	const allTokens = new Set<string>([...nameTokens, ...emailTokens]);

	allTokens.add(consecutivo.toString());

	for (const minor of minors) {
		if (minor.fullName) {
			const minorTokens = generateSearchTokens(minor.fullName);
			minorTokens.forEach((token) => allTokens.add(token));
		}

		if (minor.idNumber) {
			allTokens.add(minor.idNumber);
		}

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
// MIGRACIÓN
// ============================================================================

async function migrateConsentMinorTokens(): Promise<{
	processed: number;
	updated: number;
	skipped: number;
	errors: number;
}> {
	console.log("📝 Migrando consentimientos para agregar tokens de menores...\n");

	let processed = 0;
	let updated = 0;
	let skipped = 0;
	let errors = 0;

	const BATCH_SIZE = 500;
	let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

	while (true) {
		let query = db.collection("consents").orderBy("createdAt", "desc").limit(BATCH_SIZE);

		if (lastDoc) {
			query = query.startAfter(lastDoc);
		}

		const snapshot = await query.get();
		if (snapshot.empty) break;

		console.log(`📦 Procesando lote de ${snapshot.size} consentimientos...`);

		const batch = db.batch();
		let batchCount = 0;

		for (const doc of snapshot.docs) {
			processed++;
			const data = doc.data();

			try {
				const adultSnapshot = (data.adultSnapshot as AdultSnapshot) || {};
				const minorsSnapshot = (data.minorsSnapshot as Minor[]) || [];
				const consecutivo = data.consecutivo as number;

				// Generar nuevos tokens incluyendo menores
				const newSearchTokens = buildConsentSearchTokens(
					adultSnapshot.fullName || "",
					adultSnapshot.email || "",
					consecutivo,
					minorsSnapshot
				);

				const existingTokens = data.searchTokens as string[] || [];

				// Verificar si necesita actualización
				const needsUpdate =
					!data.searchTokens ||
					!data.adultNameLower ||
					newSearchTokens.length !== existingTokens.length ||
					!newSearchTokens.every((t) => existingTokens.includes(t));

				if (needsUpdate) {
					batch.update(doc.ref, {
						searchTokens: newSearchTokens,
						adultNameLower: (adultSnapshot.fullName || "").toLowerCase(),
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
			console.log(`   ✓ ${batchCount} consentimientos actualizados`);
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
	console.log("║  🔍 MIGRACIÓN: Tokens de menores en consentimientos          ║");
	console.log("╚═══════════════════════════════════════════════════════════════╝");
	console.log("\nEste script agrega searchTokens de menores a consentimientos");
	console.log("existentes para permitir búsqueda por nombre/cédula de participantes.\n");

	const startTime = Date.now();

	try {
		const result = await migrateConsentMinorTokens();

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
