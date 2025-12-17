"use client";

import Avatar from "boring-avatars";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
	const { user, signOut } = useAuth();
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			await signOut();
			router.push("/admin/login");
		} catch {
			// Error silencioso
		}
	};

	return (
		<header className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-md border-b border-border">
			<div className="flex items-center justify-between h-full px-4 lg:px-6">
				{/* Logo (visible en mobile, en desktop se muestra en el Sidebar) */}
				<div className="lg:hidden">
					<Image
						src="/assets/jumping-park-logo.png"
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
					{/* Email del usuario */}
					<div className="hidden sm:flex items-center">
						<span className="text-sm text-text-secondary max-w-[180px] truncate">
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
