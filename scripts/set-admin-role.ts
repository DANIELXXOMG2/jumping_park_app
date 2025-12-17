#!/usr/bin/env bun
/**
 * ============================================================================
 * SET ADMIN ROLE - Asignar rol de administrador a un usuario
 * ============================================================================
 * 
 * Este script asigna el rol 'admin' a un usuario existente en Firebase Auth.
 * 
 * Uso:
 *   bun run scripts/set-admin-role.ts <email> [role]
 * 
 * Ejemplos:
 *   bun run scripts/set-admin-role.ts admin@example.com
 *   bun run scripts/set-admin-role.ts cajero@example.com cashier
 * 
 * Roles disponibles: admin, cashier, visitor
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import type { UserRole } from "../src/types/auth";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const VALID_ROLES: UserRole[] = ['admin', 'cashier', 'visitor'];

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
      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
        console.log("🔑 Usando variables de entorno individuales");
      } else {
        console.error("❌ Error: No se encontraron credenciales de Firebase");
        console.error("   Configura FIREBASE_SERVICE_ACCOUNT_KEY o las variables individuales:");
        console.error("   - FIREBASE_PROJECT_ID");
        console.error("   - FIREBASE_CLIENT_EMAIL");
        console.error("   - FIREBASE_PRIVATE_KEY");
        process.exit(1);
      }
    }
  }

  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function setAdminRole(email: string, role: UserRole = 'admin') {
  console.log("\n🚀 Set Admin Role - Jumping Park");
  console.log("================================\n");

  const { db, auth } = initFirebase();

  try {
    // 1. Buscar usuario en Firebase Auth por email
    console.log(`📧 Buscando usuario con email: ${email}`);
    
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch {
      console.error(`❌ Usuario no encontrado: ${email}`);
      console.error("   El usuario debe existir en Firebase Auth antes de asignarle un rol.");
      console.error("   Opciones:");
      console.error("   1. El usuario debe iniciar sesión al menos una vez (ej. con Google)");
      console.error("   2. Crear el usuario manualmente en Firebase Console");
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.displayName || 'N/A'}`);

    // 2. Crear/Actualizar documento en colección admin_users
    console.log(`\n📝 Asignando rol '${role}' en Firestore...`);
    
    const adminUserRef = db.collection("admin_users").doc(user.uid);
    const adminUserDoc = await adminUserRef.get();

    const userData = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: role,
      updatedAt: Timestamp.now(),
    };

    if (adminUserDoc.exists) {
      await adminUserRef.update(userData);
      console.log(`✅ Documento actualizado en admin_users/${user.uid}`);
    } else {
      await adminUserRef.set({
        ...userData,
        createdAt: Timestamp.now(),
      });
      console.log(`✅ Documento creado en admin_users/${user.uid}`);
    }

    // 3. También establecer custom claim para compatibilidad con sistema anterior
    if (role === 'admin') {
      console.log("\n🔐 Estableciendo custom claim 'admin'...");
      await auth.setCustomUserClaims(user.uid, { admin: true });
      console.log("✅ Custom claim establecido");
    }

    // 4. Resumen final
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡Rol asignado exitosamente!");
    console.log("=".repeat(50));
    console.log(`\n   Usuario: ${user.email}`);
    console.log(`   Rol: ${role}`);
    console.log(`   UID: ${user.uid}`);
    console.log("\n⚠️  El usuario debe cerrar sesión y volver a iniciar");
    console.log("   para que los cambios surtan efecto.\n");

  } catch (error) {
    console.error("\n❌ Error al asignar rol:", error);
    process.exit(1);
  }
}

// ============================================================================
// VALIDACIÓN DE ARGUMENTOS Y EJECUCIÓN
// ============================================================================

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📖 Uso: bun run scripts/set-admin-role.ts <email> [role]

Argumentos:
  email   Email del usuario en Firebase Auth (requerido)
  role    Rol a asignar: admin | cashier | visitor (por defecto: admin)

Ejemplos:
  bun run scripts/set-admin-role.ts admin@example.com
  bun run scripts/set-admin-role.ts cajero@example.com cashier

Nota: El usuario debe existir en Firebase Auth antes de ejecutar este script.
`);
  process.exit(0);
}

const email = args[0];
const roleArg = args[1] as UserRole | undefined;
const role = roleArg || 'admin';

// Validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`❌ Email inválido: ${email}`);
  process.exit(1);
}

// Validar rol
if (!VALID_ROLES.includes(role)) {
  console.error(`❌ Rol inválido: ${role}`);
  console.error(`   Roles válidos: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

// Ejecutar
setAdminRole(email, role);
