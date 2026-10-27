// ---------------------------------------------------------------------------
// Ruta: /dashboard/resultados/[id]
// Captura el ID dinámico del CANDIDATO, consulta Supabase y renderiza
// la hoja de respuestas Terman-Merril en PDF.
// ---------------------------------------------------------------------------

"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generarTermanPdfDocument } from "../TermanPdfDocument";
import { esTestTerman } from "../generarPDFTerman";

import SideNavBar from "@/componentes/SideNavBar";
import { Loader2, Download, Eye } from "lucide-react";

import {
  statusInfo,
  formatearFecha,
  formatearScore,
  nombreTest,
  inicialesDe,
  nombreCompleto,
  type Candidate,
  type CandidateResult,
} from "../utils/helpers";

import {
  obtenerRespuestaReactivo,
  formatearRespuestaParaPDF,
  tieneRespuestaReactivo,
} from "../utils/formatters";

const supabase = createClient();

const TOTAL_REACTIVOS_TERMAN = 60;

function DetalleCandidatoContent() {
  const { id: rawCandidatoId } = useParams();
  const candidatoId = Array.isArray(rawCandidatoId) ? rawCandidatoId[0] : rawCandidatoId;

  const [candidato, setCandidato] = useState<Candidate | null>(null);
  const [resultados, setResultados] = useState<CandidateResult[]>([]);
  const [esTerman, setEsTerman] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      if (!candidatoId) {
        setError("No se proporcionó un ID de candidato válido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: candData, error: candError } = await supabase
          .from("candidates")
          .select("*")
          .eq("id", candidatoId)
          .maybeSingle();

        if (candError) throw candError;

        const { data: resData, error: resError } = await supabase
          .from("candidate_results")
          .select(
            `*,
            candidates (*),
            tests (id, name, type, description)`
          )
          .eq("candidate_id", candidatoId)
          .order("started_at", { ascending: false, nullsFirst: false });

        if (resError) throw resError;

        const listaResultados = (resData || []) as CandidateResult[];
        const tieneTerman = listaResultados.some((r) => esTestTerman(r));

        setCandidato(candData ?? null);
        setResultados(listaResultados);
        setEsTerman(tieneTerman);
      } catch (err) {
        console.error("Error al cargar el expediente del candidato:", err);
        setError("No se pudo cargar la información del candidato.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [candidatoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#0d313f] mx-auto" size={36} />
          <p className="mt-3 text-slate-500">
            Cargando expediente del candidato...
          </p>
        </div>
      </div>
    );
  }

  if (error || !candidato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Link href="/dashboard/historial_de_pruebas" className="text-[#0d313f] font-medium hover:underline">
            &larr; Volver al historial
          </Link>
        </div>
      </div>
    );
  }

  const iniciales = inicialesDe(nombreCompleto(candidato));
  const resultadoTerman = esTerman
    ? resultados.find((r) => esTestTerman(r))
    : null;
  const answersJson = resultadoTerman?.answers_json;

  const respuestasMap = new Map<number, string>();
  if (answersJson) {
    for (let n = 1; n <= TOTAL_REACTIVOS_TERMAN; n += 1) {
      if (tieneRespuestaReactivo(answersJson, n)) {
        const valor = obtenerRespuestaReactivo(answersJson, n);
        respuestasMap.set(n, formatearRespuestaParaPDF(valor));
      }
    }
  }

  const renderReporte = () => (
    <div className="p-6 text-slate-800">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d313f]">
            Reporte de Candidato
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {nombreCompleto(candidato)} &nbsp;|&nbsp; ID:{" "}
            {String(candidato.id).slice(0, 8)}…
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
              esTerman
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {esTerman ? "Test Terman-Merril" : "Prueba Psicométrica"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Candidato
          </p>
          <p className="text-lg font-bold text-slate-800">
            {nombreCompleto(candidato)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Edad: {candidato.age ?? "—"} &bull; Sexo: {candidato.sex ?? "—"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Pruebas realizadas
          </p>
          <p className="text-lg font-bold text-slate-800">{resultados.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Reactivos con respuesta
          </p>
          <p className="text-lg font-bold text-slate-800">
            {respuestasMap.size} / {TOTAL_REACTIVOS_TERMAN}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
              <th className="py-3 pr-4 font-semibold">Prueba</th>
              <th className="py-3 pr-4 font-semibold">Fecha</th>
              <th className="py-3 pr-4 font-semibold">Estado</th>
              <th className="py-3 pr-4 font-semibold text-right">Puntuaci&oacute;n</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resultados.map((r) => {
              const st = statusInfo(r.status);
              return (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 pr-4 font-medium text-slate-700">
                    {nombreTest(r)}
                  </td>
                  <td className="py-4 pr-4 text-slate-500">
                    {formatearFecha(r.started_at || r.completed_at)}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right font-bold text-slate-600">
                    {formatearScore(r.score_json)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {esTerman && resultadoTerman && (
        <div className="mt-8 bg-[#0d313f]/5 rounded-xl border border-[#0d313f]/20 p-6">
          <h3 className="font-bold text-[#0d313f] mb-4 flex items-center gap-2">
            <Eye size={16} className="text-[#70a444]" />
            Hoja de Respuestas Terman-Merril (Vista previa)
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 text-xs p-1 bg-white rounded border border-slate-200">
              {Array.from({ length: TOTAL_REACTIVOS_TERMAN }, (_, i) => i + 1).map(
                (numero) => {
                  const respuesta = respuestasMap.get(numero) ?? "—";
                  const tieneResp = respuestasMap.has(numero);
                  return (
                    <div
                      key={numero}
                      className={`border rounded p-1 text-center flex flex-col items-center gap-1 ${
                        tieneResp ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-slate-700 text-[10px]">
                        #{numero}
                      </div>
                      <div className={`text-[10px] ${
                        tieneResp ? "text-[#70a444] font-bold" : "text-slate-400"
                      }`}>
                        {respuesta}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Los valores se mapean a la notaci&oacute;n oficial de Terman-Merril
              (i, o, v, f, etc.) desde answers_json mediante formatters.ts.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const manejarDescargarPDF = () => {
    if (!resultadoTerman || !candidato) {
      alert("No hay una prueba Terman-Merril disponible para generar el PDF.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      generarTermanPdfDocument({
        candidato: {
          full_name: candidato.full_name ?? null,
          paternal_surname: candidato.paternal_surname ?? null,
          maternal_surname: candidato.maternal_surname ?? null,
          age: candidato.age ?? null,
          sex: candidato.sex ?? null,
          birth_date: candidato.birth_date ?? null,
          id: candidato.id,
        },
        pruebaId: resultadoTerman.id,
        answersJson: resultadoTerman.answers_json,
        fechaAplicacion: resultadoTerman.started_at || resultadoTerman.completed_at,
        onError: (mensaje) => {
          setIsGeneratingPDF(false);
          alert(mensaje);
        },
      });
    } catch (err) {
      setIsGeneratingPDF(false);
      console.error("Error al generar PDF:", err);
      alert("No se pudo generar la hoja de respuestas en PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const modalContent = (
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
            <Eye size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">{renderReporte()}</div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-wrap bg-white shrink-0">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={manejarDescargarPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d313f] rounded-full hover:bg-[#164a5c] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGeneratingPDF ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SideNavBar title="Resultados" role="admin" />
      <main className="ml-64 p-8">
        {renderReporte()}
        {modalContent}
      </main>
    </div>
  );
}

// Envoltorio con Suspense para evitar fallos de prerender estático
export default function DetalleCandidato() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-[#0d313f] mx-auto" size={36} />
          <p className="mt-3 text-slate-500">
            Cargando expediente del candidato...
          </p>
        </div>
      }
    >
      <DetalleCandidatoContent />
    </Suspense>
  );
}