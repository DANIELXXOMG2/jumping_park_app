import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	ADMIN_SESSION_COOKIE_NAME,
	readAdminSessionFromEdgeRequest,
} from "@/lib/adminSessionEdge";
import { evaluateHardeningFlag, HARDENING_FLAG } from "@/lib/hardeningPolicy";

const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/unauthorized"];
const NOINDEX_PREFIXES = [
	"/admin",
	"/ingreso",
	"/otp",
	"/registro",
	"/consentimiento",
	"/exito",
];

const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"object-src 'none'",
	"frame-src 'none'",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"manifest-src 'self'",
	"media-src 'self' data: blob:",
	"style-src 'self' 'unsafe-inline' https:",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
	"connect-src 'self' https: wss:",
	"worker-src 'self' blob:",
	"upgrade-insecure-requests",
].join("; ");

const REPORT_ONLY_CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"object-src 'none'",
	"frame-src 'none'",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"manifest-src 'self'",
	"media-src 'self' data: blob:",
	"style-src 'self' 'unsafe-inline' https: 'report-sample'",
	"script-src 'self' 'unsafe-inline' 'report-sample'",
	"connect-src 'self' https: wss:",
	"worker-src 'self' blob:",
	"upgrade-insecure-requests",
].join("; ");

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|favicon.png|favicon-16x16.png|favicon-48x48.png|apple-touch-icon.png|icon-192.png|icon-512.png|og-image.png|assets|manifest.json).*)",
	],
};

function isProtectedAdminRoute(pathname: string): boolean {
	if (!pathname.startsWith("/admin")) {
		return false;
	}

	return !PUBLIC_ADMIN_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

function shouldApplyNoIndex(pathname: string): boolean {
	return NOINDEX_PREFIXES.some(
		(prefix) =>
			pathname === prefix ||
			(prefix !== "/" && pathname.startsWith(`${prefix}/`)),
	);
}

function applySecurityHeaders(
	response: NextResponse,
	pathname: string,
): NextResponse {
	const cspReportOnlyPolicy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.CSP_REPORT_ONLY,
		source: "proxy-csp",
		route: pathname,
	});

	response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
	response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
	response.headers.set("Origin-Agent-Cluster", "?1");
	response.headers.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains",
	);
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=()",
	);

	for (const [headerName, headerValue] of Object.entries(
		cspReportOnlyPolicy.headers,
	)) {
		response.headers.set(headerName, headerValue);
	}

	if (cspReportOnlyPolicy.enabled) {
		response.headers.set(
			"Content-Security-Policy-Report-Only",
			REPORT_ONLY_CONTENT_SECURITY_POLICY,
		);
	} else {
		response.headers.delete("Content-Security-Policy-Report-Only");
	}

	if (shouldApplyNoIndex(pathname)) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return response;
}

function buildAdminRedirect(
	request: NextRequest,
	pathname: string,
	clearCookie = false,
) {
	const loginUrl = new URL("/admin/login", request.url);
	loginUrl.searchParams.set("redirect", pathname);
	loginUrl.searchParams.set("reason", "session-required");

	const response = NextResponse.redirect(loginUrl);

	if (clearCookie) {
		response.cookies.set({
			name: ADMIN_SESSION_COOKIE_NAME,
			value: "",
			httpOnly: true,
			secure: request.nextUrl.protocol === "https:",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});
	}

	return applySecurityHeaders(response, pathname);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (isProtectedAdminRoute(pathname)) {
		const hasAdminSessionCookie = request.cookies.has(
			ADMIN_SESSION_COOKIE_NAME,
		);

		if (!hasAdminSessionCookie) {
			return buildAdminRedirect(request, pathname);
		}

		const session = await readAdminSessionFromEdgeRequest(request);

		if (!session) {
			return buildAdminRedirect(request, pathname, true);
		}
	}

	return applySecurityHeaders(NextResponse.next(), pathname);
}
