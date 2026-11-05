// app/dashboard/asignar_prueba/vistas/Nom035Preview.tsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Nom035Preview({ questions }: { questions: any[] }) {
  return (
    <div className="space-y-4">

      {questions.map((q, index) => (
        <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-100 pb-2">
            <span>Dimensión / Sección {q.content_jsonb?.seccion || index + 1}</span>
            <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold">
              NOM-035
            </span>
          </div>

          <p className="text-xs font-bold text-[#123440]">
            {index + 1}. {q.content_jsonb?.pregunta || q.content_jsonb?.text || q.content_jsonb?.pregunta_texto || 'Pregunta de la NOM-035'}
          </p>

          {/* Opciones de respuesta típicas de la NOM-035 (Escala Likert o Sí/No) */}
          {q.content_jsonb?.opciones ? (
            <ul className="space-y-1.5 pl-2">
              {q.content_jsonb.opciones.map((op: any, i: number) => (
                <li key={i} className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-bold text-[#123440]">{op.letra || op.key || i + 1})</span>
                  <span>{op.texto || op.text || op}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-[11px] font-bold text-slate-600">Siempre</div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-[11px] font-bold text-slate-600">Casi siempre</div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-[11px] font-bold text-slate-600">Algunas veces</div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-center text-[11px] font-bold text-slate-600">Nunca</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}