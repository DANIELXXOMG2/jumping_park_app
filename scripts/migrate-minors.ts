/**
 * Script de migración de menores a la colección optimizada minors_index.
 * 
 * Ejecutar con: bun run scripts/migrate-minors.ts
 * 
 * IMPORTANTE: Asegúrate de tener las variables de entorno configuradas en .env
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
		console.error("   Asegúrate de tener FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env");
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

const MINORS_INDEX_COLLECTION = "minors_index";
const COUNTERS_COLLECTION = "_counters";

interface Minor {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	birthDate: string;
	relationship: string;
	eps?: string;
	idType?: string;
	idNumber?: string;
	medicalCondition?: string;
}

interface UserProfile {
	uid: string;
	fullName: string;
	email: string;
	phone: string;
	minors: Minor[];
}

async function migrateMinors() {
	console.log("🚀 Iniciando migración de menores a minors_index...\n");

	const errors: string[] = [];
	let usersProcessed = 0;
	let minorsMigrated = 0;
	let minorsSkipped = 0;

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

		if (usersSnap.empty) {
			console.log("   No hay más usuarios para procesar.");
			break;
		}

		console.log(`📦 Procesando lote de ${usersSnap.size} usuarios...`);

		for (const userDoc of usersSnap.docs) {
			const userData = userDoc.data() as UserProfile;
			usersProcessed++;

			if (!userData.minors || userData.minors.length === 0) {
				continue;
			}

			const batch = db.batch();
			let batchCount = 0;

			for (const minor of userData.minors) {
				// Solo sincronizar menores con idNumber (clave única)
				if (!minor.idNumber) {
					minorsSkipped++;
					errors.push(`⚠️ Menor sin idNumber: ${minor.fullName || "sin nombre"} (padre: ${userData.uid})`);
					continue;
				}

				const docRef = db.collection(MINORS_INDEX_COLLECTION).doc(minor.idNumber);
				const fullName =
					minor.fullName ||
					`${minor.firstName || ""} ${minor.lastName || ""}`.trim() ||
					"Sin nombre";

				const minorDoc = {
					fullName,
					firstName: minor.firstName || null,
					lastName: minor.lastName || null,
					birthDate: minor.birthDate,
					relationship: minor.relationship,
					eps: minor.eps || null,
					idType: minor.idType || null,
					idNumber: minor.idNumber,
					medicalCondition: minor.medicalCondition || null,
					parentId: userData.uid,
					parentName: userData.fullName,
					parentEmail: userData.email,
					parentPhone: userData.phone,
					fullNameLower: fullName.toLowerCase(),
					createdAt: FieldValue.serverTimestamp(),
					updatedAt: FieldValue.serverTimestamp(),
				};

				batch.set(docRef, minorDoc, { merge: true });
				batchCount++;
				minorsMigrated++;
			}

			if (batchCount > 0) {
				await batch.commit();
			}
		}

		lastDoc = usersSnap.docs[usersSnap.docs.length - 1];

		// Si obtuvimos menos del batch size, terminamos
		if (usersSnap.size < BATCH_SIZE) {
			break;
		}
	}

	// Actualizar contador
	const countSnap = await db.collection(MINORS_INDEX_COLLECTION).count().get();
	const totalCount = countSnap.data().count;

	await db.collection(COUNTERS_COLLECTION).doc("minors_index").set({
		count: totalCount,
		updatedAt: FieldValue.serverTimestamp(),
	});

	console.log("\n" + "=".repeat(50));
	console.log("✅ MIGRACIÓN COMPLETADA");
	console.log("=".repeat(50));
	console.log(`📊 Estadísticas:`);
	console.log(`   - Usuarios procesados: ${usersProcessed}`);
	console.log(`   - Menores migrados: ${minorsMigrated}`);
	console.log(`   - Menores omitidos (sin idNumber): ${minorsSkipped}`);
	console.log(`   - Total en minors_index: ${totalCount}`);

	if (errors.length > 0) {
		console.log(`\n⚠️ Advertencias (${errors.length}):`);
		errors.slice(0, 20).forEach((e) => console.log(`   ${e}`));
		if (errors.length > 20) {
			console.log(`   ... y ${errors.length - 20} más`);
		}
	}

	console.log("\n🎉 Listo! Los nuevos consentimientos sincronizarán automáticamente.");
}

// Ejecutar
migrateMinors()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Error durante la migración:", error);
		process.exit(1);
	});
