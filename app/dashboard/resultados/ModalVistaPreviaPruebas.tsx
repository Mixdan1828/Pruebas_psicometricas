import React, { useState, useRef } from 'react';
import { Eye, X, ArrowLeft, Download } from 'lucide-react';
import { generarPDFHojaRespuestasTerman } from './generarPDFTerman';

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

  const esTerman = (prueba: any) => {
    const nombre = nombreTest(prueba).toLowerCase();
    return nombre.includes("terman");
  };

  const obtenerDatosPreguntaSerie = (prueba: any, numeroSerie: number, numPreguntaLocal: number) => {
    const testObj = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
    if (!testObj || !testObj.test_questions) return { respuesta: "—", respuesta2: "—" };

    const preguntasSerie = testObj.test_questions
      .filter((q: any) => {
        const parsed = typeof q.content_jsonb === 'string' ? JSON.parse(q.content_jsonb || "{}") : (q.content_jsonb || {});
        return Number(parsed?.serie) === numeroSerie;
      })
      .sort((a: any, b: any) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

    const preguntaItem = preguntasSerie[numPreguntaLocal - 1];
    if (!preguntaItem) return { respuesta: "—", respuesta2: "—" };

    const preguntaId = preguntaItem.id;
    const contenidoJson = typeof preguntaItem.content_jsonb === 'string' ? JSON.parse(preguntaItem.content_jsonb || "{}") : (preguntaItem.content_jsonb || {});
    const respuestasJson = prueba?.answers_json || {};
    let respuestaUsuario = respuestasJson[preguntaId];

    if (respuestaUsuario === undefined || respuestaUsuario === null || respuestaUsuario === "") {
      return { respuesta: "—", respuesta2: "—" };
    }

    // Parseo seguro si la respuesta viene como string JSON
    if (typeof respuestaUsuario === 'string' && (respuestaUsuario.startsWith('{') || respuestaUsuario.startsWith('['))) {
      try {
        respuestaUsuario = JSON.parse(respuestaUsuario);
      } catch {}
    }

    // Serie III (Vocabulario): Mostrar 'i' u 'o'
    if (numeroSerie === 3) {
      const valStr = String(respuestaUsuario).trim().toLowerCase();
      if (valStr.startsWith('ig') || valStr === 'i') return { respuesta: 'i', respuesta2: '—' };
      if (valStr.startsWith('op') || valStr === 'o') return { respuesta: 'o', respuesta2: '—' };
      return { respuesta: valStr.charAt(0), respuesta2: '—' };
    }

    // Serie IV (Selección Lógica): 2 opciones devueltas en 2 letras independientes
    if (numeroSerie === 4) {
      const opciones = contenidoJson.opciones || contenidoJson.options || contenidoJson.choices || [];
      if (Array.isArray(respuestaUsuario)) {
        const letrasElegidas = respuestaUsuario.map((resp: any) => {
          if (typeof resp === 'string' && resp.length <= 2) return resp.toLowerCase();
          const idx = opciones.findIndex((opt: any) => {
            const textoOpt = typeof opt === 'object' ? (opt.texto || opt.label || '') : String(opt);
            return textoOpt.trim().toLowerCase() === String(resp).trim().toLowerCase();
          });
          return idx !== -1 ? String.fromCharCode(97 + idx) : String(resp).charAt(0).toLowerCase();
        });
        return {
          respuesta: letrasElegidas[0] || "—",
          respuesta2: letrasElegidas[1] || "—"
        };
      }
    }

    // Serie VIII (Ordenación + V/F): Mostrar 'v' o 'f'
    if (numeroSerie === 8) {
      if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
        const vf = respuestaUsuario.verdadFalso || respuestaUsuario.vf || respuestaUsuario.respuesta || "";
        const vfStr = String(vf).trim().toLowerCase();
        if (vfStr.startsWith('v')) return { respuesta: 'v', respuesta2: '—' };
        if (vfStr.startsWith('f')) return { respuesta: 'f', respuesta2: '—' };
      }
    }

    // Manejo robusto para objetos complejos (oraciones ordenadas, pares numéricos, etc.)
    if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
      if (respuestaUsuario.oracionOrdenada) {
        return { respuesta: String(respuestaUsuario.oracionOrdenada).trim(), respuesta2: '—' };
      }
      if (respuestaUsuario.texto) {
        return { respuesta: String(respuestaUsuario.texto).trim(), respuesta2: '—' };
      }

      const n1 = respuestaUsuario.num1 ?? respuestaUsuario.val1 ?? respuestaUsuario.n1 ?? "";
      const n2 = respuestaUsuario.num2 ?? respuestaUsuario.val2 ?? respuestaUsuario.n2 ?? "";

      if (n1 !== "" || n2 !== "") {
        const part1 = n1 !== "" ? String(n1) : "";
        const part2 = n2 !== "" ? String(n2) : "";
        const combinado = part1 && part2 ? `${part1}, ${part2}` : part1 || part2;
        return { respuesta: combinado || "—", respuesta2: '—' };
      }

      return { respuesta: "—", respuesta2: '—' };
    }

    // Series de opción múltiple estándar
    const opciones = contenidoJson.opciones || contenidoJson.options || contenidoJson.choices || [];
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
          return { respuesta: optObj.letra.toLowerCase(), respuesta2: '—' };
        }
        return { respuesta: String.fromCharCode(97 + indexEncontrado), respuesta2: '—' };
      }
    }

    if (Array.isArray(respuestaUsuario)) {
      return { respuesta: respuestaUsuario.join(", "), respuesta2: '—' };
    }

    return { respuesta: String(respuestaUsuario).trim(), respuesta2: '—' };
  };

  // Generación nativa limpia mediante jsPDF
  const handleDescargarPDF = () => {
    if (!pruebaSeleccionada) return;

    generarPDFHojaRespuestasTerman({
      candidato: candidato,
      prueba: pruebaSeleccionada,
      fechaAplicacion: pruebaSeleccionada.started_at || pruebaSeleccionada.completed_at,
      onError: (mensaje) => {
        alert(mensaje);
      }
    });
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
                      className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 hover:border-[#0d313f]/40 transition-colors bg-slate-50/50"
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
                {esTerman(pruebaSeleccionada) ? (
                  <div>
                    <div className="flex justify-end w-full mb-4">
                      <div className="w-35 h-15 border-2 border-black bg-white shadow-sm flex items-center justify-center"></div>
                    </div>

                    <h5 className="text-center font-bold text-sm text-[#0d313f] uppercase mb-4 pb-2">
                      Terman - Merrill (Hoja de Respuesta) 
                    </h5>

                    <div className="border-3 border-black mb-6 text-xs text-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-12 border-b-3 border-black divide-y md:divide-y-0 md:divide-x-2 divide-black">
                        <div className="md:col-span-8 p-2.5 flex items-center gap-2">
                          <span className="font-bold uppercase">Nombre completo:</span>
                          <span className="text-slate-900 font-medium">
                            {candidato?.full_name || ""} {candidato?.paternal_surname || ""} {candidato?.maternal_surname || ""}
                          </span>
                        </div>
                        <div className="md:col-span-4 p-2.5 flex items-center gap-2">
                          <span className="font-bold uppercase">Fecha:</span>
                          <span className="text-slate-900 font-medium">
                            {formatearFecha(pruebaSeleccionada.started_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-black">
                        <div className="md:col-span-4 p-2.5 flex items-center gap-2">
                          <span className="font-bold uppercase">Sexo:</span>
                          <span className="text-slate-900 font-medium">
                            {candidato?.sex || "No especificado"}
                          </span>
                        </div>
                        <div className="md:col-span-4 p-2.5 flex items-center gap-2">
                          <span className="font-bold uppercase">Fecha de nacimiento:</span>
                          <span className="text-slate-900 font-medium">
                            {candidato?.Fecha_Nacimiento ? (() => { const [anio, mes, dia] = String(candidato.Fecha_Nacimiento).split("T")[0].split("-"); return `${dia}/${mes}/${anio}`; })() : "No registrada"}
                          </span>
                        </div>
                        <div className="md:col-span-4 p-2.5 flex items-center gap-2">
                          <span className="font-bold uppercase">Edad:</span>
                          <span className="text-slate-900 font-medium">
                            {candidato?.age != null ? `${candidato.age} años` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 10 COLUMNAS */}
                    <div className="mb-6 overflow-x-auto">
                      <div className="grid grid-cols-10 gap-1.5 min-w-[780px] text-center items-start">
                        
                        {/* I-2 (16) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">I-2</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 1, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* II-2 (11) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">II-2</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 2, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* III-2 (30) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">III-2</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 3, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* IV-3 (18) - 3 Subcolumnas */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">IV-3</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 4, num);
                              return (
                                <div key={num} className="grid grid-cols-3 items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5 text-center">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta2}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* V-5 (12) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">V-5</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 5, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* VI-2 (20) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VI-2</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 6, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* VII-2 (20) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VII-2</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 7, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* VIII-3 (17) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VIII-3</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 8, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* IX-3 (18) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">IX-3</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 9, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* X-4 (11) */}
                        <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
                          <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">X-4</div>
                          <div className="p-1 space-y-0.5">
                            {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => {
                              const res = obtenerDatosPreguntaSerie(pruebaSeleccionada, 10, num);
                              return (
                                <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                                  <span className="font-semibold text-slate-500">{num}</span>
                                  <span className="font-bold text-slate-900">{res.respuesta}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* IMAGEN EN LA PARTE INFERIOR DERECHA */}
                    <div className="flex justify-end mt-6">
                      <img
                        src="/images/FDHZ_2025-Color_Vertical.png"
                        alt="Logo institucional"
                        className="w-32 h-auto object-contain"
                      />
                    </div>

                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                      <p>Puntuación obtenida: <strong>{JSON.stringify(pruebaSeleccionada.score_json || 'N/A')}</strong></p>
                    </div>
                  </div>
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