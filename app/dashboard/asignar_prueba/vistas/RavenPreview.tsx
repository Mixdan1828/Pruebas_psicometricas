// app/dashboard/asignar_prueba/vistas/RavenPreview.tsx
import React from 'react';
import Image from 'next/image';
import { Grid } from 'lucide-react';

export default function RavenPreview({ questions }: { questions: any[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Grid size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-900">Test de Matrices Progresivas de Raven</h4>
          <p className="text-[11px] text-indigo-700">Evaluación visual basada en la deducción de relaciones y patrones lógicos.</p>
        </div>
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-100 pb-2">
            <span>Matriz / Serie {q.content_jsonb?.serie || 'A'} - Reactivo {index + 1}</span>
            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold">
              Raven
            </span>
          </div>

          <p className="text-xs font-bold text-[#123440]">
            {index + 1}. {q.content_jsonb?.pregunta || 'Selecciona la figura que completa la matriz correctamente:'}
          </p>

          {/* Imagen Principal de la Matriz */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Matriz Principal</span>
            {q.content_jsonb?.imagen_principal ? (
              <div className="relative w-full max-w-[240px] h-36">
                <Image 
                  src={q.content_jsonb.imagen_principal} 
                  alt="Matriz Raven" 
                  fill 
                  className="object-contain rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-400">Sin imagen principal cargada</span>
            )}
          </div>

          {/* Opciones de Respuesta Visuales */}
          {q.content_jsonb?.opciones && (
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opciones de respuesta:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {q.content_jsonb.opciones.map((op: any, i: number) => {
                  const opcionId = op.opcion || op.letra || String(i + 1);
                  const textoOpcion = op.texto || op.text || '';

                  return (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 mb-1">{opcionId}</span>
                      {textoOpcion.startsWith('http') ? (
                        <div className="relative w-full h-16 bg-white rounded border border-slate-200">
                          <Image 
                            src={textoOpcion} 
                            alt={`Opción ${opcionId}`} 
                            fill 
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-[#123440]">{textoOpcion}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}