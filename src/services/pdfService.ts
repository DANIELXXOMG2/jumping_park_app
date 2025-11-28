import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Consent } from '@/types/firestore';
import fs from 'fs/promises';
import path from 'path';

export async function generateConsentPdf(data: Consent, signatureBuffer?: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;

  // 1. Logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'jumping-park-logo.png');
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.2); // Adjust scale as needed
    page.drawImage(logoImage, {
      x: 50,
      y: yPosition - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
    yPosition -= (logoDims.height + 20);
  } catch (error) {
    console.error("Error loading logo:", error);
    page.drawText('JUMPING PARK', { x: 50, y: yPosition, size: 20, font: boldFont });
    yPosition -= 40;
  }

  // 2. Title
  page.drawText('CONSENTIMIENTO INFORMADO Y EXONERACIÓN DE RESPONSABILIDAD', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    maxWidth: width - 100,
  });
  yPosition -= 40;

  // 3. Legal Text (Placeholder)
  const legalText = `
Por medio del presente documento, yo, identificado como aparece al pie de mi firma, actuando en nombre propio y/o como padre, madre o tutor legal de los menores relacionados, declaro que he leído, comprendido y aceptado los términos y condiciones de uso de las instalaciones de JUMPING PARK.

Reconozco que la actividad física en camas elásticas y atracciones similares conlleva riesgos inherentes, incluyendo pero no limitado a lesiones físicas. Asumo voluntariamente todos los riesgos asociados con el uso de las instalaciones.

Exonero a JUMPING PARK, sus empleados, directivos y agentes de cualquier responsabilidad por lesiones, daños o pérdidas que puedan ocurrir durante mi estancia o la de los menores a mi cargo en las instalaciones, salvo aquellos derivados de negligencia grave o dolo por parte de la empresa.

Certifico que yo y los menores a mi cargo nos encontramos en condiciones físicas aptas para participar en las actividades y que seguiremos todas las instrucciones de seguridad impartidas por el personal.
  `;

  page.drawText(legalText.trim(), {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
    maxWidth: width - 100,
    lineHeight: 14,
  });
  
  // Calculate space taken by text roughly or just move down enough
  yPosition -= 200; 

  // 4. Responsible Data
  page.drawText('DATOS DEL RESPONSABLE:', { x: 50, y: yPosition, size: 12, font: boldFont });
  yPosition -= 20;
  page.drawText(`Nombre: ${data.adultSnapshot.fullName}`, { x: 50, y: yPosition, size: 10, font: font });
  yPosition -= 15;
  page.drawText(`Documento: ${data.adultSnapshot.uid}`, { x: 50, y: yPosition, size: 10, font: font });
  yPosition -= 15;
  page.drawText(`Email: ${data.adultSnapshot.email}`, { x: 50, y: yPosition, size: 10, font: font });
  yPosition -= 15;
  page.drawText(`Teléfono: ${data.adultSnapshot.phone}`, { x: 50, y: yPosition, size: 10, font: font });
  yPosition -= 30;

  // 5. Minors List
  page.drawText('MENORES A CARGO:', { x: 50, y: yPosition, size: 12, font: boldFont });
  yPosition -= 20;
  
  data.minorsSnapshot.forEach((minor) => {
    const minorName = (minor.firstName || minor.lastName)
      ? `${minor.firstName || ""} ${minor.lastName || ""}`.trim()
      : (minor.fullName || "");
    const idInfo = minor.idType && minor.idNumber ? ` | ${minor.idType.toUpperCase()}: ${minor.idNumber}` : "";
    const epsInfo = minor.eps ? ` | EPS: ${minor.eps}` : "";

    page.drawText(`- ${minorName} (${minor.relationship}) - Nacimiento: ${minor.birthDate}${idInfo}${epsInfo}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;
  });
  yPosition -= 30;

  // 6. Signature
  page.drawText('FIRMA:', { x: 50, y: yPosition, size: 12, font: boldFont });
  yPosition -= 10; // Space for signature

  let signatureImage;
  try {
    let sigBuffer = signatureBuffer;
    if (!sigBuffer && data.signatureUrl) {
        // Fetch if not provided
        const response = await fetch(data.signatureUrl);
        const arrayBuffer = await response.arrayBuffer();
        sigBuffer = Buffer.from(arrayBuffer);
    }

    if (sigBuffer) {
        signatureImage = await pdfDoc.embedPng(sigBuffer);
        const sigDims = signatureImage.scale(0.5);
        page.drawImage(signatureImage, {
            x: 50,
            y: yPosition - sigDims.height,
            width: sigDims.width,
            height: sigDims.height,
        });
        yPosition -= (sigDims.height + 10);
    }
  } catch (e) {
      console.error("Error embedding signature", e);
      page.drawText('(Firma no disponible)', { x: 50, y: yPosition - 20, size: 10, font: font });
  }

  // Footer
  const footerY = 30;
  // Handle Date object or Timestamp
  const signedAtDate = data.signedAt instanceof Date 
    ? data.signedAt 
    : (data.signedAt as unknown as { toDate: () => Date }).toDate();

  page.drawText(`Consentimiento ID: ${data.id} | Fecha: ${signedAtDate.toISOString()}`, {
      x: 50,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
