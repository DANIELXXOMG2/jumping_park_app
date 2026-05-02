/**
 * API Route: /api/admin/export/consents
 * Exporta consentimientos en formato CSV con rango acotado obligatorio.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { ApiError, apiHandler } from "@/lib/apiHandler";
import {
	buildHardeningHeaders,
	HARDENING_FLAG,
	resolveHardeningFlag,
} from "@/lib/hardeningPolicy";
import { buildConsentsCsvExport } from "@/services/adminExportService";
import {
	buildExportFilenameLabel,
	buildExportMetadataHeaders,
	type ExportRangeResolution,
	resolveExportRange,
} from "@/services/exportRangeService";

interface ConsentsExportRouteDeps {
	verifyAdminTokenWithPermission: typeof verifyAdminTokenWithPermission;
	buildConsentsCsvExport: (range: ExportRangeResolution) => Promise<{
		csv: string;
		rowCount: number;
		generatedAt?: string;
		source?: "live";
	}>;
}

const defaultConsentsExportRouteDeps: ConsentsExportRouteDeps = {
	verifyAdminTokenWithPermission,
	buildConsentsCsvExport,
};

export async function handleConsentsExport(
	request: NextRequest,
	deps: ConsentsExportRouteDeps = defaultConsentsExportRouteDeps,
): Promise<NextResponse> {
	const authResult = await deps.verifyAdminTokenWithPermission(
		request,
		"consents:export",
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
			field: "signedAt",
			source: "admin-export-consents",
			route: "/api/admin/export/consents",
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

	const exportResult = await deps.buildConsentsCsvExport(range);
	const generatedAt = exportResult.generatedAt ?? new Date().toISOString();
	const source = exportResult.source ?? "live";
	const { csv, rowCount } = exportResult;
	const filename = `consentimientos_${buildExportFilenameLabel(range.metadata)}.csv`;

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
	handleConsentsExport(request),
);
