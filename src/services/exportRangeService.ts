import { ApiError } from '@/lib/apiHandler'

const EXPORT_RANGE_ERROR = {
	REQUIRED: 'EXPORT_RANGE_REQUIRED',
	INVALID: 'EXPORT_RANGE_INVALID',
	TOO_WIDE: 'EXPORT_RANGE_TOO_WIDE',
} as const

export const EXPORT_RANGE_MAX_DAYS = 30

export interface ExportRangeInput {
	from?: string
	to?: string
	field: string
}

export interface ExportRangeMetadata {
	field: string
	from: string
	to: string
	dayCount: number
	maxDays: number
	bounded: true
	capped: false
	rejected: false
}

export interface ExportRangeResolution {
	fromDate: Date
	toDate: Date
	metadata: ExportRangeMetadata
}

function parseDateOnly(value: string, boundary: 'start' | 'end'): Date {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

	if (!match) {
		throw new ApiError(
			'Las fechas deben usar el formato YYYY-MM-DD',
			400,
			EXPORT_RANGE_ERROR.INVALID,
		)
	}

	const [, year, month, day] = match
	const hour = boundary === 'start' ? '00:00:00.000' : '23:59:59.999'
	const parsed = new Date(`${year}-${month}-${day}T${hour}Z`)

	if (Number.isNaN(parsed.getTime())) {
		throw new ApiError(
			'Las fechas proporcionadas no son válidas',
			400,
			EXPORT_RANGE_ERROR.INVALID,
		)
	}

	return parsed
}

function calculateInclusiveDayCount(fromDate: Date, toDate: Date): number {
	const millisecondsPerDay = 24 * 60 * 60 * 1000
	return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
}

export function resolveBoundedExportRange(
	input: ExportRangeInput,
): ExportRangeResolution {
	if (!input.from || !input.to) {
		throw new ApiError(
			'Los exports requieren un rango acotado con from y to.',
			400,
			EXPORT_RANGE_ERROR.REQUIRED,
			{
				field: input.field,
				maxDays: EXPORT_RANGE_MAX_DAYS,
				requiresBoundedRange: true,
			},
		)
	}

	const fromDate = parseDateOnly(input.from, 'start')
	const toDate = parseDateOnly(input.to, 'end')

	if (fromDate.getTime() > toDate.getTime()) {
		throw new ApiError(
			'La fecha inicial no puede ser mayor que la fecha final.',
			400,
			EXPORT_RANGE_ERROR.INVALID,
		)
	}

	const dayCount = calculateInclusiveDayCount(fromDate, toDate)

	if (dayCount > EXPORT_RANGE_MAX_DAYS) {
		throw new ApiError(
			`El rango máximo permitido es de ${EXPORT_RANGE_MAX_DAYS} días.`,
			400,
			EXPORT_RANGE_ERROR.TOO_WIDE,
			{
				field: input.field,
				from: input.from,
				to: input.to,
				dayCount,
				maxDays: EXPORT_RANGE_MAX_DAYS,
				requiresNarrowerRange: true,
			},
		)
	}

	return {
		fromDate,
		toDate,
		metadata: {
			field: input.field,
			from: input.from,
			to: input.to,
			dayCount,
			maxDays: EXPORT_RANGE_MAX_DAYS,
			bounded: true,
			capped: false,
			rejected: false,
		},
	}
}

export function buildExportMetadataHeaders(
	metadata: ExportRangeMetadata,
	recordCount: number,
): Record<string, string> {
	return {
		'X-Export-Bounds': 'enforced',
		'X-Export-Range-Field': metadata.field,
		'X-Export-Range-From': metadata.from,
		'X-Export-Range-To': metadata.to,
		'X-Export-Range-Days': String(metadata.dayCount),
		'X-Export-Max-Days': String(metadata.maxDays),
		'X-Export-Capped': String(metadata.capped),
		'X-Export-Rejected': String(metadata.rejected),
		'X-Export-Record-Count': String(recordCount),
	}
}
