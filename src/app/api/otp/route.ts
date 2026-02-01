import { type NextRequest, NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/schemas/auth.schema";
import { getUserByCedula, saveOtp, sendOtpEmail } from "@/services/authService";
import { checkRateLimit } from "@/services/rateLimitService";

const OTP_DIGITS = 6;
/** Máximo de OTPs por email en la ventana de tiempo */
const RATE_LIMIT_MAX = 3;
/** Ventana de tiempo en minutos para el rate limit */
const RATE_LIMIT_WINDOW_MINUTES = 15;

function generateOtp(): string {
	const min = 10 ** (OTP_DIGITS - 1);
	const max = 10 ** OTP_DIGITS - 1;
	return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Obtiene la IP del cliente desde los headers de la request.
 * Considera proxies inversos (X-Forwarded-For).
 */
function getClientIP(req: NextRequest): string {
	// X-Forwarded-For puede tener múltiples IPs: "client, proxy1, proxy2"
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	// Fallback a X-Real-IP (usado por nginx)
	const realIp = req.headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	// Si no hay headers de proxy, usar "unknown"
	return "unknown";
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = sendOtpSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Datos inválidos",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const { email, cedula } = parsed.data;
		let targetEmail = email;

		// Caso B: Si no hay email pero hay cédula, buscamos el email del usuario (Login usuario existente)
		if (!targetEmail && cedula) {
			const user = await getUserByCedula(cedula);

			if (!user) {
				console.warn(`[API OTP] Usuario no encontrado para cédula: ${cedula}`);
				return NextResponse.json(
					{ error: "Usuario no encontrado" },
					{ status: 404 },
				);
			}

			if (!user.email) {
				console.warn(
					`[API OTP] Usuario encontrado pero sin email. Cédula: ${cedula}`,
				);
				return NextResponse.json(
					{ error: "Usuario sin email registrado" },
					{ status: 404 },
				);
			}

			targetEmail = user.email;
		}

		// Caso A: Payload tiene email (Registro nuevo o reenvío explícito)
		if (!targetEmail) {
			console.error("[API OTP] Faltan datos (Email o Cédula válida)");
			return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
		}

		// ═══════════════════════════════════════════════════════════════
		// RATE LIMITING: Prevenir spam de OTPs
		// ═══════════════════════════════════════════════════════════════
		const clientIP = getClientIP(req);
		
		// Verificar límite por email (principal)
		const emailRateLimit = await checkRateLimit(
			`otp:email:${targetEmail}`,
			RATE_LIMIT_MAX,
			RATE_LIMIT_WINDOW_MINUTES,
		);

		if (!emailRateLimit.success) {
			const resetInMinutes = Math.ceil(
				(emailRateLimit.resetAt - Date.now()) / 60000,
			);
			console.warn(
				`[API OTP] Rate limit alcanzado para email: ${targetEmail}`,
			);
			return NextResponse.json(
				{
					error: `Demasiados intentos. Intenta en ${resetInMinutes} minutos.`,
					retryAfter: resetInMinutes,
				},
				{
					status: 429,
					headers: {
						"Retry-After": String(resetInMinutes * 60),
					},
				},
			);
		}

		// Verificar límite por IP (secundario, más permisivo)
		if (clientIP !== "unknown") {
			const ipRateLimit = await checkRateLimit(
				`otp:ip:${clientIP}`,
				RATE_LIMIT_MAX * 3, // 15 intentos por IP (permite múltiples usuarios)
				RATE_LIMIT_WINDOW_MINUTES,
			);

			if (!ipRateLimit.success) {
				const resetInMinutes = Math.ceil(
					(ipRateLimit.resetAt - Date.now()) / 60000,
				);
				console.warn(`[API OTP] Rate limit alcanzado para IP: ${clientIP}`);
				return NextResponse.json(
					{
						error: `Demasiados intentos desde esta ubicación. Intenta en ${resetInMinutes} minutos.`,
						retryAfter: resetInMinutes,
					},
					{
						status: 429,
						headers: {
							"Retry-After": String(resetInMinutes * 60),
						},
					},
				);
			}
		}

		const otp = generateOtp();
		await saveOtp(targetEmail, otp);
		const result = await sendOtpEmail(targetEmail, otp);

		if (!result.success) {
			console.error(`[API OTP] Fallo envío de email: ${result.error}`);
			return NextResponse.json(
				{ error: result.error ?? "No se pudo enviar el OTP" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				message: "OTP enviado",
				remaining: emailRateLimit.remaining,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[API OTP] Error no controlado:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
