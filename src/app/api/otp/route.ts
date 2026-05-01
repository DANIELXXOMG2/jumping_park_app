import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, getValidatedBody } from "@/lib/apiHandler";
import { sendOtpSchema } from "@/lib/schemas/auth.schema";
import { requestOtpChallenge } from "@/services/authService";

type SendOtpInput = z.infer<typeof sendOtpSchema>;

const OTP_DIGITS = 6;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_IP_MULTIPLIER = 3;

function generateOtp(): string {
	const min = 10 ** (OTP_DIGITS - 1);
	const max = 10 ** OTP_DIGITS - 1;
	return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

function getClientIP(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0]?.trim() ?? "unknown";
	}

	return req.headers.get("x-real-ip") ?? "unknown";
}

export const POST = apiHandler(
	async (req: NextRequest) => {
		const payload = getValidatedBody<SendOtpInput>(req);
		const result = await requestOtpChallenge({
			email: payload.email,
			cedula: payload.cedula,
			clientIp: getClientIP(req),
			route: "/api/otp",
			rateLimitMax: RATE_LIMIT_MAX,
			rateLimitWindowMinutes: RATE_LIMIT_WINDOW_MINUTES,
			rateLimitIpMultiplier: RATE_LIMIT_IP_MULTIPLIER,
			codeGenerator: generateOtp,
		});

		return NextResponse.json(result.body, {
			status: result.httpStatus,
			headers: result.headers,
		});
	},
	{ bodySchema: sendOtpSchema },
);
