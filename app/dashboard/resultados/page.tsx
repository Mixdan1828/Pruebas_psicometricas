"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generarPDFResultados } from "./generarPDF";
import {
  generarPDFHojaRespuestasTerman,
  esTestTerman,
} from "./generarPDFTerman";

import SideNavBar from "@/componentes/SideNavBar";

import {
  Loader2,
  Printer,
  CalendarDays,
  ClipboardList,
  Search,
  Bell,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Eye,
  Download,
  FileText,
} from "lucide-react";

import {
  statusInfo,
  formatearFecha,
  formatearScore,
  nombreTest,
  inicialesDe,
  nombreCompleto,
  type Candidate,
  type CandidateResult,
} from "./utils/helpers";

const supabase = createClient();

interface FeedbackState {
  tipo: "success" | "error";
  mensaje: string;
}

interface ListadoItem {
  candidate: Candidate;
  resultado: CandidateResult | null;
}

function ListadoResultados() {
  const [items, setItems] = useState<ListadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarListado() {
      try {
        setLoading(true);
        setError(null);

        const { data: candidatos, error: errCand } = await supabase
          .from("candidates")
          .select("*")
          .order("full_name", { ascending: true });

        if (errCand) throw errCand;

        const { data: resultados, error: errRes } = await supabase
          .from("candidate_results")
          .select(
            `*,
            candidates (*),
            tests (id, name, type, description)`
          )
          .order("started_at", { ascending: false, nullsFirst: false });

        if (errRes) throw errRes;

        const porCandidato = new Map<string, CandidateResult | null>();
        (resultados || []).forEach((r) => {
          const cid = r.candidate_id;
          const existente = porCandidato.get(cid);
          if (!existente) {
            porCandidato.set(cid, r as CandidateResult);
          } else {
            const fechaNueva = r.started_at || r.completed_at || "";
            const fechaVieja =
              existente.started_at || existente.completed_at || "";
            if (fechaNueva > fechaVieja) {
              porCandidato.set(cid, r as CandidateResult);
            }
          }
        });

        const listado: ListadoItem[] = (candidatos || []).map((c) => ({
          candidate: c,
          resultado: porCandidato.get(c.id) ?? null,
        }));

        setItems(listado);
      } catch (err) {
        console.error("Error al cargar el listado de resultados:", err);
        setError("No se pudo cargar el listado de candidatos y resultados.");
      } finally {
        setLoading(false);
      }
    }

<<<<<<< HEAD
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
      // Si el expediente incluye el test Terman-Merril, se genera la
      // "Hoja de Respuestas" con el formato oficial (10 series en cascada).
      const pruebaTerman = pruebas.find((p) => esTestTerman(p));
      if (pruebaTerman && candidato) {
        generarPDFHojaRespuestasTerman({
          candidato: {
            full_name: candidato.full_name,
            paternal_surname: candidato.paternal_surname,
            maternal_surname: candidato.maternal_surname,
            age: candidato.age,
            sex: candidato.sex,
            birth_date: candidato.birth_date,
            
          },
          prueba: pruebaTerman,
          fechaAplicacion: pruebaTerman.started_at || pruebaTerman.completed_at,
          onError: (mensaje) => setFeedback({ tipo: "error", mensaje }),
        });
        return;
      }

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
=======
    cargarListado();
  }, []);
>>>>>>> 1921d0ec57d0cc49166f4698c76263df0cd63b06

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#0d313f]" size={36} />
          <p className="text-sm font-medium text-slate-500">
            Cargando listado de candidatos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-rose-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Link
            href="/dashboard/historial_de_pruebas"
            className="text-[#0d313f] font-medium hover:underline"
          >
            &larr; Volver al historial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans flex">
      <SideNavBar title="Resultados" role="admin" />

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#0d313f]">
              Listado de Candidatos y Resultados
            </h1>
            <p className="text-sm text-slate-500">
              Consulta los expedientes y accede al detalle de cada candidato.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <Bell size={18} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        <main className="px-8 py-6 flex-1">
          <div className="text-xs text-slate-500 flex items-center gap-1 mb-6">
            <Link
              href="/dashboard/historial_de_pruebas"
              className="hover:text-[#0d313f] transition-colors"
            >
              Historial
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-500">Listado de Resultados</span>
          </div>

<<<<<<< HEAD
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
                {isGeneratingPDF ? "Generando PDF..." : "Descargar Resultado"}
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
=======
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="py-4 pr-4 font-semibold">Candidato</th>
                  <th className="py-4 pr-4 font-semibold">Prueba</th>
                  <th className="py-4 pr-4 font-semibold">Fecha</th>
                  <th className="py-4 pr-4 font-semibold">Estado</th>
                  <th className="py-4 pr-4 font-semibold text-right">Puntuaci&oacute;n</th>
                  <th className="py-4 pr-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ candidate, resultado }) => {
                  const st = resultado
                    ? statusInfo(resultado.status)
                    : { label: "Sin prueba", cls: "bg-slate-100 text-slate-500 border-slate-200" };
                  const nombrePrueba = resultado
                    ? nombreTest(resultado)
                    : "Sin prueba asignada";
                  const fecha = resultado
                    ? formatearFecha(resultado.started_at || resultado.completed_at)
                    : "—";
                  const puntuacion = resultado
                    ? formatearScore(resultado.score_json)
                    : "—";
                  const iniciales = inicialesDe(nombreCompleto(candidate));

                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
>>>>>>> 1921d0ec57d0cc49166f4698c76263df0cd63b06
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0d313f]/10 text-[#0d313f] flex items-center justify-center font-bold text-sm shrink-0">
                            {iniciales}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/resultados/${candidate.id}`}
                              className="font-medium text-[#0d313f] hover:underline truncate"
                            >
                              {nombreCompleto(candidate)}
                            </Link>
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              ID: {String(candidate.id).slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700 font-medium">
                        {nombrePrueba}
                      </td>
                      <td className="py-4 pr-4 text-slate-500">{fecha}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right font-bold text-slate-600">
                        {puntuacion}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/resultados/${candidate.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0d313f] bg-white border border-[#0d313f]/20 rounded-full hover:bg-[#0d313f]/5 transition-colors"
                          >
                            <Eye size={14} /> Ver
                          </Link>
                          {resultado ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generarPDFParaResultado(candidate, resultado);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#70a444] rounded-full hover:bg-[#5d8c37] transition-colors"
                            >
                              <Download size={14} /> PDF
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-full cursor-not-allowed"
                            >
                              <FileText size={14} /> Sin datos
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No se encontraron candidatos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

function generarPDFParaResultado(
  candidato: Candidate,
  resultado: CandidateResult
): void {
  try {
    const esTerman = esTestTerman(resultado);
    if (esTerman) {
      generarPDFHojaRespuestasTerman({
        candidato: {
          full_name: candidato.full_name ?? null,
          paternal_surname: candidato.paternal_surname ?? null,
          maternal_surname: candidato.maternal_surname ?? null,
          age: candidato.age ?? null,
          sex: candidato.sex ?? null,
          birth_date: candidato.birth_date ?? null,
          id: candidato.id,
        },
        prueba: resultado,
        fechaAplicacion: resultado.started_at || resultado.completed_at,
        onError: (mensaje) => alert(mensaje),
      });
      return;
    }

    generarPDFResultados({
      candidato,
      pruebas: [resultado],
      statusInfo,
      formatearFecha,
      formatearScore,
      nombreTest,
      onError: (mensaje) => alert(mensaje),
    });
  } catch (err) {
    console.error("Error al generar PDF:", err);
    alert("No se pudo generar el reporte en PDF.");
  }
}

export default function DetalleCandidato() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <Loader2 className="animate-spin text-[#0d313f]" size={36} />
          <p className="ml-3 text-sm font-medium text-slate-500">
            Cargando listado de candidatos...
          </p>
        </div>
      }
    >
      <ListadoResultados />
    </Suspense>
  );
}
