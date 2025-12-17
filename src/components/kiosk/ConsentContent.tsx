"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	type ConsentClause,
	type ConsentContentStructure,
	getConsentContent,
	type ParkRule,
	replaceCompanyName,
} from "@/lib/data/legalContent";
import { cn } from "@/lib/utils";

interface ConsentContentProps {
	/** Variante de tamaño: 'compact' para scroll pequeño, 'expanded' para modal */
	variant?: "compact" | "expanded";
}

/**
 * Componente interno para resaltar texto crítico del consentimiento.
 * Aplica estilo visual de advertencia (fondo suave + borde lateral fucsia).
 */
function Highlight({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"block bg-pink-500/10 border-l-4 border-pink-500 text-pink-200 pl-3 py-2 my-1 rounded-r-md",
				className,
			)}
		>
			{children}
		</span>
	);
}

/**
 * Renderiza una cláusula del consentimiento.
 */
function ClauseItem({
	clause,
	companyName,
}: {
	clause: ConsentClause;
	companyName: string;
}) {
	// Resaltar el nombre de la empresa en negrita
	const formattedText = clause.text
		.split(companyName)
		.reduce<ReactNode[]>((acc, part, index, array) => {
			if (index < array.length - 1) {
				return [...acc, part, <strong key={index}>{companyName}</strong>];
			}
			return [...acc, part];
		}, []);

	if (clause.highlight) {
		return (
			<li>
				<Highlight>
					<strong>
						{clause.icon} {clause.highlightLabel}:
					</strong>{" "}
					{formattedText}
				</Highlight>
			</li>
		);
	}

	// Cláusula 16 tiene todo en negrita (decisiones del personal)
	if (clause.id === 16) {
		return (
			<li>
				<strong>{formattedText}</strong>
			</li>
		);
	}

	return <li>{formattedText}</li>;
}

/**
 * Renderiza una regla del parque.
 */
function RuleItem({ rule }: { rule: ParkRule }) {
	if (rule.highlight) {
		return (
			<li>
				<Highlight>
					<strong>
						{rule.icon} {rule.highlightLabel}:
					</strong>{" "}
					{rule.text}
				</Highlight>
			</li>
		);
	}

	return <li>{rule.text}</li>;
}

/**
 * Componente de contenido del consentimiento informado.
 * Lee el contenido desde API (Firestore) con fallback al contenido estático.
 */
export function ConsentContent({ variant = "compact" }: ConsentContentProps) {
	const isExpanded = variant === "expanded";

	// Contenido inicial estático para carga instantánea
	const defaultContent = useMemo(() => getConsentContent(), []);

	// Estado para el contenido dinámico
	const [content, setContent] =
		useState<ConsentContentStructure>(defaultContent);
	const [_isLoading, setIsLoading] = useState(true);

	// Fetch del contenido desde API
	useEffect(() => {
		const fetchContent = async () => {
			try {
				const response = await fetch("/api/settings/consent");
				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						// Procesar el contenido para reemplazar placeholders
						const companyName = result.data.meta.companyName;
						const processedClauses = result.data.consent.clauses.map(
							(clause: ConsentClause) => ({
								...clause,
								text: replaceCompanyName(clause.text, companyName),
							}),
						);

						setContent({
							...result.data,
							consent: {
								...result.data.consent,
								clauses: processedClauses,
							},
						});
					}
				}
			} catch (error) {
				console.error("Error fetching consent content:", error);
				// Mantener el contenido por defecto en caso de error
			} finally {
				setIsLoading(false);
			}
		};

		fetchContent();
	}, []);

	const { consent, rules, meta } = content;

	return (
		<div className={cn("space-y-4", isExpanded && "space-y-6")}>
			{/* === SECCIÓN: CONSENTIMIENTO INFORMADO === */}
			<h3
				className={cn(
					"font-bold text-center uppercase",
					isExpanded ? "text-xl sm:text-2xl" : "text-lg",
				)}
			>
				{consent.title}
			</h3>

			<p className={cn("text-center font-semibold", isExpanded && "text-lg")}>
				&quot;{consent.subtitle}&quot;
			</p>

			<p>
				{consent.introduction.split("CON MI FIRMA, MANIFIESTO QUE:")[0]}
				<strong>CON MI FIRMA, MANIFIESTO QUE:</strong>
			</p>

			<ol
				className={cn(
					"list-decimal pl-6",
					isExpanded ? "space-y-3" : "space-y-2",
				)}
			>
				{consent.clauses.map((clause) => (
					<ClauseItem
						key={clause.id}
						clause={clause}
						companyName={meta.companyName}
					/>
				))}
			</ol>

			<p className="font-semibold">{consent.closingStatement}</p>

			{/* === SEPARADOR === */}
			<hr
				className={cn(
					"border-gray-300 dark:border-gray-700",
					isExpanded ? "my-8" : "my-6",
				)}
			/>

			{/* === SECCIÓN: REGLAS DEL PARQUE === */}
			<h3
				className={cn(
					"font-bold text-center uppercase",
					isExpanded ? "text-xl sm:text-2xl" : "text-lg",
				)}
			>
				{rules.title}
			</h3>

			<p>{rules.introduction}</p>

			<ul
				className={cn("list-disc pl-6", isExpanded ? "space-y-2" : "space-y-1")}
			>
				{rules.items.map((rule) => (
					<RuleItem key={rule.id} rule={rule} />
				))}
			</ul>

			<p
				className={cn(
					"text-center font-bold",
					isExpanded ? "text-xl mt-8" : "mt-4",
				)}
			>
				{rules.closingMessage}
			</p>
		</div>
	);
}
