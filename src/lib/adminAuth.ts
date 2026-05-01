import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import type { CustomClaims, Permission, UserRole } from "@/types/auth";
import { canAccessAdmin, getRoleFromClaims, hasPermission } from "@/types/auth";

import {
	ADMIN_SESSION_COOKIE_NAME,
	AdminSessionPayload,
} from "@/types/auth";

export { ADMIN_SESSION_COOKIE_NAME, AdminSessionPayload };

export const ADMIN_SESSION_MODE =
	process.env.ADMIN_SESSION_MODE === "cookie" ? "cookie" : "dual";
export const ADMIN_IDLE_TIMEOUT_MINUTES = Number.parseInt(
	process.env.ADMIN_IDLE_TIMEOUT_MINUTES ?? "30",
	10,
);

const ADMIN_IDLE_TIMEOUT_MS = ADMIN_IDLE_TIMEOUT_MINUTES * 60 * 1000;
const SESSION_SECRET = process.env.ADMIN_JWT_SECRET ?? "";

type AdminSessionTransport = "cookie" | "bearer";

export interface AuthResult {
	success: true;
	uid: string;
	email: string;
	role: UserRole;
	expiresAt: string;
	transport: AdminSessionTransport;
}

export interface AuthError {
	success: false;
	response: NextResponse;
}

export interface BearerVerifierResult {
	uid: string;
	email?: string | null;
	exp?: number;
	claims?: CustomClaims;
}

export type BearerVerifier = (token: string) => Promise<BearerVerifierResult>;

function encodeBase64Url(value: string): string {
	return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
	return createHmac("sha256", SESSION_SECRET)
		.update(payload)
		.digest("base64url");
}

function isSecureRequest(request: NextRequest): boolean {
	const forwardedProto = request.headers.get("x-forwarded-proto");
	if (forwardedProto) {
		return forwardedProto === "https";
	}

	return request.nextUrl.protocol === "https:";
}

function getUnauthorizedResponse(message: string): AuthError {
	return {
		success: false,
		response: NextResponse.json({ error: message }, { status: 401 }),
	};
}

function getForbiddenResponse(message: string): AuthError {
	return {
		success: false,
		response: NextResponse.json({ error: message }, { status: 403 }),
	};
}

function assertSessionSecret(): void {
	if (!SESSION_SECRET) {
		throw new Error("ADMIN_JWT_SECRET is required for admin sessions");
	}
}

export function buildAdminSessionCookieValue(
	payload: AdminSessionPayload,
): string {
	assertSessionSecret();
	const encodedPayload = encodeBase64Url(JSON.stringify(payload));
	const signature = signPayload(encodedPayload);
	return `${encodedPayload}.${signature}`;
}

export function getAdminSessionCookieOptions(request: NextRequest) {
	const secure = isSecureRequest(request);

	return {
		httpOnly: true,
		secure,
		sameSite: "lax" as const,
		path: "/",
		maxAge: Math.floor(ADMIN_IDLE_TIMEOUT_MS / 1000),
	};
}

export function clearAdminSessionCookie(response: NextResponse): void {
	response.cookies.set({
		name: ADMIN_SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		secure: false,
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
}

function parseAdminSessionCookie(value: string): AdminSessionPayload | null {
	assertSessionSecret();
	const [encodedPayload, signature] = value.split(".");

	if (!encodedPayload || !signature) {
		return null;
	}

	const expectedSignature = signPayload(encodedPayload);
	const providedBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expectedSignature);

	if (
		providedBuffer.length !== expectedBuffer.length ||
		!timingSafeEqual(providedBuffer, expectedBuffer)
	) {
		return null;
	}

	const parsed = JSON.parse(
		decodeBase64Url(encodedPayload),
	) as AdminSessionPayload;

	if (
		typeof parsed.uid !== "string" ||
		typeof parsed.email !== "string" ||
		typeof parsed.role !== "string" ||
		typeof parsed.issuedAt !== "number" ||
		typeof parsed.expiresAt !== "number"
	) {
		return null;
	}

	if (!canAccessAdmin(parsed.role)) {
		return null;
	}

	if (Date.now() > parsed.expiresAt) {
		return null;
	}

	return parsed;
}

export function createAdminSessionPayload(params: {
	uid: string;
	email: string;
	role: UserRole;
	now?: number;
}): AdminSessionPayload {
	const issuedAt = params.now ?? Date.now();

	return {
		uid: params.uid,
		email: params.email,
		role: params.role,
		issuedAt,
		expiresAt: issuedAt + ADMIN_IDLE_TIMEOUT_MS,
	};
}

export function readAdminSessionFromRequest(
	request: NextRequest,
): AdminSessionPayload | null {
	const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

	if (!cookieValue) {
		return null;
	}

	try {
		return parseAdminSessionCookie(cookieValue);
	} catch {
		return null;
	}
}

async function verifyBearerToken(
	request: NextRequest,
	requiredRole?: UserRole,
	verifyToken: BearerVerifier = (token) => adminAuth.verifyIdToken(token),
): Promise<AuthResult | AuthError> {
	const authHeader = request.headers.get("Authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return getUnauthorizedResponse("Token de autenticacion requerido");
	}

	const token = authHeader.slice("Bearer ".length).trim();

	if (!token) {
		return getUnauthorizedResponse("Token de autenticacion invalido");
	}

	try {
		const decodedToken = await verifyToken(token);
		const claims = decodedToken as unknown as CustomClaims;
		const role = getRoleFromClaims(claims);

		if (!role || !canAccessAdmin(role)) {
			return getForbiddenResponse(
				"No tienes permisos para acceder al panel de administracion",
			);
		}

		if (requiredRole && requiredRole !== role && role !== "admin") {
			return getForbiddenResponse(
				`Se requiere rol '${requiredRole}' para esta accion`,
			);
		}

		return {
			success: true,
			uid: decodedToken.uid,
			email: decodedToken.email ?? "",
			role,
			expiresAt: new Date(
				(decodedToken.exp ?? Date.now() / 1000) * 1000,
			).toISOString(),
			transport: "bearer",
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes("expired")) {
			return getUnauthorizedResponse(
				"Token expirado. Inicia sesion nuevamente.",
			);
		}

		return getUnauthorizedResponse("Error de autenticacion");
	}
}

function validateRequiredRole(
	payload: AdminSessionPayload,
	requiredRole?: UserRole,
): AuthResult | AuthError {
	if (
		requiredRole &&
		requiredRole !== payload.role &&
		payload.role !== "admin"
	) {
		return getForbiddenResponse(
			`Se requiere rol '${requiredRole}' para esta accion`,
		);
	}

	return {
		success: true,
		uid: payload.uid,
		email: payload.email,
		role: payload.role,
		expiresAt: new Date(payload.expiresAt).toISOString(),
		transport: "cookie",
	};
}

export async function verifyAdminToken(
	request: NextRequest,
	requiredRole?: UserRole,
	verifyToken?: BearerVerifier,
): Promise<AuthResult | AuthError> {
	const cookieSession = readAdminSessionFromRequest(request);

	if (cookieSession) {
		return validateRequiredRole(cookieSession, requiredRole);
	}

	if (ADMIN_SESSION_MODE === "dual") {
		return verifyBearerToken(request, requiredRole, verifyToken);
	}

	return getUnauthorizedResponse("Sesion de administrador requerida");
}

export async function verifyFullAdminToken(
	request: NextRequest,
): Promise<AuthResult | AuthError> {
	return verifyAdminToken(request, "admin");
}

export async function verifyAdminTokenWithPermission(
	request: NextRequest,
	permission: Permission,
): Promise<AuthResult | AuthError> {
	const authResult = await verifyAdminToken(request);

	if (!authResult.success) {
		return authResult;
	}

	if (!hasPermission(authResult.role, permission)) {
		return getForbiddenResponse(
			`No tienes permiso para esta accion (requiere: ${permission})`,
		);
	}

	return authResult;
}

export async function verifyAdminTokenWithAnyPermission(
	request: NextRequest,
	permissions: Permission[],
): Promise<AuthResult | AuthError> {
	const authResult = await verifyAdminToken(request);

	if (!authResult.success) {
		return authResult;
	}

	const hasAnyPermission = permissions.some((permission) =>
		hasPermission(authResult.role, permission),
	);

	if (!hasAnyPermission) {
		return getForbiddenResponse(
			`No tienes permisos para esta accion (requiere uno de: ${permissions.join(", ")})`,
		);
	}

	return authResult;
}
