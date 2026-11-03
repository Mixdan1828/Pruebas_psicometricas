// app/dashboard/resultados/pdf/generarPDFClaver.ts
import jsPDF from "jspdf";

export function esTestClaver(prueba: any): boolean {
  const test = Array.isArray(prueba?.tests) ? prueba?.tests[0] : prueba?.tests;
  const campos = [test?.name, test?.type]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  return campos.some((v) => v.includes("claver") || v.includes("cleaver"));
}

interface GenerarPDFClaverOptions {
  candidato: any;
  prueba: any;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

export function generarPDFHojaRespuestasClaver({
  candidato,
  prueba,
  fechaAplicacion,
  onError,
}: GenerarPDFClaverOptions): void {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const MARGEN = 10;
    const pageWidth = doc.internal.pageSize.getWidth(); // ~297 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // ~210 mm
    let y = 8;

    // Título principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(13, 49, 63);
    doc.text("TEST CLEAVER", pageWidth / 2, y, { align: "center" });
    y += 5;

    // Encabezado formal de datos del candidato
    const headerWidth = pageWidth - MARGEN * 2;
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);

    doc.rect(MARGEN, y, headerWidth, 12);
    doc.line(MARGEN, y + 6, MARGEN + headerWidth, y + 6);
    doc.line(MARGEN + 190, y, MARGEN + 190, y + 6);
    doc.line(MARGEN + 70, y + 6, MARGEN + 70, y + 12);
    doc.line(MARGEN + 190, y + 6, MARGEN + 190, y + 12);

    const nombreCompleto = [
      candidato?.full_name,
      candidato?.paternal_surname,
      candidato?.maternal_surname,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Sin nombre";

    const fechaNacFormatted = candidato?.Fecha_Nacimiento
      ? (() => {
          const [anio, mes, dia] = String(candidato.Fecha_Nacimiento).split("T")[0].split("-");
          return `${dia}/${mes}/${anio}`;
        })()
      : "No registrada";

    const fechaAppFormatted = fechaAplicacion ? new Date(fechaAplicacion).toLocaleDateString("es-MX") : "—";

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("NOMBRE COMPLETO:", MARGEN + 3, y + 4);
    doc.setFont("helvetica", "normal");
    doc.text(nombreCompleto, MARGEN + 36, y + 4);

    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", MARGEN + 193, y + 4);
    doc.setFont("helvetica", "normal");
    doc.text(fechaAppFormatted, MARGEN + 207, y + 4);

    doc.setFont("helvetica", "bold");
    doc.text("SEXO:", MARGEN + 3, y + 9.5);
    doc.setFont("helvetica", "normal");
    doc.text(candidato?.sex || "N/A", MARGEN + 15, y + 9.5);

    doc.setFont("helvetica", "bold");
    doc.text("F. NACIMIENTO:", MARGEN + 73, y + 9.5);
    doc.setFont("helvetica", "normal");
    doc.text(fechaNacFormatted, MARGEN + 100, y + 9.5);

    doc.setFont("helvetica", "bold");
    doc.text("EDAD:", MARGEN + 193, y + 9.5);
    doc.setFont("helvetica", "normal");
    doc.text(candidato?.age != null ? `${candidato.age} años` : "N/A", MARGEN + 205, y + 9.5);

    y += 14;

    // Obtener preguntas y respuestas ordenadas por grupo
    const testObj = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
    const testQuestions = testObj?.test_questions || [];

    const preguntasMap = new Map();
    testQuestions.forEach((q: any) => {
      preguntasMap.set(q.id, q);
    });

    const respuestasJson = (prueba?.answers_json || {}) as Record<
      string,
      { mas?: string; menos?: string }
    >;

    const bloquesEntradas = Object.entries(respuestasJson).sort(([idA], [idB]) => {
      const pregA = preguntasMap.get(idA);
      const pregB = preguntasMap.get(idB);
      
      const jsonA = pregA ? (typeof pregA.content_jsonb === "string" ? JSON.parse(pregA.content_jsonb || "{}") : pregA.content_jsonb || {}) : {};
      const jsonB = pregB ? (typeof pregB.content_jsonb === "string" ? JSON.parse(pregB.content_jsonb || "{}") : pregB.content_jsonb || {}) : {};

      return (Number(jsonA.grupo) || 0) - (Number(jsonB.grupo) || 0);
    });

    if (bloquesEntradas.length === 0) {
      doc.setFontSize(10);
      doc.text("No hay respuestas registradas para esta prueba.", pageWidth / 2, y + 20, { align: "center" });
    } else {
      // Dividir en 4 tablas de 6 grupos cada una
      const tablasGrupos: any[][] = [];
      for (let i = 0; i < bloquesEntradas.length; i += 6) {
        tablasGrupos.push(bloquesEntradas.slice(i, i + 6));
      }

      const totalTablas = 4;
      const espacioTotalDisponible = pageWidth - (MARGEN * 2); // ~277 mm
      const gap = 2.5; // espacio entre tablas
      const tableWidth = (espacioTotalDisponible - (gap * (totalTablas - 1))) / totalTablas; 

      let startX = MARGEN;
      const startY = y;
      const rowHeight = 5.0; // Torban olola tarree qubee gurguddaaf foyyeffame

      tablasGrupos.forEach((gruposDeTabla, tIdx) => {
        let currentX = startX + tIdx * (tableWidth + gap);
        let currentY = startY;

        const colMasX = currentX + tableWidth - 13;   // Pirofilii kiloo +
        const colMenosX = currentX + tableWidth - 6;  // Pirofilii kiloo -

        // Mata-duree gabatee (Headers) - Qubee gurguddaa (10)
        doc.setFillColor(226, 232, 240);
        doc.rect(currentX, currentY, tableWidth, 6, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Palabras", currentX + 2, currentY + 4.2);
        doc.text("+", colMasX + 3.5, currentY + 4.2, { align: "center" });
        doc.text("-", colMenosX + 3.5, currentY + 4.2, { align: "center" });

        doc.setLineWidth(0.3);
        doc.setDrawColor(0, 0, 0);

        currentY += 6;
        const tablaStartY = currentY;

        // Tarreewwan keessatti argaman
        gruposDeTabla.forEach(([idBloque, seleccion], gIdx) => {
          const preguntaEncontrada = preguntasMap.get(idBloque);
          const contenidoJson = preguntaEncontrada
            ? typeof preguntaEncontrada.content_jsonb === "string"
              ? JSON.parse(preguntaEncontrada.content_jsonb || "{}")
              : preguntaEncontrada.content_jsonb || {}
            : {};

          const palabrasBloque: string[] = contenidoJson.palabras || [];
          const palabraMas = seleccion?.mas;
          const palabraMenos = seleccion?.menos;

          palabrasBloque.forEach((palabra) => {
            // Sarara raayyaa (Horizontal lines)
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.2);
            doc.line(currentX, currentY + rowHeight, currentX + tableWidth, currentY + rowHeight);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5); // Qubee jechootaa olkaafame (9.5 - 10)
            doc.setTextColor(30, 41, 59);
            doc.text(String(palabra || "").substring(0, 16), currentX + 2, currentY + 3.6);

            const esMas = String(palabra).trim().toLowerCase() === String(palabraMas || "").trim().toLowerCase();
            const esMenos = String(palabra).trim().toLowerCase() === String(palabraMenos || "").trim().toLowerCase();

            if (esMas) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11); // Mallattoo gurguddaa
              doc.setTextColor(16, 185, 129); // Magariisa
              doc.text("+", colMasX + 3.5, currentY + 3.7, { align: "center" });
            }

            if (esMenos) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11); // Mallattoo gurguddaa
              doc.setTextColor(244, 63, 94); // Diimaa
              doc.text("-", colMenosX + 3.5, currentY + 3.7, { align: "center" });
            }

            currentY += rowHeight;
          });

          // Gargarsaa gidduu gareewwanii
          if (gIdx < gruposDeTabla.length - 1) {
            doc.setDrawColor(80, 80, 80);
            doc.setLineWidth(0.4);
            doc.line(currentX, currentY, currentX + tableWidth, currentY);
            currentY += 1.2;
          }
        });

        const tablaAlturaTotal = currentY - tablaStartY;

        // Sarara alaa fi sararawwan madaalama tsugurruu (+ fi -)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(currentX, startY, tableWidth, (tablaStartY - startY) + tablaAlturaTotal);
        doc.line(colMasX, startY, colMasX, startY + (tablaStartY - startY) + tablaAlturaTotal);
        doc.line(colMenosX, startY, colMenosX, startY + (tablaStartY - startY) + tablaAlturaTotal);
      });
    }

    // Logo xiqqaa fi giddu galeessa ta'e (100mm x 20mm)
    doc.addImage("/images/miLogo.png", "PNG", (pageWidth - 100) / 2, pageHeight - 35, 100, 30);

    const nombreLimpio = nombreCompleto.toLowerCase().replace(/\s+/g, "_");
    doc.save(`reporte_cleaver_${nombreLimpio}.pdf`);
  } catch (err) {
    console.error("Error al generar PDF de Cleaver:", err);
    if (onError) onError("No se pudo generar el reporte en PDF para Cleaver.");
  }
}