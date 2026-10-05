"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generarPDFResultados } from "./generarPDF";

// Importamos el componente SideNavBar
import SideNavBar from "@/componentes/SideNavBar";

import {
  Loader2,
  Save,
  Eye,
  X,
  Printer,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  Search,
  Bell,
  ChevronRight,
  ArrowLeft,
  Pencil,
} from "lucide-react";

// Instancia global de Supabase fuera del componente
const supabase = createClient();

// ---------------------------------------------------------------------------
// Tipos e Interfaces de TypeScript
// ---------------------------------------------------------------------------

interface Candidate {
  id: string;
  full_name?: string;
  paternal_surname?: string;
  maternal_surname?: string;
  age?: number;
  [key: string]: unknown;
}

interface Test {
  id: string;
  name: string;
  type?: string;
  description?: string;
  test_questions?: {
    id: string;
    order_index?: number | null;
    content_jsonb?: unknown;
  }[];
}

interface CandidateResult {
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

interface FeedbackState {
  tipo: "success" | "error";
  mensaje: string;
}

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

function statusInfo(status: string | null | undefined) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "completo" || s === "completed") {
    return {
      label: "Completado",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (s === "en_proceso" || s === "in_progress") {
    return {
      label: "En proceso",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  return {
    label: "Pendiente",
    cls: "bg-red-50 text-red-700 border-red-200",
  };
}

function formatearFecha(fecha: string | null | undefined): string {
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

function formatearScore(score: unknown): string {
  if (score == null) return "N/A";
  if (typeof score === "object") return JSON.stringify(score, null, 2);
  return String(score);
}

function nombreTest(prueba: CandidateResult): string {
  const t = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
  return t?.name || "Prueba psicométrica";
}

function inicialesDe(nombre?: string | null): string {
  if (!nombre) return "PA";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "PA";
  const primera = partes[0][0] || "";
  const segunda = partes[1]?.[0] || partes[0][1] || "";
  return (primera + segunda).toUpperCase();
}

function posicionRango(score: unknown): number {
  let num: number;
  if (typeof score === "number") num = score;
  else if (typeof score === "string") num = parseFloat(score);
  else if (score && typeof score === "object") {
    const vals = Object.values(score as Record<string, unknown>)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    num = vals.length ? vals[0] : 50;
  } else {
    num = 50;
  }
  if (Number.isNaN(num)) num = 50;
  return Math.min(100, Math.max(0, num));
}

export default function DetalleCandidato() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");

  // Estados de datos
  const [candidato, setCandidato] = useState<Candidate | null>(null);
  const [pruebas, setPruebas] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Observaciones del evaluador
  const [observacionTestId, setObservacionTestId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // Modal de vista previa del reporte
  const [showModal, setShowModal] = useState<boolean>(false);

  // Generación del PDF de resultados
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  useEffect(() => {
    async function cargarDatos() {
      if (!candidateId) {
        setError("No se proporcionó un ID de candidato válido en la URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setFeedback(null);

        // 1. Información del candidato
        const { data: cand } = await supabase
          .from("candidates")
          .select("*")
          .eq("id", candidateId)
          .maybeSingle();

        // 2. Pruebas realizadas por el candidato
        const { data: resultados, error: errResultados } = await supabase
          .from("candidate_results")
          .select(
            `
            *,
            candidates (*),
            tests (id, name, type, description, test_questions (id, order_index, content_jsonb))
          `
          )
          .eq("candidate_id", candidateId)
          .order("started_at", { ascending: false, nullsFirst: false });

        if (errResultados) throw errResultados;

        setCandidato(cand || null);
        setPruebas((resultados as CandidateResult[]) || []);

        const primerResultado = (resultados || [])[0];
        if (primerResultado) {
          setObservacionTestId(primerResultado.id);
          setObservaciones(primerResultado.examiner_notes || "");
        } else {
          setObservacionTestId("");
          setObservaciones("");
        }
      } catch (err: unknown) {
        console.error("Error al cargar el expediente del candidato:", err);
        setError("No se pudo cargar la información del candidato.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [candidateId]);

  const nombreCompleto = [
    candidato?.full_name,
    candidato?.paternal_surname,
    candidato?.maternal_surname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const seleccionarPruebaObservacion = (testId: string) => {
    const resultado = pruebas.find((p) => p.id === testId);
    setObservacionTestId(testId);
    setObservaciones(resultado?.examiner_notes || "");
    setFeedback(null);
  };

  const guardarObservaciones = async () => {
    if (!observacionTestId) {
      setFeedback({
        tipo: "error",
        mensaje: "No hay una prueba seleccionada para guardar la observación.",
      });
      return;
    }
    setGuardando(true);
    setFeedback(null);

    try {
      const { data, error: err } = await supabase
        .from("candidate_results")
        .update({ examiner_notes: observaciones })
        .eq("id", observacionTestId)
        .select();

      if (err) throw err;

      if (!data || data.length === 0) {
        throw new Error(
          "No se actualizó el registro. Revisa las políticas RLS en Supabase."
        );
      }

      setPruebas((prev) =>
        prev.map((p) =>
          p.id === observacionTestId
            ? { ...p, examiner_notes: observaciones }
            : p
        )
      );
      setFeedback({
        tipo: "success",
        mensaje: "Observaciones guardadas correctamente.",
      });
    } catch (err: unknown) {
      console.error("Error al guardar observaciones:", err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setFeedback({
        tipo: "error",
        mensaje: `Error al guardar: ${msg}`,
      });
    } finally {
      setGuardando(false);
    }
  };

  const renderReporte = () => (
    <div className="p-8 text-slate-800">
      <h1 className="text-xl font-bold text-[#0d313f]">Reporte de Resultados</h1>
      <p className="text-sm text-slate-500 mt-1">
        Candidato: <strong>{nombreCompleto || "Sin nombre"}</strong>
        {candidato?.age != null ? ` — Edad: ${candidato.age} años` : ""}
      </p>

      <div className="mt-6 space-y-4">
        {pruebas.map((p, i) => {
          const st = statusInfo(p.status);
          return (
            <div
              key={p.id || i}
              className="border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-[#0d313f]">{nombreTest(p)}</h3>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${st.cls}`}
                >
                  {st.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aplicada el: {formatearFecha(p.started_at || p.completed_at)}
              </p>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Puntuación
                </p>
                <pre className="mt-1 whitespace-pre-wrap text-sm bg-slate-50 border border-slate-100 rounded-lg p-3">
                  {formatearScore(p.score_json)}
                </pre>
              </div>
              {p.examiner_notes && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Observaciones del evaluador
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {p.examiner_notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {pruebas.length === 0 && (
          <p className="text-sm text-slate-500">
            El candidato no tiene pruebas registradas.
          </p>
        )}
      </div>
    </div>
  );

  const handleDescargarResultados = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    setFeedback(null);
    try {
      generarPDFResultados({
        candidato,
        pruebas,
        statusInfo,
        formatearFecha,
        formatearScore,
        nombreTest,
        onError: (mensaje) => setFeedback({ tipo: "error", mensaje }),
      });
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      setFeedback({
        tipo: "error",
        mensaje: "No se pudo generar el reporte en PDF.",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#0d313f]" size={36} />
          <p className="text-sm font-medium text-slate-500">
            Cargando expediente del candidato...
          </p>
        </div>
      </div>
    );
  }

  if (error || !candidato) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <p className="text-rose-600 font-bold">
          {error || "Candidato no encontrado."}
        </p>
      </div>
    );
  }

  const primerPrueba = pruebas[0];
  const nombrePruebaActual = primerPrueba
    ? nombreTest(primerPrueba)
    : "Sin prueba";
  const fechaPruebaActual = primerPrueba
    ? formatearFecha(primerPrueba.started_at || primerPrueba.completed_at)
    : "Sin fecha";
  const estadoPruebaActual = primerPrueba
    ? statusInfo(primerPrueba.status)
    : { label: "Sin datos", cls: "" };
  const iniciales = inicialesDe(nombreCompleto);
  const valorIndicador = primerPrueba
    ? posicionRango(primerPrueba.score_json)
    : 50;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans flex">
      <SideNavBar
        title="Modulo Aplicador"
        role="aplicador"
        candidateId={candidateId}
      />

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* TopBar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center gap-6 sticky top-0 z-30">
          <div className="relative w-full max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              placeholder="Buscar candidatos o folios..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#70a444] focus:bg-white transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <Bell size={18} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#0d313f] text-white flex items-center justify-center font-bold text-xs">
                AP
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#0d313f] leading-tight">
                  Aplicador
                </p>
                <p className="text-xs text-slate-500 leading-tight">Evaluador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-6 flex-1">
          {/* Breadcrumb */}
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Link
              href="/dashboard/historial_de_pruebas"
              className="hover:text-[#0d313f] transition-colors"
            >
              Resultados
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-500">Detalle de Prueba</span>
          </div>

          {/* Title + Actions */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-[#0d313f]">
              Resultados de Prueba
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/historial_de_pruebas"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
                Regresar al Historial
              </Link>
              <button
                onClick={() => setShowModal(true)}
                style={{ backgroundColor: '#07465d', color: '#ffffff' }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                <Eye size={16} />
                Ver Resultados
              </button>
              <button
                onClick={handleDescargarResultados}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 text- font-semibold text-white bg-[#0d313f] rounded-full hover:bg-[#164a5c] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                {isGeneratingPDF ? "Generando PDF..." : "Imprimir Resultado"}
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Candidate Info Card */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#0d313f]/10 text-[#0d313f] flex items-center justify-center font-bold text-lg shrink-0">
                    {iniciales}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0d313f] truncate">
                      {nombreCompleto || "Candidato"}
                    </p>
                    <p className="text-xs text-slate-500">
                      ID: {candidato?.id ? String(candidato.id).slice(0, 8) : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <InfoItem
                    icon={ClipboardList}
                    etiqueta="Prueba"
                    valor={nombrePruebaActual}
                  />
                  <InfoItem
                    icon={CalendarDays}
                    etiqueta="Fecha"
                    valor={fechaPruebaActual}
                  />
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      size={16}
                      className="text-[#70a444] mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Estado
                      </p>
                      <span
                        className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full border ${
                          estadoPruebaActual.cls ||
                          "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {estadoPruebaActual.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Card */}
              <div className="bg-[#0d313f] rounded-2xl p-6 text-white">
                <p className="text-xs uppercase tracking-wide text-white/60 font-semibold">
                  Indicador visual de desempeño
                </p>
                <div className="mt-5 h-2.5 rounded-full bg-white/15 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#70a444]"
                    style={{ width: `${valorIndicador}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/70">
                  <span>BAJO</span>
                  <span>MEDIO</span>
                  <span>ALTO</span>
                </div>
              </div>
            </div>

            {/* Right Column (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Detailed Table */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6">
                <h2 className="font-bold text-[#0d313f] mb-4">
                  Resultados detallados
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                        <th className="py-3 pr-4 font-semibold">Prueba</th>
                        <th className="py-3 pr-4 font-semibold">Fecha</th>
                        <th className="py-3 pr-4 font-semibold">Estado</th>
                        <th className="py-3 text-right font-semibold">
                          Puntuación
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pruebas.map((p, i) => {
                        const st = statusInfo(p.status);
                        return (
                          <tr
                            key={p.id || i}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-4 pr-4 font-medium text-slate-700">
                              {nombreTest(p)}
                            </td>
                            <td className="py-4 pr-4 text-slate-500">
                              {formatearFecha(p.started_at || p.completed_at)}
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                                  st.cls ||
                                  "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td
                              className={`py-4 text-right font-bold ${
                                i === 0 ? "text-[#70a444]" : "text-slate-600"
                              }`}
                            >
                              {formatearScore(p.score_json)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {pruebas.length === 0 && (
                    <p className="py-6 text-sm text-slate-500 text-center">
                      Este candidato aún no tiene pruebas registradas.
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Notes Form */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6">
                <h2 className="font-bold text-[#0d313f] flex items-center gap-2 mb-4">
                  <Pencil size={16} className="text-[#70a444]" />
                  Información Adicional / Observaciones
                </h2>

                {pruebas.length > 1 && (
                  <div className="mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Aplicar a la prueba
                    </label>
                    <select
                      value={observacionTestId}
                      onChange={(e) =>
                        seleccionarPruebaObservacion(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#70a444] focus:bg-white"
                    >
                      {pruebas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {nombreTest(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <textarea
                    value={observaciones}
                    onChange={(e) => {
                      setObservaciones(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Escribe aquí las observaciones del evaluador..."
                    rows={5}
                    className="w-full bg-transparent text-sm text-slate-700 focus:outline-none resize-y placeholder:text-slate-500"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={guardarObservaciones}
                    disabled={guardando}
                    style={{ backgroundColor: '#167914', color: '#ffffff' }}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer rounded-full"
                  >
                    {guardando ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    Guardar Cambios
                  </button>
                </div>

                {feedback && (
                  <p
                    className={`mt-3 text-sm font-medium flex items-center gap-1 ${
                      feedback.tipo === "success"
                        ? "text-green-600"
                        : "text-rose-600"
                    }`}
                  >
                    {feedback.tipo === "success" ? "✓ Guardado" : "✕ Error"}:{" "}
                    {feedback.mensaje}
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-[#0d313f] flex items-center gap-2">
                <Eye size={18} className="text-[#70a444]" />
                Vista previa del reporte
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">{renderReporte()}</div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-wrap bg-white shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cerrar
              </button>
              <button
                onClick={handleDescargarResultados}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d313f] rounded-full hover:bg-[#164a5c] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGeneratingPDF ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                {isGeneratingPDF ? "Generando PDF..." : "Imprimir / Guardar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Auxiliary Component
function InfoItem({
  icon: Icon,
  etiqueta,
  valor,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon size={16} className="text-[#70a444] mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {etiqueta}
        </p>
        <p className="mt-0.5 font-medium text-slate-800 break-words">{valor}</p>
      </div>
    </div>
  );
}