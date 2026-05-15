"use client";

import { AlertCircle, Eye, EyeOff, Lock, Mail, Rocket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLoginPage() {
	const router = useRouter();
	const { signIn, isLoading: authLoading } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await signIn(email, password);
			router.push("/admin");
		} catch (err) {
			if (err instanceof Error) {
				if (
					err.message.includes("invalid-credential") ||
					err.message.includes("wrong-password")
				) {
					setError("Credenciales inválidas");
				} else if (err.message.includes("user-not-found")) {
					setError("Usuario no encontrado");
				} else if (err.message.includes("too-many-requests")) {
					setError("Demasiados intentos. Intenta más tarde.");
				} else if (err.message.includes("permisos de administrador")) {
					setError("No tienes permisos de administrador");
				} else {
					setError("Error al iniciar sesión");
				}
			} else {
				setError("Error desconocido");
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (authLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<Image
							src="/assets/jumping-park-logo-optimized.png"
							alt="Jumping Park"
							width={280}
							height={80}
							className="h-16 w-auto"
							priority
						/>
					</div>
					<h1 className="text-xl font-semibold text-foreground">
						Panel de Administración
					</h1>
					<p className="text-foreground/60 mt-1">
						Inicia sesión para continuar
					</p>
				</div>

				{/* Login Form */}
				<div className="bg-surface rounded-2xl border border-border p-6 lg:p-8">
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Error Alert */}
						{error && (
							<div
								role="alert"
								className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
							>
								<AlertCircle
									className="w-5 h-5 text-red-400 flex-shrink-0"
									aria-hidden="true"
								/>
								<p className="text-sm text-red-400">{error}</p>
							</div>
						)}

						{/* Email Field */}
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-foreground/70 mb-2"
							>
								Correo electrónico
							</label>
							<div className="relative">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@jumpingpark.com"
									required
									className="w-full pl-12 pr-4 py-3 bg-surface-muted border-border rounded-xl focus:border-primary"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-foreground/70 mb-2"
							>
								Contraseña
							</label>
							<div className="relative">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									className="w-full pl-12 pr-12 py-3 bg-surface-muted border-border rounded-xl focus:border-primary"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={
										showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
									}
									aria-pressed={showPassword}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 min-h-0 p-0 !bg-transparent !border-none !shadow-none outline-none hover:!bg-transparent hover:!transform-none"
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5" aria-hidden="true" />
									) : (
										<Eye className="w-5 h-5" aria-hidden="true" />
									)}
								</button>
							</div>
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full"
							size="lg"
							isLoading={isLoading}
							disabled={isLoading || !email || !password}
						>
							Iniciar Sesión
						</Button>
					</form>
				</div>

				{/* Footer */}
				<p className="text-center text-xs text-foreground/40 mt-6">
					Acceso restringido a personal autorizado
				</p>

				{/* Enlace para volver al Kiosco */}
				<div className="mt-8 flex justify-center">
					<Link
						href="/"
						className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(46,204,113,0.3)] overflow-hidden"
					>
						{/* Fondo animado */}
						<span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

						{/* Icono con animación hover */}
						<span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors duration-300">
							<Rocket
								className="w-4 h-4 text-primary transform -rotate-45 group-hover:animate-bounce group-hover:scale-110 transition-transform duration-300"
								strokeWidth={2.5}
							/>
							{/* Indicadores visuales hover */}
							<span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-yellow-400/0 group-hover:bg-yellow-400 group-hover:animate-ping transition-all duration-300" />
							<span className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-orange-400/0 group-hover:bg-orange-400 group-hover:animate-pulse transition-all duration-300 delay-75" />
						</span>

						{/* Texto */}
						<span className="relative flex flex-col items-start">
							<span className="text-xs text-foreground/50 group-hover:text-foreground/70 transition-colors duration-300">
								¿Eres visitante?
							</span>
							<span className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors duration-300">
								Ir al Kiosco
							</span>
						</span>

						{/* Flecha animada */}
						<span className="relative text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
							→
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
