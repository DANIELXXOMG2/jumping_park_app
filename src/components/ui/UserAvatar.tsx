import Avatar from "boring-avatars";

/**
 * UserAvatar - Componente de avatar consistente usando boring-avatars.
 * 
 * Genera avatares únicos basados en el nombre/email del usuario.
 * Usa la misma paleta de colores en todo el sistema.
 */

interface UserAvatarProps {
	/** Nombre o email del usuario (usado como seed) */
	name: string;
	/** Tamaño del avatar en píxeles */
	size?: number;
	/** Variante del avatar */
	variant?: "marble" | "beam" | "pixel" | "sunset" | "ring" | "bauhaus";
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Paleta de colores predeterminada del sistema.
 * Basada en los colores primarios del tema.
 */
const DEFAULT_COLORS = ["#1e3a8a", "#3b82f6", "#60a5fa", "#93c5fd", "#f3f4f6"];

export function UserAvatar({
	name,
	size = 40,
	variant = "beam",
	className = "",
}: UserAvatarProps) {
	return (
		<div className={className}>
			<Avatar
				size={size}
				name={name}
				variant={variant}
				colors={DEFAULT_COLORS}
			/>
		</div>
	);
}
