// printReport.ts (ubicado dentro de la carpeta resultados)

interface Candidate {
  full_name?: string;
  paternal_surname?: string;
  maternal_surname?: string;
  age?: number;
}

interface Test {
  name: string;
}

export interface CandidateResult {
  id: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  score_json?: unknown;
  examiner_notes?: string;
  tests?: Test | Test[];
}

// Estructura mínima que la utilidad necesita de cada prueba.
// Permite reutilizarla con cualquier tipo de prueba más específico.
interface PruebaLike {
  id: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  score_json?: unknown;
  examiner_notes?: string;
  tests?: Test | Test[];
}

interface PrintReportOptions<T extends PruebaLike = CandidateResult> {
  candidato: Candidate | null;
  pruebas: T[];
  statusInfo: (status: string | null | undefined) => { label: string; cls?: string };
  formatearFecha: (fecha: string | null | undefined) => string;
  formatearScore: (score: unknown) => string;
  nombreTest: (prueba: T) => string;
  onError?: (mensaje: string) => void;
}

export function imprimirReporteCandidato<T extends PruebaLike = CandidateResult>({
  candidato,
  pruebas,
  statusInfo,
  formatearFecha,
  formatearScore,
  nombreTest,
  onError,
}: PrintReportOptions<T>): void {
  const nombreCompleto = [
    candidato?.full_name,
    candidato?.paternal_surname,
    candidato?.maternal_surname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const filas =
    pruebas
      .map((p) => {
        const st = statusInfo(p.status);
        const score = String(formatearScore(p.score_json)).replace(/\n/g, "<br/>");
        const notas = p.examiner_notes
          ? `<div class="detalle"><b>Observaciones:</b> ${String(p.examiner_notes).replace(/</g, "&lt;")}</div>`
          : "";
        return `
          <div class="bloque">
            <div class="cabecera-bloque">
              <strong>${nombreTest(p)}</strong>
              <span class="estado">${st.label}</span>
            </div>
            <div class="detalle">Aplicada el: ${formatearFecha(p.started_at || p.completed_at)}</div>
            <div class="detalle"><b>Puntuación:</b> ${score}</div>
            ${notas}
          </div>
        `;
      })
      .join("") ||
    '<p class="vacio">El candidato no tiene pruebas registradas.</p>';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reporte de ${nombreCompleto || "Candidato"}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 32px; }
    h1 { color: #0d313f; font-size: 22px; margin: 0 0 4px; }
    .subtitulo { color: #64748b; font-size: 14px; margin: 0 0 24px; border-bottom: 2px solid #70a444; padding-bottom: 8px; }
    .bloque { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
    .cabecera-bloque { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px; }
    .estado { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 10px; border-radius: 9999px; border: 1px solid #70a444; color: #0d313f; background: #eff7e0; }
    .detalle { font-size: 13px; color: #475569; margin-top: 6px; line-height: 1.4; }
    .vacio { color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <h1>Reporte de Resultados</h1>
  <p class="subtitulo">Candidato: <strong>${nombreCompleto || "Sin nombre"}</strong> ${
    candidato?.age != null ? `— Edad: ${candidato.age} años` : ""
  }</p>
  ${filas}
</body>
</html>`;

  const ventana = window.open("", "_blank");
  if (!ventana) {
    if (onError) {
      onError("El navegador bloqueó la ventana emergente. Habilítalas para imprimir o guardar el PDF.");
    } else {
      alert("El navegador bloqueó la ventana emergente.");
    }
    return;
  }

  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 500);
}