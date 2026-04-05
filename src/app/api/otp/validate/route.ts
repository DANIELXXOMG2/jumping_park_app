import { type NextRequest, NextResponse } from 'next/server'
import { apiHandler, getValidatedBody } from '@/lib/apiHandler'
import { validateOtpSchema } from '@/lib/schemas/auth.schema'
import { validateOtpChallengeRequest } from '@/services/authService'

const VALIDATION_LIMIT = 5
const VALIDATION_WINDOW_MINUTES = 5

type ValidateOtpInput = {
	email?: string
	cedula?: string
	code: string
}

export const POST = apiHandler(
	async (req: NextRequest) => {
		const payload = getValidatedBody<ValidateOtpInput>(req)
		const result = await validateOtpChallengeRequest({
			email: payload.email,
			cedula: payload.cedula,
			code: payload.code,
			validationLimit: VALIDATION_LIMIT,
			validationWindowMinutes: VALIDATION_WINDOW_MINUTES,
		})

		return NextResponse.json(result.body, {
			status: result.httpStatus,
			headers: result.headers,
		})
	},
	{ bodySchema: validateOtpSchema },
)
