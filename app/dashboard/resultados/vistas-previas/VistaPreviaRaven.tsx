// app/dashboard/resultados/vistas-previas/VistaPreviaRaven.tsx
import React from 'react';

interface VistaPreviaRavenProps {
  candidato?: any;
  prueba?: any;
  resultado?: any;
  formatearFecha?: (fecha: string | null | undefined) => string;
}

export default function VistaPreviaRaven({
  candidato: candidatoProp,
  prueba: pruebaProp,
  resultado: resultadoProp,
  formatearFecha,
}: VistaPreviaRavenProps) {
  const prueba = pruebaProp || resultadoProp || {};
  const candidato = candidatoProp || prueba?.candidate || prueba?.candidates || {};

  const respuestas = prueba?.answers_json || [];
  const fechaApp = prueba?.started_at || prueba?.completed_at;

  const respuestasSerieA = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'A');
  const respuestasSerieAB = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'AB');
  const respuestasSerieB = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'B');

  // Renderizado de cada columna de serie de forma compacta y continua
  const renderColumnaSerie = (titulo: string, items: any[]) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      <div className="bg-[#123440] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-center">
        Serie {titulo} <span className="text-[10px] font-normal opacity-80"></span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">Sin registros</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold sticky top-0">
                <th className="py-2 px-3">Reactivo</th>
                <th className="py-2 px-3 text-center">Opción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-1.5 px-3 font-semibold text-slate-700">
                    {r.order_index ?? (idx + 1)}
                  </td>
                  <td className="py-1.5 px-3 text-center font-bold text-[#123440]">
                    <span className="inline-block bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-100">
                      {r.respuesta_seleccionada ?? 'N/D'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Título de la Hoja de Respuesta */}
      <h5 className="text-center font-bold text-sm text-[#0d313f] uppercase mb-4 pb-2">
        Test Raven - Hoja de Respuesta
      </h5>

      {/* Encabezado formal de datos del candidato */}
      <div className="border-3 border-black mb-6 text-xs text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-3 border-black divide-y md:divide-y-0 md:divide-x-2 divide-black">
          <div className="md:col-span-8 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Nombre completo:</span>
            <span className="text-slate-900 font-medium">
              {candidato?.full_name || ""} {candidato?.paternal_surname || ""}{" "}
              {candidato?.maternal_surname || ""}
            </span>
          </div>
          <div className="md:col-span-4 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Fecha:</span>
            <span className="text-slate-900 font-medium">
              {formatearFecha ? formatearFecha(fechaApp) : (fechaApp || "No registrada")}
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
              {candidato?.Fecha_Nacimiento
                ? (() => {
                    const [anio, mes, dia] = String(
                      candidato.Fecha_Nacimiento
                    )
                      .split("T")[0]
                      .split("-");
                    return `${dia}/${mes}/${anio}`;
                  })()
                : "No registrada"}
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

      {/* Las 3 Series Distribuidas en 3 columnas continuas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderColumnaSerie("A", respuestasSerieA)}
        {renderColumnaSerie("AB", respuestasSerieAB)}
        {renderColumnaSerie("B", respuestasSerieB)}
      </div>

      {/* Logotipo institucional en la parte inferior derecha */}
      <div className="flex justify-end mt-6">
        <img
          src="/images/FDHZ_2025-Color_Vertical.png"
          alt="Logo institucional"
          className="w-32 h-auto object-contain"
        />
      </div>
    </div>
  );
}