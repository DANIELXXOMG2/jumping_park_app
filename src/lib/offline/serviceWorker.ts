const OFFLINE_SERVICE_WORKER_PATH = "/offline-sw.js";

export async function registerOfflineServiceWorker(): Promise<boolean> {
	if (
		typeof window === "undefined" ||
		typeof navigator === "undefined" ||
		!("serviceWorker" in navigator)
	) {
		return false;
	}

	try {
		await navigator.serviceWorker.register(OFFLINE_SERVICE_WORKER_PATH);
		return true;
	} catch (error) {
		console.warn("[Offline] No se pudo registrar el service worker", error);
		return false;
	}
}
