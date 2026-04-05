import { getDocsByDateRange } from '@/lib/firestoreService'
import type { ExportRangeResolution } from '@/services/exportRangeService'
import type { Consent, UserProfile } from '@/types/firestore'

const CSV_BOM = '\uFEFF'

type ExportableUser = UserProfile & { id?: string }
type ExportableConsent = Consent & { id?: string }

function formatDateTime(timestamp: unknown): string {
	if (!timestamp) return ''

	let date: Date
	if (timestamp instanceof Date) {
		date = timestamp
	} else if (
		typeof timestamp === 'object' &&
		timestamp !== null &&
		'toDate' in timestamp
	) {
		date = (timestamp as { toDate: () => Date }).toDate()
	} else {
		return ''
	}

	return date.toLocaleString('es-CO', {
		timeZone: 'America/Bogota',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function escapeCsv(value: string | number | undefined | null): string {
	if (value === null || value === undefined) return ''
	const str = String(value)
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`
	}

	return str
}

function buildCsv(headers: string[], rows: string[]): string {
	return `${CSV_BOM}${[headers.join(','), ...rows].join('\n')}`
}

export async function buildUsersCsvExport(
	range: ExportRangeResolution,
): Promise<{ csv: string; rowCount: number }> {
	const users = await getDocsByDateRange('users', {
		field: 'createdAt',
		from: range.fromDate,
		to: range.toDate,
		orderBy: 'createdAt',
		orderDirection: 'desc',
		limit: 5000,
	})

	const headers = [
		'Cédula',
		'Nombre Completo',
		'Email',
		'Teléfono',
		'Dirección',
		'Cantidad Menores',
		'Fecha Registro',
		'Última Actualización',
	]

	const rows = users.map((userDoc) => {
		const user = userDoc as ExportableUser

		return [
			escapeCsv(user.uid || userDoc.id),
			escapeCsv(user.fullName),
			escapeCsv(user.email),
			escapeCsv(user.phone),
			escapeCsv(user.address),
			escapeCsv(user.minors?.length || 0),
			escapeCsv(formatDateTime(user.createdAt)),
			escapeCsv(formatDateTime(user.updatedAt)),
		].join(',')
	})

	return {
		csv: buildCsv(headers, rows),
		rowCount: users.length,
	}
}

export async function buildConsentsCsvExport(
	range: ExportRangeResolution,
): Promise<{ csv: string; rowCount: number }> {
	const consents = await getDocsByDateRange('consents', {
		field: 'signedAt',
		from: range.fromDate,
		to: range.toDate,
		orderBy: 'signedAt',
		orderDirection: 'desc',
		limit: 5000,
	})

	const headers = [
		'Consecutivo',
		'Fecha Firma',
		'Cédula Responsable',
		'Nombre Responsable',
		'Email',
		'Teléfono',
		'Cantidad Participantes',
		'Participantes',
		'Válido Hasta',
		'Estado',
	]

	const rows = consents.map((consentDoc) => {
		const consent = consentDoc as ExportableConsent
		const validUntil = consent.validUntil
		let isValid = false

		if (validUntil) {
			const validDate =
				validUntil instanceof Date
					? validUntil
					: (validUntil as { toDate: () => Date }).toDate()
			isValid = validDate > new Date()
		}

		const minorsList = (consent.minorsSnapshot || [])
			.map(
				(minor) =>
					minor.fullName ||
					`${minor.firstName || ''} ${minor.lastName || ''}`.trim(),
			)
			.join('; ')

		return [
			escapeCsv(consent.consecutivo),
			escapeCsv(formatDateTime(consent.signedAt)),
			escapeCsv(consent.adultSnapshot?.uid),
			escapeCsv(consent.adultSnapshot?.fullName),
			escapeCsv(consent.adultSnapshot?.email),
			escapeCsv(consent.adultSnapshot?.phone),
			escapeCsv(consent.minorsSnapshot?.length || 0),
			escapeCsv(minorsList),
			escapeCsv(formatDateTime(consent.validUntil)),
			escapeCsv(isValid ? 'Vigente' : 'Vencido'),
		].join(',')
	})

	return {
		csv: buildCsv(headers, rows),
		rowCount: consents.length,
	}
}
