/**
 * PDF Service - Generación de Consentimientos Jumping Park
 *
 * Genera documentos PDF profesionales con diseño de marca.
 * Incluye manejo de texto largo (truncate/wrap) para evitar desbordamientos.
 *
 * @note El contenido legal se importa desde legalContent.ts para mantener
 *       consistencia entre el frontend y los PDFs generados.
 */

import fs from "node:fs/promises";
import path from "node:path";
import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	type RGB,
	rgb,
	StandardFonts,
} from "pdf-lib";
import {
	DEFAULT_CONSENT_CONTENT,
	getConsentContent,
} from "@/lib/data/legalContent";
import { createLogger } from "@/lib/logger";
import { toJsDate } from "@/lib/utils/dateUtils";
import type { Consent } from "@/types/firestore";

const logger = createLogger("PDFService");

// ============================================================================
// CONSTANTES DE DISEÑO
// ============================================================================

/** Colores de la marca Jumping Park */
const COLORS = {
	// Morado Mundo Galáctico - Color principal header
	purple: rgb(155 / 255, 89 / 255, 182 / 255), // #9B59B6
	// Verde Jumping - Acentos
	green: rgb(46 / 255, 204 / 255, 113 / 255), // #2ECC71
	// Azul - Acentos secundarios
	blue: rgb(52 / 255, 152 / 255, 219 / 255), // #3498DB
	// Textos
	darkText: rgb(44 / 255, 62 / 255, 80 / 255), // #2C3E50
	lightText: rgb(127 / 255, 140 / 255, 141 / 255), // #7F8C8D
	// Líneas separadoras
	separator: rgb(236 / 255, 240 / 255, 241 / 255), // #ECF0F1
	white: rgb(1, 1, 1),
};

/** Configuración de página A4 */
const PAGE = {
	width: 595.28,
	height: 841.89,
	marginX: 50,
	marginTop: 50,
	marginBottom: 60,
};

/** Configuración del header */
const HEADER = {
	height: 80,
	logoMaxWidth: 120,
	logoMaxHeight: 50,
};

// ============================================================================
// UTILIDADES DE TEXTO
// ============================================================================

/**
 * Trunca un texto si excede el ancho máximo, añadiendo "..." al final.
 */
function truncateText(
	text: string,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
): string {
	const textWidth = font.widthOfTextAtSize(text, fontSize);
	if (textWidth <= maxWidth) return text;

	const ellipsis = "...";
	const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);
	const availableWidth = maxWidth - ellipsisWidth;

	let truncated = text;
	while (
		font.widthOfTextAtSize(truncated, fontSize) > availableWidth &&
		truncated.length > 0
	) {
		truncated = truncated.slice(0, -1);
	}

	return truncated.trim() + ellipsis;
}

/**
 * Divide un texto en múltiples líneas para que quepa en el ancho máximo.
 */
function wrapText(
	text: string,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let currentLine = "";

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		const testWidth = font.widthOfTextAtSize(testLine, fontSize);

		if (testWidth <= maxWidth) {
			currentLine = testLine;
		} else {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		}
	}

	if (currentLine) lines.push(currentLine);
	return lines;
}

/**
 * Dibuja texto con truncamiento automático si excede el ancho.
 */
function drawTruncatedText(
	page: PDFPage,
	text: string,
	x: number,
	y: number,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
	color: RGB = COLORS.darkText,
): void {
	const truncated = truncateText(text, font, fontSize, maxWidth);
	page.drawText(truncated, { x, y, size: fontSize, font, color });
}

/**
 * Dibuja texto con ajuste de líneas y retorna la nueva posición Y.
 */
function drawWrappedText(
	page: PDFPage,
	text: string,
	x: number,
	y: number,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
	lineHeight: number,
	color: RGB = COLORS.darkText,
): number {
	const lines = wrapText(text, font, fontSize, maxWidth);
	let currentY = y;

	for (const line of lines) {
		page.drawText(line, { x, y: currentY, size: fontSize, font, color });
		currentY -= lineHeight;
	}

	return currentY;
}

/**
 * Dibuja una línea separadora horizontal.
 */
function drawSeparator(
	page: PDFPage,
	y: number,
	startX: number = PAGE.marginX,
	endX: number = PAGE.width - PAGE.marginX,
): void {
	page.drawLine({
		start: { x: startX, y },
		end: { x: endX, y },
		thickness: 1,
		color: COLORS.separator,
	});
}

/**
 * Convierte Firestore Timestamp o Date a Date.
 * Usa la utilidad centralizada.
 */
function toDate(value: Date | { toDate: () => Date }): Date {
	return toJsDate(value);
}

/**
 * Formatea fecha a formato legible en español.
 */
function formatDate(date: Date): string {
	return date.toLocaleDateString("es-CO", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// ============================================================================
// GENERADOR PRINCIPAL
// ============================================================================

/**
 * Genera un PDF profesional de consentimiento informado.
 *
 * @param data - Datos del consentimiento desde Firestore
 * @param signatureBuffer - Buffer de la imagen de firma (opcional)
 * @returns Buffer del PDF generado
 */
export async function generateConsentPdf(
	data: Consent,
	signatureBuffer?: Buffer,
): Promise<Buffer> {
	// Validaciones defensivas de campos requeridos
	if (!data) {
		throw new Error("No se proporcionaron datos del consentimiento");
	}

	if (!data.adultSnapshot) {
		throw new Error(
			"Datos del adulto responsable no encontrados (adultSnapshot)",
		);
	}

	if (!data.minorsSnapshot || !Array.isArray(data.minorsSnapshot)) {
		logger.warn("minorsSnapshot no es un array, usando array vacio");
		data.minorsSnapshot = [];
	}

	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
	const { width, height } = page.getSize();

	// Cargar fuentes
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const contentWidth = width - PAGE.marginX * 2;
	let yPosition = height;

	// =========================================================================
	// 1. HEADER VISUAL (Rectángulo morado con logo)
	// =========================================================================

	// Dibujar rectángulo header
	page.drawRectangle({
		x: 0,
		y: height - HEADER.height,
		width: width,
		height: HEADER.height,
		color: COLORS.purple,
	});

	// Intentar cargar y dibujar logo
	try {
		const logoPath = path.join(
			process.cwd(),
			"public",
			"assets",
			"jumping-park-logo-optimized.png",
		);
		const logoBytes = await fs.readFile(logoPath);
		const logoImage = await pdfDoc.embedPng(logoBytes);

		// Calcular escala manteniendo proporción
		const logoAspect = logoImage.width / logoImage.height;
		let logoWidth = HEADER.logoMaxWidth;
		let logoHeight = logoWidth / logoAspect;

		if (logoHeight > HEADER.logoMaxHeight) {
			logoHeight = HEADER.logoMaxHeight;
			logoWidth = logoHeight * logoAspect;
		}

		// Centrar logo en el header
		const logoX = (width - logoWidth) / 2;
		const logoY = height - HEADER.height / 2 - logoHeight / 2;

		page.drawImage(logoImage, {
			x: logoX,
			y: logoY,
			width: logoWidth,
			height: logoHeight,
		});
	} catch (error) {
		// Fallback: texto si no hay logo
		logger.error("Error cargando logo", error);
		const fallbackText = "JUMPING PARK";
		const textWidth = boldFont.widthOfTextAtSize(fallbackText, 24);
		page.drawText(fallbackText, {
			x: (width - textWidth) / 2,
			y: height - HEADER.height / 2 - 8,
			size: 24,
			font: boldFont,
			color: COLORS.white,
		});
	}

	yPosition = height - HEADER.height - 30;

	// =========================================================================
	// 2. TÍTULO DEL DOCUMENTO
	// =========================================================================

	const title = "CONSENTIMIENTO INFORMADO Y EXONERACIÓN DE RESPONSABILIDAD";
	const titleFontSize = 12;
	const titleWidth = boldFont.widthOfTextAtSize(title, titleFontSize);
	const titleX = (width - titleWidth) / 2;

	page.drawText(title, {
		x: titleX,
		y: yPosition,
		size: titleFontSize,
		font: boldFont,
		color: COLORS.darkText,
	});

	yPosition -= 8;
	drawSeparator(page, yPosition);
	yPosition -= 25;

	// =========================================================================
	// 3. TEXTO LEGAL COMPLETO (Importado desde legalContent.ts)
	// =========================================================================

	// Obtener contenido legal con placeholders reemplazados
	const legalContent = getConsentContent();
	const { consent } = legalContent;

	// Título de la sección de consentimiento
	page.drawText(consent.subtitle, {
		x: PAGE.marginX,
		y: yPosition,
		size: 8,
		font,
		color: COLORS.lightText,
	});
	yPosition -= 18;

	// Introducción del consentimiento
	yPosition = drawWrappedText(
		page,
		consent.introduction,
		PAGE.marginX,
		yPosition,
		font,
		9,
		contentWidth,
		12,
		COLORS.darkText,
	);
	yPosition -= 12;

	// DECLARACIÓN JURAMENTADA Y TÉRMINOS - Texto legal completo
	const companyName = DEFAULT_CONSENT_CONTENT.meta.companyName;
	const fullLegalClauses = DEFAULT_CONSENT_CONTENT.consent.clauses
		.map((c) => `${c.id}. ${c.text.replace(/{COMPANY_NAME}/g, companyName)}`)
		.join("\n\n");

	const fullLegalText = `DECLARACIÓN JURAMENTADA Y TÉRMINOS:\n\n${fullLegalClauses}\n\n${DEFAULT_CONSENT_CONTENT.consent.closingStatement.replace(/{COMPANY_NAME}/g, companyName)}`;

	// Renderizar texto legal completo con fuente pequeña
	// Dividir en líneas y verificar si necesitamos más páginas
	const legalFontSize = 7;
	const legalLineHeight = 9;
	const legalLines = fullLegalText.split("\n").flatMap((paragraph) => {
		if (paragraph.trim() === "") return [""];
		return wrapText(paragraph, font, legalFontSize, contentWidth);
	});

	// Calcular espacio mínimo necesario para datos del responsable, menores, firma y footer
	const minSpaceForRest = 280;
	let currentPage = page;

	for (const line of legalLines) {
		// Verificar si necesitamos una nueva página
		if (yPosition < PAGE.marginBottom + minSpaceForRest) {
			// Agregar indicador de continuación
			currentPage.drawText("(continúa en la siguiente página...)", {
				x: PAGE.marginX,
				y: yPosition,
				size: 7,
				font,
				color: COLORS.lightText,
			});

			// Crear nueva página
			currentPage = pdfDoc.addPage([PAGE.width, PAGE.height]);
			yPosition = PAGE.height - PAGE.marginTop;

			// Header simple en página de continuación
			currentPage.drawText("CONSENTIMIENTO INFORMADO (Continuación)", {
				x: PAGE.marginX,
				y: yPosition,
				size: 10,
				font: boldFont,
				color: COLORS.darkText,
			});
			yPosition -= 25;
		}

		if (line.trim()) {
			currentPage.drawText(line, {
				x: PAGE.marginX,
				y: yPosition,
				size: legalFontSize,
				font,
				color: COLORS.darkText,
			});
		}
		yPosition -= legalLineHeight;
	}

	// Usar la última página para el resto del contenido
	// Reasignar para que las siguientes secciones usen la página correcta
	const finalPage = currentPage;

	yPosition -= 15;
	drawSeparator(finalPage, yPosition);
	yPosition -= 25;

	// =========================================================================
	// 4. DATOS DEL RESPONSABLE
	// =========================================================================

	// Título de sección con icono verde
	finalPage.drawRectangle({
		x: PAGE.marginX,
		y: yPosition - 2,
		width: 4,
		height: 16,
		color: COLORS.green,
	});

	finalPage.drawText("DATOS DEL RESPONSABLE", {
		x: PAGE.marginX + 12,
		y: yPosition,
		size: 11,
		font: boldFont,
		color: COLORS.darkText,
	});

	yPosition -= 22;

	// Grid de datos
	const labelWidth = 80;
	const dataFields = [
		{ label: "Nombre:", value: data.adultSnapshot?.fullName },
		{ label: "Documento:", value: data.adultSnapshot?.uid || data.userId },
		{ label: "Email:", value: data.adultSnapshot?.email },
		{ label: "Teléfono:", value: data.adultSnapshot?.phone },
	];

	for (const field of dataFields) {
		finalPage.drawText(field.label, {
			x: PAGE.marginX,
			y: yPosition,
			size: 9,
			font: boldFont,
			color: COLORS.lightText,
		});

		drawTruncatedText(
			finalPage,
			field.value || "N/A",
			PAGE.marginX + labelWidth,
			yPosition,
			font,
			9,
			contentWidth - labelWidth,
			COLORS.darkText,
		);

		yPosition -= 16;
	}

	yPosition -= 10;
	drawSeparator(finalPage, yPosition);
	yPosition -= 25;

	// =========================================================================
	// 5. MENORES A CARGO
	// =========================================================================

	// Título de sección con icono azul
	finalPage.drawRectangle({
		x: PAGE.marginX,
		y: yPosition - 2,
		width: 4,
		height: 16,
		color: COLORS.blue,
	});

	finalPage.drawText("MENORES A CARGO", {
		x: PAGE.marginX + 12,
		y: yPosition,
		size: 11,
		font: boldFont,
		color: COLORS.darkText,
	});

	yPosition -= 22;

	if (data.minorsSnapshot.length === 0) {
		finalPage.drawText("No se registraron menores a cargo.", {
			x: PAGE.marginX,
			y: yPosition,
			size: 9,
			font,
			color: COLORS.lightText,
		});
		yPosition -= 20;
	} else {
		for (const minor of data.minorsSnapshot) {
			// Construir nombre completo
			const minorName =
				minor.firstName || minor.lastName
					? `${minor.firstName || ""} ${minor.lastName || ""}`.trim()
					: minor.fullName || "Sin nombre";

			// Bullet point verde
			finalPage.drawCircle({
				x: PAGE.marginX + 4,
				y: yPosition + 3,
				size: 3,
				color: COLORS.green,
			});

			// Nombre del menor (truncado si es necesario)
			drawTruncatedText(
				finalPage,
				minorName,
				PAGE.marginX + 14,
				yPosition,
				boldFont,
				9,
				contentWidth - 14,
				COLORS.darkText,
			);

			yPosition -= 14;

			// Detalles del menor
			const details: string[] = [];
			if (minor.relationship) details.push(`Parentesco: ${minor.relationship}`);
			if (minor.birthDate) details.push(`Nacimiento: ${minor.birthDate}`);
			if (minor.eps) details.push(`EPS: ${minor.eps}`);
			if (minor.idType && minor.idNumber) {
				details.push(`${minor.idType.toUpperCase()}: ${minor.idNumber}`);
			}

			const detailsText = details.join(" | ");
			drawTruncatedText(
				finalPage,
				detailsText,
				PAGE.marginX + 14,
				yPosition,
				font,
				8,
				contentWidth - 14,
				COLORS.lightText,
			);

			yPosition -= 18;
		}
	}

	yPosition -= 5;
	drawSeparator(finalPage, yPosition);
	yPosition -= 25;

	// =========================================================================
	// 6. FIRMA DIGITAL
	// =========================================================================

	// Título de sección con icono morado
	finalPage.drawRectangle({
		x: PAGE.marginX,
		y: yPosition - 2,
		width: 4,
		height: 16,
		color: COLORS.purple,
	});

	finalPage.drawText("FIRMA DIGITAL", {
		x: PAGE.marginX + 12,
		y: yPosition,
		size: 11,
		font: boldFont,
		color: COLORS.darkText,
	});

	yPosition -= 20;

	// Intentar embeber firma
	try {
		let sigBuffer = signatureBuffer;

		if (!sigBuffer && data.signatureUrl) {
			const response = await fetch(data.signatureUrl);
			const arrayBuffer = await response.arrayBuffer();
			sigBuffer = Buffer.from(arrayBuffer);
		}

		if (sigBuffer) {
			const signatureImage = await pdfDoc.embedPng(sigBuffer);

			// Calcular dimensiones máximas
			const maxSigWidth = 200;
			const maxSigHeight = 80;
			const sigAspect = signatureImage.width / signatureImage.height;

			let sigWidth = maxSigWidth;
			let sigHeight = sigWidth / sigAspect;

			if (sigHeight > maxSigHeight) {
				sigHeight = maxSigHeight;
				sigWidth = sigHeight * sigAspect;
			}

			// Caja contenedora de firma
			finalPage.drawRectangle({
				x: PAGE.marginX,
				y: yPosition - sigHeight - 10,
				width: sigWidth + 20,
				height: sigHeight + 20,
				borderColor: COLORS.separator,
				borderWidth: 1,
			});

			finalPage.drawImage(signatureImage, {
				x: PAGE.marginX + 10,
				y: yPosition - sigHeight - 5,
				width: sigWidth,
				height: sigHeight,
			});

			yPosition -= sigHeight + 35;
		} else {
			throw new Error("No signature buffer available");
		}
	} catch (error) {
		logger.error("Error embebiendo firma", error);
		finalPage.drawText("(Firma no disponible)", {
			x: PAGE.marginX,
			y: yPosition - 15,
			size: 9,
			font,
			color: COLORS.lightText,
		});
		yPosition -= 40;
	}

	// =========================================================================
	// 7. FOOTER INFORMATIVO
	// =========================================================================

	const footerY = PAGE.marginBottom - 20;

	// Línea separadora del footer
	drawSeparator(finalPage, footerY + 25);

	// Dirección legal
	const footerAddress =
		"Jumping Park - C.C. Primavera Urbana, Piso 3, Local 314 - Villavicencio, Meta";
	const addressWidth = font.widthOfTextAtSize(footerAddress, 8);
	finalPage.drawText(footerAddress, {
		x: (width - addressWidth) / 2,
		y: footerY + 10,
		size: 8,
		font,
		color: COLORS.lightText,
	});

	// ID del documento y timestamp
	const signedAtDate = data.signedAt ? toDate(data.signedAt) : new Date();
	const consecutivo = data.consecutivo || "sin-numero";
	const footerMeta = `Documento ID: ${data.id || "N/A"} | Consecutivo: #${consecutivo} | Firmado: ${formatDate(signedAtDate)}`;
	const metaWidth = font.widthOfTextAtSize(footerMeta, 7);
	finalPage.drawText(footerMeta, {
		x: (width - metaWidth) / 2,
		y: footerY - 5,
		size: 7,
		font,
		color: COLORS.lightText,
	});

	// =========================================================================
	// 8. GENERAR Y RETORNAR PDF
	// =========================================================================

	const pdfBytes = await pdfDoc.save();
	return Buffer.from(pdfBytes);
}
