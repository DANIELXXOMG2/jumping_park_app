"use client";

import { Eye, FileText, MoreHorizontal, PenTool, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Consent } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";
import type { ReactNode } from "react";

interface ConsentTableColumn {
	key: string;
	header: string;
	render?: (consent: Consent) => ReactNode;
}

interface ConsentTableActions {
	onView: (consent: Consent) => void;
	onDownloadPdf: (consent: Consent) => void;
	onViewSignature?: (consent: Consent) => void;
	onDelete?: (consent: Consent) => void;
}

interface ConsentTableProps {
	consents: Consent[];
	isLoading?: boolean;
	fromCache?: boolean;
	emptyMessage?: string;
	actions: ConsentTableActions;
	isValidConsent: (validUntil: string | null) => boolean;
	pagination?: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
		onPageChange: (offset: number) => void;
	};
	/** Columnas adicionales a mostrar (ej: para vista de admin general) */
	showContactColumn?: boolean;
}

/**
 * Tabla reutilizable para mostrar consentimientos.
 * Usado tanto en la vista general de consentimientos como en el detalle de usuario.
 */
export function ConsentTable({
	consents,
	isLoading = false,
	fromCache = false,
	emptyMessage = "No se encontraron consentimientos",
	actions,
	isValidConsent,
	pagination,
	showContactColumn = true,
}: ConsentTableProps) {
	const baseColumns: ConsentTableColumn[] = [
		{
			key: "consecutivo",
			header: "#",
			render: (consent: Consent) => (
				<Badge variant="info">#{consent.consecutivo}</Badge>
			),
		},
		{
			key: "adultName",
			header: "Responsable",
			render: (consent: Consent) => (
				<div>
					<p className="font-medium" data-pii="admin-consent-adult-name">
						{consent.adultName}
					</p>
					<p
						className="text-xs text-foreground/50"
						data-pii="admin-consent-adult-userid"
					>
						{consent.userId}
					</p>
				</div>
			),
		},
	];

	const contactColumn: ConsentTableColumn = {
		key: "adultEmail",
		header: "Contacto",
		render: (consent: Consent) => (
			<div className="text-xs">
				<p className="text-foreground/70" data-pii="admin-consent-adult-email">
					{consent.adultEmail}
				</p>
				<p className="text-foreground/50" data-pii="admin-consent-adult-phone">
					{consent.adultPhone}
				</p>
			</div>
		),
	};

	const commonColumns: ConsentTableColumn[] = [
		{
			key: "minorsCount",
			header: "Participantes",
			render: (consent: Consent) => (
				<Badge variant="default">{consent.minorsCount}</Badge>
			),
		},
		{
			key: "validUntil",
			header: "Estado",
			render: (consent: Consent) => (
				<Badge
					variant={isValidConsent(consent.validUntil) ? "success" : "error"}
				>
					{isValidConsent(consent.validUntil) ? "Vigente" : "Vencido"}
				</Badge>
			),
		},
		{
			key: "signedAt",
			header: "Firmado",
			render: (consent: Consent) => (
				<span className="text-xs text-foreground/50">
					{consent.signedAt ? formatRelativeTime(consent.signedAt) : "-"}
				</span>
			),
		},
		{
			key: "actions",
			header: "",
			render: (consent: Consent) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="p-2 rounded-lg hover:bg-surface-muted transition-colors"
							onClick={(e) => e.stopPropagation()}
							aria-label="Abrir menú de acciones"
						>
							<MoreHorizontal className="w-4 h-4 text-foreground/60" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								actions.onView(consent);
							}}
						>
							<Eye className="w-4 h-4" />
							Ver Detalle
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								actions.onDownloadPdf(consent);
							}}
						>
							<FileText className="w-4 h-4" />
							Descargar PDF
						</DropdownMenuItem>
						{consent.signatureStatus === "available" &&
							actions.onViewSignature && (
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										actions.onViewSignature?.(consent);
									}}
								>
									<PenTool className="w-4 h-4" />
									Ver Firma
								</DropdownMenuItem>
							)}
						{actions.onDelete && (
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									actions.onDelete?.(consent);
								}}
								className="text-red-600 focus:text-red-600"
							>
								<Trash2 className="w-4 h-4" />
								Eliminar
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	const columns = showContactColumn
		? [...baseColumns, contactColumn, ...commonColumns]
		: [...baseColumns, ...commonColumns];

	return (
		<DataTable
			data={consents}
			columns={columns}
			keyExtractor={(consent) => consent.id}
			onRowClick={actions.onView}
			getRowAriaLabel={(consent) =>
				`Abrir consentimiento #${consent.consecutivo} de ${consent.adultName}`
			}
			isLoading={isLoading}
			fromCache={fromCache}
			emptyMessage={emptyMessage}
			pagination={pagination}
		/>
	);
}
