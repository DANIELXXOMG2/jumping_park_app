import { type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
	CACHE_SIZE_UNLIMITED,
	type Firestore,
	getFirestore,
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

/**
 * Inicializa Firestore con persistencia offline avanzada.
 * En el navegador: usa persistentLocalCache con persistentMultipleTabManager
 * para soportar múltiples pestañas del recepcionista.
 * En el servidor: usa getFirestore básico.
 */
function initializeFirestoreWithPersistence(): Firestore {
	// En el servidor (SSR), usar inicialización básica
	if (typeof window === "undefined") {
		return getFirestore(app);
	}

	// En el cliente: inicializar con persistencia multi-tab
	try {
		return initializeFirestore(app, {
			localCache: persistentLocalCache({
				tabManager: persistentMultipleTabManager(),
				cacheSizeBytes: CACHE_SIZE_UNLIMITED,
			}),
		});
	} catch (error) {
		// Si Firestore ya fue inicializado (Fast Refresh), retornar instancia existente
		console.warn(
			"[Firestore] Ya inicializado, usando instancia existente:",
			error,
		);
		return getFirestore(app);
	}
}

initializeFirestoreWithPersistence();

export { app, auth };
