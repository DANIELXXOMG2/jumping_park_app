/**
 * Utilidades compartidas para formateo y transformación de datos.
 * Estas funciones deben ser isomórficas (funcionan en cliente y servidor).
 */

/**
 * Ofusca un email para mostrar al usuario sin revelar datos completos.
 * Cumple con RF-13 (No mostrar datos precargados sin OTP validado).
 *
 * @example
 * maskEmail("juan.perez@gmail.com") => "ju****@g***.com"
 * maskEmail("a@b.co") => "a***@b***.co"
 *
 * @param email - Email a ofuscar
 * @returns Email ofuscado o placeholder si el formato es inválido
 */
export function maskEmail(email: string): string {
	// Si ya está ofuscado, retornarlo tal cual
	if (email.includes("*")) {
		return email;
	}

	const parts = email.split("@");
	if (parts.length !== 2) {
		return "***@***.***";
	}

	const [localPart, domainPart] = parts;

	// Ofuscar parte local: mostrar primeros 2 caracteres + asteriscos
	const visibleLocal = localPart.slice(0, 2);
	const paddingLocal = Math.max(localPart.length - 2, 3);
	const maskedLocal = `${visibleLocal}${"*".repeat(paddingLocal)}`;

	// Ofuscar dominio: mostrar primer caracter + asteriscos + TLD
	const domainSegments = domainPart.split(".");
	const tld = domainSegments.pop() ?? "";
	const domainName = domainSegments.join(".");

	const visibleDomain = domainName.slice(0, 1) || "*";
	const maskedDomain = `${visibleDomain}***`;

	return `${maskedLocal}@${maskedDomain}${tld ? `.${tld}` : ""}`;
}
