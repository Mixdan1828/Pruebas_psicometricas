// app/dashboard/resultados/ModalVistaPreviaPruebas.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Eye, X, ArrowLeft, Download } from 'lucide-react';
import { generarPDFHojaRespuestasTerman, esTestTerman } from './pdf/generarPDFTerman';
import { generarPDFHojaRespuestasClaver, esTestClaver } from "./pdf/generarPDFClaver";
import { generarPDFHojaRespuestasRaven, esTestRaven } from "./pdf/generarPDFRaven";
import { generarPDFHojaRespuestasNom035, esTestNom035 as esTestNom035PDF } from './pdf/generarNom035';
import { VistaPreviaTerman } from "./vistas-previas/VistaPreviaTerman";
import { VistaPreviaClaver } from "./vistas-previas/VistaPreviClaver";
import VistaPreviaRaven from "./vistas-previas/VistaPreviaRaven";
import VistaPreviaNom035 from "./vistas-previas/VistaPreviaNom035"; // Asegúrate de tener esta vista o la que creamos

interface ModalVistaPreviaProps {
  isOpen: boolean;
  onClose: () => void;
  candidato: any;
  pruebas: any[];
  statusInfo: (status: string | null | undefined) => { label: string; cls: string };
  formatearFecha: (fecha: string | null | undefined) => string;
  nombreTest: (prueba: any) => string;
  onDescargarPrueba?: (prueba: any) => void;
}

// Función auxiliar para detectar si es test NOM-035 Integral
const esTestNom035 = (prueba: any) => {
  const tName = (prueba?.tests?.name || prueba?.test_name || "").toLowerCase();
  const tType = (prueba?.tests?.type || "").toLowerCase();
  return tName.includes('nom-035') || tName.includes('nom035') || tName.includes('integral') || tType.includes('nom');
};

export function ModalVistaPreviaPruebas({
  isOpen,
  onClose,
  candidato,
  pruebas,
  statusInfo,
  formatearFecha,
  nombreTest,
}: ModalVistaPreviaProps) {
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const nombreCompleto = [
    candidato?.full_name,
    candidato?.paternal_surname,
    candidato?.maternal_surname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Generación nativa limpia mediante jsPDF o acciones de descarga
  const handleDescargarPDF = () => {
    if (!pruebaSeleccionada) return;

    const fechaApp = pruebaSeleccionada.started_at || pruebaSeleccionada.completed_at;

    if (esTestClaver(pruebaSeleccionada)) {
      generarPDFHojaRespuestasClaver({
        candidato: candidato,
        prueba: pruebaSeleccionada,
        fechaAplicacion: fechaApp,
        onError: (mensaje) => alert(mensaje),
      });
      return;
    }

    if (esTestRaven(pruebaSeleccionada)) {
      generarPDFHojaRespuestasRaven({
        candidato: candidato,
        prueba: pruebaSeleccionada,
        fechaAplicacion: fechaApp,
        onError: (mensaje) => alert(mensaje),
      });
      return;
    }

    if (esTestTerman(pruebaSeleccionada)) {
      generarPDFHojaRespuestasTerman({
        candidato: candidato,
        prueba: pruebaSeleccionada,
        fechaAplicacion: fechaApp,
        onError: (mensaje) => alert(mensaje),
      });
      return;
    }

    if (esTestNom035PDF(pruebaSeleccionada)) {
      generarPDFHojaRespuestasNom035({
      candidato: candidato,
      prueba: pruebaSeleccionada,
      onError: (mensaje) => alert(mensaje),
      });
      return;
    }

    alert("La descarga para esta prueba está en desarrollo.");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {pruebaSeleccionada && (
              <button
                onClick={() => setPruebaSeleccionada(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer mr-1"
                title="Regresar al listado"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h3 className="font-bold text-[#0d313f] flex items-center gap-2">
              <Eye size={18} className="text-[#70a444]" />
              {pruebaSeleccionada
                ? `Hoja de Respuesta: ${nombreTest(pruebaSeleccionada)}`
                : "Reporte de Resultados - Pruebas del Candidato"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="overflow-y-auto flex-1 min-h-0 p-6 text-slate-800">
          {!pruebaSeleccionada ? (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Candidato: <strong>{nombreCompleto || "Sin nombre"}</strong>
                {candidato?.age != null ? ` — Edad: ${candidato.age} años` : ""}
              </p>

              <div className="space-y-3">
                {pruebas.map((p, i) => {
                  const st = statusInfo(p.status);
                  return (
                    <div
                      key={p.id || i}
                      className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 hover:border-[#0d313f]/45 transition-colors bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-[#0d313f]">
                          {nombreTest(p)}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Aplicada el: {formatearFecha(p.started_at || p.completed_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${st.cls}`}
                        >
                          {st.label}
                        </span>

                        <button
                          onClick={() => setPruebaSeleccionada(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d313f] rounded-lg hover:bg-[#164a5c] transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          Ver Hoja de Respuesta
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pruebas.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    El candidato no tiene pruebas registradas.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-[#0d313f]">
                      {nombreTest(pruebaSeleccionada)}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Fecha de aplicación: {formatearFecha(pruebaSeleccionada.started_at || pruebaSeleccionada.completed_at)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      statusInfo(pruebaSeleccionada.status).cls
                    }`}
                  >
                    {statusInfo(pruebaSeleccionada.status).label}
                  </span>
                </div>

                {pruebaSeleccionada.examiner_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Observaciones del evaluador
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {pruebaSeleccionada.examiner_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Contenedor encapsulado con ref */}
              <div ref={printRef} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
                {esTestTerman(pruebaSeleccionada) ? (
                  <VistaPreviaTerman
                    candidato={candidato}
                    prueba={pruebaSeleccionada}
                    formatearFecha={formatearFecha}
                  />
                ) : esTestClaver(pruebaSeleccionada) ? (
                  <VistaPreviaClaver
                    candidato={candidato}
                    prueba={pruebaSeleccionada}
                    formatearFecha={formatearFecha}  
                  />
                ) : esTestRaven(pruebaSeleccionada) ? (
                  <VistaPreviaRaven
                    candidato={candidato}
                    prueba={pruebaSeleccionada}
                    formatearFecha={formatearFecha}
                  />
                ) : esTestNom035(pruebaSeleccionada) ? (
                  <VistaPreviaNom035
                    candidato={candidato}
                    prueba={pruebaSeleccionada}
                    formatearFecha={formatearFecha}
                  />
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    La vista previa para este tipo de prueba aún no está disponible.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie de página del Modal */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
          {pruebaSeleccionada ? (
            <button
              onClick={() => setPruebaSeleccionada(null)}
              className="text-xs font-semibold text-slate-600 hover:text-[#0d313f] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Volver al listado de pruebas
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cerrar
            </button>
            {pruebaSeleccionada && (
              <button
                onClick={handleDescargarPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d313f] rounded-full hover:bg-[#164a5c] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download size={16} />
                Descargar PDF de esta prueba
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}