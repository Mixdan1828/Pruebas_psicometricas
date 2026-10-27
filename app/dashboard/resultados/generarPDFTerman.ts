import jsPDF from "jspdf";
import {
  obtenerPreguntas,
  parseRespuestas,
  tieneRespuestas,
  type QuestionAnswer,
  type ResultadoCrudo,
} from "@/lib/utils/parseAnswers";

// ---------------------------------------------------------------------------
// Definición de las 10 series (subtests) del Test de Terman-Merril.
// ---------------------------------------------------------------------------

export interface SerieTerman {
  clave: string;
  nombre: string;
  inicio: number;
  fin: number;
  cantidad: number;
  minutos: number;
  bloques?: { desde: number; hasta: number }[];
}

export const SERIES_TERMAN: SerieTerman[] = [
  { clave: "I", nombre: "I - 2", inicio: 1, fin: 16, cantidad: 16, minutos: 2 },
  { clave: "II", nombre: "II - 2", inicio: 17, fin: 27, cantidad: 11, minutos: 2 },
  {
    clave: "III",
    nombre: "III - 2",
    inicio: 28,
    fin: 57,
    cantidad: 30,
    minutos: 3,
    bloques: [
      { desde: 1, hasta: 15 },
      { desde: 16, hasta: 30 },
    ],
  },
  { clave: "IV", nombre: "IV - 3", inicio: 58, fin: 75, cantidad: 18, minutos: 3 },
  { clave: "V", nombre: "V - 5", inicio: 76, fin: 87, cantidad: 12, minutos: 5 },
  { clave: "VI", nombre: "VI - 2", inicio: 88, fin: 107, cantidad: 20, minutos: 2 },
  { clave: "VII", nombre: "VII - 2", inicio: 108, fin: 127, cantidad: 20, minutos: 2 },
  { clave: "VIII", nombre: "VIII - 3", inicio: 128, fin: 144, cantidad: 17, minutos: 3 },
  { clave: "IX", nombre: "IX - 3", inicio: 145, fin: 162, cantidad: 18, minutos: 3 },
  { clave: "X", nombre: "X - 4", inicio: 163, fin: 173, cantidad: 11, minutos: 4 },
];

export function esTestTerman(prueba: ResultadoCrudo | null | undefined): boolean {
  const test = Array.isArray(prueba?.tests) ? prueba?.tests[0] : prueba?.tests;
  const campos = [test?.name, test?.type]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  return campos.some(
    (v) => v.includes("terman") || v.includes("merril") || v.includes("merrill")
  );
}

export interface DatosCandidatoTerman {
  full_name?: string | null;
  paternal_surname?: string | null;
  maternal_surname?: string | null;
  age?: number | null;
  sex?: string | null;
  Fecha_Nacimiento?: string | null;
  id?: string | null;
}

export interface GenerarPDFTermanOptions {
  candidato: DatosCandidatoTerman | null;
  prueba: ResultadoCrudo;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

// ---------------------------------------------------------------------------
// Constantes de maquetado (mm, A4 horizontal) - Blanco y Negro
// ---------------------------------------------------------------------------

const MARGEN = 10;
const ALTO_FILA = 6.2;
const ANCHO_NUM = 4.8;

function limpiarTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u2022\u00B7]/g, "*")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function nombreCompleto(candidato: DatosCandidatoTerman | null): string {
  return [candidato?.full_name, candidato?.paternal_surname, candidato?.maternal_surname]
    .filter(Boolean)
    .map((v) => limpiarTexto(v))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatearFechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  try {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return limpiarTexto(fecha);
  }
}

function edadDesdeNacimiento(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  try {
    const fecha = new Date(fechaNacimiento);
    if (Number.isNaN(fecha.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
    return edad >= 0 && edad < 130 ? edad : null;
  } catch {
    return null;
  }
}

function mapearRespuestas(prueba: ResultadoCrudo): Map<number, QuestionAnswer> {
  const mapa = new Map<number, QuestionAnswer>();
  try {
    const preguntas = obtenerPreguntas(prueba);
    if (preguntas.length === 0 || !tieneRespuestas(prueba.answers_json)) return mapa;
    parseRespuestas(prueba.answers_json, preguntas).forEach((r) => {
      mapa.set(Number(r.numero), { ...r, respuesta: limpiarTexto(r.respuesta) });
    });
  } catch {
    // Silencioso si no hay respuestas
  }
  return mapa;
}

async function obtenerImagenLogo(): Promise<string | null> {
  try {
    const response = await fetch("/images/FDHZ_2025-Color_Vertical.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dibujo: Encabezado y Datos Generales
// ---------------------------------------------------------------------------

async function escribirEncabezadoGeneral(
  doc: jsPDF,
  candidato: DatosCandidatoTerman | null,
  fechaInicioPrueba: string
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Cuadro superior derecho (4 cm de ancho x 2.5 cm de alto) encima del título
  const cuadroAncho = 40; // 40 mm = 4 cm
  const cuadroAlto = 25;  // 25 mm = 2.5 cm
  const cuadroX = pageWidth - MARGEN - cuadroAncho;
  const cuadroY = 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(cuadroX, cuadroY, cuadroAncho, cuadroAlto);

  try {
    const logoData = await obtenerImagenLogo();
    if (logoData) {
      doc.addImage(logoData, "PNG", cuadroX + 2, cuadroY + 2, cuadroAncho - 4, cuadroAlto - 4);
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6);
      doc.text("Logo Institucional", cuadroX + cuadroAncho / 2, cuadroY + cuadroAlto / 2, { align: "center" });
    }
  } catch {
    // Omite si falla
  }

  // 2. Título principal centrado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("TERMAN - MERRIL (HOJA DE RESPUESTAS)", (pageWidth - cuadroAncho) / 2, 16, { align: "center" });

  // 3. Datos del Candidato
  let cursorY = 37;

  const nombreVal = nombreCompleto(candidato) || "—";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`NOMBRE DEL CANDIDATO: `, MARGEN, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(nombreVal, MARGEN + 50, cursorY);

  cursorY += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE INICIO DE LA PRUEBA: `, MARGEN, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(fechaInicioPrueba, MARGEN + 58, cursorY);

  cursorY += 8;

  const sexoVal = limpiarTexto(candidato?.sex) || "—";
  const nacimientoVal = candidato?.Fecha_Nacimiento ? formatearFechaLarga(candidato.Fecha_Nacimiento) : "—";
  const edadCalculada = edadDesdeNacimiento(candidato?.Fecha_Nacimiento);
  const edadVal = candidato?.age != null ? `${candidato.age} años` : edadCalculada != null ? `${edadCalculada} años` : "—";

  doc.setFont("helvetica", "bold");
  doc.text(`SEXO:`, MARGEN, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(sexoVal, MARGEN + 14, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE NACIMIENTO:`, MARGEN + 45, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(nacimientoVal, MARGEN + 86, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text(`EDAD:`, MARGEN + 145, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(edadVal, MARGEN + 158, cursorY);

  return cursorY + 10;
}

// ---------------------------------------------------------------------------
// Dibujo: Cuadrícula de Series (Blanco y Negro)
// ---------------------------------------------------------------------------

function recortar(doc: jsPDF, texto: string, anchoMm: number): string {
  if (!texto) return "";
  if (doc.getTextWidth(texto) <= anchoMm) return texto;
  let salida = texto;
  while (salida.length > 1 && doc.getTextWidth(`${salida}.`) <= anchoMm) {
    salida = salida.slice(0, -1);
  }
  return `${salida}.`;
}

function dibujarCelda(
  doc: jsPDF,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  numero: number,
  respuesta: string,
  respondida: boolean,
  fontSize: number
): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.rect(x, y, ancho, alto);

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, ANCHO_NUM, alto, "F");
  doc.setDrawColor(0, 0, 0);
  doc.line(x + ANCHO_NUM, y, x + ANCHO_NUM, y + alto);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(String(numero), x + ANCHO_NUM / 2, y + alto / 2 + fontSize * 0.36, {
    align: "center",
  });

  const textoRespuesta = respondida ? respuesta : "";
  doc.setFont("helvetica", respondida ? "bold" : "italic");
  doc.setFontSize(respondida ? fontSize : fontSize - 0.5);
  doc.setTextColor(0, 0, 0);
  
  if (respondida) {
    const disponible = ancho - ANCHO_NUM - 1.4;
    doc.text(
      recortar(doc, textoRespuesta, disponible),
      x + ANCHO_NUM + 0.7,
      y + alto / 2 + fontSize * 0.36
    );
  } else {
    doc.text("-", x + ANCHO_NUM + 0.7, y + alto / 2 + fontSize * 0.36);
  }
}

function dibujarCuadriculaSeries(
  doc: jsPDF,
  mapaRespuestas: Map<number, QuestionAnswer>,
  inicioY: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const anchoTotal = pageWidth - MARGEN * 2;
  const anchoColumna = anchoTotal / SERIES_TERMAN.length;

  const maxReactivos = Math.max(...SERIES_TERMAN.map((s) => s.cantidad));
  const altoCabeceraSerie = 8;
  const altoFila = Math.min(
    ALTO_FILA,
    (doc.internal.pageSize.getHeight() - inicioY - altoCabeceraSerie - 12) / maxReactivos
  );
  const fontSize = altoFila < 5.5 ? 5 : 5.5;

  SERIES_TERMAN.forEach((serie, i) => {
    const x = MARGEN + i * anchoColumna;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, inicioY, anchoColumna, altoCabeceraSerie, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(serie.nombre.toUpperCase(), x + anchoColumna / 2, inicioY + 5, {
      align: "center",
    });
  });

  const yCeldas = inicioY + altoCabeceraSerie;

  SERIES_TERMAN.forEach((serie, col) => {
    const x = MARGEN + col * anchoColumna;

    for (let n = 1; n <= serie.cantidad; n += 1) {
      const numeroGlobal = serie.inicio + (n - 1);
      const registro = mapaRespuestas.get(numeroGlobal);
      const y = yCeldas + (n - 1) * altoFila;

      dibujarCelda(
        doc,
        x,
        y,
        anchoColumna,
        altoFila,
        n,
        registro?.respuesta ?? "",
        Boolean(registro?.respondida),
        fontSize
      );

      if (serie.bloques) {
        const finBloque = serie.bloques.find((b) => b.hasta === n);
        if (finBloque && n < serie.cantidad) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(x, y + altoFila, x + anchoColumna, y + altoFila);
        }
      }
    }
  });

  const altoCeldas = maxReactivos * altoFila;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(MARGEN, inicioY, anchoTotal, altoCabeceraSerie + altoCeldas);
}

// ---------------------------------------------------------------------------
// Pie de página
// ---------------------------------------------------------------------------

function escribirPiePagina(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(MARGEN, pageHeight - 6, pageWidth - MARGEN, pageHeight - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "Hoja de respuestas Terman-Merril - Registro oficial",
    MARGEN,
    pageHeight - 3
  );
  doc.text(
    `Página ${doc.getNumberOfPages()}`,
    pageWidth - MARGEN,
    pageHeight - 3,
    { align: "right" }
  );
}

// ---------------------------------------------------------------------------
// Función principal exportada
// ---------------------------------------------------------------------------

export async function generarPDFHojaRespuestasTerman({
  candidato,
  prueba,
  fechaAplicacion,
  onError,
}: GenerarPDFTermanOptions): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const fechaInicio =
      formatearFechaLarga(fechaAplicacion || prueba?.started_at) || "—";

    const yEncabezado = await escribirEncabezadoGeneral(doc, candidato, fechaInicio);
    const ySeries = yEncabezado + 10;

    const mapaRespuestas = mapearRespuestas(prueba);
    dibujarCuadriculaSeries(doc, mapaRespuestas, ySeries);

    escribirPiePagina(doc);

    const nombreArchivo =
      limpiarTexto(nombreCompleto(candidato)).replace(/\s+/g, "_").slice(0, 60) ||
      "candidato";
    doc.save(`hoja_terman_${nombreArchivo}.pdf`);
  } catch (err) {
    console.error("Error al generar la hoja de respuestas Terman:", err);
    const mensaje =
      err instanceof Error
        ? err.message
        : "No se pudo generar la hoja de respuestas en PDF.";
    if (onError) {
      onError(mensaje);
    } else {
      alert(mensaje);
    }
  }
}