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

/**
 * Capitaliza la primera letra de cada palabra.
 *
 * @example
 * capitalizeWords("juan perez") => "Juan Perez"
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formatea una fecha ISO a formato legible en español.
 *
 * @example
 * formatDate("2025-11-26") => "26 de noviembre de 2025"
 */
export function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatea una fecha ISO a formato corto.
 *
 * @example
 * formatDateShort("2025-11-26") => "26/11/2025"
 */
export function formatDateShort(isoDate: string | Date): string {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formatea un valor monetario en pesos colombianos.
 *
 * @example
 * formatCurrency(50000) => "$50.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
