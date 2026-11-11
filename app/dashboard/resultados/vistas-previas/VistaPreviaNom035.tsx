// app/dashboard/resultados/vistas-previas/VistaPreviaNom035.tsx
"use client";

import React, { useMemo } from 'react';

interface VistaPreviaNom035Props {
  candidato?: any;
  prueba?: any;
  resultado?: any;
  testData?: any;
  candidateAnswers?: Record<string, any>;
  formatearFecha?: (fecha: string | null | undefined) => string;
}

const SECTIONS = [
  {
    id: 1,
    title: "Sección 1",
    subtitle: "Cuestionario para identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.",
    groups: [
      { id: '1-1', start: 1, end: 6, title: "1. Acontecimiento traumático severo" },
      { id: '1-2', start: 7, end: 8, title: "2. Recuerdos persistentes sobre el acontecimiento (durante los últimos meses)" },
      { id: '1-3', start: 9, end: 15, title: "3. Esfuerzo para evitar circunstancias parecidas o asociadas al acontecimiento (durante el último mes)" },
      { id: '1-4', start: 16, end: 20, title: "4. Afectación (durante el último mes)" },
    ]
  },
  {
    id: 2,
    title: "Sección 2",
    subtitle: "Cuestionario para identificar los factores de riesgo psicosocial en los centros de trabajo.",
    groups: [
      { id: '2-1', start: 21, end: 29, title: "Para responder las siguientes preguntas considere las condiciones de su trabajo, así como la cantidad y ritmo de trabajo." },
      { id: '2-2', start: 30, end: 33, title: "Las preguntas siguientes están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene." },
      { id: '2-3', start: 34, end: 37, title: "Las siguientes preguntas están relacionadas con el tiempo destinado a su trabajo y sus responsabilidades familiares." },
      { id: '2-4', start: 38, end: 42, title: "Las siguientes preguntas están relacionadas con las decisiones que puede tomar en su trabajo." },
      { id: '2-5', start: 43, end: 47, title: "Las siguientes preguntas están relacionadas con la capacitación e información que recibe sobre su trabajo." },
      { id: '2-6', start: 48, end: 60, title: "Las siguientes preguntas se refieren a las relaciones con sus compañeros de trabajo y su jefe." },
      { id: '2-7', start: 61, end: 61, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios." },
      { id: '2-8', start: 62, end: 64, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
      { id: '2-9', start: 65, end: 65, title: "La siguiente pregunta está relacionada con las actitudes de los trabajadores que supervisa." },
      { id: '2-10', start: 66, end: 68, title: "Las siguientes preguntas están relacionadas con las actitudes de los trabajadores que supervisa." },
    ]
  },
  {
    id: 3,
    title: "Sección 3",
    subtitle: "Cuestionario para identificar los factores de riesgo psicosocial y evaluar el entorno organizacional en los centros de trabajo.",
    groups: [
      { id: '3-1', start: 69, end: 73, title: "Para responder las siguientes preguntas considere las condiciones ambientales de su centro de trabajo." },
      { id: '3-2', start: 74, end: 76, title: "Para responder las siguientes preguntas piense en la cantidad y ritmo de trabajo que tiene." },
      { id: '3-3', start: 77, end: 80, title: "Las siguientes preguntas están relacionadas con el esfuerzo mental que exige su trabajo." },
      { id: '3-4', start: 81, end: 84, title: "Las siguientes preguntas están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene." },
      { id: '3-5', start: 85, end: 90, title: "Las siguientes preguntas están relacionadas con su jornada de trabajo." },
      { id: '3-6', start: 91, end: 96, title: "Las siguientes preguntas están relacionadas con las decisiones que puede tomar en su trabajo." },
      { id: '3-7', start: 97, end: 98, title: "Las siguientes preguntas están relacionadas con cualquier tipo de cambio que ocurra en su trabajo (considere los últimos cambios realizados)." },
      { id: '3-8', start: 99, end: 104, title: "Las siguientes preguntas están relacionadas con la capacitación e información que se le proporciona sobre su trabajo." },
      { id: '3-9', start: 105, end: 109, title: "Las siguientes preguntas están relacionadas con el o los jefes con quien tiene contacto." },
      { id: '3-10', start: 110, end: 114, title: "Las siguientes preguntas se refieren a las relaciones con sus compañeros." },
      { id: '3-11', start: 115, end: 125, title: "Las siguientes preguntas están relacionadas con la información que recibe sobre su rendimiento en el trabajo, el reconocimiento, el sentido de pertenencia y estabilidad que le ofrece su trabajo." },
      { id: '3-12', start: 126, end: 133, title: "Las siguientes preguntas están relacionadas con actos de violencia laboral (malos tratos, acoso, hostigamiento, acoso psicológico)." },
      { id: '3-13', start: 134, end: 134, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios." },
      { id: '3-14', start: 135, end: 138, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
      { id: '3-15', start: 139, end: 139, title: "La siguiente pregunta está relacionada con los trabajadores que supervisa." },
      { id: '3-16', start: 140, end: 143, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
    ]
  }
];

export default function VistaPreviaNom035({
  candidato: candidatoProp,
  prueba: pruebaProp,
  resultado: resultadoProp,
  testData: testDataProp,
  candidateAnswers: candidateAnswersProp,
  formatearFecha,
}: VistaPreviaNom035Props) {

  const prueba = pruebaProp || resultadoProp || {};
  const candidato = candidatoProp || prueba?.candidate || prueba?.candidates || {};
  const testData = testDataProp || prueba?.tests || prueba;
  
  const candidateAnswers = candidateAnswersProp || prueba?.answers_json || prueba?.answers || {};
  const fechaApp = prueba?.started_at || prueba?.completed_at;

  const allQuestionsMap = useMemo(() => {
    const rawQuestions = testData?.test_questions || [];
    const map = new Map<number, any>();

    rawQuestions.forEach((q: any, index: number) => {
      let parsedContent = q.content_jsonb;
      if (typeof parsedContent === 'string') {
        try { parsedContent = JSON.parse(parsedContent); } catch { parsedContent = {}; }
      }
      const orderIdx = Number(q.order_index) || (index + 1);
      map.set(orderIdx, { ...q, order_index: orderIdx, content_jsonb: parsedContent || {} });
    });

    return map;
  }, [testData?.test_questions]);

  return (
    <div className="space-y-6 text-slate-800 bg-white p-4">
      
      {/* 1. ENCABEZADO: LOGO (1.5cm) + LÍNEA VERDE (#416912) */}
      <div className="flex items-center gap-4 w-full">
        <img
          src="/images/miLogo.png"
          alt="Logo Institucional"
          style={{ height: '2.5cm' }}
          className="w-auto object-contain shrink-0"
        />
        <div 
          style={{ height: '1cm' }}
          className="w-full bg-[#416912] rounded shadow-sm flex-1" 
        />
      </div>

      {/* 2. TÍTULO ABAJO Y CENTRADO */}
      <div className="text-center py-1">
        <h5 className="font-bold text-base md:text-lg text-[#0d313f] uppercase tracking-wide">
          {testData?.name || "NOM-035 Integral - Hoja de Respuesta"}
        </h5>
      </div>

      {/* 3. DATOS DEL CANDIDATO */}
      <div className="border-2 border-black mb-6 text-xs text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-black divide-y md:divide-y-0 md:divide-x-2 divide-black">
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
                    const [anio, mes, dia] = String(candidato.Fecha_Nacimiento).split("T")[0].split("-");
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

      {/* 4. SECCIONES Y TABLAS DE PREGUNTAS */}
      {SECTIONS.map((sec) => (
        <div key={sec.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-[#416912] uppercase tracking-wider">{sec.title}</span>
            <h3 className="text-lg font-headline font-bold text-slate-900 mt-1">{sec.subtitle}</h3>
          </div>

          <div className="space-y-6">
            {sec.groups.map((group) => {
              const groupQuestions: any[] = [];
              for (let i = group.start; i <= group.end; i++) {
                if (allQuestionsMap.has(i)) {
                  groupQuestions.push(allQuestionsMap.get(i));
                }
              }
              if (groupQuestions.length === 0) return null;

              const firstContent = groupQuestions[0]?.content_jsonb || {};
              const headerOptions: string[] = firstContent.options || ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];

              return (
                <div key={group.id} className="space-y-3">
                  <h4 className="font-headline font-bold text-sm md:text-base text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border-l-4 border-[#416912]">
                    {group.title}
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <th className="p-3 w-16 text-center">N°</th>
                          <th className="p-3 min-w-[280px]">Pregunta</th>
                          {headerOptions.map((opt, idx) => (
                            <th key={idx} className="p-3 text-center min-w-[90px] text-[11px]">
                              {opt}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {groupQuestions.map((q) => {
                          const qNum = q.order_index;
                          const content = q.content_jsonb || {};
                          const textPregunta = content.pregunta || content.text || `Pregunta ${qNum}`;
                          const optionsList: string[] = content.options || headerOptions;
                          
                          const rawAnswer = candidateAnswers[q.id] || "";

                          return (
                            <tr key={q.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-center text-slate-500">{qNum}</td>
                              <td className="p-3 font-medium text-slate-900 leading-snug">{textPregunta}</td>
                              {optionsList.map((opt, optIdx) => {
                                const normCandidate = String(rawAnswer).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const normOpt = String(opt).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const isChecked = normCandidate === normOpt;

                                return (
                                  <td key={optIdx} className="p-3 text-center">
                                    {isChecked ? (
                                      <span className="text-emerald-700 font-extrabold text-base select-none">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 select-none">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}