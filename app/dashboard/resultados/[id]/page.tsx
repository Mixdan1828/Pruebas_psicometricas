// ---------------------------------------------------------------------------
// Vista dinámica: Detalle de Candidato con reporte Terman-Merril
// ---------------------------------------------------------------------------
// Ruta: /dashboard/resultados/[id]
// Captura el ID dinámico del candidato, consulta Supabase y renderiza
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
import { Loader2, Printer, Download, Eye } from "lucide-react";

const supabase = createClient();

//---------------------------------------------------------------------------
// Tipos e interfaces
//---------------------------------------------------------------------------

interface Candidate {
  id: string;
  full_name?: string;
  paternal_surname?: string;
  maternal_surname?: string;
  age?: number;
  sex?: string;
  birth_date?: string;
}

interface Test {
  id: string;
  name: string;
  type?: string;
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

//---------------------------------------------------------------------------
// Helpers de presentación
//---------------------------------------------------------------------------

function statusInfo(status: string | null | undefined) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "completo" || s === "completed") {
    return { label: "Completado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (s === "en_proceso" || s === "in_progress") {
    return { label: "En proceso", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Pendiente", cls: "bg-red-50 text-red-700 border-red-200" };
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
  if (!nombre) return "—";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "—";
  return partes.map((p) => p[0]).join("").toUpperCase();
}

function nombreCompleto(candidato: Candidate | null | undefined): string {
  const partes = [candidato?.full_name, candidato?.paternal_surname, candidato?.maternal_surname]
    .filter(Boolean);
  return partes.join(" ").trim() || "Sin nombre";
}

//---------------------------------------------------------------------------
// Componente principal
//---------------------------------------------------------------------------

export default function DetalleCandidato() {
  const params = useParams();
  const [candidato, setCandidato] = useState<Candidate | null>(null);
  const [prueba, setPrueba] = useState<CandidateResult | null>(null);
  const [esTerman, setEsTerman] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const candidatoId = params?.id as string;

  useEffect(() => {
    const cargarDatos = async () => {
      if (!candidatoId) {
        setError("No se proporcionó un ID de candidato.");
        setLoading(false);
        return;
      }

      try {
        const { data: resultado, error: resultError } = await supabase
          .from("candidate_results")
          .select(`*,
            candidates (*),
            tests (*)`)
          .eq("id", candidatoId)
          .single();

        if (resultError || !resultado) {
          setError("No se encontró el resultado del candidato.");
          setLoading(false);
          return;
        }

        setPrueba(resultado as CandidateResult);
        setEsTerman(esTestTerman(resultado as CandidateResult));

        const { data: candidatoData, error: candError } = await supabase
          .from("candidates")
          .select("id, full_name, paternal_surname, maternal_surname, age, sex, birth_date")
          .eq("id", (resultado as CandidateResult).candidate_id ?? "")
          .single();

        if (candError && candError.code !== "PGRST116") {
          console.warn("No se pudieron cargar datos completos del candidato:", candError);
        }

        setCandidato(candidatoData as Candidate | null);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos del candidato.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [candidatoId]);

  const manejarDescargarPDF = () => {
    if (!prueba || !candidato) return;
    setIsGeneratingPDF(true);

    const candidatoPDF = {
      full_name: candidato.full_name || null,
      paternal_surname: candidato.paternal_surname || null,
      maternal_surname: candidato.maternal_surname || null,
      age: candidato.age || null,
      sex: candidato.sex || null,
      birth_date: candidato.birth_date || null,
      id: candidato.id || null,
    };

    generarTermanPdfDocument({
      candidato: candidatoPDF,
      pruebaId: candidatoId,
      answersJson: prueba.answers_json,
      fechaAplicacion: prueba.started_at || prueba.completed_at,
      onError: (mensaje: string) => {
        console.error(mensaje);
        setError(mensaje);
        setIsGeneratingPDF(false);
      },
    });

    setIsGeneratingPDF(false);
    setShowModal(false);
  };

  function renderReporte() {
    if (!candidato || !prueba) return <div className="text-center py-8">Cargando reporte...</div>;

    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0d313f] mb-2">{nombreCompleto(candidato)}</h2>
          <p className="text-sm text-slate-600">
            ID del candidato: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{candidatoId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Nombre Completo</p>
            <p className="font-medium text-slate-800">{nombreCompleto(candidato)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Iniciales</p>
            <p className="font-medium text-slate-800">{inicialesDe(candidato.full_name)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Sexo</p>
            <p className="font-medium text-slate-800">{candidato.sex || "—"}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Edad</p>
            <p className="font-medium text-slate-800">{candidato.age ? `${candidato.age} años` : "—"}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Fecha de Nacimiento</p>
            <p className="font-medium text-slate-800">{candidato.birth_date || "—"}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Fecha de Aplicación</p>
            <p className="font-medium text-slate-800">{formatearFecha(prueba.started_at || prueba.completed_at)}</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${statusInfo(prueba.status).cls}`}>
          <p className="text-sm font-semibold">Estado: {statusInfo(prueba.status).label}</p>
        </div>
      </div>
    );
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 h-full max-h-[60vh] overflow-y-auto">
            <h4 className="font-bold text-slate-700 mb-4">Hoja de Respuestas Terman-Merril</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
              {Array.from({ length: 60 }, (_, i) => i + 1).map((numero) => (
                <div key={numero} className="border border-slate-300 rounded p-1 text-center">
                  <div className="font-bold text-slate-600">{numero}</div>
                  <div className="text-xs text-slate-400">—</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isGeneratingPDF ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#0d313f] mx-auto" size={36} />
          <p className="mt-3 text-slate-500">Cargando expediente del candidato...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
