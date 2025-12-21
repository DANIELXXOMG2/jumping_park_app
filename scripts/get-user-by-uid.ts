#!/usr/bin/env bun
/**
 * Obtener información de usuario por UID
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function initFirebase() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        console.error("❌ Error: No se encontraron credenciales de Firebase");
        process.exit(1);
      }
    }
  }

  return getAuth();
}

const uid = process.argv[2];

if (!uid) {
  console.log("Uso: bun run scripts/get-user-by-uid.ts <UID>");
  process.exit(0);
}

const auth = initFirebase();

auth.getUser(uid)
  .then(user => {
    console.log("\n✅ Usuario encontrado:");
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.displayName || 'N/A'}`);
    console.log(`\n📌 Para asignar rol admin, ejecuta:`);
    console.log(`   bun run scripts/set-admin-role.ts ${user.email}\n`);
  })
  .catch(error => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
