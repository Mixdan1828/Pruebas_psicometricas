import jsPDF from "jspdf";
import {
  obtenerPreguntas,
  parseRespuestas,
  tieneRespuestas,
  type ResultadoCrudo,
} from "@/lib/utils/parseAnswers";

export interface SerieTerman {
  clave: string;
  nombre: string;
  minutos: number;
  inicio: number;
  fin: number;
  cantidad: number;
  bloques?: { desde: number; hasta: number }[];
}

export const SERIES_TERMAN: SerieTerman[] = [
  { clave: "I", nombre: "I-2", minutos: 2, inicio: 1, fin: 16, cantidad: 16 },
  { clave: "II", nombre: "II-2", minutos: 2, inicio: 17, fin: 27, cantidad: 11 },
  { clave: "III", nombre: "III-2", minutos: 2, inicio: 28, fin: 57, cantidad: 30 },
  { clave: "IV", nombre: "IV-3", minutos: 3, inicio: 58, fin: 75, cantidad: 18 },
  { clave: "V", nombre: "V-5", minutos: 5, inicio: 76, fin: 87, cantidad: 12 },
  { clave: "VI", nombre: "VI-2", minutos: 2, inicio: 88, fin: 107, cantidad: 20 },
  { clave: "VII", nombre: "VII-2", minutos: 2, inicio: 108, fin: 127, cantidad: 20 },
  { clave: "VIII", nombre: "VIII-3", minutos: 3, inicio: 128, fin: 144, cantidad: 17 },
  { clave: "IX", nombre: "IX-3", minutos: 3, inicio: 145, fin: 162, cantidad: 18 },
  { clave: "X", nombre: "X-4", minutos: 4, inicio: 163, fin: 173, cantidad: 11 },
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
  birth_date?: string | null;
  Fecha_Nacimiento?: string | null;
  id?: string | null;
}

export interface GenerarPDFTermanOptions {
  candidato: DatosCandidatoTerman | null;
  prueba: ResultadoCrudo;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

const MARGEN = 10;
const COLOR_NEGRO: [number, number, number] = [0, 0, 0];
const COLOR_GRIS_CABECERA: [number, number, number] = [226, 232, 240];

const ALTO_FILA = 4.3; 
const ANCHO_NUM = 5.0;

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

function mapearRespuestasPersonalizadas(prueba: ResultadoCrudo): Map<number, { resp1: string; resp2?: string }> {
  const mapa = new Map<number, { resp1: string; resp2?: string }>();
  try {
    const testObj = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
    if (!testObj || !testObj.test_questions) return mapa;

    const preguntas = testObj.test_questions;
    const respuestasJson = (prueba?.answers_json || {}) as Record<string, any>;

    preguntas.forEach((q: any) => {
      const parsed = typeof q.content_jsonb === 'string' ? JSON.parse(q.content_jsonb || "{}") : (q.content_jsonb || {});
      const numeroSerie = Number(parsed?.serie);

      const serieConfig = SERIES_TERMAN.find(s => {
        const idNum = s.clave === "I" ? 1 : s.clave === "II" ? 2 : s.clave === "III" ? 3 : s.clave === "IV" ? 4 : s.clave === "V" ? 5 : s.clave === "VI" ? 6 : s.clave === "VII" ? 7 : s.clave === "VIII" ? 8 : s.clave === "IX" ? 9 : 10;
        return idNum === numeroSerie;
      });

      if (!serieConfig) return;

      const preguntasSerie = preguntas
        .filter((item: any) => {
          const pJson = typeof item.content_jsonb === 'string' ? JSON.parse(item.content_jsonb || "{}") : (item.content_jsonb || {});
          return Number(pJson?.serie) === numeroSerie;
        })
        .sort((a: any, b: any) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

      const localIndex = preguntasSerie.findIndex((item: any) => item.id === q.id);
      if (localIndex === -1) return;
      const numPreguntaLocal = localIndex + 1;
      const numeroGlobal = serieConfig.inicio + (numPreguntaLocal - 1);

      let respuestaUsuario = respuestasJson[q.id];
      if (respuestaUsuario === undefined || respuestaUsuario === null || respuestaUsuario === "") {
        mapa.set(numeroGlobal, { resp1: "—", resp2: "—" });
        return;
      }

      // Parseo seguro si la respuesta viene como cadena JSON
      if (typeof respuestaUsuario === 'string' && (respuestaUsuario.startsWith('{') || respuestaUsuario.startsWith('['))) {
        try {
          respuestaUsuario = JSON.parse(respuestaUsuario);
        } catch {}
      }

      // 1. Serie III (Vocabulario): Mostrar 'i' u 'o'
      if (numeroSerie === 3) {
        const valStr = String(respuestaUsuario).trim().toLowerCase();
        let res = '—';
        if (valStr.startsWith('ig') || valStr === 'i') res = 'i';
        else if (valStr.startsWith('op') || valStr === 'o') res = 'o';
        else res = valStr.charAt(0);
        mapa.set(numeroGlobal, { resp1: res });
        return;
      }

      // 2. Serie IV (Selección Lógica): 2 letras independientes
      if (numeroSerie === 4) {
        const opciones = parsed.opciones || parsed.options || parsed.choices || [];
        if (Array.isArray(respuestaUsuario)) {
          const letrasElegidas = respuestaUsuario.map((resp: any) => {
            if (typeof resp === 'string' && resp.length <= 2) return resp.toLowerCase();
            const idx = opciones.findIndex((opt: any) => {
              const textoOpt = typeof opt === 'object' ? (opt.texto || opt.label || '') : String(opt);
              return textoOpt.trim().toLowerCase() === String(resp).trim().toLowerCase();
            });
            return idx !== -1 ? String.fromCharCode(97 + idx) : String(resp).charAt(0).toLowerCase();
          });
          mapa.set(numeroGlobal, {
            resp1: letrasElegidas[0] || "—",
            resp2: letrasElegidas[1] || "—"
          });
          return;
        }
      }

      // 3. Serie VIII (Ordenación + V/F): Mostrar 'v' o 'f'
      if (numeroSerie === 8) {
        if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
          const vf = (respuestaUsuario as any).verdadFalso || (respuestaUsuario as any).vf || (respuestaUsuario as any).respuesta || "";
          const vfStr = String(vf).trim().toLowerCase();
          let res = "—";
          if (vfStr.startsWith('v')) res = 'v';
          else if (vfStr.startsWith('f')) res = 'f';
          mapa.set(numeroGlobal, { resp1: res });
          return;
        }
      }

      // 4. Manejo avanzado de objetos para Serie X, oraciones u otros formatos compuestos
      if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
        if ((respuestaUsuario as any).oracionOrdenada) {
          mapa.set(numeroGlobal, { resp1: limpiarTexto((respuestaUsuario as any).oracionOrdenada) });
          return;
        }
        if ((respuestaUsuario as any).texto) {
          mapa.set(numeroGlobal, { resp1: limpiarTexto((respuestaUsuario as any).texto) });
          return;
        }
        
        // Manejo específico para campos de tipo num1 / num2 (como en Serie X)
        const n1 = (respuestaUsuario as any).num1 ?? (respuestaUsuario as any).val1 ?? (respuestaUsuario as any).n1 ?? "";
        const n2 = (respuestaUsuario as any).num2 ?? (respuestaUsuario as any).val2 ?? (respuestaUsuario as any).n2 ?? "";
        
        if (n1 !== "" || n2 !== "") {
          const part1 = n1 !== "" ? String(n1) : "";
          const part2 = n2 !== "" ? String(n2) : "";
          const combinado = part1 && part2 ? `${part1}, ${part2}` : part1 || part2;
          mapa.set(numeroGlobal, { resp1: combinado || "—" });
          return;
        }

        mapa.set(numeroGlobal, { resp1: "—" });
        return;
      }

      // 5. Series de opción múltiple estándar
      const opciones = parsed.opciones || parsed.options || parsed.choices || [];
      if (opciones.length > 0 && [1, 2, 5, 6, 7, 9, 10].includes(numeroSerie)) {
        const indexEncontrado = opciones.findIndex((opt: any) => {
          const textoOpt = typeof opt === 'object' ? (opt.texto || opt.label || '') : String(opt);
          const letraOpt = typeof opt === 'object' ? (opt.letra || '') : '';
          return (
            String(respuestaUsuario).trim().toLowerCase() === textoOpt.trim().toLowerCase() ||
            String(respuestaUsuario).trim().toLowerCase() === letraOpt.trim().toLowerCase()
          );
        });

        if (indexEncontrado !== -1) {
          const optObj = opciones[indexEncontrado];
          if (typeof optObj === 'object' && optObj.letra) {
            mapa.set(numeroGlobal, { resp1: optObj.letra.toLowerCase() });
            return;
          }
          mapa.set(numeroGlobal, { resp1: String.fromCharCode(97 + indexEncontrado) });
          return;
        }
      }

      if (Array.isArray(respuestaUsuario)) {
        mapa.set(numeroGlobal, { resp1: respuestaUsuario.join(", ") });
        return;
      }

      mapa.set(numeroGlobal, { resp1: limpiarTexto(respuestaUsuario) || "—" });
    });
  } catch (e) {
    console.error("Error mapeando respuestas:", e);
  }
  return mapa;
}

function escribirEncabezadoGeneral(
  doc: jsPDF,
  candidato: DatosCandidatoTerman | null,
  fechaAplicacion: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Rectángulo vacío en la esquina superior derecha para anotar manualmente el número de respuestas correctas
  const rectAncho = 24;
  const rectAlto = 10;
  const rectX = pageWidth - MARGEN - rectAncho;
  const rectY = 4;
  doc.setDrawColor(...COLOR_NEGRO);
  doc.setLineWidth(0.4);
  doc.rect(rectX, rectY, rectAncho, rectAlto);

  // Título principal centrado (dejando espacio para el rectángulo de la derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_NEGRO);
  doc.text("TERMAN - MERRILL (HOJA DE RESPUESTA)", pageWidth / 2, 10, { align: "center" });

  const cajaY = 15;
  const cajaAlto = 13;
  const cajaAncho = pageWidth - MARGEN * 2;

  doc.setDrawColor(...COLOR_NEGRO);
  doc.setLineWidth(0.6);
  doc.rect(MARGEN, cajaY, cajaAncho, cajaAlto);

  doc.setLineWidth(0.4);
  doc.line(MARGEN, cajaY + 6.5, MARGEN + cajaAncho, cajaY + 6.5);

  const colFechaX = MARGEN + cajaAncho * 0.65;
  doc.line(colFechaX, cajaY, colFechaX, cajaY + 6.5);

  // Fila 1: Nombre completo y Fecha de aplicación
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("NOMBRE COMPLETO:", MARGEN + 2, cajaY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(nombreCompleto(candidato) || "—", MARGEN + 38, cajaY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.text("FECHA DE APLICACIÓN:", colFechaX + 1, cajaY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(fechaAplicacion, colFechaX + 41, cajaY + 4.5);

  const col1X = MARGEN + cajaAncho * 0.33;
  const col2X = MARGEN + cajaAncho * 0.66;
  doc.line(col1X, cajaY + 6.5, col1X, cajaY + cajaAlto);
  doc.line(col2X, cajaY + 6.5, col2X, cajaY + cajaAlto);

  const sexo = limpiarTexto(candidato?.sex) || "No especificado";
  const edad = candidato?.age != null ? `${candidato.age} años` : "N/A";
  
  const rawFechaNac = candidato?.Fecha_Nacimiento || candidato?.birth_date;
  const fechaNac = rawFechaNac
    ? (() => {
        const [anio, mes, dia] = String(rawFechaNac).split("T")[0].split("-");
        return `${dia}/${mes}/${anio}`;
      })()
    : "No registrada";

  // Fila 2: Sexo, Fecha de Nacimiento y Edad
  doc.setFont("helvetica", "bold");
  doc.text("SEXO:", MARGEN + 2, cajaY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.text(sexo, MARGEN + 16, cajaY + 10.5);

  doc.setFont("helvetica", "bold");
  doc.text("FECHA DE NACIMIENTO:", col1X + 2, cajaY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.text(fechaNac, col1X + 42, cajaY + 10.5);

  doc.setFont("helvetica", "bold");
  doc.text("EDAD:", col2X + 2, cajaY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.text(edad, col2X + 16, cajaY + 10.5);

  return cajaY + cajaAlto + 3.5;
}

function dibujarCuadriculaSeries(
  doc: jsPDF,
  mapaRespuestas: Map<number, { resp1: string; resp2?: string }>,
  inicioY: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const anchoTotal = pageWidth - MARGEN * 2;
  const totalSeries = SERIES_TERMAN.length;
  
  const gap = 8; 
  const espacioTotalGaps = gap * (totalSeries - 1);
  const anchoColumna = (anchoTotal - espacioTotalGaps) / totalSeries;

  const altoCabeceraSerie = 5.5;
  const yCeldas = inicioY + altoCabeceraSerie;

  SERIES_TERMAN.forEach((serie, i) => {
    const x = MARGEN + i * (anchoColumna + gap);

    doc.setFillColor(...COLOR_GRIS_CABECERA);
    doc.setDrawColor(...COLOR_NEGRO);
    doc.setLineWidth(0.4);
    doc.rect(x, inicioY, anchoColumna, altoCabeceraSerie, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_NEGRO);
    doc.text(serie.nombre, x + anchoColumna / 2, inicioY + 3.8, { align: "center" });

    for (let n = 1; n <= serie.cantidad; n++) {
      const numeroGlobal = serie.inicio + (n - 1);
      const registro = mapaRespuestas.get(numeroGlobal);
      const y = yCeldas + (n - 1) * ALTO_FILA;

      doc.setDrawColor(...COLOR_NEGRO);
      doc.setLineWidth(0.2);
      doc.rect(x, y, anchoColumna, ALTO_FILA);

      if (serie.clave === "IV") {
        const wSub = anchoColumna / 3;

        doc.line(x + wSub, y, x + wSub, y + ALTO_FILA);
        doc.line(x + wSub * 2, y, x + wSub * 2, y + ALTO_FILA);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLOR_NEGRO);
        doc.text(String(n), x + wSub / 2, y + 3.0, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.text(registro?.resp1 || "—", x + wSub + wSub / 2, y + 3.0, { align: "center" });
        doc.text(registro?.resp2 || "—", x + wSub * 2 + wSub / 2, y + 3.0, { align: "center" });
      } else {
        const anchoNumCol = Math.min(ANCHO_NUM, anchoColumna * 0.4);
        doc.line(x + anchoNumCol, y, x + anchoNumCol, y + ALTO_FILA);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLOR_NEGRO);
        doc.text(String(n), x + anchoNumCol / 2, y + 3.0, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.text(registro?.resp1 || "—", x + anchoNumCol + (anchoColumna - anchoNumCol) / 2, y + 3.0, {
          align: "center",
        });
      }
    }
  });

  try {
    const imgWidth = 36;
    const imgHeight = 33;
    const imgX = pageWidth - MARGEN - imgWidth;
    const imgY = pageHeight - MARGEN - imgHeight;

    doc.addImage("/images/FDHZ_2025-Color_Vertical.png", "PNG", imgX, imgY, imgWidth, imgHeight);
  } catch (e) {
    console.error("No se pudo cargar la imagen del logo institucional en el PDF", e);
  }
}

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

    const fecha = formatearFechaLarga(fechaAplicacion || prueba?.started_at || prueba?.completed_at);
    const yEncabezado = escribirEncabezadoGeneral(doc, candidato, fecha);
    const mapaRespuestas = mapearRespuestasPersonalizadas(prueba);

    dibujarCuadriculaSeries(doc, mapaRespuestas, yEncabezado);

    const nombreArchivo = limpiarTexto(nombreCompleto(candidato)).replace(/\s+/g, "_").toLowerCase() || "candidato";
    doc.save(`hoja_terman_${nombreArchivo}.pdf`);
  } catch (err) {
    console.error("Error al generar PDF de Terman:", err);
    if (onError) onError("No se pudo generar la hoja de respuestas.");
  }
}