/**
 * API Route: /api/admin/export/users
 * Exporta usuarios en formato CSV con rango acotado obligatorio.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { ApiError, apiHandler } from "@/lib/apiHandler";
import {
	buildHardeningHeaders,
	HARDENING_FLAG,
	resolveHardeningFlag,
} from "@/lib/hardeningPolicy";
import { buildUsersCsvExport } from "@/services/adminExportService";
import {
	buildExportFilenameLabel,
	buildExportMetadataHeaders,
	type ExportRangeResolution,
	resolveExportRange,
} from "@/services/exportRangeService";

interface UsersExportRouteDeps {
	verifyAdminTokenWithPermission: typeof verifyAdminTokenWithPermission;
	buildUsersCsvExport: (range: ExportRangeResolution) => Promise<{
		csv: string;
		rowCount: number;
		generatedAt?: string;
		source?: "live";
	}>;
}

const defaultUsersExportRouteDeps: UsersExportRouteDeps = {
	verifyAdminTokenWithPermission,
	buildUsersCsvExport,
};

export async function handleUsersExport(
	request: NextRequest,
	deps: UsersExportRouteDeps = defaultUsersExportRouteDeps,
): Promise<NextResponse> {
	const authResult = await deps.verifyAdminTokenWithPermission(
		request,
		"users:view",
	);
	if (!authResult.success) {
		return authResult.response;
	}

	const { searchParams } = new URL(request.url);
	let range: ExportRangeResolution;

	try {
		range = resolveExportRange({
			from: searchParams.get("from") || undefined,
			to: searchParams.get("to") || undefined,
			field: "createdAt",
			source: "admin-export-users",
			route: "/api/admin/export/users",
		});
	} catch (error) {
		if (error instanceof ApiError) {
			return NextResponse.json(
				{
					error: error.message,
					code: error.code,
					details: error.details,
				},
				{
					status: error.statusCode,
					headers: buildHardeningHeaders(
						resolveHardeningFlag(HARDENING_FLAG.EXPORT_BOUNDS),
					),
				},
			);
		}

		throw error;
	}

	const exportResult = await deps.buildUsersCsvExport(range);
	const generatedAt = exportResult.generatedAt ?? new Date().toISOString();
	const source = exportResult.source ?? "live";
	const { csv, rowCount } = exportResult;
	const filename = `usuarios_${buildExportFilenameLabel(range.metadata)}.csv`;

	return new NextResponse(csv, {
		status: 200,
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${filename}"`,
			...range.hardening.headers,
			...buildExportMetadataHeaders(
				range.metadata,
				rowCount,
				generatedAt,
				source,
			),
		},
	});
}

export const GET = apiHandler(async (request: NextRequest) =>
	handleUsersExport(request),
);
