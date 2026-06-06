#!/usr/bin/env bun
/**
 * ============================================================================
 * SEED DATABASE - Datos de prueba para Jumping Park
 * ============================================================================
 * 
 * Genera datos realistas para demostración y pruebas de carga.
 * 
 * Ejecutar con: bun run scripts/seed-database.ts
 * 
 * Datos generados:
 * - 50 usuarios con perfiles completos
 * - 100 consentimientos firmados históricos
 * - 20 sesiones OTP (activas e inactivas)
 */

import { faker } from "@faker-js/faker/locale/es_MX";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "./lib/firebase-admin";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  USERS_COUNT: 50,
  CONSENTS_COUNT: 100,
  OTP_SESSIONS_COUNT: 20,
  // Porcentaje de sesiones OTP que estarán activas
  OTP_ACTIVE_PERCENTAGE: 0.3,
};

// ============================================================================
// INICIALIZACIÓN FIREBASE ADMIN (vía lib compartida)
// ============================================================================

function initFirebase() {
  try {
    const app = initFirebaseAdmin();
    return getFirestore(app);
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════════════════╗
║  ⚠️  CREDENCIALES DE FIREBASE NO ENCONTRADAS                          ║
╠════════════════════════════════════════════════════════════════════════╣
║  Para ejecutar el seed, configura las variables en .env:              ║
║                                                                        ║
║    FIREBASE_PROJECT_ID=tu-proyecto                                     ║
║    FIREBASE_CLIENT_EMAIL=tu-email@iam.gserviceaccount.com             ║
║    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."            ║
║                                                                        ║
║  O usa el emulador:                                                    ║
║    firebase emulators:start                                            ║
║    FIRESTORE_EMULATOR_HOST=localhost:8080 bun run seed                 ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }
}

// ============================================================================
// DATOS DE EPS (Copiados de epsColombiaData.ts para evitar imports complejos)
// ============================================================================

const EPS_VALUES = [
  "nueva_eps",
  "sanitas",
  "sura",
  "salud_total",
  "compensar",
  "famisanar",
  "comfenalco_valle",
  "coosalud",
  "mutual_ser",
  "asmet_salud",
  "emssanar",
  "sos",
  "capital_salud",
  "savia_salud",
  "cajacopi",
  "fuerzas_militares",
  "policia_nacional",
  "magisterio",
  "particular",
];

const ID_TYPES = ["rc", "ti", "cc", "ce", "pa", "ppt", "otro"] as const;
const RELATIONSHIPS = ["hijo", "sobrino", "nieto", "otro"] as const;

// ============================================================================
// GENERADORES DE DATOS
// ============================================================================

/**
 * Genera una cédula colombiana realista (8-10 dígitos)
 */
function generateCedula(): string {
  const length = faker.number.int({ min: 8, max: 10 });
  return faker.string.numeric(length);
}

/**
 * Genera una fecha de nacimiento válida para un menor (1-17 años)
 */
function generateMinorBirthDate(): string {
  const date = faker.date.birthdate({ min: 1, max: 17, mode: "age" });
  return date.toISOString().split("T")[0];
}

/**
 * Genera un código OTP de 6 dígitos
 */
function generateOtpCode(): string {
  return faker.string.numeric(6);
}

/**
 * Selecciona un valor aleatorio de un array
 */
function randomChoice<T>(arr: readonly T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

/**
 * Genera un menor con datos realistas
 */
function generateMinor(): {
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string;
  eps: string;
  idType: typeof ID_TYPES[number];
  idNumber: string;
  relationship: typeof RELATIONSHIPS[number];
  medicalCondition?: string;
} {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    birthDate: generateMinorBirthDate(),
    eps: randomChoice(EPS_VALUES),
    idType: randomChoice(ID_TYPES),
    idNumber: faker.string.numeric({ length: { min: 6, max: 12 } }),
    relationship: randomChoice(RELATIONSHIPS),
    // 20% de probabilidad de tener condición médica
    ...(faker.datatype.boolean({ probability: 0.2 }) && {
      medicalCondition: faker.helpers.arrayElement([
        "Alergia al polvo",
        "Asma leve",
        "Diabetes tipo 1",
        "Alergia a medicamentos",
        "Epilepsia controlada",
        "Ninguna",
      ]),
    }),
  };
}

/**
 * Genera un usuario completo con 0-3 menores
 */
function generateUser() {
  const uid = generateCedula();
  const minorsCount = faker.number.int({ min: 0, max: 3 });
  const minors = Array.from({ length: minorsCount }, generateMinor);
  
  const now = new Date();
  const createdAt = faker.date.past({ years: 2, refDate: now });
  const updatedAt = faker.date.between({ from: createdAt, to: now });

  return {
    uid,
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: `+57 ${faker.string.numeric(3)} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`,
    // Firestore no acepta undefined, usar null para campos opcionales vacíos
    address: faker.datatype.boolean({ probability: 0.7 })
      ? `${faker.location.streetAddress()}, ${faker.location.city()}`
      : null,
    minors,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(updatedAt),
  };
}

/**
 * Genera un consentimiento histórico firmado
 */
function generateConsent(users: ReturnType<typeof generateUser>[], consecutivo: number) {
  const user = randomChoice(users);
  
  // Fecha de firma en los últimos 6 meses
  const signedAt = faker.date.past({ years: 0.5 });
  // Válido por 1 año desde la firma
  const validUntil = new Date(signedAt);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  // Snapshot del usuario al momento de la firma
  const adultSnapshot = {
    uid: user.uid,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    minors: user.minors,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Seleccionar algunos menores para el consentimiento (puede ser todos o algunos)
  const minorsForConsent = user.minors.length > 0
    ? faker.helpers.arrayElements(user.minors, { min: 1, max: user.minors.length })
    : [];

  return {
    consecutivo,
    userId: user.uid,
    adultSnapshot,
    minorsSnapshot: minorsForConsent,
    // Firma simulada (base64 placeholder)
    signatureUrl: `gs://jumping-park.appspot.com/signatures/${user.uid}_${consecutivo}.png`,
    policyVersion: "v1.0.0",
    ipAddress: faker.internet.ipv4(),
    signedAt: Timestamp.fromDate(signedAt),
    validUntil: Timestamp.fromDate(validUntil),
    createdAt: Timestamp.fromDate(signedAt),
  };
}

/**
 * Genera una sesión OTP (activa o expirada)
 */
function generateOtpSession(users: ReturnType<typeof generateUser>[], isActive: boolean) {
  const user = randomChoice(users);
  
  const now = new Date();
  let validatedAt: Date;
  let expiresAt: Date;

  if (isActive) {
    // Sesión activa: validada en los últimos 10 minutos, expira en 5 minutos
    validatedAt = faker.date.recent({ days: 0, refDate: now });
    expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min en el futuro
  } else {
    // Sesión expirada: validada hace 1-7 días
    validatedAt = faker.date.past({ years: 0.02 }); // ~1 semana
    expiresAt = new Date(validatedAt.getTime() + 15 * 60 * 1000); // Expiró 15 min después
  }

  return {
    email: user.email,
    code: generateOtpCode(),
    expiresAt: Timestamp.fromDate(expiresAt),
    attempts: faker.number.int({ min: 0, max: 3 }),
    userId: user.uid,
    validatedAt: Timestamp.fromDate(validatedAt),
    createdAt: Timestamp.fromDate(validatedAt),
  };
}

// ============================================================================
// FUNCIONES DE INSERCIÓN
// ============================================================================

async function seedUsers(db: FirebaseFirestore.Firestore) {
  console.log(`\n📦 Generando ${CONFIG.USERS_COUNT} usuarios...`);
  
  const users: ReturnType<typeof generateUser>[] = [];
  const batch = db.batch();
  
  for (let i = 0; i < CONFIG.USERS_COUNT; i++) {
    const user = generateUser();
    users.push(user);
    
    const docRef = db.collection("users").doc(user.uid);
    batch.set(docRef, user);
    
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`  ✓ ${i + 1}/${CONFIG.USERS_COUNT} usuarios generados\r`);
    }
  }
  
  await batch.commit();
  console.log(`  ✅ ${CONFIG.USERS_COUNT} usuarios creados`);
  
  return users;
}

async function seedConsents(db: FirebaseFirestore.Firestore, users: ReturnType<typeof generateUser>[]) {
  console.log(`\n📝 Generando ${CONFIG.CONSENTS_COUNT} consentimientos...`);
  
  // Obtener el último consecutivo existente o empezar desde 1000
  const lastConsentSnap = await db.collection("consents")
    .orderBy("consecutivo", "desc")
    .limit(1)
    .get();
  
  let startConsecutivo = 1000;
  if (!lastConsentSnap.empty) {
    const lastConsent = lastConsentSnap.docs[0].data();
    startConsecutivo = (lastConsent.consecutivo || 999) + 1;
  }
  
  // Firestore batch tiene límite de 500 operaciones
  const BATCH_SIZE = 500;
  let totalCreated = 0;
  
  for (let batchStart = 0; batchStart < CONFIG.CONSENTS_COUNT; batchStart += BATCH_SIZE) {
    const batch = db.batch();
    const batchEnd = Math.min(batchStart + BATCH_SIZE, CONFIG.CONSENTS_COUNT);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const consecutivo = startConsecutivo + i;
      const consent = generateConsent(users, consecutivo);
      
      const docRef = db.collection("consents").doc();
      batch.set(docRef, { ...consent, id: docRef.id });
      
      totalCreated++;
      if (totalCreated % 20 === 0) {
        process.stdout.write(`  ✓ ${totalCreated}/${CONFIG.CONSENTS_COUNT} consentimientos generados\r`);
      }
    }
    
    await batch.commit();
  }
  
  console.log(`  ✅ ${CONFIG.CONSENTS_COUNT} consentimientos creados (consecutivos ${startConsecutivo} - ${startConsecutivo + CONFIG.CONSENTS_COUNT - 1})`);
}

async function seedOtpSessions(db: FirebaseFirestore.Firestore, users: ReturnType<typeof generateUser>[]) {
  console.log(`\n🔐 Generando ${CONFIG.OTP_SESSIONS_COUNT} sesiones OTP...`);
  
  const batch = db.batch();
  const activeCount = Math.floor(CONFIG.OTP_SESSIONS_COUNT * CONFIG.OTP_ACTIVE_PERCENTAGE);
  const inactiveCount = CONFIG.OTP_SESSIONS_COUNT - activeCount;
  
  // Sesiones activas
  for (let i = 0; i < activeCount; i++) {
    const session = generateOtpSession(users, true);
    const docRef = db.collection("otp_sessions").doc(session.email);
    batch.set(docRef, session);
  }
  
  // Sesiones expiradas
  for (let i = 0; i < inactiveCount; i++) {
    const session = generateOtpSession(users, false);
    // Usar email + timestamp para IDs únicos de sesiones expiradas
    const docRef = db.collection("otp_sessions").doc(`${session.email}_expired_${i}`);
    batch.set(docRef, session);
  }
  
  await batch.commit();
  console.log(`  ✅ ${CONFIG.OTP_SESSIONS_COUNT} sesiones OTP creadas (${activeCount} activas, ${inactiveCount} expiradas)`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║       🎢 JUMPING PARK - DATABASE SEEDER                       ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  
  console.log("\n⏳ Inicializando conexión con Firebase...");
  
  try {
    const db = initFirebase();
    console.log("✅ Conexión establecida");
    
    // Generar usuarios primero (otros dependen de ellos)
    const users = await seedUsers(db);
    
    // Generar consentimientos usando los usuarios
    await seedConsents(db, users);
    
    // Generar sesiones OTP
    await seedOtpSessions(db, users);
    
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║       ✅ SEED COMPLETADO EXITOSAMENTE                         ║");
    console.log("╠═══════════════════════════════════════════════════════════════╣");
    console.log(`║  👤 Usuarios:        ${CONFIG.USERS_COUNT.toString().padStart(5)}                                  ║`);
    console.log(`║  📝 Consentimientos: ${CONFIG.CONSENTS_COUNT.toString().padStart(5)}                                  ║`);
    console.log(`║  🔐 Sesiones OTP:    ${CONFIG.OTP_SESSIONS_COUNT.toString().padStart(5)}                                  ║`);
    console.log("╚═══════════════════════════════════════════════════════════════╝");
    
  } catch (error) {
    console.error("\n❌ Error durante el seed:", error);
    process.exit(1);
  }
}

// Ejecutar
main();
