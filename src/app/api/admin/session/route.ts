import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
	ADMIN_SESSION_COOKIE_NAME,
	clearAdminSessionCookie,
	getAdminSessionCookieOptions,
} from "@/lib/adminAuth";
import { apiHandler, getValidatedBody } from "@/lib/apiHandler";
import {
	exchangeAdminSessionFromIdToken,
	refreshAdminSessionFromRequest,
} from "@/services/adminSessionService";

export const runtime = "nodejs";

const sessionExchangeSchema = z.object({
	idToken: z.string().min(1, "idToken requerido"),
});

type SessionExchangeInput = z.infer<typeof sessionExchangeSchema>;

function unauthorized(message: string): NextResponse {
	return NextResponse.json({ error: message }, { status: 401 });
}

export const POST = apiHandler(
	async (request: NextRequest) => {
		const { idToken } = getValidatedBody<SessionExchangeInput>(request);
		const session = await exchangeAdminSessionFromIdToken(idToken);

		const response = NextResponse.json(
			{
				session: {
					role: session.role,
					expiresAt: session.expiresAt,
				},
			},
			{ status: 200 },
		);

		response.cookies.set({
			name: ADMIN_SESSION_COOKIE_NAME,
			value: session.cookieValue,
			...getAdminSessionCookieOptions(request),
		});

		return response;
	},
	{ bodySchema: sessionExchangeSchema },
);

export const GET = apiHandler(async (request: NextRequest) => {
	const session = refreshAdminSessionFromRequest(request);

	if (!session) {
		const response = unauthorized("Sesion expirada o inexistente");
		clearAdminSessionCookie(response);
		return response;
	}

	const response = NextResponse.json(
		{
			session: {
				role: session.role,
				expiresAt: session.expiresAt,
			},
		},
		{ status: 200 },
	);

	if (session.didRefresh && session.cookieValue) {
		response.cookies.set({
			name: ADMIN_SESSION_COOKIE_NAME,
			value: session.cookieValue,
			...getAdminSessionCookieOptions(request),
		});
	}

	return response;
});

export const DELETE = apiHandler(async () => {
	const cookieStore = await cookies();
	cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);

	const response = NextResponse.json({ success: true }, { status: 200 });
	clearAdminSessionCookie(response);
	return response;
});
