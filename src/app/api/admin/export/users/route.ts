/**
 * API Route: /api/admin/export/users
 * Exporta usuarios en formato CSV con rango acotado obligatorio.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { verifyAdminTokenWithPermission } from '@/lib/adminAuth'
import { apiHandler } from '@/lib/apiHandler'
import { buildUsersCsvExport } from '@/services/adminExportService'
import {
	buildExportMetadataHeaders,
	resolveBoundedExportRange,
} from '@/services/exportRangeService'

export const GET = apiHandler(async (request: NextRequest) => {
	const authResult = await verifyAdminTokenWithPermission(request, 'users:view')
	if (!authResult.success) {
		return authResult.response
	}

	const { searchParams } = new URL(request.url)
	const range = resolveBoundedExportRange({
		from: searchParams.get('from') || undefined,
		to: searchParams.get('to') || undefined,
		field: 'createdAt',
	})

	const { csv, rowCount } = await buildUsersCsvExport(range)
	const filename = `usuarios_${range.metadata.from}_a_${range.metadata.to}.csv`

	return new NextResponse(csv, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			...buildExportMetadataHeaders(range.metadata, rowCount),
		},
	})
})
