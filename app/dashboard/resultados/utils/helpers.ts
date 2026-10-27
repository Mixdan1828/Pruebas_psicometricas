// ---------------------------------------------------------------------------
// Helpers compartidos entre page.tsx y [id]/page.tsx
// Extraídos para mantener cada archivo por debajo de 800 líneas y evitar
// duplicación de lógica de presentación.
// ---------------------------------------------------------------------------

export interface Candidate {
  id: string;
  full_name?: string;
  paternal_surname?: string;
  maternal_surname?: string;
  age?: number;
  sex?: string;
  birth_date?: string;
  [key: string]: unknown;
}

export interface Test {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

export interface CandidateResult {
  id: string;
  candidate_id: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  score_json?: unknown;
  examiner_notes?: string;
  answers_json?: unknown;
  tests?: Test | Test[];
  candidates?: Candidate;
}

/** Devuelve etiqueta y clase CSS según el estado de la prueba. */
export function statusInfo(status: string | null | undefined) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "completo" || s === "completed") {
    return { label: "Completado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (s === "en_proceso" || s === "in_progress") {
    return { label: "En proceso", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Pendiente", cls: "bg-red-50 text-red-700 border-red-200" };
}

/** Formatea una fecha ISO a cadena legible (es-MX). */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Sin registrar";
  try {
    return new Date(fecha).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(fecha);
  }
}

/** Formatea un score (puede ser objeto, string o número) a cadena legible. */
export function formatearScore(score: unknown): string {
  if (score == null) return "N/A";
  if (typeof score === "object") return JSON.stringify(score, null, 2);
  return String(score);
}

/** Extrae el nombre del test desde un CandidateResult. */
export function nombreTest(prueba: CandidateResult): string {
  const t = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
  return t?.name || "Prueba psicométrica";
}

/** Devuelve las iniciales de un nombre completo (máximo 2 letras). */
export function inicialesDe(nombre?: string | null): string {
  if (!nombre) return "PA";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "PA";
  return partes.map((p) => p[0]).join("").toUpperCase();
}

/** Devuelve el nombre completo de un candidato. */
export function nombreCompleto(candidato: Candidate | null | undefined): string {
  if (!candidato) return "Sin nombre";
  const partes = [candidato.full_name, candidato.paternal_surname, candidato.maternal_surname].filter(Boolean);
  return partes.join(" ").trim() || "Sin nombre";
}

/** Extrae el ID numérico de un reactivo desde una clave tipo "r_42" o "42". */
export function extraerNumeroReactivo(clave: string): number | null {
  const num = parseInt(clave.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? null : num;
}