"use client";

import {
	Baby,
	CheckCircle,
	Clock,
	FileCheck,
	FileText,
	Heart,
	Loader2,
	RefreshCw,
	Search,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/admin/Badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/admin/Card";
import { StatCard } from "@/components/admin/StatCard";
import { useActivity } from "@/hooks/useActivity";
import { adminGet } from "@/lib/adminApi";
import { formatRelativeTime } from "@/lib/utils";

interface MinorSnapshot {
	firstName: string;
	lastName: string;
	idType?: string;
	idNumber?: string;
	medicalCondition?: string;
}

interface ConsentResult {
	found: boolean;
	consent?: {
		id: string;
		consecutivo: number;
		adultSnapshot: {
			fullName: string;
			uid: string;
		};
		minorsSnapshot: MinorSnapshot[];
		createdAt: string;
		expiresAt?: string;
	};
	isExpired?: boolean;
}

export default function AdminDashboard() {
	const [cedula, setCedula] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResult, setSearchResult] = useState<ConsentResult | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// 🔥 OPTIMIZADO: Usar hook con SWR en lugar de setInterval
	// Refresco automático cada 5 minutos, no 30 segundos
	const { data: activityData, isLoading: activityLoading, isValidating, mutate } = useActivity();

	// Focus en el input al cargar
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSearch = useCallback(async () => {
		if (!cedula.trim() || cedula.length < 6) return;

		setIsSearching(true);
		setSearchResult(null);

		try {
			const result = await adminGet<ConsentResult>(
				`/api/admin/verificar-consentimiento?cedula=${encodeURIComponent(cedula.trim())}`,
			);
			setSearchResult(result);
		} catch {
			setSearchResult({ found: false });
		} finally {
			setIsSearching(false);
		}
	}, [cedula]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleClear = () => {
		setCedula("");
		setSearchResult(null);
		inputRef.current?.focus();
	};

	return (
		<div className="min-h-[80vh] flex flex-col items-center justify-start pt-4 sm:pt-8 px-3 sm:px-4 pb-20 lg:pb-6">
			{/* Header */}
			<div className="text-center mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
					Visor de Verificación
				</h1>
				<p className="text-foreground/60 mt-1.5 sm:mt-2 text-sm sm:text-base px-2">
					Ingresa el documento de identidad para verificar el consentimiento vigente
				</p>
			</div>

			{/* Stats del día */}
			<div className="w-full max-w-2xl mb-6">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-xs sm:text-sm font-semibold text-foreground/60 uppercase flex items-center gap-1.5 sm:gap-2">
						<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						Actividad de Hoy
					</h2>
					<button
						type="button"
						onClick={() => mutate()}
						disabled={isValidating}
						className="p-1.5 sm:p-2 hover:bg-surface-muted rounded-lg transition-colors"
						title="Actualizar"
						aria-label="Actualizar actividad"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground/60 ${isValidating ? "animate-spin" : ""}`}
						/>
					</button>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:gap-4">
					<StatCard
						title="Consentimientos"
						value={
							activityLoading ? "..." : activityData?.stats.consentsToday || 0
						}
						icon={FileCheck}
					/>
					<StatCard
						title="Participantes"
						value={
							activityLoading ? "..." : activityData?.stats.minorsToday || 0
						}
						icon={Baby}
					/>
				</div>
			</div>

			{/* Buscador Central */}
			<div className="w-full max-w-lg mb-6">
				<div className="relative">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
					<input
						ref={inputRef}
						type="text"
						value={cedula}
						onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
						onKeyDown={handleKeyDown}
						placeholder="Ingresa número de cédula..."
						className="w-full pl-14 pr-4 py-4 text-xl bg-surface border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-foreground/40"
						maxLength={12}
						autoComplete="off"
					/>
				</div>
				<div className="flex gap-3 mt-4">
					<button
						type="button"
						onClick={handleSearch}
						disabled={isSearching || cedula.length < 6}
						className="flex-1 py-4 px-6 bg-primary text-background font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
					>
						{isSearching ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Buscando...
							</>
						) : (
							<>
								<Search className="w-5 h-5" />
								Verificar
							</>
						)}
					</button>
					{searchResult && (
						<button
							type="button"
							onClick={handleClear}
							className="py-4 px-6 bg-surface-muted text-foreground font-medium rounded-xl hover:bg-surface-muted/80 transition-all"
						>
							Limpiar
						</button>
					)}
				</div>
			</div>

			{/* Resultado de búsqueda */}
			{searchResult && (
				<div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
					{searchResult.found &&
					searchResult.consent &&
					!searchResult.isExpired ? (
						// ✅ CONSENTIMIENTO VIGENTE
						<Card className="border-2 border-green-500 bg-green-500/10">
							<CardContent className="pt-6">
								<div className="flex items-center justify-center mb-4">
									<div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
										<CheckCircle className="w-12 h-12 text-green-500" />
									</div>
								</div>
								<h2 className="text-2xl font-bold text-center text-green-500 mb-2">
									CONSENTIMIENTO VIGENTE
								</h2>
								
								{/* Información del Responsable */}
								<div className="mt-6 p-4 bg-surface-muted rounded-xl border border-green-500/20">
									<div className="flex items-center gap-3 mb-3">
										<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
											<Users className="w-6 h-6 text-green-400" />
										</div>
										<div>
											<p className="text-lg font-bold text-foreground">
												{searchResult.consent.adultSnapshot.fullName}
											</p>
											<p className="text-sm text-foreground/60">
												Adulto Responsable
											</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-3 mt-3">
										<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
											<FileText className="w-4 h-4 text-green-400" />
											<span className="font-mono text-sm text-green-400">
												#{searchResult.consent.consecutivo}
											</span>
										</div>
										<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg">
											<Baby className="w-4 h-4 text-foreground/60" />
											<span className="text-sm text-foreground/70">
												{searchResult.consent.minorsSnapshot.length} participante(s)
											</span>
										</div>
									</div>
								</div>
								
								{/* Lista de Participantes */}
								{searchResult.consent.minorsSnapshot.length > 0 && (
									<div className="mt-4">
										<p className="text-sm font-semibold text-foreground/60 mb-3 flex items-center gap-2">
											<Baby className="w-4 h-4" />
											Participantes Autorizados
										</p>
										<div className="space-y-2">
											{searchResult.consent.minorsSnapshot.map((minor, idx) => (
												<div
													key={minor.idNumber || `minor-${idx}`}
													className="p-3 bg-surface-muted rounded-xl border border-border/50 hover:border-green-500/30 transition-colors"
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="relative">
																<div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
																	<span className="text-green-400 font-bold text-sm">
																		{idx + 1}
																	</span>
																</div>
																{minor.medicalCondition && (
																	<div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center" title="Condición médica">
																		<Heart className="w-3 h-3 text-red-400 fill-red-400" />
																	</div>
																)}
															</div>
															<div>
																<p className="font-semibold text-foreground">
																	{minor.firstName} {minor.lastName}
																</p>
																<div className="flex flex-wrap items-center gap-2 mt-0.5">
																	<span className="text-xs text-foreground/50 font-mono bg-surface px-1.5 py-0.5 rounded">
																		{minor.idType?.toUpperCase() || "T.I."}: {minor.idNumber}
																	</span>
																	{minor.medicalCondition && (
																		<span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
																			⚠️ {minor.medicalCondition}
																		</span>
																	)}
																</div>
															</div>
														</div>
														<div className="text-right">
															<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">
																<CheckCircle className="w-3 h-3" />
																Autorizado
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
								<button
									type="button"
									onClick={async () => {
										try {
											const pdfUrl = `/api/admin/consents/${searchResult.consent?.id}/pdf`;
												const response = await fetch(pdfUrl);
											if (!response.ok) throw new Error("Error al generar PDF");
											const blob = await response.blob();
											const url = URL.createObjectURL(blob);
											window.open(url, "_blank");
										} catch (error) {
											console.error("Error descargando PDF:", error);
										}
									}}
									className="mt-6 w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
								>
									<FileText className="w-5 h-5" />
									Ver PDF del Consentimiento
								</button>
							</CardContent>
						</Card>
					) : (
						// ❌ SIN CONSENTIMIENTO O EXPIRADO
						<Card className="border-2 border-red-500 bg-red-500/10">
							<CardContent className="pt-6">
								<div className="flex items-center justify-center mb-4">
									<div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
										<XCircle className="w-12 h-12 text-red-500" />
									</div>
								</div>
								<h2 className="text-2xl font-bold text-center text-red-500 mb-2">
									{searchResult.isExpired
										? "CONSENTIMIENTO VENCIDO"
										: "SIN CONSENTIMIENTO VIGENTE"}
								</h2>
								<p className="text-center text-foreground/60 mt-4">
									{searchResult.isExpired
										? "El consentimiento de este usuario ha expirado. Debe firmar uno nuevo."
										: "No se encontró un consentimiento activo para esta cédula."}
								</p>
								<div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
									<p className="text-center text-red-400 font-medium">
										⚠️ El usuario debe completar el registro en el kiosco antes
										de ingresar.
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Últimos registros */}
			{!searchResult &&
				activityData &&
				activityData.latestConsents.length > 0 && (
					<div className="w-full max-w-2xl mt-8">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<TrendingUp className="w-5 h-5 text-primary" />
									Últimos Registros
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{activityData.latestConsents.map((consent) => (
										<div
											key={consent.id}
											className="flex items-center justify-between p-3 bg-surface-muted rounded-lg"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
													<FileCheck className="w-5 h-5 text-primary" />
												</div>
												<div>
													<p className="font-medium text-foreground text-sm">
														{consent.adultName}
													</p>
													<p className="text-xs text-foreground/50">
														#{consent.consecutivo} • {consent.minorsCount}{" "}
														participante(s)
													</p>
												</div>
											</div>
											<div className="text-right">
												<Badge variant="success" className="text-xs">
													{consent.signedAt
														? formatRelativeTime(consent.signedAt)
														: "Reciente"}
												</Badge>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				)}
		</div>
	);
}
