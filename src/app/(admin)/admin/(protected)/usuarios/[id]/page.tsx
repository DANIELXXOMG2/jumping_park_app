"use client";

import {
	ArrowLeft,
	Baby,
	Calendar,
	CreditCard,
	Eye,
	FileCheck,
	Heart,
	Mail,
	Phone,
	User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/admin/Card";
import { ConsentDetailModal } from "@/components/admin/ConsentDetailModal";
import { Modal } from "@/components/admin/Modal";
import { useConsentsTable } from "@/hooks/useConsentsTable";
import { adminGet } from "@/lib/adminApi";
import { formatRelativeTime } from "@/lib/utils";
import { formatEPS } from "@/lib/utils/formatters";

interface Minor {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	birthDate: string;
	relationship: string;
	eps?: string;
	idType?: string;
	idNumber?: string;
	medicalCondition?: string;
}

interface User {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone: string;
	address?: string;
	minors: Minor[];
	createdAt: string | null;
	updatedAt: string | null;
}

interface Consent {
	id: string;
	consecutivo: number;
	policyVersion: string;
	signatureUrl: string;
	minorsCount: number;
	minors: Minor[];
	adultName: string;
	adultEmail: string;
	adultPhone: string;
	userId: string;
	ipAddress?: string;
	createdAt: string | null;
	signedAt: string | null;
	validUntil: string | null;
}

interface UserStats {
	totalConsents: number;
	minorsCount: number;
}

interface UserData {
	user: User;
	consents: Consent[];
	stats: UserStats;
}

interface UserDetailPageProps {
	params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
	const { id } = use(params);
	const router = useRouter();
	const [data, setData] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedMinor, setSelectedMinor] = useState<Minor | null>(null);

	// Hook compartido para manejo de consentimientos
	const {
		selectedConsent,
		setSelectedConsent,
		isResending,
		handleResendEmail,
		isValidConsent,
	} = useConsentsTable();

	const fetchUserData = useCallback(async () => {
		try {
			setIsLoading(true);
			const result = await adminGet<UserData>(`/api/admin/users/${id}`);
			setData(result);
			setError(null);
		} catch (err) {
			if (err instanceof Error && err.message.includes("404")) {
				setError("Usuario no encontrado");
			} else {
				setError(err instanceof Error ? err.message : "Error desconocido");
			}
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[60vh]">
				<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] gap-4">
				<p className="text-red-400">{error || "Usuario no encontrado"}</p>
				<Button variant="secondary" onClick={() => router.back()}>
					Volver
				</Button>
			</div>
		);
	}

	const { user, consents, stats } = data;

	const calculateAge = (birthDate: string) => {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	};

	const getRelationshipLabel = (relationship: string) => {
		const labels: Record<string, string> = {
			hijo: "Hijo/a",
			sobrino: "Sobrino/a",
			nieto: "Nieto/a",
			otro: "Otro",
		};
		return labels[relationship] || relationship;
	};

	return (
		<div className="space-y-6 pb-20 lg:pb-6">
			{/* Back button and header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.back()}
					className="gap-2"
				>
					<ArrowLeft className="w-4 h-4" />
					Volver
				</Button>
			</div>

			{/* User Info Header */}
			<div className="bg-surface rounded-xl border border-border p-6">
				<div className="flex flex-col lg:flex-row lg:items-center gap-6">
					<div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-primary to-primary-contrast flex items-center justify-center">
						<span className="text-2xl lg:text-3xl font-bold text-background">
							{user.fullName?.charAt(0)?.toUpperCase() || "U"}
						</span>
					</div>
					<div className="flex-1">
						<h1 className="text-2xl lg:text-3xl font-bold text-foreground">
							{user.fullName}
						</h1>
						<p className="text-foreground/60 mt-1 font-mono">Doc: {user.uid}</p>
						<div className="flex flex-wrap gap-4 mt-3">
							<div className="flex items-center gap-2 text-sm text-foreground/70">
								<Mail className="w-4 h-4" />
								{user.email}
							</div>
							<div className="flex items-center gap-2 text-sm text-foreground/70">
								<Phone className="w-4 h-4" />
								{user.phone || "Sin teléfono"}
							</div>
							<div className="flex items-center gap-2 text-sm text-foreground/70">
								<Calendar className="w-4 h-4" />
								Registrado{" "}
								{user.createdAt ? formatRelativeTime(user.createdAt) : "-"}
							</div>
						</div>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-foreground/60">
							<FileCheck className="w-4 h-4" />
							<span className="text-xs uppercase">Consentimientos</span>
						</div>
						<p className="text-2xl font-bold text-foreground mt-1">
							{stats.totalConsents}
						</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-foreground/60">
							<Baby className="w-4 h-4" />
							<span className="text-xs uppercase">Participantes</span>
						</div>
						<p className="text-2xl font-bold text-foreground mt-1">
							{stats.minorsCount}
						</p>
					</div>
				</div>
			</div>

			{/* Minors */}
			<Card>
				<CardHeader>
					<CardTitle>Participantes Asociados ({user.minors.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{user.minors.length > 0 ? (
						<div className="grid sm:grid-cols-2 gap-4">
							{user.minors.map((minor) => (
								<button
									type="button"
									key={minor.idNumber || minor.birthDate}
									onClick={() => setSelectedMinor(minor)}
									className="bg-surface-muted rounded-lg p-4 border border-border/50 cursor-pointer hover:border-primary/50 hover:bg-surface-muted/80 transition-all text-left"
								>
									<div className="flex items-start justify-between">
										<div>
											<div className="flex items-center gap-2">
												<p className="font-medium text-foreground">
													{minor.fullName ||
														`${minor.firstName || ""} ${minor.lastName || ""}`.trim() ||
														"Sin nombre"}
												</p>
												{minor.medicalCondition && (
													<div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center" title="Tiene condición médica">
														<Heart className="w-3 h-3 text-red-400 fill-red-400" />
													</div>
												)}
											</div>
											<p className="text-sm text-foreground/60 mt-1">
												{getRelationshipLabel(minor.relationship)}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="info">
												{calculateAge(minor.birthDate)} años
											</Badge>
											<Eye className="w-4 h-4 text-foreground/40" />
										</div>
									</div>
								</button>
							))}
						</div>
					) : (
						<p className="text-center text-foreground/50 py-8">
							No hay participantes registrados
						</p>
					)}
				</CardContent>
			</Card>

			{/* Consents */}
			<Card>
				<CardHeader>
					<CardTitle>Historial de Consentimientos</CardTitle>
				</CardHeader>
				<CardContent>
					{consents.length > 0 ? (
						<div className="space-y-3">
							{consents.map((consent) => {
								const isValid = isValidConsent(consent.validUntil);
								return (
									<button
										type="button"
										key={consent.id}
										onClick={() => setSelectedConsent(consent)}
										className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-muted border border-border/50 cursor-pointer hover:border-primary/50 hover:bg-surface-muted/80 transition-all text-left"
									>
										<div className="flex items-center gap-4">
											<Badge variant="info">#{consent.consecutivo}</Badge>
											<div>
												<p className="text-sm font-medium text-foreground">
													{consent.minorsCount} participante(s)
												</p>
												<p className="text-xs text-foreground/50">
													Versión {consent.policyVersion}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="text-right">
												<Badge variant={isValid ? "success" : "error"}>
													{isValid ? "Vigente" : "Vencido"}
												</Badge>
												<p className="text-xs text-foreground/50 mt-1">
													{consent.signedAt
														? formatRelativeTime(consent.signedAt)
														: "-"}
												</p>
											</div>
											<Eye className="w-4 h-4 text-foreground/40" />
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<p className="text-center text-foreground/50 py-8">
							No hay consentimientos registrados
						</p>
					)}
				</CardContent>
			</Card>

			{/* Minor Detail Modal */}
			<Modal
				isOpen={!!selectedMinor}
				onClose={() => setSelectedMinor(null)}
				title="Información del Participante"
			>
				{selectedMinor && (
					<div className="space-y-6">
						{/* Header con avatar */}
						<div className="flex items-center gap-4 pb-4 border-b border-border">
							<div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/80 to-primary-contrast flex items-center justify-center">
								<Baby className="w-8 h-8 text-white" />
							</div>
							<div>
								<h3 className="text-xl font-semibold text-foreground">
									{selectedMinor.fullName ||
										`${selectedMinor.firstName || ""} ${selectedMinor.lastName || ""}`.trim()}
								</h3>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="info" className="text-sm">
										{calculateAge(selectedMinor.birthDate)} años
									</Badge>
									<Badge variant="default">
										{getRelationshipLabel(selectedMinor.relationship)}
									</Badge>
								</div>
							</div>
						</div>

						{/* Información personal */}
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3 flex items-center gap-2">
								<UserIcon className="w-4 h-4" />
								Identificación
							</h4>
							<div className="bg-surface-muted rounded-lg p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-foreground/60">
										Tipo de documento:
									</span>
									<Badge variant="default">
										{selectedMinor.idType?.toUpperCase() || "No registrado"}
									</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Número:</span>
									<span className="text-sm font-mono font-medium">
										{selectedMinor.idNumber || "No registrado"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">
										Fecha de nacimiento:
									</span>
									<span className="text-sm font-medium">
										{new Date(selectedMinor.birthDate).toLocaleDateString(
											"es-CO",
											{
												year: "numeric",
												month: "long",
												day: "numeric",
											},
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Información médica */}
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3 flex items-center gap-2">
								<Heart className="w-4 h-4" />
								Información Médica
							</h4>
							<div className="bg-surface-muted rounded-lg p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-foreground/60">EPS:</span>
									<span className="text-sm font-medium">
										{formatEPS(selectedMinor.eps)}
									</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-sm text-foreground/60">Condición Médica / Alergias:</span>
									<span className={`text-sm font-medium text-right max-w-[60%] ${selectedMinor.medicalCondition ? "text-red-400" : ""}`}>
										{selectedMinor.medicalCondition || "Ninguna"}
									</span>
								</div>
							</div>
						</div>

						{/* Responsable */}
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3 flex items-center gap-2">
								<CreditCard className="w-4 h-4" />
								Responsable
							</h4>
							<div className="bg-surface-muted rounded-lg p-4 space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Nombre:</span>
									<span className="text-sm font-medium">{user.fullName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Documento:</span>
									<span className="text-sm font-mono">{user.uid}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">
										Parentesco:
									</span>
									<span className="text-sm font-medium">
										{getRelationshipLabel(selectedMinor.relationship)}
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Consent Detail Modal - Componente reutilizable */}
			<ConsentDetailModal
				consent={selectedConsent}
				onClose={() => setSelectedConsent(null)}
				onResendEmail={handleResendEmail}
				isResending={isResending}
				isValidConsent={isValidConsent}
				userFallback={{
					fullName: user.fullName,
					uid: user.uid,
					email: user.email,
					phone: user.phone,
				}}
			/>
		</div>
	);
}
