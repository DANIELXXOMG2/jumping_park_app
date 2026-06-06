/**
 * Script de Migración: Formato Plano → Multilenguaje
 *
 * Este script migra el documento settings/consent_v1 del formato antiguo (plano)
 * al nuevo formato multilenguaje { es: {...}, en: {...} }.
 *
 * IMPORTANTE: Solo ejecutar en desarrollo. Para producción, hacer backup primero.
 *
 * @usage
 * 1. Ejecutar con: bun scripts/migrate-consent-multilang.ts
 * 2. O copiar la función migrateConsentData() a la consola del navegador
 *
 * @version 1.0.0
 * @date 2025-12-27
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONSENT_DOC_PATH = "settings/consent_v1";

// Inicializar Firebase Admin si no está ya inicializado
if (getApps().length === 0) {
	// Obtener credenciales del entorno (mismo patrón que firebaseAdmin.ts)
	const projectId = process.env.FIREBASE_PROJECT_ID as string | undefined;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined;
	const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY as string | undefined;
	const privateKey = privateKeyRaw
		? privateKeyRaw.replace(/\\n/g, "\n")
		: undefined;

	if (projectId && clientEmail && privateKey) {
		initializeApp({
			credential: cert({ projectId, clientEmail, privateKey }),
		});
	} else {
		console.error("╔════════════════════════════════════════════════════════════╗");
		console.error("║  ❌ ERROR: Variables de entorno de Firebase no configuradas  ║");
		console.error("╠════════════════════════════════════════════════════════════╣");
		console.error("║  Asegúrate de tener las siguientes variables en tu .env:   ║");
		console.error("║    - FIREBASE_PROJECT_ID                                   ║");
		console.error("║    - FIREBASE_CLIENT_EMAIL                                 ║");
		console.error("║    - FIREBASE_PRIVATE_KEY                                  ║");
		console.error("╚════════════════════════════════════════════════════════════╝");
		process.exit(1);
	}
}

const db = getFirestore();

// ============================================================================
// TIPOS
// ============================================================================

interface ConsentContentStructure {
	meta: {
		version: string;
		lastUpdated: string;
		companyName: string;
	};
	consent: {
		title: string;
		subtitle: string;
		introduction: string;
		clauses: Array<{
			id: number;
			text: string;
			highlight?: boolean;
			icon?: string;
			highlightLabel?: string;
		}>;
		closingStatement: string;
	};
	rules: {
		title: string;
		introduction: string;
		items: Array<{
			id: number;
			text: string;
			highlight?: boolean;
			icon?: string;
			highlightLabel?: string;
		}>;
		closingMessage: string;
	};
}

interface MultiLanguageDocument {
	es: ConsentContentStructure;
	en?: ConsentContentStructure;
	[key: string]: ConsentContentStructure | undefined;
}

// ============================================================================
// FUNCIONES DE DETECCIÓN
// ============================================================================

/**
 * Detecta si el documento está en formato antiguo o nuevo.
 */
function detectFormat(data: Record<string, unknown>): 'legacy' | 'multilang' | 'unknown' {
	// Formato antiguo: tiene meta, consent, rules en la raíz
	if ('meta' in data && 'consent' in data && 'rules' in data) {
		return 'legacy';
	}
	
	// Formato nuevo: las claves son códigos de idioma (es, en, etc.)
	const keys = Object.keys(data);
	if (keys.length > 0 && keys.every(k => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) {
		return 'multilang';
	}
	
	return 'unknown';
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE MIGRACIÓN
// ============================================================================

/**
 * Migra el documento de consentimiento al formato multilenguaje.
 * 
 * @param dryRun - Si es true, solo muestra qué haría sin escribir
 * @returns Resultado de la migración
 */
async function migrateConsentData(dryRun = true): Promise<{
	success: boolean;
	message: string;
	oldFormat?: string;
	newData?: MultiLanguageDocument;
}> {
	console.log('🔄 Iniciando migración de consentimiento...');
	console.log(`📂 Documento: ${CONSENT_DOC_PATH}`);
	console.log(`🧪 Modo: ${dryRun ? 'DRY RUN (sin escribir)' : 'ESCRITURA REAL'}`);
	console.log('─'.repeat(50));

	try {
		// 1. Leer documento actual
		const docRef = db.doc(CONSENT_DOC_PATH);
		const docSnap = await docRef.get();

		if (!docSnap.exists) {
			return {
				success: false,
				message: '❌ El documento settings/consent_v1 no existe.',
			};
		}

		const currentData = docSnap.data() as Record<string, unknown>;
		const format = detectFormat(currentData);

		console.log(`📋 Formato detectado: ${format}`);

		// 2. Verificar si necesita migración
		if (format === 'multilang') {
			return {
				success: true,
				message: '✅ El documento ya está en formato multilenguaje. No se requiere migración.',
				oldFormat: format,
			};
		}

		if (format === 'unknown') {
			return {
				success: false,
				message: '❌ Formato desconocido. El documento no tiene la estructura esperada.',
				oldFormat: format,
			};
		}

		// 3. Migrar formato legacy → multilang
		const legacyContent = currentData as unknown as ConsentContentStructure;
		
		// Crear nuevo documento con estructura multilenguaje
		const newDocument: MultiLanguageDocument = {
			es: {
				...legacyContent,
				meta: {
					...legacyContent.meta,
					lastUpdated: new Date().toISOString().split('T')[0], // Actualizar fecha
				},
			},
			// En: crear copia vacía/placeholder o copiar español
			en: {
				...legacyContent,
				meta: {
					...legacyContent.meta,
					lastUpdated: new Date().toISOString().split('T')[0],
				},
			},
		};

		console.log('📝 Nueva estructura creada:');
		console.log(`   - es: ${newDocument.es.consent.clauses.length} cláusulas, ${newDocument.es.rules.items.length} reglas`);
		console.log(`   - en: ${newDocument.en?.consent.clauses.length} cláusulas, ${newDocument.en?.rules.items.length} reglas`);

		// 4. Escribir o simular
		if (dryRun) {
			console.log('\n🧪 DRY RUN: No se escribió nada.');
			console.log('   Para ejecutar la migración real, usa: migrateConsentData(false)');
		} else {
			await docRef.set(newDocument);
			console.log('\n✅ Documento migrado exitosamente.');
		}

		return {
			success: true,
			message: dryRun 
				? '🧪 Dry run completado. Ejecuta con dryRun=false para aplicar cambios.'
				: '✅ Migración completada exitosamente.',
			oldFormat: format,
			newData: newDocument,
		};

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		console.error('❌ Error durante la migración:', errorMessage);
		return {
			success: false,
			message: `❌ Error: ${errorMessage}`,
		};
	}
}

// ============================================================================
// FUNCIÓN PARA CONSOLA DEL NAVEGADOR
// ============================================================================

/**
 * Código para ejecutar directamente en la consola del navegador.
 * Copia y pega este bloque en las DevTools de tu app.
 * @internal No exportado - es código de referencia para copiar/pegar
 */
const browserConsoleCode = `
// ============================================================================
// MIGRACIÓN DE CONSENTIMIENTO - CONSOLA DEL NAVEGADOR
// ============================================================================
// Pega esto en la consola de DevTools mientras estás en tu app

async function migrateConsentData() {
  // Importar Firebase (asumiendo que ya está inicializado en la app)
  const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
  
  // Obtener instancia de Firestore (ajusta esto según tu configuración)
  // Si tienes acceso global a 'db', usa eso directamente
  const db = getFirestore();
  
  const CONSENT_DOC_PATH = 'settings/consent_v1';
  
  console.log('🔄 Leyendo documento actual...');
  
  const docRef = doc(db, 'settings', 'consent_v1');
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    console.error('❌ El documento no existe');
    return;
  }
  
  const currentData = docSnap.data();
  
  // Verificar si ya está en formato nuevo
  if ('es' in currentData || 'en' in currentData) {
    console.log('✅ El documento ya está en formato multilenguaje');
    return;
  }
  
  // Verificar formato antiguo
  if (!('meta' in currentData && 'consent' in currentData && 'rules' in currentData)) {
    console.error('❌ Formato desconocido');
    return;
  }
  
  console.log('📋 Formato antiguo detectado. Migrando...');
  
  // Crear nuevo documento
  const newDocument = {
    es: {
      ...currentData,
      meta: {
        ...currentData.meta,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    },
    en: {
      ...currentData,
      meta: {
        ...currentData.meta,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    },
  };
  
  console.log('📝 Nueva estructura:', newDocument);
  
  // Confirmar antes de escribir
  if (!confirm('¿Deseas sobrescribir el documento con la nueva estructura?')) {
    console.log('❌ Migración cancelada por el usuario');
    return;
  }
  
  await setDoc(docRef, newDocument);
  console.log('✅ ¡Migración completada!');
}

// Ejecutar
migrateConsentData();
`;

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

async function main() {
	console.log('═'.repeat(60));
	console.log('   MIGRACIÓN DE CONSENTIMIENTO A FORMATO MULTILENGUAJE');
	console.log('═'.repeat(60));
	console.log();

	// Primero hacer dry run
	const dryRunResult = await migrateConsentData(true);
	console.log();
	console.log('Resultado:', dryRunResult.message);

	// Si el dry run fue exitoso y requiere migración
	if (dryRunResult.success && dryRunResult.oldFormat === 'legacy') {
		console.log();
		console.log('─'.repeat(60));
		console.log('🚀 Aplicando migración real...');
		
		// Ejecutar la migración real:
		await migrateConsentData(false);
	}
}

// Solo ejecutar si es el módulo principal
main().catch(console.error);
