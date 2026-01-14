"use client";

import {
	Award,
	Baby,
	BarChart3,
	Calendar,
	Clock,
	FileCheck,
	RefreshCw,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/admin/Card";
import { CacheWarningBanner, useNetworkStatus } from "@/components/admin/NetworkStatus";
import { adminGet } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "year" | "all";

interface KPI {
	value: number;
	change?: number;
	previousValue?: number;
	label?: string;
}

interface StatsData {
	period: Period;
	dateRange: {
		start: string;
		end: string;
	};
	kpis: {
		consents: KPI;
		users: KPI;
		minors: KPI;
		uniqueMinors: KPI;
		activeConsents: KPI;
		expiredConsents: KPI;
	};
	totals: {
		users: number;
		consents: number;
		minors: number;
	};
	chartData: Array<{
		date: string;
		consents: number;
		users: number;
		minors: number;
	}>;
	topDays: Array<{
		date: string;
		count: number;
	}>;
	averages: {
		consentsPerDay: number;
		minorsPerConsent: number;
	};
}

const periodLabels: Record<Period, string> = {
	today: "Hoy",
	week: "Última semana",
	month: "Último mes",
	year: "Último año",
	all: "Todo el tiempo",
};

const periodComparison: Record<Period, string> = {
	today: "vs ayer",
	week: "vs semana anterior",
	month: "vs mes anterior",
	year: "vs año anterior",
	all: "",
};

// Cache en memoria para evitar recargas innecesarias
const statsCache = new Map<Period, { data: StatsData; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minuto

// Skeleton components
function KPISkeleton() {
	return (
		<Card className="relative overflow-hidden">
			<div className="absolute top-0 right-0 w-24 h-24 bg-surface-muted rounded-full -mr-8 -mt-8" />
			<CardContent className="pt-6">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
						<div className="h-8 w-16 bg-surface-muted rounded animate-pulse" />
						<div className="h-4 w-20 bg-surface-muted rounded animate-pulse" />
					</div>
					<div className="w-12 h-12 bg-surface-muted rounded-xl animate-pulse" />
				</div>
			</CardContent>
		</Card>
	);
}

function SmallStatSkeleton() {
	return (
		<Card>
			<CardContent className="pt-4 pb-4 text-center">
				<div className="w-5 h-5 bg-surface-muted rounded mx-auto mb-2 animate-pulse" />
				<div className="h-6 w-8 bg-surface-muted rounded mx-auto mb-1 animate-pulse" />
				<div className="h-3 w-12 bg-surface-muted rounded mx-auto animate-pulse" />
			</CardContent>
		</Card>
	);
}

// Anchos deterministas para el skeleton del gráfico (evita errores de hidratación)
const SKELETON_WIDTHS = [65, 42, 78, 55, 89, 35, 72, 48];

function ChartSkeleton() {
	return (
		<Card className="lg:col-span-2">
			<CardHeader>
				<div className="h-5 w-32 bg-surface-muted rounded animate-pulse" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{SKELETON_WIDTHS.map((width, i) => (
						<div key={i} className="space-y-1">
							<div className="flex justify-between">
								<div className="h-3 w-12 bg-surface-muted rounded animate-pulse" />
								<div className="h-3 w-16 bg-surface-muted rounded animate-pulse" />
							</div>
							<div
								className="h-5 bg-surface-muted rounded animate-pulse"
								style={{ width: `${width}%` }}
							/>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default function EstadisticasPage() {
	const [period, setPeriod] = useState<Period>("month");
	const [data, setData] = useState<StatsData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const { isOffline } = useNetworkStatus();

	const fetchStats = useCallback(
		async (forceFresh = false) => {
			// Verificar caché primero
			if (!forceFresh) {
				const cached = statsCache.get(period);
				if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
					setData(cached.data);
					setLastUpdate(new Date(cached.timestamp));
					setIsLoading(false);
					return;
				}
			}

			// Cancelar petición anterior si existe
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			abortControllerRef.current = new AbortController();

			try {
				setIsLoading(true);
				const result = await adminGet<StatsData>(
					`/api/admin/stats/detailed?period=${period}`,
				);

				// Guardar en caché
				statsCache.set(period, { data: result, timestamp: Date.now() });

				setData(result);
				setLastUpdate(new Date());
			} catch (error) {
				// Ignorar errores de abort
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("Error fetching stats:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[period],
	);

	useEffect(() => {
		fetchStats();

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [fetchStats]);

	const maxChartValue = data?.chartData
		? Math.max(
				...data.chartData.map((d) => Math.max(d.consents, d.users, d.minors)),
				1,
			)
		: 1;

	// Mostrar skeleton mientras carga inicialmente
	const showSkeleton = isLoading && !data;

	return (
		<div className="space-y-6 pb-20 lg:pb-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
						<BarChart3 className="w-8 h-8 text-primary" />
						Estadísticas
					</h1>
					<p className="text-foreground/60 mt-1">
						Análisis detallado del rendimiento del parque
					</p>
				</div>
				<div className="flex items-center gap-3">
					{lastUpdate && (
						<span className="text-xs text-foreground/50">
							Actualizado: {lastUpdate.toLocaleTimeString("es-CO")}
						</span>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => fetchStats(true)}
						disabled={isLoading}
					>
						<RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
					</Button>
				</div>
			</div>

			{/* Period Selector */}
			<div className="flex flex-wrap gap-2">
				{(Object.keys(periodLabels) as Period[]).map((p) => (
					<Button
						key={p}
						variant={period === p ? "primary" : "outline"}
						size="sm"
						onClick={() => setPeriod(p)}
						disabled={isLoading}
					>
						{periodLabels[p]}
					</Button>
				))}
			</div>

			{/* Offline Warning Banner */}
			{isOffline && <CacheWarningBanner />}

			{showSkeleton ? (
				<>
					{/* Main KPIs Skeleton */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<KPISkeleton />
						<KPISkeleton />
						<KPISkeleton />
					</div>

					{/* Secondary Stats Skeleton */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<SmallStatSkeleton />
						<SmallStatSkeleton />
						<SmallStatSkeleton />
						<SmallStatSkeleton />
					</div>

					{/* Chart Skeleton */}
					<div className="grid lg:grid-cols-3 gap-6">
						<ChartSkeleton />
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<div className="h-5 w-40 bg-surface-muted rounded animate-pulse" />
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{[...Array(5)].map((_, i) => (
											<div
												key={i}
												className="flex justify-between items-center"
											>
												<div className="flex items-center gap-3">
													<div className="w-6 h-6 bg-surface-muted rounded-full animate-pulse" />
													<div className="h-4 w-20 bg-surface-muted rounded animate-pulse" />
												</div>
												<div className="h-5 w-8 bg-surface-muted rounded animate-pulse" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
							<Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
								<CardHeader>
									<div className="h-5 w-32 bg-surface-muted rounded animate-pulse" />
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex justify-between">
												<div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
												<div className="h-5 w-12 bg-surface-muted rounded animate-pulse" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</>
			) : data ? (
				<>
					{/* Main KPIs */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
						{/* Consentimientos */}
						<Card className="relative overflow-hidden">
							<div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8" />
							<CardContent className="pt-4 sm:pt-6">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className="text-xs sm:text-sm text-foreground/60 font-medium">
											Consentimientos
										</p>
										<p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
											{data.kpis.consents.value.toLocaleString()}
										</p>
										{data.kpis.consents.change !== undefined &&
											period !== "all" && (
												<div className="flex items-center gap-1 mt-2">
													{data.kpis.consents.change >= 0 ? (
														<TrendingUp className="w-4 h-4 text-green-500" />
													) : (
														<TrendingDown className="w-4 h-4 text-red-500" />
													)}
													<span
														className={cn(
															"text-sm font-medium",
															data.kpis.consents.change >= 0
																? "text-green-500"
																: "text-red-500",
														)}
													>
														{data.kpis.consents.change > 0 ? "+" : ""}
														{data.kpis.consents.change}%
													</span>
													<span className="text-xs text-foreground/50">
														{periodComparison[period]}
													</span>
												</div>
											)}
									</div>
									<div className="p-3 bg-primary/10 rounded-xl">
										<FileCheck className="w-6 h-6 text-primary" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Usuarios */}
						<Card className="relative overflow-hidden">
							<div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8" />
							<CardContent className="pt-4 sm:pt-6">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className="text-xs sm:text-sm text-foreground/60 font-medium">
											Nuevos Usuarios
										</p>
										<p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
											{data.kpis.users.value.toLocaleString()}
										</p>
										{data.kpis.users.change !== undefined &&
											period !== "all" && (
												<div className="flex items-center gap-1 mt-2">
													{data.kpis.users.change >= 0 ? (
														<TrendingUp className="w-4 h-4 text-green-500" />
													) : (
														<TrendingDown className="w-4 h-4 text-red-500" />
													)}
													<span
														className={cn(
															"text-sm font-medium",
															data.kpis.users.change >= 0
																? "text-green-500"
																: "text-red-500",
														)}
													>
														{data.kpis.users.change > 0 ? "+" : ""}
														{data.kpis.users.change}%
													</span>
													<span className="text-xs text-foreground/50">
														{periodComparison[period]}
													</span>
												</div>
											)}
									</div>
									<div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg sm:rounded-xl flex-shrink-0">
										<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Acompañantes */}
						<Card className="relative overflow-hidden">
							<div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8" />
							<CardContent className="pt-4 sm:pt-6">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className="text-xs sm:text-sm text-foreground/60 font-medium">
											Acompañantes
										</p>
										<p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
											{data.kpis.minors.value.toLocaleString()}
										</p>
										{data.kpis.minors.change !== undefined &&
											period !== "all" && (
												<div className="flex items-center gap-1 mt-2">
													{data.kpis.minors.change >= 0 ? (
														<TrendingUp className="w-4 h-4 text-green-500" />
													) : (
														<TrendingDown className="w-4 h-4 text-red-500" />
													)}
													<span
														className={cn(
															"text-sm font-medium",
															data.kpis.minors.change >= 0
																? "text-green-500"
																: "text-red-500",
														)}
													>
														{data.kpis.minors.change > 0 ? "+" : ""}
														{data.kpis.minors.change}%
													</span>
													<span className="text-xs text-foreground/50">
														{periodComparison[period]}
													</span>
												</div>
											)}
									</div>
									<div className="p-2 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl flex-shrink-0">
										<Baby className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Secondary Stats Row */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
						<Card>
							<CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 text-center">
								<Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto mb-1 sm:mb-2" />
								<p className="text-lg sm:text-2xl font-bold text-foreground">
									{data.kpis.activeConsents.value}
								</p>
								<p className="text-[10px] sm:text-xs text-foreground/60">Vigentes</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 text-center">
								<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mx-auto mb-1 sm:mb-2" />
								<p className="text-lg sm:text-2xl font-bold text-foreground">
									{data.kpis.expiredConsents.value}
								</p>
								<p className="text-[10px] sm:text-xs text-foreground/60">Vencidos</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 text-center">
								<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1 sm:mb-2" />
								<p className="text-lg sm:text-2xl font-bold text-foreground">
									{data.averages.consentsPerDay}
								</p>
								<p className="text-[10px] sm:text-xs text-foreground/60">Prom/día</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 text-center">
								<Baby className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-1 sm:mb-2" />
								<p className="text-lg sm:text-2xl font-bold text-foreground">
									{data.averages.minorsPerConsent}
								</p>
								<p className="text-[10px] sm:text-xs text-foreground/60">Ac./cons.</p>
							</CardContent>
						</Card>
					</div>

					{/* Chart and Top Days */}
					<div className="grid lg:grid-cols-3 gap-6">
						{/* Chart */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BarChart3 className="w-5 h-5" />
									Actividad por {period === "year" ? "Mes" : "Día"}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-1">
									{/* Legend */}
									<div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-[10px] sm:text-xs">
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-primary" />
											<span className="text-foreground/60">
												<span className="hidden sm:inline">Consentimientos</span>
												<span className="sm:hidden">Cons.</span>
											</span>
										</div>
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-blue-500" />
											<span className="text-foreground/60">Usuarios</span>
										</div>
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-amber-500" />
											<span className="text-foreground/60">
												<span className="hidden sm:inline">Acompañantes</span>
												<span className="sm:hidden">Acomp.</span>
											</span>
										</div>
									</div>

									{/* Bars */}
									<div className="space-y-1.5 sm:space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
										{data.chartData.map((item, index) => (
											<div key={index} className="space-y-0.5 sm:space-y-1">
												<div className="flex items-center justify-between text-[10px] sm:text-xs">
													<span className="text-foreground/60 w-12 sm:w-16 shrink-0 truncate">
														{item.date}
													</span>
													<span className="text-foreground/40 text-[9px] sm:text-[10px]">
														{item.consents}c / {item.users}u / {item.minors}m
													</span>
												</div>
												<div className="flex gap-0.5 sm:gap-1 h-4 sm:h-5">
													<div
														className="bg-primary rounded-sm transition-all duration-300"
														style={{
															width: `${(item.consents / maxChartValue) * 100}%`,
															minWidth: item.consents > 0 ? "4px" : "0",
														}}
													/>
													<div
														className="bg-blue-500 rounded-sm transition-all duration-300"
														style={{
															width: `${(item.users / maxChartValue) * 100}%`,
															minWidth: item.users > 0 ? "4px" : "0",
														}}
													/>
													<div
														className="bg-amber-500 rounded-sm transition-all duration-300"
														style={{
															width: `${(item.minors / maxChartValue) * 100}%`,
															minWidth: item.minors > 0 ? "4px" : "0",
														}}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Top Days & Totals */}
						<div className="space-y-6">
							{/* Top Days */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-base">
										<Award className="w-5 h-5 text-amber-500" />
										Días con Más Actividad
									</CardTitle>
								</CardHeader>
								<CardContent>
									{data.topDays.length > 0 ? (
										<div className="space-y-3">
											{data.topDays.map((day, index) => (
												<div
													key={index}
													className="flex items-center justify-between"
												>
													<div className="flex items-center gap-3">
														<span
															className={cn(
																"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
																index === 0
																	? "bg-amber-500 text-white"
																	: index === 1
																		? "bg-gray-400 text-white"
																		: index === 2
																			? "bg-amber-700 text-white"
																			: "bg-surface-muted text-foreground/60",
															)}
														>
															{index + 1}
														</span>
														<span className="text-sm text-foreground">
															{day.date}
														</span>
													</div>
													<Badge variant="info">{day.count}</Badge>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-foreground/50 text-center py-4">
											Sin datos
										</p>
									)}
								</CardContent>
							</Card>

							{/* Global Totals */}
							<Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
								<CardHeader>
									<CardTitle className="text-base">Totales Globales</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-sm text-foreground/70">
												Total Usuarios
											</span>
											<span className="text-lg font-bold text-foreground">
												{data.totals.users.toLocaleString()}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-foreground/70">
												Total Consentimientos
											</span>
											<span className="text-lg font-bold text-foreground">
												{data.totals.consents.toLocaleString()}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-foreground/70">
												Total Acompañantes
											</span>
											<span className="text-lg font-bold text-foreground">
												{data.totals.minors.toLocaleString()}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Period Info */}
					<Card className="bg-surface-muted/50">
						<CardContent className="py-4">
							<div className="flex flex-wrap items-center justify-between gap-4 text-sm">
								<div className="flex items-center gap-2 text-foreground/60">
									<Calendar className="w-4 h-4" />
									<span>
										Período:{" "}
										{new Date(data.dateRange.start).toLocaleDateString("es-CO")}{" "}
										- {new Date(data.dateRange.end).toLocaleDateString("es-CO")}
									</span>
								</div>
								{period !== "all" &&
									data.kpis.consents.previousValue !== undefined && (
										<div className="text-foreground/50 text-xs">
											Período anterior: {data.kpis.consents.previousValue}{" "}
											consentimientos, {data.kpis.users.previousValue} usuarios,{" "}
											{data.kpis.minors.previousValue} acompañantes
										</div>
									)}
							</div>
						</CardContent>
					</Card>
				</>
			) : (
				<div className="text-center py-12 text-foreground/50">
					Error al cargar estadísticas
				</div>
			)}
		</div>
	);
}
