"use client";

import { Building2, ChevronDown, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import {
	type EPSOption,
	getEPSByRegimen,
	type RegimenType,
	regimenesOptions,
} from "@/lib/data/epsColombiaData";
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

	const inputBaseClass =
		"w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all";

	return (
		<div className={cn("space-y-3", className)}>
			{/* Paso 1: Selección de Régimen */}
			<div>
				<span className="flex items-center gap-1 text-xs text-gray-500 mb-2">
					<Building2 size={12} />
					Tipo de Afiliación
				</span>
				<div className="grid grid-cols-2 gap-2">
					{regimenesOptions.map((regimen) => (
						<button
							key={regimen.value}
							type="button"
							onClick={() => handleRegimenChange(regimen.value)}
							className={cn(
								"flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-left",
								selectedRegimen === regimen.value
									? "border-neon-blue bg-neon-blue/10 text-white"
									: "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800",
							)}
						>
							<span className="text-lg">{regimen.icon}</span>
							<span className="text-xs font-medium text-center">
								{regimen.label}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Paso 2: Selección de EPS (solo si hay régimen seleccionado) */}
			{selectedRegimen && selectedRegimen !== "particular" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="epsSelect" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
						<Heart size={12} />
						EPS del Menor
					</label>
					<div className="relative">
						<select
							id="epsSelect"
							value={selectedEPS}
							onChange={(e) => handleEPSChange(e.target.value)}
							className={cn(
								inputBaseClass,
								"appearance-none cursor-pointer pr-10",
							)}
						>
							<option value="">Selecciona la EPS</option>
							{availableEPS.map((eps) => (
								<option key={eps.value} value={eps.value}>
									{eps.label}
								</option>
							))}
						</select>
						<ChevronDown
							size={18}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
						/>
					</div>
				</div>
			)}

			{/* Paso 2b: Si es régimen particular, mostrar opciones directamente */}
			{selectedRegimen === "particular" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="coverageSelect" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
						<Heart size={12} />
						Tipo de Cobertura
					</label>
					<div className="relative">
						<select
							id="coverageSelect"
							value={selectedEPS}
							onChange={(e) => handleEPSChange(e.target.value)}
							className={cn(
								inputBaseClass,
								"appearance-none cursor-pointer pr-10",
							)}
						>
							<option value="">Selecciona una opción</option>
							<option value="particular">Sin EPS (Particular)</option>
							<option value="prepagada">Medicina Prepagada</option>
						</select>
						<ChevronDown
							size={18}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
						/>
					</div>
				</div>
			)}

			{/* Paso 3: Input manual si seleccionó "Otra" */}
			{selectedEPS === "otra" && (
				<div className="animate-in slide-in-from-top-2 duration-200">
					<label htmlFor="customEps" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
						<Heart size={12} />
						Nombre de la EPS
					</label>
					<input
						id="customEps"
						type="text"
						value={customEPS}
						onChange={(e) => handleCustomEPSChange(e.target.value)}
						placeholder="Escribe el nombre de la EPS"
						className={inputBaseClass}
						autoFocus
					/>
					<p className="text-gray-600 text-xs mt-1">
						Escribe el nombre exacto de la EPS
					</p>
				</div>
			)}

			{/* Mensaje de error */}
			{error && <span className="text-red-500 text-xs block">{error}</span>}

			{/* Preview de selección */}
			{(selectedEPS && selectedEPS !== "otra") ||
			(selectedEPS === "otra" && customEPS) ? (
				<div className="flex items-center gap-2 p-2 bg-neon-green/10 border border-neon-green/30 rounded-lg">
					<Heart size={14} className="text-neon-green" />
					<span className="text-neon-green text-xs font-medium">
						{selectedEPS === "otra" && customEPS
							? customEPS
							: availableEPS.find((e) => e.value === selectedEPS)?.label ||
								(selectedEPS === "particular"
									? "Sin EPS (Particular)"
									: "Medicina Prepagada")}
					</span>
				</div>
			) : null}
		</div>
	);
}
