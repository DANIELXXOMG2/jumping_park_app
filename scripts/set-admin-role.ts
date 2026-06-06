#!/usr/bin/env bun
/**
 * ============================================================================
 * SET ADMIN ROLE - Asignar rol a un usuario mediante Custom Claims
 * ============================================================================
 * 
 * Este script asigna roles a usuarios en Firebase Auth usando Custom Claims,
 * que es la mejor práctica recomendada por Firebase.
 * 
 * Los Custom Claims:
 * - Se almacenan en el token JWT del usuario
 * - Se pueden verificar en Firestore Security Rules
 * - Se validan tanto en frontend como en backend
 * - Son la forma más segura de implementar RBAC
 * 
 * Uso:
 *   bun run scripts/set-admin-role.ts <email> [role]
 * 
 * Ejemplos:
 *   bun run scripts/set-admin-role.ts admin@example.com admin
 *   bun run scripts/set-admin-role.ts empleado@example.com trabajador
 * 
 * Roles disponibles: admin, trabajador
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initFirebaseAdmin } from "./lib/firebase-admin";
import type { UserRole } from "../src/types/auth";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const VALID_ROLES: UserRole[] = ['admin', 'trabajador'];
const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Acceso completo al panel de administración",
  trabajador: "Solo acceso al Dashboard",
};

/**
 * Type guard — narrows unknown to UserRole without unsafe `as` casts.
 */
function isUserRole(value: unknown): value is UserRole {
  if (typeof value !== 'string') return false;
  return (VALID_ROLES as readonly string[]).includes(value);
}

// ============================================================================
// INICIALIZACIÓN FIREBASE ADMIN (vía lib compartida)
// ============================================================================

function initFirebase() {
  try {
    const app = initFirebaseAdmin();
    return {
      db: getFirestore(app),
      auth: getAuth(app),
    };
  } catch (error) {
    console.error("❌ Error: No se encontraron credenciales de Firebase");
    console.error("   Configura las variables individuales en .env:");
    console.error("   - FIREBASE_PROJECT_ID");
    console.error("   - FIREBASE_CLIENT_EMAIL");
    console.error("   - FIREBASE_PRIVATE_KEY");
    process.exit(1);
  }
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

    // 2. Establecer Custom Claims con el rol
    // IMPORTANTE: Esta es la fuente de verdad para los roles
    console.log(`\n🔐 Estableciendo Custom Claims con rol '${role}'...`);
    
    await auth.setCustomUserClaims(user.uid, { 
      role: role,
      // Mantener 'admin: true' para compatibilidad con sistema anterior
      admin: role === 'admin'
    });
    console.log("✅ Custom Claims establecidos");

    // 3. Crear/Actualizar documento en admin_users (backup/referencia)
    console.log(`\n📝 Actualizando registro en Firestore (admin_users)...`);
    
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

    // 4. Resumen final
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡Rol asignado exitosamente via Custom Claims!");
    console.log("=".repeat(50));
    console.log(`\n   Usuario: ${user.email}`);
    console.log(`   Rol: ${role}`);
    console.log(`   Permisos: ${ROLE_DESCRIPTIONS[role]}`);
    console.log(`   UID: ${user.uid}`);
    console.log("\n⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver");
    console.log("   a iniciar para que los nuevos claims surtan efecto.\n");

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
  role    Rol a asignar: admin | trabajador (por defecto: admin)

Roles disponibles:
  admin      - Acceso completo al panel de administración
  trabajador - Solo acceso al Dashboard

Ejemplos:
  bun run scripts/set-admin-role.ts admin@example.com
  bun run scripts/set-admin-role.ts empleado@example.com trabajador

Nota: El usuario debe existir en Firebase Auth antes de ejecutar este script.
      Después de asignar el rol, el usuario debe re-iniciar sesión.
`);
  process.exit(0);
}

const email = args[0];
const roleArg = args[1];
const role: UserRole = isUserRole(roleArg) ? roleArg : 'admin';

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
