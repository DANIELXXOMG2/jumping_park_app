import type { NextRequest } from "next/server";
import {
	ADMIN_SESSION_COOKIE_NAME,
	AdminSessionPayload,
	canAccessAdmin,
} from "@/types/auth";

const SESSION_SECRET = process.env.ADMIN_JWT_SECRET ?? "";
const textEncoder = new TextEncoder();

let adminSessionKeyPromise: Promise<CryptoKey | null> | null = null;

function decodeBase64UrlToBytes(value: string): Uint8Array {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(
		normalized.length + ((4 - (normalized.length % 4)) % 4),
		"=",
	);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
}

function decodeBase64UrlToString(value: string): string {
	return new TextDecoder().decode(decodeBase64UrlToBytes(value));
}

function isAdminSessionPayload(value: unknown): value is AdminSessionPayload {
	if (!value || typeof value !== "object") {
		return false;
	}

	const payload = value as Partial<AdminSessionPayload>;

	return (
		typeof payload.uid === "string" &&
		typeof payload.email === "string" &&
		typeof payload.role === "string" &&
		typeof payload.issuedAt === "number" &&
		typeof payload.expiresAt === "number" &&
		canAccessAdmin(payload.role)
	);
}

async function getAdminSessionKey(): Promise<CryptoKey | null> {
	if (!SESSION_SECRET) {
		return null;
	}

	if (!adminSessionKeyPromise) {
		adminSessionKeyPromise = crypto.subtle.importKey(
			"raw",
			textEncoder.encode(SESSION_SECRET),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);
	}

	return adminSessionKeyPromise;
}

export async function readAdminSessionFromEdgeRequest(
	request: NextRequest,
): Promise<AdminSessionPayload | null> {
	const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

	if (!cookieValue) {
		return null;
	}

	try {
		const [encodedPayload, signature] = cookieValue.split(".");

		if (!encodedPayload || !signature) {
			return null;
		}

		const key = await getAdminSessionKey();

		if (!key) {
			return null;
		}

		const isValidSignature = await crypto.subtle.verify(
			"HMAC",
			key,
			toArrayBuffer(decodeBase64UrlToBytes(signature)),
			textEncoder.encode(encodedPayload),
		);

		if (!isValidSignature) {
			return null;
		}

		const payload = JSON.parse(
			decodeBase64UrlToString(encodedPayload),
		) as unknown;

		if (!isAdminSessionPayload(payload)) {
			return null;
		}

		if (Date.now() > payload.expiresAt) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}
