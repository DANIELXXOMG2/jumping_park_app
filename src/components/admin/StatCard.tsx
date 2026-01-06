"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: LucideIcon;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
}

export function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	trend,
	className,
}: StatCardProps) {
	return (
		<div
			className={cn(
				"bg-surface rounded-xl border border-border p-3 sm:p-4 lg:p-6",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<p className="text-xs sm:text-sm font-medium text-foreground/60 truncate">{title}</p>
					<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-1">
						{value}
					</p>
					{subtitle && (
						<p className="text-[10px] sm:text-xs text-foreground/50 mt-0.5 sm:mt-1 truncate">{subtitle}</p>
					)}
					{trend && (
						<div className="flex items-center gap-1 mt-1 sm:mt-2">
							<span
								className={cn(
									"text-[10px] sm:text-xs font-medium",
									trend.isPositive ? "text-green-400" : "text-red-400",
								)}
							>
								{trend.isPositive ? "+" : ""}
								{trend.value}%
							</span>
							<span className="text-[10px] sm:text-xs text-foreground/40">vs ayer</span>
						</div>
					)}
				</div>
				<div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
					<Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
				</div>
			</div>
		</div>
	);
}
