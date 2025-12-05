"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Resultado del escaneo OCR con datos parseados
 */
interface OCRResult {
  rawText: string;
  confidence: number;
  parsedData: {
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
  };
}

/**
 * Estado del hook useOCRScanner
 */
interface OCRScannerState {
  scanning: boolean;
  progress: number;
  text: string;
  confidence: number;
  error: string | null;
  parsedData: OCRResult["parsedData"];
}

/**
 * Patrones Regex para documentos colombianos
 */
const PATTERNS = {
  // Cédula colombiana: 6-10 dígitos, puede tener prefijos como C.C., CC, NUIP
  CEDULA: /(?:C\.?C\.?|NUIP|No\.?|N[úu]mero)?[\s.:]*(\d{6,10})/gi,
  // Fecha de nacimiento en varios formatos
  FECHA_NACIMIENTO: /(?:F\.?\s*Nac\.?|Nacimiento|Fecha\s*Nac\.?)[\s.:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
  FECHA_ISO: /(\d{4}[-/]\d{2}[-/]\d{2})/g,
  FECHA_DMY: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,
  // Nombres (busca después de palabras clave)
  NOMBRE: /(?:Nombres?|NOMBRES?)[\s.:]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g,
  APELLIDO: /(?:Apellidos?|APELLIDOS?)[\s.:]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g,
};

/**
 * Parsea el texto OCR para extraer datos relevantes de documentos colombianos
 */
function parseDocumentData(text: string): OCRResult["parsedData"] {
  const result: OCRResult["parsedData"] = {};

  // Extraer número de documento (cédula/TI)
  const cedulaMatches = [...text.matchAll(PATTERNS.CEDULA)];
  if (cedulaMatches.length > 0) {
    // Tomar el primer número válido encontrado
    const validNumbers = cedulaMatches
      .map((m) => m[1])
      .filter((n) => n && n.length >= 6 && n.length <= 10);
    if (validNumbers.length > 0) {
      result.documentNumber = validNumbers[0];
    }
  }

  // Extraer fecha de nacimiento
  const fechaNacMatches = [...text.matchAll(PATTERNS.FECHA_NACIMIENTO)];
  if (fechaNacMatches.length > 0) {
    result.birthDate = normalizeDateToISO(fechaNacMatches[0][1]);
  } else {
    // Intentar con formatos genéricos
    const fechaISOMatches = [...text.matchAll(PATTERNS.FECHA_ISO)];
    const fechaDMYMatches = [...text.matchAll(PATTERNS.FECHA_DMY)];

    if (fechaISOMatches.length > 0) {
      result.birthDate = fechaISOMatches[0][1].replace(/\//g, "-");
    } else if (fechaDMYMatches.length > 0) {
      result.birthDate = normalizeDateToISO(fechaDMYMatches[0][1]);
    }
  }

  // Extraer nombres
  const nombreMatches = [...text.matchAll(PATTERNS.NOMBRE)];
  if (nombreMatches.length > 0) {
    result.firstName = nombreMatches[0][1].trim();
  }

  // Extraer apellidos
  const apellidoMatches = [...text.matchAll(PATTERNS.APELLIDO)];
  if (apellidoMatches.length > 0) {
    result.lastName = apellidoMatches[0][1].trim();
  }

  return result;
}

/**
 * Normaliza una fecha al formato ISO (YYYY-MM-DD)
 */
function normalizeDateToISO(dateStr: string): string {
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;

  const [first, second, third] = parts;

  // Determinar el formato (DD/MM/YYYY o YYYY/MM/DD)
  if (first.length === 4) {
    // Ya está en formato ISO-like
    return `${first}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
  } else {
    // Formato DD/MM/YYYY o DD/MM/YY
    const day = first.padStart(2, "0");
    const month = second.padStart(2, "0");
    let year = third;

    // Convertir año de 2 dígitos a 4
    if (year.length === 2) {
      const century = parseInt(year) > 50 ? 1900 : 2000;
      year = String(century + parseInt(year));
    }

    return `${year}-${month}-${day}`;
  }
}

/**
 * Pre-procesa la imagen usando Canvas para mejorar el OCR
 * - Convierte a escala de grises
 * - Aumenta el contraste
 */
async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }

      // Escalar si la imagen es muy grande (mejora performance)
      const maxDimension = 2000;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen original
      ctx.drawImage(img, 0, 0, width, height);

      // Obtener datos de imagen
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Aplicar escala de grises y aumento de contraste
      const contrastFactor = 1.5; // Factor de contraste

      for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises usando luminosidad
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Aplicar contraste
        let enhanced = ((gray - 128) * contrastFactor + 128);
        enhanced = Math.max(0, Math.min(255, enhanced));

        // Binarización suave (threshold adaptativo)
        const threshold = 140;
        const finalValue = enhanced > threshold ? 255 : enhanced < 80 ? 0 : enhanced;

        data[i] = finalValue; // R
        data[i + 1] = finalValue; // G
        data[i + 2] = finalValue; // B
        // Alpha (data[i + 3]) se mantiene igual
      }

      ctx.putImageData(imageData, 0, 0);

      // Convertir canvas a Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Error al convertir canvas a blob"));
          }
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar la imagen"));
    };

    img.src = url;
  });
}

/**
 * Hook personalizado para escaneo OCR de documentos
 * Usa Tesseract.js con lazy loading del worker WASM
 */
export function useOCRScanner() {
  const [state, setState] = useState<OCRScannerState>({
    scanning: false,
    progress: 0,
    text: "",
    confidence: 0,
    error: null,
    parsedData: {},
  });

  // Referencia al worker para reutilizarlo
  const workerRef = useRef<Awaited<
    ReturnType<typeof import("tesseract.js").createWorker>
  > | null>(null);

  /**
   * Inicializa el worker de Tesseract de forma lazy
   */
  const initializeWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    // Import dinámico para lazy loading
    const Tesseract = await import("tesseract.js");

    const worker = await Tesseract.createWorker("spa", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setState((prev) => ({
            ...prev,
            progress: Math.round(m.progress * 100),
          }));
        }
      },
    });

    workerRef.current = worker;
    return worker;
  }, []);

  /**
   * Escanea una imagen y extrae texto usando OCR
   */
  const scanImage = useCallback(
    async (file: File): Promise<OCRResult> => {
      setState({
        scanning: true,
        progress: 0,
        text: "",
        confidence: 0,
        error: null,
        parsedData: {},
      });

      try {
        // Pre-procesar imagen
        setState((prev) => ({ ...prev, progress: 5 }));
        const processedBlob = await preprocessImage(file);

        // Inicializar worker (lazy loading)
        setState((prev) => ({ ...prev, progress: 10 }));
        const worker = await initializeWorker();

        // Ejecutar OCR
        const result = await worker.recognize(processedBlob);

        const rawText = result.data.text;
        const confidence = result.data.confidence;

        // Parsear datos del documento
        const parsedData = parseDocumentData(rawText);

        const ocrResult: OCRResult = {
          rawText,
          confidence,
          parsedData,
        };

        setState({
          scanning: false,
          progress: 100,
          text: rawText,
          confidence,
          error: null,
          parsedData,
        });

        return ocrResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido en OCR";

        setState((prev) => ({
          ...prev,
          scanning: false,
          progress: 0,
          error: errorMessage,
        }));

        throw new Error(errorMessage);
      }
    },
    [initializeWorker]
  );

  /**
   * Resetea el estado del escáner
   */
  const reset = useCallback(() => {
    setState({
      scanning: false,
      progress: 0,
      text: "",
      confidence: 0,
      error: null,
      parsedData: {},
    });
  }, []);

  /**
   * Termina el worker para liberar memoria
   */
  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    ...state,
    scanImage,
    reset,
    terminate,
  };
}

export type { OCRResult, OCRScannerState };
