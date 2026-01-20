"use client";

import { Building2, ChevronDown, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import {
	type EPSOption,
	getEPSByRegimen,
	type RegimenType,
	regimenesOptions,
} from "@/lib/data/epsColombiaData";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface EPSSelectorProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
	className?: string;
}

/**
 * Parsea el valor inicial para determinar régimen, EPS y valor custom
 */
function parseInitialValue(value: string): {
	regimen: RegimenType | "";
	eps: string;
	custom: string;
} {
	if (!value) {
		return { regimen: "", eps: "", custom: "" };
	}

	// Caso: valor manual con prefijo "otra_manual:"
	if (value.startsWith("otra_manual:")) {
		return {
			regimen: "contributivo",
			eps: "otra",
			custom: value.replace("otra_manual:", ""),
		};
	}

	// Caso: particular o prepagada
	if (value === "particular" || value === "prepagada") {
		return { regimen: "particular", eps: value, custom: "" };
	}

	// Caso: buscar EPS en las listas para determinar régimen
	const allOptions = [
		...getEPSByRegimen("contributivo"),
		...getEPSByRegimen("subsidiado"),
		...getEPSByRegimen("especial"),
	];
	const found = allOptions.find((eps) => eps.value === value);
	if (found) {
		return { regimen: found.regimen[0], eps: value, custom: "" };
	}

	return { regimen: "", eps: "", custom: "" };
}

/**
 * Selector de EPS estandarizado para Colombia
 *
 * Flujo:
 * 1. Usuario selecciona el régimen (Contributivo, Subsidiado, Especial, Particular)
 * 2. Se muestran las EPS disponibles para ese régimen
 * 3. Si selecciona "Otra", aparece un input para escribir manualmente
 */
export function EPSSelector({
	value,
	onChange,
	error,
	className,
}: EPSSelectorProps) {
	const { t, language } = useLanguage();
	
	// Lazy initialization: parsear valor inicial una sola vez
	const [selectedRegimen, setSelectedRegimen] = useState<RegimenType | "">(
		() => parseInitialValue(value).regimen,
	);
	const [selectedEPS, setSelectedEPS] = useState<string>(
		() => parseInitialValue(value).eps,
	);
	const [customEPS, setCustomEPS] = useState<string>(
		() => parseInitialValue(value).custom,
	);

	// Derivar availableEPS con useMemo en lugar de estado + useEffect
	const availableEPS = useMemo<EPSOption[]>(() => {
		if (!selectedRegimen) return [];
		return getEPSByRegimen(selectedRegimen);
	}, [selectedRegimen]);

	// Obtener labels traducidos para los regímenes
	const getRegimenLabel = (regimen: RegimenType): string => {
		const key = `forms.health.options.${regimen}` as const;
		return t(key as Parameters<typeof t>[0]);
	};

	// Manejar cambio de régimen
	const handleRegimenChange = (regimen: RegimenType) => {
		setSelectedRegimen(regimen);
		setSelectedEPS("");
		setCustomEPS("");
		onChange(""); // Limpiar valor padre
	};

	// Manejar cambio de EPS
	const handleEPSChange = (epsValue: string) => {
		setSelectedEPS(epsValue);

		if (epsValue === "otra") {
			// No emitir valor aún, esperar input manual
			setCustomEPS("");
		} else {
			onChange(epsValue);
		}
	};

	// Manejar input manual de EPS
	const handleCustomEPSChange = (customValue: string) => {
		setCustomEPS(customValue);
		if (customValue.trim()) {
			onChange(`otra_manual:${customValue.trim()}`);
		} else {
			onChange("");
		}
	};

	// Clase base premium para inputs y selects
	const inputBaseClass = cn(
		// Base
		"kiosk-input-base kiosk-input-premium",
		"w-full text-sm sm:text-base text-white",
		"bg-zinc-800 dark:bg-zinc-800",
		"border-2 border-zinc-600/50 rounded-xl",
		"px-3 py-3 sm:px-4 sm:py-3.5",
		// Placeholder
		"placeholder:text-zinc-500",
		// Hover
		"hover:border-emerald-500/40 hover:bg-zinc-700",
		// Focus
		"focus:border-emerald-500/60 focus:outline-none focus:ring-4 focus:ring-emerald-500/20",
		"focus:bg-zinc-700",
		"focus:shadow-[0_0_24px_rgba(46,204,113,0.15)]",
		// Active (móvil)
		"active:scale-[0.99]",
		// Transiciones
		"transition-all duration-300 ease-out",
		// Estilos para options de select (evitar texto blanco sobre fondo blanco)
		"[&_option]:bg-zinc-800 [&_option]:text-white"
	);

	// Clase para botones de selección de régimen
	const regimenButtonClass = (isSelected: boolean) => cn(
		// Base
		"flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-center",
		// Touch friendly
		"touch-manipulation active:scale-[0.97]",
		// Estado seleccionado
		isSelected && [
			"border-emerald-500/70 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/15",
			"text-white shadow-[0_4px_20px_rgba(46,204,113,0.2)]",
			"ring-2 ring-emerald-500/20"
		],
		// Estado no seleccionado
		!isSelected && [
			"border-zinc-600/40 bg-zinc-800/50 text-zinc-400",
			"hover:border-zinc-500/60 hover:bg-zinc-800/70 hover:text-zinc-300",
			"hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
		]
	);

	return (
		<div className={cn("space-y-3", className)}>
			{/* Paso 1: Selección de Régimen */}
			<div>
				<span className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2.5 font-medium uppercase tracking-wider">
					<Building2 size={12} className="text-emerald-500/70" />
					{t("forms.health.affiliationType")}
				</span>
				<div className="grid grid-cols-2 gap-2.5 sm:gap-3">
					{regimenesOptions.map((regimen) => (
						<button
							key={regimen.value}
							type="button"
							onClick={() => handleRegimenChange(regimen.value)}
							className={regimenButtonClass(selectedRegimen === regimen.value)}
						>
							<span className="text-xl sm:text-2xl">{regimen.icon}</span>
							<span className="text-xs sm:text-sm font-semibold">
								{getRegimenLabel(regimen.value)}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Paso 2: Selección de EPS (solo si hay régimen seleccionado) */}
			{selectedRegimen && selectedRegimen !== "particular" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="epsSelect" className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">
						<Heart size={12} className="text-emerald-500/70" />
						{t("forms.health.companionEps")}
					</label>
					<div className="relative group">
						<select
							id="epsSelect"
							value={selectedEPS}
							onChange={(e) => handleEPSChange(e.target.value)}
							className={cn(
								inputBaseClass,
								"appearance-none cursor-pointer pr-12",
							)}
						>
							<option value="">{t("forms.health.selectEps")}</option>
							{availableEPS.map((eps) => (
								<option key={eps.value} value={eps.value}>
									{eps.label}
								</option>
							))}
						</select>
						<ChevronDown
							size={18}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none transition-all duration-300 group-hover:text-emerald-500/70 group-focus-within:text-emerald-500 group-focus-within:rotate-180"
						/>
					</div>
				</div>
			)}

			{/* Paso 2b: Si es régimen particular, mostrar opciones directamente */}
			{selectedRegimen === "particular" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="coverageSelect" className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">
						<Heart size={12} className="text-emerald-500/70" />
						{t("forms.health.coverageType")}
					</label>
					<div className="relative group">
						<select
							id="coverageSelect"
							value={selectedEPS}
							onChange={(e) => handleEPSChange(e.target.value)}
							className={cn(
								inputBaseClass,
								"appearance-none cursor-pointer pr-12",
							)}
						>
							<option value="">{t("forms.health.selectPlaceholder")}</option>
							<option value="particular">{t("forms.health.options.noEps")}</option>
							<option value="prepagada">{t("forms.health.options.prepagada")}</option>
						</select>
						<ChevronDown
							size={18}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none transition-all duration-300 group-hover:text-emerald-500/70 group-focus-within:text-emerald-500 group-focus-within:rotate-180"
						/>
					</div>
				</div>
			)}

			{/* Paso 3: Input manual si seleccionó "Otra" */}
			{selectedEPS === "otra" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="customEps" className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">
						<Heart size={12} className="text-emerald-500/70" />
						{t("forms.health.epsName")}
					</label>
					<input
						id="customEps"
						type="text"
						value={customEPS}
						onChange={(e) => handleCustomEPSChange(e.target.value)}
						placeholder={t("forms.health.writeEpsName")}
						className={inputBaseClass}
						autoFocus
					/>
					<p className="text-zinc-500 text-xs mt-1.5">
						{t("forms.health.writeExactName")}
					</p>
				</div>
			)}

			{/* Mensaje de error */}
			{error && (
				<span className="flex items-center gap-1.5 text-red-400 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
					<span className="w-1 h-1 rounded-full bg-red-400" />
					{error}
				</span>
			)}

			{/* Preview de selección */}
			{(selectedEPS && selectedEPS !== "otra") ||
			(selectedEPS === "otra" && customEPS) ? (
				<div className="flex items-center gap-2.5 px-3 py-2.5 
					bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/15 
					border border-emerald-500/30 rounded-xl
					shadow-[0_2px_12px_rgba(46,204,113,0.1)]
					animate-in fade-in slide-in-from-bottom-2 duration-300">
					<Heart size={14} className="text-emerald-500" />
					<span className="text-emerald-400 text-sm font-medium">
						{selectedEPS === "otra" && customEPS
							? customEPS
							: availableEPS.find((e) => e.value === selectedEPS)?.label ||
								(selectedEPS === "particular"
									? t("forms.health.options.noEps")
									: t("forms.health.options.prepagada"))}
					</span>
				</div>
			) : null}
		</div>
	);
}
