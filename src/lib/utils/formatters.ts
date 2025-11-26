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
 * Formatea un número de teléfono para mostrar parcialmente.
 *
 * @example
 * maskPhone("3001234567") => "300***4567"
 *
 * @param phone - Teléfono a ofuscar
 * @returns Teléfono ofuscado
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 7) {
    return "***";
  }

  const first = digits.slice(0, 3);
  const last = digits.slice(-4);

  return `${first}***${last}`;
}

/**
 * Formatea una cédula/documento para mostrar parcialmente.
 *
 * @example
 * maskDocument("1234567890") => "123****890"
 *
 * @param doc - Documento a ofuscar
 * @returns Documento ofuscado
 */
export function maskDocument(doc: string): string {
  const cleaned = doc.replace(/\D/g, "");

  if (cleaned.length < 6) {
    return "***";
  }

  const first = cleaned.slice(0, 3);
  const last = cleaned.slice(-3);

  return `${first}****${last}`;
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
