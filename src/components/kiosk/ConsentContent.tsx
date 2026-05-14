"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	type ConsentClause,
	type ConsentContentStructure,
	getConsentContent,
	type ParkRule,
	replaceCompanyName,
} from "@/lib/data/legalContent";
import { validateLocalizedContent } from "@/lib/schemas/legalContent.schema";
import { cn } from "@/lib/utils";

interface ConsentContentProps {
	/** Variante de tamaño: 'compact' para scroll pequeño, 'expanded' para modal */
	variant?: "compact" | "expanded";
}

/**
 * Componente interno para resaltar texto crítico del consentimiento.
 * Aplica estilo visual de advertencia con alto contraste para ambos modos (light/dark).
 * AAA Compliant: texto oscuro sobre fondo claro en light mode, texto claro sobre fondo oscuro en dark mode.
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
				// Light mode: fondo rosa suave con texto MUY oscuro para alto contraste
				"block bg-rose-100 border-l-4 border-rose-500 text-rose-950 pl-3 py-2 my-1 rounded-r-md",
				// Dark mode: fondo semi-transparente oscuro con texto claro
				"dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-400",
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
	const parts = clause.text.split(companyName);
	const formattedText = parts.flatMap((part, idx) =>
		idx < parts.length - 1
			? [
					part,
					<strong key={`${clause.id}-company-${idx}`}>{companyName}</strong>,
				]
			: [part],
	);

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
 * Soporta múltiples idiomas (es/en) mediante el contexto de idioma.
 */
export function ConsentContent({ variant = "compact" }: ConsentContentProps) {
	const isExpanded = variant === "expanded";
	const { language } = useLanguage();

	// Contenido inicial estático para carga instantánea (basado en idioma actual)
	const defaultContent = useMemo(() => getConsentContent(language), [language]);

	// Estado para el contenido dinámico
	const [content, setContent] =
		useState<ConsentContentStructure>(defaultContent);
	const [_isLoading, setIsLoading] = useState(true);

	// Actualizar contenido cuando cambie el idioma
	useEffect(() => {
		setContent(getConsentContent(language));
	}, [language]);

	// Fetch del contenido desde API (con soporte de idioma)
	// Confía en la DB: si los datos tienen estructura válida, los usa.
	// Solo hace fallback al estático si la estructura está corrupta o hay error.
	useEffect(() => {
		const fetchContent = async () => {
			try {
				const response = await fetch(`/api/settings/consent?lang=${language}`);
				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						const apiData = result.data;

						// Validar ESTRUCTURA de un solo idioma (no cantidad) usando Zod
						const validation = validateLocalizedContent(apiData);

						if (!validation.success) {
							console.warn(
								`[ConsentContent] API returned invalid structure: ${validation.error}. Using static content.`,
							);
							// Estructura corrupta → usar contenido estático
							setIsLoading(false);
							return;
						}

						// Estructura válida → procesar y usar datos de la DB
						const validData = validation.data;
						const companyName = validData.meta.companyName;

						// Procesar el contenido para reemplazar placeholders
						const processedClauses = validData.consent.clauses.map(
							(clause) => ({
								...clause,
								text: replaceCompanyName(clause.text, companyName),
							}),
						);

						setContent({
							...validData,
							consent: {
								...validData.consent,
								clauses: processedClauses,
							},
						});

						console.info(
							`[ConsentContent] Using Firestore data (clauses: ${validData.consent.clauses.length}, rules: ${validData.rules.items.length})`,
						);
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
	}, [language]);

	const { consent, rules, meta } = content;

	// Determinar el texto de "firma" según el idioma para el split de la introducción
	const signatureText =
		language === "en"
			? "BY MY SIGNATURE, DECLARE THAT:"
			: "CON MI FIRMA, MANIFIESTO QUE:";

	// Dividir la introducción en dos partes para resaltar la firma
	const introductionParts = consent.introduction.split(signatureText);
	const hasSignatureSplit = introductionParts.length > 1;

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

			{hasSignatureSplit ? (
				<p>
					{introductionParts[0]}
					<strong>{signatureText}</strong>
				</p>
			) : (
				<p>{consent.introduction}</p>
			)}

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
