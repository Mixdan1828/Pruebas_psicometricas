// app/dashboard/asignar_prueba/vistas/TermanPreview.tsx
import React from 'react';

export default function TermanPreview({ questions }: { questions: any[] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, index) => {
        const tipo = q.content_jsonb?.tipo_pregunta;

        // Caso: Ordenar oración y V/F
        if (tipo === 'ordenar_oracion_vf') {
          return (
            <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-100 pb-2">
                <span>Serie {q.content_jsonb?.serie}</span>
                <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                  Ordenar y V/F
                </span>
              </div>
              <p className="text-xs font-bold text-[#123440]">
                {index + 1}. Ordena las palabras para formar una oración correcta e indica si es Verdadera o Falsa.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Oración desordenada</span>
                <span className="text-xs font-mono font-bold text-[#123440] bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                  {q.content_jsonb?.oracion_desordenada}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-xs font-bold text-slate-600">Verdadero</div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-xs font-bold text-slate-600">Falso</div>
              </div>
            </div>
          );
        }

        // Caso: Secuencia numérica
        if (tipo === 'secuencia_numerica') {
          return (
            <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-100 pb-2">
                <span>Serie {q.content_jsonb?.serie}</span>
                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                  Secuencia Numérica
                </span>
              </div>
              <p className="text-xs font-bold text-[#123440]">
                {index + 1}. Continúa la secuencia numérica completando los espacios faltantes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {q.content_jsonb?.secuencia?.map((num: string, i: number) => (
                  <span key={i} className="bg-white text-[#123440] font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200">
                    {num}
                  </span>
                ))}
                {Array.from({ length: q.content_jsonb?.espacios_faltantes || 0 }).map((_, i) => (
                  <span key={`empty-${i}`} className="bg-blue-50 text-blue-600 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-dashed border-blue-300">
                    ?
                  </span>
                ))}
              </div>
            </div>
          );
        }

        // Caso: Igual o Opuesto
        if (tipo === 'igual_opuesto') {
          return (
            <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-100 pb-2">
                <span>Serie {q.content_jsonb?.serie}</span>
                <span className="bg-[#9DBA3A]/20 text-[#69943A] px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                  Igual o Opuesto
                </span>
              </div>
              <p className="text-xs font-bold text-[#123440]">
                {index + 1}. {q.content_jsonb?.pregunta}
              </p>
              <div className="flex items-center justify-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex-1 bg-white py-2 px-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Palabra 1</span>
                  <span className="text-xs font-bold text-[#123440]">{q.content_jsonb?.palabra_1}</span>
                </div>
                <div className="text-slate-400 font-bold text-xs px-1">VS</div>
                <div className="flex-1 bg-white py-2 px-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Palabra 2</span>
                  <span className="text-xs font-bold text-[#123440]">{q.content_jsonb?.palabra_2}</span>
                </div>
              </div>
            </div>
          );
        }

        // Caso por defecto (Opción múltiple / Texto general)
        return (
          <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
            <p className="text-xs font-bold text-[#123440]">
              {index + 1}. {q.content_jsonb?.pregunta || q.content_jsonb?.text || q.content_jsonb?.pregunta_texto || 'Pregunta sin texto'}
            </p>
            {q.content_jsonb?.opciones && (
              <ul className="space-y-1.5 pl-2">
                {q.content_jsonb.opciones.map((op: any, i: number) => (
                  <li key={i} className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-bold text-[#123440]">{op.letra || op.key || i + 1})</span>
                    <span>{op.texto || op.text || op}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}