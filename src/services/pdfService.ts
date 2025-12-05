/**
 * PDF Service - Generación de Consentimientos Jumping Park
 *
 * Genera documentos PDF profesionales con diseño de marca.
 * Incluye manejo de texto largo (truncate/wrap) para evitar desbordamientos.
 */
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, RGB } from "pdf-lib";
import type { Consent, Minor } from "@/types/firestore";
import fs from "fs/promises";
import path from "path";

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
  maxWidth: number
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
  maxWidth: number
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
  color: RGB = COLORS.darkText
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
  color: RGB = COLORS.darkText
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
  endX: number = PAGE.width - PAGE.marginX
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
 */
function toDate(value: Date | { toDate: () => Date }): Date {
  if (value instanceof Date) return value;
  if (typeof value === "object" && "toDate" in value) return value.toDate();
  return new Date();
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
  signatureBuffer?: Buffer
): Promise<Buffer> {
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
      "jumping-park-logo.png"
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
    console.error("[PDFService] Error cargando logo:", error);
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
  // 3. TEXTO LEGAL
  // =========================================================================

  const legalParagraphs = [
    "Por medio del presente documento, yo, identificado como aparece al pie de mi firma, actuando en nombre propio y/o como padre, madre o tutor legal de los menores relacionados, declaro que he leído, comprendido y aceptado los términos y condiciones de uso de las instalaciones de JUMPING PARK.",
    "Reconozco que la actividad física en camas elásticas y atracciones similares conlleva riesgos inherentes, incluyendo pero no limitado a lesiones físicas. Asumo voluntariamente todos los riesgos asociados con el uso de las instalaciones.",
    "Exonero a JUMPING PARK, sus empleados, directivos y agentes de cualquier responsabilidad por lesiones, daños o pérdidas que puedan ocurrir durante mi estancia o la de los menores a mi cargo en las instalaciones, salvo aquellos derivados de negligencia grave o dolo por parte de la empresa.",
    "Certifico que yo y los menores a mi cargo nos encontramos en condiciones físicas aptas para participar en las actividades y que seguiremos todas las instrucciones de seguridad impartidas por el personal.",
  ];

  for (const paragraph of legalParagraphs) {
    yPosition = drawWrappedText(
      page,
      paragraph,
      PAGE.marginX,
      yPosition,
      font,
      9,
      contentWidth,
      12,
      COLORS.lightText
    );
    yPosition -= 8;
  }

  yPosition -= 10;
  drawSeparator(page, yPosition);
  yPosition -= 25;

  // =========================================================================
  // 4. DATOS DEL RESPONSABLE
  // =========================================================================

  // Título de sección con icono verde
  page.drawRectangle({
    x: PAGE.marginX,
    y: yPosition - 2,
    width: 4,
    height: 16,
    color: COLORS.green,
  });

  page.drawText("DATOS DEL RESPONSABLE", {
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
    { label: "Nombre:", value: data.adultSnapshot.fullName },
    { label: "Documento:", value: data.adultSnapshot.uid },
    { label: "Email:", value: data.adultSnapshot.email },
    { label: "Teléfono:", value: data.adultSnapshot.phone },
  ];

  for (const field of dataFields) {
    page.drawText(field.label, {
      x: PAGE.marginX,
      y: yPosition,
      size: 9,
      font: boldFont,
      color: COLORS.lightText,
    });

    drawTruncatedText(
      page,
      field.value || "N/A",
      PAGE.marginX + labelWidth,
      yPosition,
      font,
      9,
      contentWidth - labelWidth,
      COLORS.darkText
    );

    yPosition -= 16;
  }

  yPosition -= 10;
  drawSeparator(page, yPosition);
  yPosition -= 25;

  // =========================================================================
  // 5. MENORES A CARGO
  // =========================================================================

  // Título de sección con icono azul
  page.drawRectangle({
    x: PAGE.marginX,
    y: yPosition - 2,
    width: 4,
    height: 16,
    color: COLORS.blue,
  });

  page.drawText("MENORES A CARGO", {
    x: PAGE.marginX + 12,
    y: yPosition,
    size: 11,
    font: boldFont,
    color: COLORS.darkText,
  });

  yPosition -= 22;

  if (data.minorsSnapshot.length === 0) {
    page.drawText("No se registraron menores a cargo.", {
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
      page.drawCircle({
        x: PAGE.marginX + 4,
        y: yPosition + 3,
        size: 3,
        color: COLORS.green,
      });

      // Nombre del menor (truncado si es necesario)
      drawTruncatedText(
        page,
        minorName,
        PAGE.marginX + 14,
        yPosition,
        boldFont,
        9,
        contentWidth - 14,
        COLORS.darkText
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
        page,
        detailsText,
        PAGE.marginX + 14,
        yPosition,
        font,
        8,
        contentWidth - 14,
        COLORS.lightText
      );

      yPosition -= 18;
    }
  }

  yPosition -= 5;
  drawSeparator(page, yPosition);
  yPosition -= 25;

  // =========================================================================
  // 6. FIRMA DIGITAL
  // =========================================================================

  // Título de sección con icono morado
  page.drawRectangle({
    x: PAGE.marginX,
    y: yPosition - 2,
    width: 4,
    height: 16,
    color: COLORS.purple,
  });

  page.drawText("FIRMA DIGITAL", {
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
      page.drawRectangle({
        x: PAGE.marginX,
        y: yPosition - sigHeight - 10,
        width: sigWidth + 20,
        height: sigHeight + 20,
        borderColor: COLORS.separator,
        borderWidth: 1,
      });

      page.drawImage(signatureImage, {
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
    console.error("[PDFService] Error embebiendo firma:", error);
    page.drawText("(Firma no disponible)", {
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
  drawSeparator(page, footerY + 25);

  // Dirección legal
  const footerAddress = "Jumping Park - C.C. Primavera Urbana, Piso 3, Local 314 - Villavicencio, Meta";
  const addressWidth = font.widthOfTextAtSize(footerAddress, 8);
  page.drawText(footerAddress, {
    x: (width - addressWidth) / 2,
    y: footerY + 10,
    size: 8,
    font,
    color: COLORS.lightText,
  });

  // ID del documento y timestamp
  const signedAtDate = toDate(data.signedAt);
  const footerMeta = `Documento ID: ${data.id} | Consecutivo: #${data.consecutivo} | Firmado: ${formatDate(signedAtDate)}`;
  const metaWidth = font.widthOfTextAtSize(footerMeta, 7);
  page.drawText(footerMeta, {
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
