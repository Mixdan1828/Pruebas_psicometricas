"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Nom035IntegralViewProps {
  testData: any;
  onComplete: (answers: Record<string, any>) => void;
}

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE GRUPOS DE PREGUNTAS POR SECCIÓN
// ---------------------------------------------------------------------------
interface GroupConfig {
  id: string;
  start: number;
  end: number;
  title: string;
  isConditionalGate?: boolean; // Indica si es una pregunta filtro (ej: 61, 65, 133, 138)
}

interface SectionConfig {
  id: number;
  title: string;
  subtitle: string;
  instruction: string;
  groups: GroupConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: 1,
    title: "Sección 1",
    subtitle: "Cuestionario para identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.",
    instruction: "Marque la respuesta que se le indica.",
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
    instruction: "Lea atentamente y seleccione una respuesta por cada afirmación.",
    groups: [
      { id: '2-1', start: 21, end: 29, title: "Para responder las siguientes preguntas considere las condiciones de su trabajo, así como la cantidad y ritmo de trabajo." },
      { id: '2-2', start: 30, end: 33, title: "Las preguntas siguientes están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene." },
      { id: '2-3', start: 34, end: 37, title: "Las siguientes preguntas están relacionadas con el tiempo destinado a su trabajo y sus responsabilidades familiares." },
      { id: '2-4', start: 38, end: 42, title: "Las siguientes preguntas están relacionadas con las decisiones que puede tomar en su trabajo." },
      { id: '2-5', start: 43, end: 47, title: "Las siguientes preguntas están relacionadas con la capacitación e información que recibe sobre su trabajo." },
      { id: '2-6', start: 48, end: 60, title: "Las siguientes preguntas se refieren a las relaciones con sus compañeros de trabajo y su jefe." },
      { id: '2-7', start: 61, end: 61, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios.", isConditionalGate: true },
      { id: '2-8', start: 62, end: 64, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
      { id: '2-9', start: 65, end: 65, title: "La siguiente pregunta está relacionada con las actitudes de los trabajadores que supervisa.", isConditionalGate: true },
      { id: '2-10', start: 66, end: 68, title: "Las siguientes preguntas están relacionadas con las actitudes de los trabajadores que supervisa." },
    ]
  },
  {
    id: 3,
    title: "Sección 3",
    subtitle: "Cuestionario para identificar los factores de riesgo psicosocial y evaluar el entorno organizacional en los centros de trabajo.",
    instruction: "Seleccione la opción que mejor represente su situación laboral.",
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
      { id: '3-11', start: 115, end: 124, title: "Las siguientes preguntas están relacionadas con la información que recibe sobre su rendimiento en el trabajo, el reconocimiento, el sentido de pertenencia y estabilidad que le ofrece su trabajo." },
      { id: '3-12', start: 125, end: 132, title: "Las siguientes preguntas están relacionadas con actos de violencia laboral (malos tratos, acoso, hostigamiento, acoso psicológico)." },
      { id: '3-13', start: 133, end: 133, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios.", isConditionalGate: true },
      { id: '3-14', start: 134, end: 137, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
      { id: '3-15', start: 138, end: 138, title: "La siguiente pregunta está relacionada con los trabajadores que supervisa.", isConditionalGate: true },
      { id: '3-16', start: 139, end: 142, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
    ]
  }
];

export default function Nom035IntegralView({ testData, onComplete }: Nom035IntegralViewProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const hasCompletedRef = useRef(false);

  const userAnswersRef = useRef(userAnswers);
  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Parsear y mapear las preguntas de la BD ordenadas por order_index
  const allQuestionsMap = useMemo(() => {
    const rawQuestions = testData?.test_questions || [];
    const map = new Map<number, any>();

    rawQuestions.forEach((q: any, index: number) => {
      let parsedContent = q.content_jsonb;
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch {
          parsedContent = {};
        }
      }
      const orderIdx = Number(q.order_index) || (index + 1);
      map.set(orderIdx, {
        ...q,
        order_index: orderIdx,
        content_jsonb: parsedContent || {}
      });
    });

    return map;
  }, [testData?.test_questions]);

  // Finalizar el test
  const finishTest = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    Promise.resolve(onCompleteRef.current(userAnswersRef.current))
      .catch(() => {
        hasCompletedRef.current = false;
      });
  }, []);

  const handleSelectAnswer = (questionId: string, answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Helper para normalizar respuestas de opción (por ejemplo "si" / "no" / "Sí" / "No")
  const getSelectedValue = (questionId: string) => {
    return userAnswers[questionId];
  };

  const isYesAnswer = (ans: any) => {
    if (!ans) return false;
    const str = String(ans).trim().toLowerCase();
    return str === 'si' || str === 'sí';
  };

  const currentSection = SECTIONS[currentSectionIndex];

  // Determinar qué grupos deben mostrarse según las respuestas condicionales
  const visibleGroups = useMemo(() => {
    const groups: GroupConfig[] = [];

    for (const group of currentSection.groups) {
      // Reglas condicionales de la Sección 2
      if (group.id === '2-8') {
        // Preguntas 62-64: Solo si en la 61 respondió "Sí"
        const q61 = allQuestionsMap.get(61);
        if (!q61 || !isYesAnswer(getSelectedValue(q61.id))) continue;
      }
      if (group.id === '2-10') {
        // Preguntas 66-68: Solo si en la 65 respondió "Sí"
        const q65 = allQuestionsMap.get(65);
        if (!q65 || !isYesAnswer(getSelectedValue(q65.id))) continue;
      }

      // Reglas condicionales de la Sección 3
      if (group.id === '3-14') {
        // Preguntas 134-137: Solo si en la 133 respondió "Sí"
        const q133 = allQuestionsMap.get(133);
        if (!q133 || !isYesAnswer(getSelectedValue(q133.id))) continue;
      }
      if (group.id === '3-16') {
        // Preguntas 139-142: Solo si en la 138 respondió "Sí"
        const q138 = allQuestionsMap.get(138);
        if (!q138 || !isYesAnswer(getSelectedValue(q138.id))) continue;
      }

      groups.push(group);
    }

    return groups;
  }, [currentSection, allQuestionsMap, userAnswers]);

  // Cambios de sección
  const handleNextSection = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishTest();
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F9F9F7] text-slate-800 min-h-screen flex flex-col font-body pb-12">
      {/* HEADER FIXO */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm py-3 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="font-headline font-bold text-slate-900 text-base md:text-lg truncate">
            {testData?.name || "NOM-035 Integral"}
          </h1>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
            {currentSection.title} de 3
          </span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 mt-6 space-y-6">
        {/* TARJETA DE ENCABEZADO Y NAVEGACIÓN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="text-center">
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl text-slate-900 mb-1">
              {currentSection.title}
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base max-w-2xl mx-auto">
              {currentSection.subtitle}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
            <span className="font-bold">Indicación:</span> {currentSection.instruction}
          </div>

          {/* BARRA NAVEGACIÓN SUPERIOR */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrevSection}
              disabled={currentSectionIndex === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm ${
                currentSectionIndex === 0 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span className="uppercase tracking-wider hidden sm:inline">Sección Anterior</span>
            </button>

            {currentSectionIndex < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="flex items-center gap-2 bg-[#BEEE89] text-[#001E28] hover:bg-[#a8e070] font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider">Siguiente Sección</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishTest}
                className="flex items-center gap-2 bg-[#416912] text-white hover:bg-green-700 font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider">Finalizar Cuestionario</span>
                <CheckCircle size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* TABLAS POR CADA GRUPO DE PREGUNTAS DE LA SECCIÓN */}
        {visibleGroups.map((group) => {
          // Obtener las preguntas del mapa que están dentro del rango de este grupo
          const groupQuestions: any[] = [];
          for (let i = group.start; i <= group.end; i++) {
            if (allQuestionsMap.has(i)) {
              groupQuestions.push(allQuestionsMap.get(i));
            }
          }

          if (groupQuestions.length === 0) return null;

          // Obtener las opciones del primer elemento (ej. de 5 opciones o de 2 "Sí"/"No")
          const firstContent = groupQuestions[0]?.content_jsonb || {};
          const headerOptions: string[] = firstContent.options || ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];

          return (
            <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* TÍTULO / INDICACIÓN DE LA TABLA */}
              <div className="bg-slate-800 text-white p-4 font-bold text-sm md:text-base">
                {group.title}
              </div>

              {/* TABLA EN FORMATO DESKTOP / RESPONSIVE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <th className="p-3 w-16 text-center">N°</th>
                      <th className="p-3 min-w-[280px]">Pregunta</th>
                      {headerOptions.map((opt, idx) => (
                        <th key={idx} className="p-3 text-center min-w-[100px]">
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
                      const selectedVal = userAnswers[q.id];

                      return (
                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-center text-slate-500">
                            {qNum}
                          </td>
                          <td className="p-3 font-medium text-slate-900 leading-snug">
                            {textPregunta}
                          </td>
                          {optionsList.map((opt, optIdx) => {
                            const isSelected = selectedVal === opt;

                            return (
                              <td key={optIdx} className="p-3 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-2 w-full h-full">
                                  <input
                                    type="radio"
                                    name={`question_${q.id}`}
                                    value={opt}
                                    checked={isSelected}
                                    onChange={() => handleSelectAnswer(q.id, opt)}
                                    className="w-5 h-5 text-[#416912] border-slate-300 focus:ring-[#416912] cursor-pointer"
                                  />
                                </label>
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

        {/* NAVEGACIÓN INFERIOR DE PIE DE PÁGINA */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSectionIndex === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all text-sm ${
              currentSectionIndex === 0 ? 'opacity-30 cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-wider">Sección Anterior</span>
          </button>

          {currentSectionIndex < SECTIONS.length - 1 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="flex items-center gap-2 bg-[#BEEE89] text-[#001E28] hover:bg-[#a8e070] font-bold rounded-xl px-6 py-3 transition-all shadow-md text-sm"
            >
              <span className="uppercase tracking-wider">Siguiente Sección</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishTest}
              className="flex items-center gap-2 bg-[#416912] text-white hover:bg-green-700 font-bold rounded-xl px-6 py-3 transition-all shadow-md text-sm"
            >
              <span className="uppercase tracking-wider">Finalizar Cuestionario</span>
              <CheckCircle size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}