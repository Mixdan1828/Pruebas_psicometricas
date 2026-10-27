// ---------------------------------------------------------------------------
// Componente PDF: Hoja de Respuestas Terman-Merril
// ---------------------------------------------------------------------------
// Plantilla para generar la hoja de respuestas en PDF (A4 horizontal)
// con la cuadrícula de las 10 series (I a X) y los datos del candidato.
// Diseño estrictamente en blanco y negro, con excepción del logotipo a color.
// ---------------------------------------------------------------------------

import jsPDF from "jspdf";

import {
  SERIES_TERMAN,
  type SerieTerman,
} from "./generarPDFTerman";

import {
  formatearRespuestaParaPDF,
  obtenerRespuestaReactivo,
  tieneRespuestaReactivo,
  limpiarTextoParaPDF,
} from "./utils/formatters";

//---------------------------------------------------------------------------
// Tipos y interfaces
//---------------------------------------------------------------------------

export interface DatosCandidatoPDF {
  full_name?: string | null;
  paternal_surname?: string | null;
  maternal_surname?: string | null;
  age?: number | null;
  sex?: string | null;
  birth_date?: string | null;
  id?: string | null;
}

export interface GenerarTermanPdfOptions {
  candidato: DatosCandidatoPDF | null;
  pruebaId: string;
  answersJson?: unknown;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

// Colores B/N para el diseño
const COLOR_PRIMARIO: [number, number, number] = [0, 0, 0];
const COLOR_TEXTO: [number, number, number] = [40, 40, 40];
const COLOR_LINEA: [number, number, number] = [100, 100, 100];
const COLOR_VERDE: [number, number, number] = [112, 164, 68];

// Constantes de maquetado (mm, A4 horizontal)
const MARGEN = 8;
const ALTO_FILA = 6.4;
const ANCHO_NUM = 5.2;

//---------------------------------------------------------------------------
// Funciones de dibujo (JSPDF puro, sin librerías adicionales)
//---------------------------------------------------------------------------

/**
 * Dibuja una celda de reactivo con borde y respuesta.
 */
function dibujarCelda(
  doc: jsPDF,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  numero: number,
  textoRespuesta: string,
  tieneRespuesta: boolean,
  fontSize: number
): void {
  // Région de la celda
  doc.setDrawColor(...COLOR_PRIMARIO);
  doc.setLineWidth(0.3);
  doc.rect(x, y, ancho, alto, "FD");

  // Número de pregunta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.text(String(numero), x + 1, y + Math.ceil(alto / 2) - 1, { align: "center" });

  // Respuesta (vacío por defecto)
  if (tieneRespuesta && textoRespuesta.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...COLOR_TEXTO);
    doc.text(textoRespuesta, x + ANCHO_NUM + 1, y + Math.ceil(alto / 2) - 1, { align: "left" });
  }
}

/**
 * Dibuja el logotipo institucional (color original).
 */
function dibujarLogotipo(doc: jsPDF): void {
  try {
    const imgPath = "images/FDHZ_2025-Color_Vertical.png";
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgProps = doc.getImageProperties(imgPath);
    const imgWidth = 25;
    const imgHeight = (imgProps.height / imgProps.width) * imgWidth;
    const x = pageWidth - MARGEN - imgWidth;
    const y = 10;
    doc.addImage(imgPath, "PNG", x, y, imgWidth, imgHeight);
  } catch {
    // Si no se encuentra la imagen, omitir
  }
}

//---------------------------------------------------------------------------
// Función principal
//---------------------------------------------------------------------------

/**
 * Genera la "Hoja de Respuestas de Terman - Merril" en PDF (A4 horizontal),
 * con el encabezado de datos generales y la cuadrícula de las 10 series.
 *
 * Diseño: blanco y negro, con logotipo institucional a color en esquina.
 */
export function generarTermanPdfDocument({
  candidato,
  pruebaId,
  answersJson,
  fechaAplicacion,
  onError,
}: GenerarTermanPdfOptions): void {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Obtener fecha de aplicación
    const fecha = fechaAplicacion;

    // Escribir encabezado
    const yEncabezado = escribirEncabezadoGeneral(doc, candidato, fecha || "—");

    // Mapear respuestas si existen
    const mapaRespuestas = new Map<number, { respuesta: string; respondida: boolean }>();
    if (answersJson) {
      mapearRespuestasEnMapa(answersJson, mapaRespuestas);
    }

    // Dibujar cuadrícula
    dibujarCuadriculaSeries(doc, mapaRespuestas, yEncabezado);

    // Dibujar pie de página
    escribirPiePagina(doc);

    // Dibujar logotipo (excepción al B/N)
    dibujarLogotipo(doc);

    // Guardar archivo
    const nombreArchivo = (candidato?.full_name || "candidato").toString()
      .replace(/\s+/g, "_")
      .slice(0, 60);
    doc.save(`TERMAN_${pruebaId}_${nombreArchivo}.pdf`);

  } catch (err) {
    console.error("Error al generar Terman PDF:", err);
    const mensaje = err instanceof Error ? err.message : "No se pudo generar el PDF de Terman.";
    if (onError) {
      onError(mensaje);
    } else {
      alert(mensaje);
    }
  }
}

/**
 * Mapea las respuestas al mapa de reactivos.
 */
function mapearRespuestasEnMapa(answersJson: unknown, mapa: Map<number, { respuesta: string; respondida: boolean }>): void {
  if (!answersJson || typeof answersJson !== "object") return;

  const obj = answersJson as Record<string, unknown>;

  // Iterar sobre todas las claves
  for (const [clave, valor] of Object.entries(obj)) {
    const numeroReactivo = parseInt(clave.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numeroReactivo)) continue;

    const respuestaFormateada = formatearRespuestaParaPDF(valor);
    mapa.set(numeroReactivo, {
      respuesta: respuestaFormateada,
      respondida: respuestaFormateada.length > 0,
    });
  }
}

/**
 * Dibuja la cuadrícula de las 10 series de Terman-Merril.
 */
function dibujarCuadriculaSeries(
  doc: jsPDF,
  mapaRespuestas: Map<number, { respuesta: string; respondida: boolean }>,
  yInicio: number
): void {
  const numColumnas = SERIES_TERMAN.length;
  const anchoSerie = ANCHO_SERIE;
  const totalAncho = numColumnas * anchoSerie;
  const yCabecera = yInicio + 12;

  // Cabeceras de series
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_PRIMARIO);

  for (let col = 0; col < numColumnas; col++) {
    const serie = SERIES_TERMAN[col];
    const x = MARGEN + col * anchoSerie;

    // Fondo de la cabecera
    doc.rect(x, yCabecera, anchoSerie, 8, "F");

    // Nombre de la serie
    doc.text(serie.nombre, x + 2, yCabecera + 6, { align: "left" });

    // Derechos de autor / minutos
    doc.setFontSize(6);
    doc.setTextColor(...COLOR_TEXTO);
    doc.text(`${serie.minutos} min`, x + anchoSerie - 5, yCabecera + 6, { align: "right" });
  }

  // Dibujar cada reactivo
  const numSeries = SERIES_TERMAN.length;
  const anchoSerieCalculada = totalAncho / numSeries;

  for (let n = 1; n <= SERIES_TERMAN[SERIES_TERMAN.length - 1].fin; n += 1) {
    const serie = findSerieForReactivo(n);
    if (!serie) continue;

    // Calcular la columna de la serie (índice base)
    let colIndex = 0;
    for (let i = 0; i < SERIES_TERMAN.length; i++) {
      if (SERIES_TERMAN[i].clave === serie.clave) {
        colIndex = i;
        break;
      }
    }

    const x = MARGEN + colIndex * anchoSerieCalculada;
    const y = yCabecera + 12 + (n - 1) * ALTO_FILA;
    const registro = mapaRespuestas.get(n);

    dibujarCelda(
      doc,
      x,
      y,
      anchoSerieCalculada,
      ALTO_FILA,
      n,
      registro?.respuesta ?? "",
      Boolean(registro?.respondida),
      7
    );

    // Línea divisoria entre bloques (Serie III)
    if (serie.bloques) {
      const finBloque = serie.bloques.find((b) => b.hasta === n);
      if (finBloque && n < serie.cantidad) {
        doc.setDrawColor(...COLOR_PRIMARIO);
        doc.setLineWidth(0.3);
        doc.line(x, y + ALTO_FILA, x + anchoSerieCalculada, y + ALTO_FILA);
      }
    }
  }

  // Contorno general de la cuadrícula
  doc.setDrawColor(...COLOR_PRIMARIO);
  doc.setLineWidth(0.5);
  doc.rect(MARGEN, yCabecera, totalAncho, (SERIES_TERMAN[SERIES_TERMAN.length - 1].fin) * ALTO_FILA + 16);
}

/**
 * Busca la serie a la que pertenece un reactivo.
 */
function findSerieForReactivo(numero: number): SerieTerman | undefined {
  return SERIES_TERMAN.find((s) => numero >= s.inicio && numero <= s.fin);
}

/**
 * Escribe el encabezado general con datos del candidato.
 */
function escribirEncabezadoGeneral(doc: jsPDF, candidato: DatosCandidatoPDF | null, fecha: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fondo superior
  doc.setFillColor(...COLOR_PRIMARIO);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Línea divisoria
  doc.setDrawColor(...COLOR_PRIMARIO);
  doc.setLineWidth(0.5);
  doc.line(MARGEN, 8, pageWidth - MARGEN, 8);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.text("TERMAN - MERRIL", pageWidth / 2, 6, { align: "center" });

  // Subtítulo
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text("HOJA DE RESPUESTAS  |  Serie I a X", pageWidth / 2, 11, { align: "center" });

  // Datos generales
  const yDatos = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_PRIMARIO);

  const nombreCompleto = [candidato?.full_name, candidato?.paternal_surname, candidato?.maternal_surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  doc.text(`Nombre: ${nombreCompleto || "—"}`, MARGEN, yDatos);
  doc.text(`Sexo: ${candidato?.sex || "—"}`, MARGEN, yDatos + 5);
  doc.text(`Fecha Nac.: ${limpiarTextoParaPDF(candidato?.birth_date) || "—"}`, MARGEN, yDatos + 10);
  doc.text(`Edad: ${candidato?.age ? `${candidato.age} años` : "—"}`, MARGEN, yDatos + 15);

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text(`Fecha Aplicación: ${fecha || "—"}`, MARGEN, yDatos + 20);

  // Línea inferior
  doc.setDrawColor(...COLOR_PRIMARIO);
  doc.setLineWidth(0.5);
  doc.line(MARGEN, yDatos + 25, pageWidth - MARGEN, yDatos + 25);

  return yDatos + 28;
}

/**
 * Escribe el pie de página.
 */
function escribirPiePagina(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLOR_LINEA);
  doc.setLineWidth(0.2);
  doc.line(MARGEN, pageHeight - 7, pageWidth - MARGEN, pageHeight - 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text("Hoja de respuestas Terman-Merril - Registro de reactivos por subtest", MARGEN, pageHeight - 3.5);
  doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - MARGEN, pageHeight - 3.5, { align: "right" });
}

const ANCHO_RESP = 10.5;
const ANCHO_SERIE = ANCHO_NUM + ANCHO_RESP;
const ANCHO_TOTAL = MARGEN * 2 + SERIES_TERMAN.length * ANCHO_SERIE;

const MAX_REACTIVOS_PAGINA = 60;
