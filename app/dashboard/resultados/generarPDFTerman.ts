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
// `inicio`/`fin` corresponden al `order_index` global de la pregunta y
// `cantidad` al número de reactivos que le corresponden a la serie.
// ---------------------------------------------------------------------------

export interface SerieTerman {
  clave: string;
  nombre: string;
  minutos: number;
  inicio: number;
  fin: number;
  cantidad: number;
  /** Divisiones opcionales en bloques (ej. Serie III: 1-15 y 16-30). */
  bloques?: { desde: number; hasta: number }[];
}

export const SERIES_TERMAN: SerieTerman[] = [
  { clave: "I", nombre: "Serie I", minutos: 2, inicio: 1, fin: 16, cantidad: 16 },
  { clave: "II", nombre: "Serie II", minutos: 2, inicio: 17, fin: 27, cantidad: 11 },
  {
    clave: "III",
    nombre: "Serie III",
    minutos: 2,
    inicio: 28,
    fin: 57,
    cantidad: 30,
    bloques: [
      { desde: 1, hasta: 15 },
      { desde: 16, hasta: 30 },
    ],
  },
  { clave: "IV", nombre: "Serie IV", minutos: 3, inicio: 58, fin: 75, cantidad: 18 },
  { clave: "V", nombre: "Serie V", minutos: 5, inicio: 76, fin: 87, cantidad: 12 },
  { clave: "VI", nombre: "Serie VI", minutos: 2, inicio: 88, fin: 107, cantidad: 20 },
  { clave: "VII", nombre: "Serie VII", minutos: 2, inicio: 108, fin: 127, cantidad: 20 },
  { clave: "VIII", nombre: "Serie VIII", minutos: 3, inicio: 128, fin: 144, cantidad: 17 },
  { clave: "IX", nombre: "Serie IX", minutos: 3, inicio: 145, fin: 162, cantidad: 18 },
  { clave: "X", nombre: "Serie X", minutos: 4, inicio: 163, fin: 173, cantidad: 11 },
];

/** ¿El test relacionado corresponde al Terman-Merril? */
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
  birth_date?: string | null;
  id?: string | null;
}

export interface GenerarPDFTermanOptions {
  candidato: DatosCandidatoTerman | null;
  prueba: ResultadoCrudo;
  /** Fecha de aplicación (ISO). Si se omite se toma de la prueba. */
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

// ---------------------------------------------------------------------------
// Constantes de maquetado (mm, A4 horizontal)
// ---------------------------------------------------------------------------

const MARGEN = 10;
const COLOR_PRIMARIO: [number, number, number] = [13, 49, 63];
const COLOR_TEXTO: [number, number, number] = [30, 41, 59];
const COLOR_GRIS: [number, number, number] = [100, 116, 139];
const COLOR_LINEA: [number, number, number] = [203, 213, 225];
const COLOR_FONDO_SUAVE: [number, number, number] = [241, 245, 249];

const ALTO_FILA = 6.6; // alto de cada reactivo
const ANCHO_NUM = 5.2; // ancho de la sub-columna del número de pregunta

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

// ---------------------------------------------------------------------------
// Helpers de datos
// ---------------------------------------------------------------------------

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

/** Índice: número global de pregunta -> respuesta formateada. */
function mapearRespuestas(prueba: ResultadoCrudo): Map<number, QuestionAnswer> {
  const mapa = new Map<number, QuestionAnswer>();
  try {
    const preguntas = obtenerPreguntas(prueba);
    if (preguntas.length === 0 || !tieneRespuestas(prueba.answers_json)) return mapa;
    parseRespuestas(prueba.answers_json, preguntas).forEach((r) => {
      mapa.set(Number(r.numero), { ...r, respuesta: limpiarTexto(r.respuesta) });
    });
  } catch {
    // Sin respuestas registradas: la hoja se imprime en blanco.
  }
  return mapa;
}



// ---------------------------------------------------------------------------
// Dibujo: encabezado general
// ---------------------------------------------------------------------------

function escribirEncabezadoGeneral(
  doc: jsPDF,
  candidato: DatosCandidatoTerman | null,
  fechaAplicacion: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLOR_PRIMARIO);
  doc.rect(0, 0, pageWidth, 3.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.text("TERMAN - MERRIL (HOJA DE RESPUESTAS)", pageWidth / 2, 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(
    "Test de inteligencia - Formato de registro de respuestas por serie",
    pageWidth / 2,
    15,
    { align: "center" }
  );

  // Caja de datos generales del candidato
  const cajaY = 16;
  const cajaAlto = 13;
  doc.setDrawColor(...COLOR_LINEA);
  doc.setLineWidth(0.3);
  doc.setFillColor(...COLOR_FONDO_SUAVE);
  doc.roundedRect(MARGEN, cajaY, pageWidth - MARGEN * 2, cajaAlto, 1.5, 1.5, "FD");

  const anchoUtil = pageWidth - MARGEN * 2 - 6;
  const anchoNombre = Math.min(88, anchoUtil * 0.34);

  const sexo = limpiarTexto(candidato?.sex) || "—";
  const nacimiento = candidato?.birth_date
    ? formatearFechaLarga(candidato.birth_date)
    : null;
  const edadCalculada = edadDesdeNacimiento(candidato?.birth_date);
  const edad =
    candidato?.age != null
      ? `${candidato.age} años`
      : edadCalculada != null
        ? `${edadCalculada} años`
        : "—";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_GRIS);
  doc.text("NOMBRE DEL CANDIDATO", MARGEN + 3, cajaY + 4.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text(
    recortar(doc, nombreCompleto(candidato) || "—", anchoNombre - 3),
    MARGEN + 3,
    cajaY + 9.2
  );

  // Los campos mostrados se adaptan a la información disponible del candidato.
  const campos: { etiqueta: string; valor: string }[] = [
    { etiqueta: "SEXO", valor: sexo },
    { etiqueta: "EDAD", valor: edad },
  ];
  if (nacimiento) {
    campos.push({ etiqueta: "FECHA DE NACIMIENTO", valor: nacimiento });
  }
  campos.push({ etiqueta: "FECHA DE APLICACIÓN", valor: fechaAplicacion });
  const registro = limpiarTexto(candidato?.id);
  if (registro) {
    campos.push({ etiqueta: "ID EXPEDIENTE", valor: registro });
  }

  const xCampos = MARGEN + 3 + anchoNombre;
  const anchoCampos = pageWidth - MARGEN - 3 - xCampos;
  const anchoCampo = anchoCampos / campos.length;

  campos.forEach((campo, i) => {
    const x = xCampos + i * anchoCampo;
    if (i > 0) {
      doc.setDrawColor(...COLOR_LINEA);
      doc.setLineWidth(0.2);
      doc.line(x - 3, cajaY + 2.5, x - 3, cajaY + cajaAlto - 2.5);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_GRIS);
    doc.text(campo.etiqueta, x, cajaY + 4.4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_TEXTO);
    doc.text(recortar(doc, campo.valor, anchoCampo - 3.5), x, cajaY + 9.2);
  });

  return cajaY + cajaAlto + 2.2;
}


// ---------------------------------------------------------------------------
// Dibujo: cuadrícula de series
// ---------------------------------------------------------------------------

/** Recorta el texto para que quepa en el ancho disponible (usa métricas reales). */
function recortar(doc: jsPDF, texto: string, anchoMm: number): string {
  if (!texto) return "";
  const limpio = texto;
  if (doc.getTextWidth(limpio) <= anchoMm) return limpio;
  let salida = limpio;
  while (salida.length > 1 && doc.getTextWidth(`${salida}.`) > anchoMm) {
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
  doc.setDrawColor(...COLOR_LINEA);
  doc.setLineWidth(0.15);
  doc.rect(x, y, ancho, alto);

  doc.setFillColor(...COLOR_FONDO_SUAVE);
  doc.rect(x, y, ANCHO_NUM, alto, "F");
  doc.setDrawColor(...COLOR_LINEA);
  doc.line(x + ANCHO_NUM, y, x + ANCHO_NUM, y + alto);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(String(numero), x + ANCHO_NUM / 2, y + alto / 2 + fontSize * 0.36, {
    align: "center",
  });

  const textoRespuesta = respondida ? respuesta : "";
  doc.setFont("helvetica", respondida ? "bold" : "italic");
  doc.setFontSize(respondida ? fontSize : fontSize - 0.5);
  doc.setTextColor(...(respondida ? COLOR_PRIMARIO : COLOR_LINEA));
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


/**
 * Dibuja la cuadrícula de las 10 series: una columna por serie con la
 * cascada vertical numerada de reactivos y la respuesta registrada.
 */
function dibujarCuadriculaSeries(
  doc: jsPDF,
  mapaRespuestas: Map<number, QuestionAnswer>,
  inicioY: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const anchoTotal = pageWidth - MARGEN * 2;
  const anchoColumna = anchoTotal / SERIES_TERMAN.length;

  const maxReactivos = Math.max(...SERIES_TERMAN.map((s) => s.cantidad));
  const altoCabeceraSerie = 9;
  const altoFila = Math.min(
    ALTO_FILA,
    (doc.internal.pageSize.getHeight() - inicioY - altoCabeceraSerie - 13.5) / maxReactivos
  );
  const fontSize = altoFila < 6 ? 5.2 : 5.8;

  SERIES_TERMAN.forEach((serie, i) => {
    const x = MARGEN + i * anchoColumna;

    doc.setFillColor(...COLOR_PRIMARIO);
    doc.rect(x, inicioY, anchoColumna, altoCabeceraSerie, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(serie.nombre.toUpperCase(), x + anchoColumna / 2, inicioY + 4, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(214, 231, 240);
    doc.text(`${serie.minutos} min`, x + anchoColumna / 2, inicioY + 8, { align: "center" });

    doc.setFillColor(...COLOR_FONDO_SUAVE);
    doc.rect(x, inicioY + altoCabeceraSerie, anchoColumna, 4.6, "F");
    doc.setDrawColor(...COLOR_LINEA);
    doc.setLineWidth(0.15);
    doc.rect(x, inicioY + altoCabeceraSerie, anchoColumna, 4.6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.6);
    doc.setTextColor(...COLOR_PRIMARIO);
    doc.text(
      `${serie.cantidad} reactivos`,
      x + anchoColumna / 2,
      inicioY + altoCabeceraSerie + 3.2,
      { align: "center" }
    );
  });

  const yCeldas = inicioY + altoCabeceraSerie + 4.6;

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
          doc.setDrawColor(...COLOR_PRIMARIO);
          doc.setLineWidth(0.4);
          doc.line(x, y + altoFila, x + anchoColumna, y + altoFila);
        }
      }
    }
  });

  const altoCeldas = maxReactivos * altoFila;
  doc.setDrawColor(...COLOR_PRIMARIO);
  doc.setLineWidth(0.35);
  doc.rect(MARGEN, inicioY, anchoTotal, altoCabeceraSerie + 4.6 + altoCeldas);
}


// ---------------------------------------------------------------------------
// Pie de página
// ---------------------------------------------------------------------------

function escribirPiePagina(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLOR_LINEA);
  doc.setLineWidth(0.2);
  doc.line(MARGEN, pageHeight - 7, pageWidth - MARGEN, pageHeight - 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(
    "Hoja de respuestas Terman-Merril - Registro de reactivos por subtest",
    MARGEN,
    pageHeight - 3.5
  );
  doc.text(
    `Página ${doc.getNumberOfPages()}`,
    pageWidth - MARGEN,
    pageHeight - 3.5,
    { align: "right" }
  );
}

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------

/**
 * Genera la "Hoja de Respuestas de Terman - Merril" en PDF (A4 horizontal),
 * con el encabezado de datos generales y la cuadrícula de las 10 series.
 */
export function generarPDFHojaRespuestasTerman({
  candidato,
  prueba,
  fechaAplicacion,
  onError,
}: GenerarPDFTermanOptions): void {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const fecha =
      formatearFechaLarga(fechaAplicacion || prueba?.started_at || prueba?.completed_at) || "—";

    const yEncabezado = escribirEncabezadoGeneral(doc, candidato, fecha);
    const mapaRespuestas = mapearRespuestas(prueba);
    dibujarCuadriculaSeries(doc, mapaRespuestas, yEncabezado);

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
