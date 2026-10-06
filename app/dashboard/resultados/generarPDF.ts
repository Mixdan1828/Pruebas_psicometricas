import jsPDF from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import {
  obtenerPreguntas,
  parseRespuestas,
  tieneRespuestas,
  type QuestionAnswer,
  type ResultadoCrudo,
} from "@/lib/utils/parseAnswers";

export interface DatosCandidatoPDF {
  full_name?: string | null;
  paternal_surname?: string | null;
  maternal_surname?: string | null;
  age?: number | null;
  id?: string | null;
}

export interface GenerarPDFResultadosOptions<T extends ResultadoCrudo = ResultadoCrudo> {
  candidato: DatosCandidatoPDF | null;
  pruebas: T[];
  statusInfo: (status: string | null | undefined) => { label: string; cls?: string };
  formatearFecha: (fecha: string | null | undefined) => string;
  formatearScore: (score: unknown) => string;
  nombreTest: (prueba: T) => string;
  onError?: (mensaje: string) => void;
}

const MARGEN = 14;
const COLOR_PRIMARIO: [number, number, number] = [13, 49, 63];
const COLOR_VERDE: [number, number, number] = [112, 164, 68];
const COLOR_TEXTO: [number, number, number] = [30, 41, 59];
const COLOR_GRIS: [number, number, number] = [100, 116, 139];

function limpiarTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[•·]/g, "*")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function generarPDFResultados<T extends ResultadoCrudo = ResultadoCrudo>({
  candidato,
  pruebas,
  statusInfo,
  formatearFecha,
  formatearScore,
  nombreTest,
  onError,
}: GenerarPDFResultadosOptions<T>): void {
  try {
    if (pruebas.length === 0) {
      throw new Error("El candidato no tiene pruebas registradas para generar el PDF.");
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGEN * 2;

    escribirEncabezado(doc, candidato);
    let cursorY = 52;

    pruebas.forEach((prueba, indice) => {
      const estatus = statusInfo(prueba.status).label;
      const nombreTestActual = limpiarTexto(nombreTest(prueba));
      const fecha = limpiarTexto(formatearFecha(prueba.started_at || prueba.completed_at));
      const puntuacion = limpiarTexto(formatearScore(prueba.score_json));

      if (cursorY > pageHeight - 45) {
        doc.addPage();
        escribirPieInicial(doc, pageWidth);
        cursorY = MARGEN + 4;
      }

      if (indice > 0) cursorY += 6;
      doc.setFillColor(...COLOR_PRIMARIO);
      doc.roundedRect(MARGEN, cursorY, 4, 8, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...COLOR_PRIMARIO);
      doc.text(nombreTestActual || "Prueba psicométrica", MARGEN + 8, cursorY + 6);
      cursorY += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_GRIS);
      const meta = `Estado: ${limpiarTexto(estatus)}    |    Fecha: ${fecha}    |    Puntuación: ${puntuacion}`;
      doc.text(meta, MARGEN, cursorY);
      cursorY += 4;

      if (prueba.examiner_notes) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...COLOR_TEXTO);
        doc.text(
          doc.splitTextToSize(`Observaciones: ${limpiarTexto(prueba.examiner_notes)}`, contentWidth),
          MARGEN,
          cursorY + 4
        );
        cursorY += 8;
      }
      cursorY += 4;

      const respuestas = compilarRespuestas(prueba);

      if (respuestas.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR_GRIS);
        doc.text("Este examen no cuenta con preguntas o respuestas registradas.", MARGEN, cursorY);
        cursorY += 8;
        return;
      }

      const body: (string | number)[][] = respuestas.map((r) => [
        r.numero,
        r.pregunta,
        r.respondida ? r.respuesta : "Sin responder",
      ]);

      autoTable(doc, {
        startY: cursorY,
        margin: { horizontal: MARGEN },
        head: [["#", "Pregunta", "Respuesta"]],
        body,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 1.6,
          textColor: COLOR_TEXTO,
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
          valign: "top",
        },
        headStyles: {
          fillColor: COLOR_PRIMARIO,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: contentWidth - 10 - 52 },
          2: { cellWidth: 52, fontStyle: "bold", textColor: COLOR_VERDE },
        },
        didDrawPage: (datos) => {
          escribirPiePagina(doc, pageWidth, datos.pageNumber);
        },
      } satisfies UserOptions);

      const ultimaY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY;
      cursorY = (ultimaY ?? cursorY) + 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_GRIS);
    });

    const nombreArchivo =
      limpiarTexto(nombreCompletoCandidato(candidato)).replace(/\s+/g, "_").slice(0, 60) ||
      "reporte_candidato";
    doc.save(`reporte_${nombreArchivo}.pdf`);
  } catch (err) {
    console.error("Error al generar el PDF:", err);
    const mensaje = err instanceof Error ? err.message : "No se pudo generar el reporte en PDF.";
    if (onError) {
      onError(mensaje);
    } else {
      alert(mensaje);
    }
  }
}

function nombreCompletoCandidato(candidato: DatosCandidatoPDF | null): string {
  return [candidato?.full_name, candidato?.paternal_surname, candidato?.maternal_surname]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function compilarRespuestas(prueba: ResultadoCrudo): QuestionAnswer[] {
  try {
    const preguntas = obtenerPreguntas(prueba);
    if (preguntas.length === 0 || !tieneRespuestas(prueba.answers_json)) {
      return [];
    }
    return parseRespuestas(prueba.answers_json, preguntas);
  } catch {
    return [];
  }
}

function escribirEncabezado(doc: jsPDF, candidato: DatosCandidatoPDF | null): void {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLOR_PRIMARIO);
  doc.rect(0, 0, pageWidth, 9, "F");
  doc.setFillColor(...COLOR_VERDE);
  doc.rect(0, 9, pageWidth, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.text("Reporte de Resultados Psicométricos", MARGEN, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text(`Candidato: ${nombreCompletoCandidato(candidato) || "Sin nombre"}`, MARGEN, 38);

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRIS);
  const lineasAdicionales: string[] = [];
  if (candidato?.age != null) lineasAdicionales.push(`Edad: ${candidato.age} años`);
  if (candidato?.id) lineasAdicionales.push(`ID: ${String(candidato.id)}`);
  lineasAdicionales.push(`Fecha de emisión: ${new Date().toLocaleString("es-MX")}`);
  doc.text(lineasAdicionales.join("    |    "), MARGEN, 43);

  doc.setDrawColor(...COLOR_VERDE);
  doc.setLineWidth(0.6);
  doc.line(MARGEN, 47, pageWidth - MARGEN, 47);
}

function escribirPieInicial(doc: jsPDF, pageWidth: number): void {
  escribirPiePagina(doc, pageWidth, doc.getNumberOfPages());
}

function escribirPiePagina(doc: jsPDF, pageWidth: number, pageNumber: number): void {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(`Página ${pageNumber}`, pageWidth - MARGEN, 289, { align: "right" });
  doc.text("Documento generado por la Plataforma de Pruebas Psicométricas", MARGEN, 289);
}
