"use client";

import Avatar from "boring-avatars";
import { LogOut, Shield, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InstallAppButton } from "@/components/admin/InstallAppButton";
import { NetworkStatus } from "@/components/admin/NetworkStatus";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mapeo de roles a etiquetas legibles
 */
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
	admin: { label: "Admin", color: "bg-primary/10 text-primary" },
	trabajador: {
		label: "Trabajador",
		color: "bg-yellow-500/10 text-yellow-600",
	},
};

export function Header() {
	const { user, signOut, role } = useAuth();
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			await signOut();
			router.push("/admin/login");
		} catch {
			// Error silencioso
		}
	};

	const roleInfo = role ? ROLE_LABELS[role] : null;

	return (
		<header className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-md border-b border-border">
			<div className="flex items-center justify-between h-full px-4 lg:px-6">
				{/* Logo (visible en mobile, en desktop se muestra en el Sidebar) */}
				<div className="lg:hidden">
					<Image
						src="/assets/jumping-park-logo-optimized.png"
						alt="Jumping Park"
						width={100}
						height={30}
						className="h-7 w-auto"
					/>
				</div>

				{/* Spacer para mantener el layout en desktop */}
				<div className="hidden lg:block" />

				{/* Controles de usuario (derecha) */}
				<div className="flex items-center gap-3">
					{/* Estado de conexión */}
					<NetworkStatus />

					{/* Badge de rol */}
					{roleInfo && (
						<div
							className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
						>
							{role === "admin" ? (
								<Shield className="w-3.5 h-3.5" />
							) : (
								<User className="w-3.5 h-3.5" />
							)}
							<span>{roleInfo.label}</span>
						</div>
					)}

					{/* Email del usuario */}
					<div className="hidden sm:flex items-center">
						<span
							className="text-sm text-text-secondary max-w-[180px] truncate"
							data-pii="admin-header-email"
						>
							{user?.email}
						</span>
					</div>

					{/* Avatar */}
					<Avatar
						size={36}
						name={user?.email || "admin"}
						variant="beam"
						colors={["#1e3a8a", "#3b82f6", "#60a5fa", "#93c5fd", "#f3f4f6"]}
					/>

					{/* Botón instalar PWA */}
					<InstallAppButton />

					{/* Theme Toggle */}
					<ThemeToggleCompact />

					{/* Logout */}
					<button
						type="button"
						onClick={handleSignOut}
						className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors min-h-0"
						title="Cerrar sesión"
						aria-label="Cerrar sesión"
					>
						<LogOut className="w-5 h-5" />
					</button>
				</div>
			</div>
		</header>
	);
}
