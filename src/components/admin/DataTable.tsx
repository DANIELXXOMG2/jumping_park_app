"use client";

import { ChevronLeft, ChevronRight, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
	key: string;
	header: string;
	render?: (item: T) => React.ReactNode;
	className?: string;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	keyExtractor: (item: T) => string;
	onRowClick?: (item: T) => void;
	isLoading?: boolean;
	emptyMessage?: string;
	/** Indica si los datos provienen de caché local (modo offline) */
	fromCache?: boolean;
	pagination?: {
		total: number;
		limit: number;
		offset: number;
		onPageChange: (offset: number) => void;
	};
}

export function DataTable<T extends object>({
	data,
	columns,
	keyExtractor,
	onRowClick,
	isLoading,
	emptyMessage = "No hay datos disponibles",
	fromCache = false,
	pagination,
}: DataTableProps<T>) {
	const totalPages = pagination
		? Math.ceil(pagination.total / pagination.limit)
		: 1;
	const currentPage = pagination
		? Math.floor(pagination.offset / pagination.limit) + 1
		: 1;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center py-12 text-foreground/50">
				{emptyMessage}
			</div>
		);
	}

	const getValueByKey = (item: T, key: string): unknown => {
		return (item as Record<string, unknown>)[key];
	};

	return (
		<div className="w-full">
			{/* Cache Warning Banner */}
			{fromCache && (
				<div
					className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning"
					role="alert"
				>
					<CloudOff className="w-4 h-4 shrink-0" />
					<p>
						<strong>Datos locales:</strong> Esta información podría no estar
						actualizada. Se sincronizará cuando vuelva la conexión.
					</p>
				</div>
			)}

			{/* Desktop Table */}
			<div className={cn(
				"hidden lg:block overflow-x-auto",
				fromCache && "ring-2 ring-warning/30 rounded-lg"
			)}>
				<table className="w-full">
					<thead>
						<tr className="border-b border-border">
							{columns.map((column) => (
								<th
									key={column.key}
									className={cn(
										"px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60",
										column.className,
									)}
								>
									{column.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr
								key={keyExtractor(item)}
								onClick={() => onRowClick?.(item)}
								className={cn(
									"border-b border-border/50 transition-colors",
									onRowClick && "cursor-pointer hover:bg-surface-muted",
								)}
							>
								{columns.map((column) => (
									<td
										key={column.key}
										className={cn(
											"px-4 py-4 text-sm text-foreground/80",
											column.className,
										)}
									>
										{column.render
											? column.render(item)
											: String(getValueByKey(item, column.key) ?? "-")}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Cards */}
			<div className={cn(
				"lg:hidden space-y-3",
				fromCache && "ring-2 ring-warning/30 rounded-lg p-2"
			)}>
				{data.map((item) => (
					<button
						type="button"
						key={keyExtractor(item)}
						onClick={() => onRowClick?.(item)}
						className={cn(
							"bg-surface-muted rounded-lg p-4 border border-border/50 w-full text-left",
							onRowClick && "cursor-pointer active:bg-surface",
						)}
					>
						{columns.map((column) => (
							<div
								key={column.key}
								className="flex items-center justify-between py-1.5"
							>
								<span className="text-xs font-medium text-foreground/50 uppercase">
									{column.header}
								</span>
								<span className="text-sm text-foreground/80">
									{column.render
										? column.render(item)
										: String(getValueByKey(item, column.key) ?? "-")}
								</span>
							</div>
						))}
					</button>
				))}
			</div>

			{/* Pagination */}
			{pagination && totalPages > 1 && (
				<div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
					<p className="text-sm text-foreground/50">
						Mostrando {pagination.offset + 1} -{" "}
						{Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
						de {pagination.total}
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() =>
								pagination.onPageChange(
									Math.max(0, pagination.offset - pagination.limit),
								)
							}
							disabled={currentPage === 1}
							className="p-2 rounded-lg bg-surface-muted border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors min-h-0"
							aria-label="Página anterior"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="text-sm text-foreground/70 px-2">
							{currentPage} / {totalPages}
						</span>
						<button
							type="button"
							onClick={() =>
								pagination.onPageChange(pagination.offset + pagination.limit)
							}
							disabled={currentPage === totalPages}
							className="p-2 rounded-lg bg-surface-muted border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors min-h-0"
							aria-label="Página siguiente"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
