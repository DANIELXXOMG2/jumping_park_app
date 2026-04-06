import { ApiError } from '@/lib/apiHandler'
import {
	evaluateHardeningFlag,
	HARDENING_FLAG,
	type HardeningEvaluation,
	type HardeningSource,
} from '@/lib/hardeningPolicy'

const EXPORT_RANGE_ERROR = {
	REQUIRED: 'EXPORT_RANGE_REQUIRED',
	INVALID: 'EXPORT_RANGE_INVALID',
	TOO_WIDE: 'EXPORT_RANGE_TOO_WIDE',
} as const

export const EXPORT_RANGE_MAX_DAYS = 30
export const EXPORT_FALLBACK_ROW_CAP = 5000

const EXPORT_RANGE_MIN_DATE = new Date('1970-01-01T00:00:00.000Z')
const EXPORT_RANGE_MAX_DATE = new Date('9999-12-31T23:59:59.999Z')

export interface ExportRangeInput {
	from?: string
	to?: string
	field: string
	source?: HardeningSource
	route?: string
}

export interface ExportRangeMetadata {
	field: string
	from: string | null
	to: string | null
	dayCount: number | null
	maxDays: number
	bounded: boolean
	capped: false
	rejected: false
	rowCap: number
}

export interface ExportRangeResolution {
	fromDate: Date | null
	toDate: Date | null
	metadata: ExportRangeMetadata
	hardening: HardeningEvaluation
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
	return (
		Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
	)
}

function evaluateExportBoundsPolicy(
	input: ExportRangeInput,
): HardeningEvaluation {
	return evaluateHardeningFlag({
		featureName: HARDENING_FLAG.EXPORT_BOUNDS,
		source: input.source ?? 'admin-export-users',
		route: input.route,
		details: {
			has_from: Boolean(input.from),
			has_to: Boolean(input.to),
		},
	})
}

export function resolveBoundedExportRange(
	input: ExportRangeInput,
): ExportRangeResolution {
	const hardening = evaluateExportBoundsPolicy(input)

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
			rowCap: EXPORT_FALLBACK_ROW_CAP,
		},
		hardening,
	}
}

export function resolveExportRange(
	input: ExportRangeInput,
): ExportRangeResolution {
	const hardening = evaluateExportBoundsPolicy(input)

	if (hardening.enabled) {
		return {
			...resolveBoundedExportRange(input),
			hardening,
		}
	}

	const parsedFrom = input.from ? parseDateOnly(input.from, 'start') : null
	const parsedTo = input.to ? parseDateOnly(input.to, 'end') : null

	if (
		parsedFrom !== null &&
		parsedTo !== null &&
		parsedFrom.getTime() > parsedTo.getTime()
	) {
		throw new ApiError(
			'La fecha inicial no puede ser mayor que la fecha final.',
			400,
			EXPORT_RANGE_ERROR.INVALID,
		)
	}

	const fromDate = parsedFrom ?? (parsedTo ? EXPORT_RANGE_MIN_DATE : null)
	const toDate = parsedTo ?? (parsedFrom ? EXPORT_RANGE_MAX_DATE : null)
	const dayCount =
		parsedFrom !== null && parsedTo !== null
			? calculateInclusiveDayCount(parsedFrom, parsedTo)
			: null

	return {
		fromDate,
		toDate,
		metadata: {
			field: input.field,
			from: input.from ?? null,
			to: input.to ?? null,
			dayCount,
			maxDays: EXPORT_RANGE_MAX_DAYS,
			bounded: fromDate !== null && toDate !== null,
			capped: false,
			rejected: false,
			rowCap: EXPORT_FALLBACK_ROW_CAP,
		},
		hardening,
	}
}

export function buildExportFilenameLabel(metadata: ExportRangeMetadata): string {
	if (metadata.from && metadata.to) {
		return `${metadata.from}_a_${metadata.to}`
	}

	if (metadata.from) {
		return `${metadata.from}_en_adelante`
	}

	if (metadata.to) {
		return `hasta_${metadata.to}`
	}

	return 'completo'
}

export function buildExportMetadataHeaders(
	metadata: ExportRangeMetadata,
	recordCount: number,
): Record<string, string> {
	return {
		'X-Export-Bounds': metadata.bounded ? 'enforced' : 'bypassed',
		'X-Export-Range-Field': metadata.field,
		'X-Export-Range-From': metadata.from ?? 'unbounded',
		'X-Export-Range-To': metadata.to ?? 'unbounded',
		'X-Export-Range-Days':
			metadata.dayCount === null ? 'unbounded' : String(metadata.dayCount),
		'X-Export-Max-Days': String(metadata.maxDays),
		'X-Export-Row-Cap': String(metadata.rowCap),
		'X-Export-Capped': String(metadata.capped),
		'X-Export-Rejected': String(metadata.rejected),
		'X-Export-Record-Count': String(recordCount),
	}
}
