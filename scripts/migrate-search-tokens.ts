#!/usr/bin/env bun
/**
 * ============================================================================
 * MIGRACIÓN: Agregar campos de búsqueda optimizados
 * ============================================================================
 *
 * Agrega searchTokens a las colecciones users, minors_index y consents
 * para habilitar búsquedas eficientes por nombre.
 *
 * Ejecutar con: bun run scripts/migrate-search-tokens.ts
 */

import { config } from "dotenv";
config(); // Cargar .env

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
// UTILIDADES
// ============================================================================

/**
 * Genera tokens de búsqueda a partir de un nombre completo
 * "Maria Jose Rojas" → ["maria", "jose", "rojas", "mariajose", "joserojas"]
 */
function generateSearchTokens(fullName: string): string[] {
	if (!fullName) return [];

	const normalized = fullName.toLowerCase().trim();
	const words = normalized.split(/\s+/).filter(w => w.length > 0);

	if (words.length === 0) return [];

	const tokens = new Set<string>();

	// Palabras individuales
	words.forEach(word => tokens.add(word));

	// Combinaciones de 2 palabras consecutivas
	for (let i = 0; i < words.length - 1; i++) {
		tokens.add(words[i] + words[i + 1]);
	}

	// Combinación de todas las palabras (nombre completo sin espacios)
	if (words.length > 2) {
		tokens.add(words.join(""));
	}

	return Array.from(tokens);
}

/**
 * Extrae dominio del email para búsqueda
 */
function extractEmailTokens(email: string): string[] {
	if (!email) return [];

	const normalized = email.toLowerCase().trim();
	const tokens = new Set<string>();

	// Email completo
	tokens.add(normalized);

	// Parte local (antes del @)
	const localPart = normalized.split("@")[0];
	if (localPart) {
		tokens.add(localPart);

		// Si tiene puntos o guiones, también agregar partes individuales
		localPart.split(/[._-]/).forEach(part => {
			if (part.length > 2) tokens.add(part);
		});
	}

	return Array.from(tokens);
}

// ============================================================================
// MIGRACIÓN DE USERS
// ============================================================================

async function migrateUsers(): Promise<{ processed: number; updated: number; errors: number }> {
	console.log("\n👥 Migrando colección 'users'...");

	let processed = 0;
	let updated = 0;
	let errors = 0;

	const BATCH_SIZE = 500; // Firestore batch limit
	let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

	while (true) {
		let query = db.collection("users").orderBy("createdAt", "desc").limit(BATCH_SIZE);

		if (lastDoc) {
			query = query.startAfter(lastDoc);
		}

		const snapshot = await query.get();
		if (snapshot.empty) break;

		const batch = db.batch();
		let batchCount = 0;

		for (const doc of snapshot.docs) {
			processed++;
			const data = doc.data();

			try {
				// Generar tokens del nombre
				const nameTokens = generateSearchTokens(data.fullName);

				// Generar tokens del email
				const emailTokens = extractEmailTokens(data.email);

				// Combinar todos los tokens
				const allTokens = [...new Set([...nameTokens, ...emailTokens])];

				if (allTokens.length > 0) {
					batch.update(doc.ref, {
						searchTokens: allTokens,
						updatedAt: FieldValue.serverTimestamp(),
					});
					batchCount++;
					updated++;
				}
			} catch (err) {
				errors++;
				console.error(`   ❌ Error en ${doc.id}:`, err);
			}
		}

		if (batchCount > 0) {
			await batch.commit();
			console.log(`   ✓ Lote de ${batchCount} usuarios actualizado`);
		}

		lastDoc = snapshot.docs[snapshot.docs.length - 1];

		if (snapshot.size < BATCH_SIZE) break;
	}

	console.log(`   ✅ Usuarios: ${processed} procesados, ${updated} actualizados, ${errors} errores`);
	return { processed, updated, errors };
}

// ============================================================================
// MIGRACIÓN DE MINORS_INDEX
// ============================================================================

async function migrateMinorsIndex(): Promise<{ processed: number; updated: number; errors: number }> {
	console.log("\n👶 Migrando colección 'minors_index'...");

	let processed = 0;
	let updated = 0;
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

		const batch = db.batch();
		let batchCount = 0;

		for (const doc of snapshot.docs) {
			processed++;
			const data = doc.data();

			try {
				// Tokens del nombre del menor
				const minorNameTokens = generateSearchTokens(data.fullName);

				// Tokens del nombre del padre
				const parentNameTokens = generateSearchTokens(data.parentName);

				// Combinar
				const allTokens = [...new Set([...minorNameTokens, ...parentNameTokens])];

				if (allTokens.length > 0) {
					batch.update(doc.ref, {
						searchTokens: allTokens,
						updatedAt: FieldValue.serverTimestamp(),
					});
					batchCount++;
					updated++;
				}
			} catch (err) {
				errors++;
				console.error(`   ❌ Error en ${doc.id}:`, err);
			}
		}

		if (batchCount > 0) {
			await batch.commit();
			console.log(`   ✓ Lote de ${batchCount} menores actualizado`);
		}

		lastDoc = snapshot.docs[snapshot.docs.length - 1];

		if (snapshot.size < BATCH_SIZE) break;
	}

	console.log(`   ✅ Menores: ${processed} procesados, ${updated} actualizados, ${errors} errores`);
	return { processed, updated, errors };
}

// ============================================================================
// MIGRACIÓN DE CONSENTS
// ============================================================================

async function migrateConsents(): Promise<{ processed: number; updated: number; errors: number }> {
	console.log("\n📝 Migrando colección 'consents'...");

	let processed = 0;
	let updated = 0;
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

		const batch = db.batch();
		let batchCount = 0;

		for (const doc of snapshot.docs) {
			processed++;
			const data = doc.data();

			try {
				const adultSnapshot = data.adultSnapshot || {};

				// Tokens del nombre del adulto
				const nameTokens = generateSearchTokens(adultSnapshot.fullName);

				// Tokens del email
				const emailTokens = extractEmailTokens(adultSnapshot.email);

				// Agregar consecutivo como token (para buscar #1047)
				const consecutivoToken = data.consecutivo?.toString();

				const allTokens = [...new Set([...nameTokens, ...emailTokens])];
				if (consecutivoToken) allTokens.push(consecutivoToken);

				// Nombre en minúsculas para búsqueda por prefijo
				const adultNameLower = adultSnapshot.fullName?.toLowerCase() || "";

				if (allTokens.length > 0 || adultNameLower) {
					const updateData: Record<string, unknown> = {
						updatedAt: FieldValue.serverTimestamp(),
					};

					if (allTokens.length > 0) updateData.searchTokens = allTokens;
					if (adultNameLower) updateData.adultNameLower = adultNameLower;

					batch.update(doc.ref, updateData);
					batchCount++;
					updated++;
				}
			} catch (err) {
				errors++;
				console.error(`   ❌ Error en ${doc.id}:`, err);
			}
		}

		if (batchCount > 0) {
			await batch.commit();
			console.log(`   ✓ Lote de ${batchCount} consentimientos actualizado`);
		}

		lastDoc = snapshot.docs[snapshot.docs.length - 1];

		if (snapshot.size < BATCH_SIZE) break;
	}

	console.log(`   ✅ Consentimientos: ${processed} procesados, ${updated} actualizados, ${errors} errores`);
	return { processed, updated, errors };
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
	console.log("╔═══════════════════════════════════════════════════════════════╗");
	console.log("║  🔍 MIGRACIÓN: Campos de búsqueda optimizados                 ║");
	console.log("╚═══════════════════════════════════════════════════════════════╝");
	console.log("\nEste script agrega 'searchTokens' a users, minors_index y consents");
	console.log("para habilitar búsquedas eficientes.\n");

	const startTime = Date.now();

	try {
		// Migrar en orden
		const usersResult = await migrateUsers();
		const minorsResult = await migrateMinorsIndex();
		const consentsResult = await migrateConsents();

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);

		console.log("\n" + "=".repeat(65));
		console.log("✅ MIGRACIÓN COMPLETADA");
		console.log("=".repeat(65));
		console.log(`\n📊 Resumen:`);
		console.log(`   👥 Usuarios:        ${usersResult.processed} procesados, ${usersResult.updated} actualizados`);
		console.log(`   👶 Menores:         ${minorsResult.processed} procesados, ${minorsResult.updated} actualizados`);
		console.log(`   📝 Consentimientos: ${consentsResult.processed} procesados, ${consentsResult.updated} actualizados`);
		console.log(`\n⏱️  Duración: ${duration}s`);

		const totalErrors = usersResult.errors + minorsResult.errors + consentsResult.errors;
		if (totalErrors > 0) {
			console.log(`\n⚠️  Errores totales: ${totalErrors}`);
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Error durante la migración:", error);
		process.exit(1);
	}
}

main();
