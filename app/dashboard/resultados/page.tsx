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
          const cid = r.candidate_id ?? "";
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

    cargarListado();
  }, []);

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
            <button
              className="relative p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
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
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="py-4 pr-4 font-semibold">Candidato</th>
                  <th className="py-4 pr-4 font-semibold">Prueba</th>
                  <th className="py-4 pr-4 font-semibold">Fecha</th>
                  <th className="py-4 pr-4 font-semibold">Estado</th>
                  <th className="py-4 pr-4 font-semibold text-right">
                    Puntuaci&oacute;n
                  </th>
                  <th className="py-4 pr-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ candidate, resultado }) => {
                  const st = resultado
                    ? statusInfo(resultado.status)
                    : {
                        label: "Sin prueba",
                        cls: "bg-slate-100 text-slate-500 border-slate-200",
                      };
                  const nombrePrueba = resultado
                    ? nombreTest(resultado)
                    : "Sin prueba asignada";
                  const fecha = resultado
                    ? formatearFecha(
                        resultado.started_at || resultado.completed_at
                      )
                    : "—";
                  const puntuacion = resultado
                    ? formatearScore(resultado.score_json)
                    : "—";
                  const iniciales = inicialesDe(nombreCompleto(candidate));

                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
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
                    <td colSpan={6} className="py-8 text-center text-slate-500">
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

