import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
	children: ReactNode;
	className?: string;
}

export function Card({ children, className }: CardProps) {
	return (
		<div
			className={cn(
				"bg-surface rounded-xl border border-border p-3 sm:p-4 lg:p-6",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface CardHeaderProps {
	children: ReactNode;
	className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
	return (
		<div className={cn("flex items-center justify-between mb-3 sm:mb-4", className)}>
			{children}
		</div>
	);
}

interface CardTitleProps {
	children: ReactNode;
	className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
	return (
		<h3 className={cn("text-base sm:text-lg font-semibold text-foreground", className)}>
			{children}
		</h3>
	);
}

interface CardContentProps {
	children: ReactNode;
	className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
	return <div className={className}>{children}</div>;
}
