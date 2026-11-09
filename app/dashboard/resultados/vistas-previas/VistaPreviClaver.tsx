// app/dashboard/resultados/vistas-previas/VistaPreviaClaver.tsx
import React from "react";

interface VistaPreviaCleaverProps {
  candidato: any;
  prueba: any;
  formatearFecha: (fecha: string | null | undefined) => string;
}

export function VistaPreviaClaver({
  candidato,
  prueba,
  formatearFecha,
}: VistaPreviaCleaverProps) {
  // 1. Obtener las preguntas del test (para buscar su content_jsonb por ID)
  const testObj = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
  const testQuestions = testObj?.test_questions || [];

  // Crear un mapa rápido por ID de pregunta para búsqueda inmediata O(1)
  const preguntasMap = new Map();
  testQuestions.forEach((q: any) => {
    preguntasMap.set(q.id, q);
  });

  // 2. Obtener las respuestas registradas en candidates_results (answers_json)
  const respuestasJson = (prueba?.answers_json || {}) as Record<
    string,
    { mas?: string; menos?: string }
  >;

  // 3. Convertir a array y ordenar estrictamente por el campo "grupo"
  const bloquesEntradas = Object.entries(respuestasJson).sort(([idA], [idB]) => {
    const pregA = preguntasMap.get(idA);
    const pregB = preguntasMap.get(idB);
    
    const jsonA = pregA ? (typeof pregA.content_jsonb === "string" ? JSON.parse(pregA.content_jsonb || "{}") : pregA.content_jsonb || {}) : {};
    const jsonB = pregB ? (typeof pregB.content_jsonb === "string" ? JSON.parse(pregB.content_jsonb || "{}") : pregB.content_jsonb || {}) : {};

    const grupoA = Number(jsonA.grupo) || 0;
    const grupoB = Number(jsonB.grupo) || 0;

    return grupoA - grupoB;
  });

  return (
    <div>
      

      <h5 className="text-center font-bold text-sm text-[#0d313f] uppercase mb-4 pb-2">
        Test Cleaver - Hoja de Respuesta
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
              {formatearFecha(prueba.started_at || prueba.completed_at)}
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

      {/* Contenedor de los bloques organizados */}
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h6 className="font-bold text-xs text-slate-600 uppercase">
            Detalle de Reactivos Seleccionados
          </h6>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border">
            Total de bloques: {bloquesEntradas.length}
          </span>
        </div>

        {/* Listado de tablas (2 columnas en pantallas medianas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
          {bloquesEntradas.map(([idBloque, seleccion], idx) => {
            const preguntaEncontrada = preguntasMap.get(idBloque);
            
            const contenidoJson = preguntaEncontrada
              ? typeof preguntaEncontrada.content_jsonb === "string"
                ? JSON.parse(preguntaEncontrada.content_jsonb || "{}")
                : preguntaEncontrada.content_jsonb || {}
              : {};

            const palabrasBloque: string[] = contenidoJson.palabras || [];
            const grupoBloque = contenidoJson.grupo || (idx + 1);

            const palabraMas = seleccion?.mas;
            const palabraMenos = seleccion?.menos;

            return (
              <div
                key={idBloque}
                className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-sm mb-4"
              >
                {/* Cabecera del bloque */}
                <div className="bg-slate-200 text-slate-900 font-bold px-3 py-1.5 text-xs border-b-2 border-black flex justify-between items-center">
                  <span>BLOQUE {grupoBloque}</span>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black font-bold text-slate-800">
                      <th className="py-2 px-3 border-r border-black w-3/5">
                        Palabras
                      </th>
                      <th className="py-2 px-2 border-r border-black text-center w-1/5 text-emerald-700">
                        +
                      </th>
                      <th className="py-2 px-2 text-center w-1/5 text-rose-700">
                        -
                      </th>
                    </tr>
                    <tr className="bg-slate-100 border-b-2 border-black">
                      
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {palabrasBloque.map((palabra: string, pIdx: number) => {
                      const esMas =
                        palabra.trim().toLowerCase() ===
                        String(palabraMas || "").trim().toLowerCase();
                      const esMenos =
                        palabra.trim().toLowerCase() ===
                        String(palabraMenos || "").trim().toLowerCase();

                      return (
                        <tr
                          key={pIdx}
                          className={`hover:bg-slate-50 ${
                            esMas
                              ? "bg-emerald-50/60 font-semibold"
                              : esMenos
                              ? "bg-rose-50/60 font-semibold"
                              : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 border-r border-slate-300 text-slate-800">
                            {palabra}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-300 text-center text-emerald-700 font-bold text-base">
                            {esMas ? "+" : ""}
                          </td>
                          <td className="py-2.5 px-2 text-center text-rose-700 font-bold text-base">
                            {esMenos ? "-" : ""}
                          </td>
                        </tr>
                      );
                    })}

                    {palabrasBloque.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-slate-400 text-xs italic"
                        >
                          No se encontraron palabras para este bloque.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
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