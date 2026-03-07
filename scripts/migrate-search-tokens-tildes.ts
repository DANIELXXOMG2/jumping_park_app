#!/usr/bin/env bun
/**
 * ============================================================================
 * MIGRACIÓN: Regenerar searchTokens con normalización de tildes
 * ============================================================================
 *
 * Este script actualiza todos los documentos en consents y minors_index
 * para generar searchTokens sin tildes (acentos), permitiendo búsqueda
 * que funcione con o sin tildes.
 *
 * Ejemplo: "María José" genera tokens: ["maria", "jose", "mariajose"]
 *
 * Ejecutar con: bun run migrate:search-tokens-tildes
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
// UTILIDADES (con normalización de tildes)
// ============================================================================

/**
 * Normaliza un texto quitando tildes y convirtiendo a minúsculas.
 */
function normalizeText(text: string): string {
	if (!text) return "";
	return text
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Genera tokens de búsqueda a partir de un nombre completo.
 */
function generateSearchTokens(fullName: string): string[] {
	if (!fullName) return [];

	const normalized = normalizeText(fullName);
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

/**
 * Extrae tokens del email para búsqueda.
 */
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

/**
 * Combina tokens de menor y padre.
 */
function buildMinorSearchTokens(minorName: string, parentName: string): string[] {
	const minorTokens = generateSearchTokens(minorName);
	const parentTokens = generateSearchTokens(parentName);
	return [...new Set([...minorTokens, ...parentTokens])];
}

/**
 * Construye tokens de búsqueda para consentimientos.
 */
function buildConsentSearchTokens(
	fullName: string,
	email: string,
	consecutivo: number,
	minors: { fullName?: string; idNumber?: string; firstName?: string; lastName?: string }[]
): string[] {
	const nameTokens = generateSearchTokens(fullName);
	const emailTokens = extractEmailTokens(email);
	const allTokens = new Set<string>([...nameTokens, ...emailTokens]);

	allTokens.add(consecutivo.toString());

	for (const minor of minors || []) {
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
// MIGRACIÓN DE CONSENTIMIENTOS
// ============================================================================

async function migrateConsentTokens(): Promise<{
	processed: number;
	updated: number;
	skipped: number;
	errors: number;
}> {
	console.log("📝 Migrando tokens de consentimientos...\n");

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
				const adultSnapshot = data.adultSnapshot || {};
				const minorsSnapshot = data.minorsSnapshot || [];
				const consecutivo = data.consecutivo as number;

				const newSearchTokens = buildConsentSearchTokens(
					adultSnapshot.fullName || "",
					adultSnapshot.email || "",
					consecutivo,
					minorsSnapshot
				);

				const existingTokens = data.searchTokens as string[] || [];

				const needsUpdate =
					!data.searchTokens ||
					!data.adultNameLower ||
					newSearchTokens.length !== existingTokens.length ||
					!newSearchTokens.every((t) => existingTokens.includes(t));

				if (needsUpdate) {
					batch.update(doc.ref, {
						searchTokens: newSearchTokens,
						adultNameLower: normalizeText(adultSnapshot.fullName || ""),
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
// MIGRACIÓN DE MENORES
// ============================================================================

async function migrateMinorTokens(): Promise<{
	processed: number;
	updated: number;
	skipped: number;
	errors: number;
}> {
	console.log("\n👶 Migrando tokens de menores...\n");

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

				const newSearchTokens = buildMinorSearchTokens(fullName, parentName);
				const existingTokens = data.searchTokens as string[] || [];

				const needsUpdate =
					!data.searchTokens ||
					!data.fullNameLower ||
					newSearchTokens.length !== existingTokens.length ||
					!newSearchTokens.every((t) => existingTokens.includes(t));

				if (needsUpdate) {
					batch.update(doc.ref, {
						searchTokens: newSearchTokens,
						fullNameLower: normalizeText(fullName),
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
	console.log("║  🔤 MIGRACIÓN: Normalización de tildes en searchTokens       ║");
	console.log("╚═══════════════════════════════════════════════════════════════╝");
	console.log("\nEste script regenera los tokens de búsqueda sin tildes (acentos),");
	console.log("permitiendo buscar 'Maria Jose' y encontrar 'María José'.\n");

	const startTime = Date.now();

	try {
		// Migrar consentimientos
		const consentResult = await migrateConsentTokens();

		// Migrar menores
		const minorResult = await migrateMinorTokens();

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);

		console.log("\n" + "=".repeat(65));
		console.log("✅ MIGRACIÓN COMPLETADA");
		console.log("=".repeat(65));
		console.log(`\n📊 Consentimientos:`);
		console.log(`   - Procesados: ${consentResult.processed}`);
		console.log(`   - Actualizados: ${consentResult.updated}`);
		console.log(`   - Sin cambios: ${consentResult.skipped}`);
		console.log(`   - Errores: ${consentResult.errors}`);
		console.log(`\n📊 Menores:`);
		console.log(`   - Procesados: ${minorResult.processed}`);
		console.log(`   - Actualizados: ${minorResult.updated}`);
		console.log(`   - Sin cambios: ${minorResult.skipped}`);
		console.log(`   - Errores: ${minorResult.errors}`);
		console.log(`\n⏱️  Duración: ${duration}s`);

		const totalErrors = consentResult.errors + minorResult.errors;
		if (totalErrors > 0) {
			console.log(`\n⚠️  Hubo ${totalErrors} errores durante la migración`);
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Error durante la migración:", error);
		process.exit(1);
	}
}

main();
