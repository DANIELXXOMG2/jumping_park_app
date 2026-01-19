"use client";

import { auth } from "@/lib/firebaseClient";

/**
 * Obtiene el token de autenticación del usuario actual.
 * Útil para llamadas manuales que requieren el token.
 */
export async function getAuthToken(): Promise<string | null> {
	const user = auth.currentUser;
	if (!user) return null;
	return user.getIdToken();
}

export async function adminFetch(
	url: string,
	options: RequestInit = {},
): Promise<Response> {
	const user = auth.currentUser;

	if (!user) {
		throw new Error("No autenticado");
	}

	const token = await user.getIdToken();

	const headers = new Headers(options.headers);
	headers.set("Authorization", `Bearer ${token}`);
	headers.set("Content-Type", "application/json");

	return fetch(url, {
		...options,
		headers,
	});
}

export async function adminGet<T>(url: string): Promise<T> {
	const response = await adminFetch(url, { method: "GET" });

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Error al obtener datos");
	}

	return response.json();
}

export async function adminPost<T>(url: string, data: unknown): Promise<T> {
	const response = await adminFetch(url, {
		method: "POST",
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Error al enviar datos");
	}

	return response.json();
}

export async function adminDelete<T>(url: string): Promise<T> {
	const response = await adminFetch(url, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Error al eliminar");
	}

	return response.json();
}

/**
 * Descarga un archivo desde una URL protegida.
 * Útil para exportar CSV, PDF, etc.
 */
export async function adminDownload(
	url: string,
	filename: string,
): Promise<void> {
	const response = await adminFetch(url, { method: "GET" });

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Error al descargar");
	}

	const blob = await response.blob();
	const downloadUrl = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(downloadUrl);
}
