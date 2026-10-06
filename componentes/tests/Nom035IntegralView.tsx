"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Timer, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Nom035IntegralViewProps {
  testData: any;
  onComplete: (answers: Record<string, any>) => void;
}

/**
 * Guías que componen el test unificado NOM-035.
 * La Guía I usa respuesta dicotómica (Sí/No) y las Guías II y III una
 * escala de frecuencia de 5 puntos.
 */
const GUIAS = [
  {
    key: 'I',
    titulo: 'Guía I: Acontecimientos Traumáticos Severos (ATS)',
    descripcion:
      'Responda Sí o No según haya vivido o presenciado los acontecimientos descritos durante o después de su vida laboral.',
    tipo: 'si_no',
  },
  {
    key: 'II',
    titulo: 'Guía II: Factores de Riesgo Psicosocial',
    descripcion:
      'Indique con qué frecuencia se presentan en su trabajo las situaciones que se describen. Marque una sola opción.',
    tipo: 'frecuencia',
  },
  {
    key: 'III',
    titulo: 'Guía III: Entorno Organizacional',
    descripcion:
      'Indique con qué frecuencia se presentan las condiciones de su entorno organizacional. Marque una sola opción.',
    tipo: 'frecuencia',
  },
];

/** Rango por defecto de preguntas por guía (Guías I, II y III suman 137 ítems). */
const RANGOS_GUIAS: { guia: string; inicio: number; fin: number }[] = [
  { guia: 'I', inicio: 1, fin: 15 },
  { guia: 'II', inicio: 16, fin: 87 },
  { guia: 'III', inicio: 88, fin: 137 },
];

/** Escala de frecuencia de 5 puntos para las Guías II y III. */
const ESCALA_FRECUENCIA = [
  { valor: 1, etiqueta: 'Nunca' },
  { valor: 2, etiqueta: 'Casi nunca' },
  { valor: 3, etiqueta: 'Algunas veces' },
  { valor: 4, etiqueta: 'Casi siempre' },
  { valor: 5, etiqueta: 'Siempre' },
];

const OPCIONES_SI_NO = ['Sí', 'No'];

export default function Nom035IntegralView({ testData, onComplete }: Nom035IntegralViewProps) {
  // Pregunta actual (índice base 0)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  // Duración por defecto: 60 minutos
  const [timeLeft, setTimeLeft] = useState(
    () => (Number(testData?.tiempo) || 60) * 60
  );

  const userAnswersRef = useRef(userAnswers);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Parseo y orden de preguntas según content_jsonb
  const allQuestions = useMemo(() => {
    const raw = testData?.test_questions || [];
    return raw
      .map((q: any, index: number) => {
        let parsed = q.content_jsonb;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            parsed = {};
          }
        }
        return {
          ...q,
          order_index: Number(q.order_index) || index + 1,
          content_jsonb: parsed || {},
        };
      })
      .sort((a: any, b: any) => a.order_index - b.order_index);
  }, [testData?.test_questions]);

  const totalItems = allQuestions.length;

  // Determina la guía de una pregunta (lectura desde metadatos o por rango)
  const getGuiaDePregunta = useCallback((q: any): (typeof GUIAS)[number] => {
    const content = q.content_jsonb || {};
    const clave = String(
      content.guia || content.guide || content.seccion || content.section || ''
    ).toLowerCase().trim();

    if (clave === 'i' || clave === '1' || clave.includes('guía i') || clave.includes('guia i') || clave.includes('ats')) {
      return GUIAS[0];
    }
    if (clave === 'ii' || clave === '2' || clave.includes('guía ii') || clave.includes('guia ii') || clave.includes('factores')) {
      return GUIAS[1];
    }
    if (clave === 'iii' || clave === '3' || clave.includes('guía iii') || clave.includes('guia iii') || clave.includes('entorno')) {
      return GUIAS[2];
    }

    // Fallback por rango de orden
    const num = Number(q.order_index) || 0;
    const rango = RANGOS_GUIAS.find((r) => num >= r.inicio && num <= r.fin);
    if (rango) {
      return GUIAS.find((g) => g.key === rango.guia) || GUIAS[0];
    }
    return GUIAS[0];
  }, []);

  const currentQuestion = allQuestions[currentIndex];
  const currentGuia = currentQuestion ? getGuiaDePregunta(currentQuestion) : GUIAS[0];

  const answeredCount = useMemo(
    () => allQuestions.filter((q: any) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== '').length,
    [allQuestions, userAnswers]
  );

  const progressPercent = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0;

  // Finaliza la prueba de forma centralizada
  const finishTest = useCallback(
    (isTimeout = false) => {
      if (hasCompletedRef.current) return;

      const answers = userAnswersRef.current;
      const unanswered = totalItems - Object.keys(answers).length;

      if (!isTimeout && unanswered > 0) {
        const confirmar = window.confirm(
          `Tiene ${unanswered} pregunta(s) sin responder. ¿Está seguro de que desea finalizar la evaluación?`
        );
        if (!confirmar) return;
      }

      hasCompletedRef.current = true;
      // Si el guardado falla (resolver), se rehabilita para permitir reintento
      Promise.resolve(onCompleteRef.current(answers)).catch(() => {
        hasCompletedRef.current = false;
      });
    },
    [totalItems]
  );

  // Temporizador de 60 minutos
  useEffect(() => {
    if (hasCompletedRef.current || timeLeft <= 0) return;
    const timeout = setTimeout(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  // Auto-envío al agotarse el tiempo
  useEffect(() => {
    if (timeLeft === 0 && totalItems > 0) {
      finishTest(true);
    }
  }, [timeLeft, totalItems, finishTest]);

  const handleSelect = (question: any, value: any) => {
    setUserAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishTest();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLast = currentIndex === totalItems - 1;
  const isAnsweredQuestion =
    currentQuestion && userAnswers[currentQuestion.id] !== undefined && userAnswers[currentQuestion.id] !== '';

  // Texto de la pregunta (enunciado)
  const getQuestionText = (q: any): string => {
    const content = q.content_jsonb || {};
    return (
      content.pregunta ||
      content.text ||
      content.enunciado ||
      content.enunciado_pregunta ||
      content.texto ||
      content.title ||
      content.reactivo ||
      `Pregunta ${q.order_index}`
    );
  };

  const getGuideStats = () => {
    return GUIAS.map((g) => {
      const count = allQuestions.filter((q: any) => getGuiaDePregunta(q).key === g.key).length;
      const answered = allQuestions.filter(
        (q: any) => getGuiaDePregunta(q).key === g.key && userAnswers[q.id] !== undefined && userAnswers[q.id] !== ''
      ).length;
      return { ...g, count, answered };
    });
  };

  const guiaStats = getGuideStats();

  return (
    <div className="bg-[#F9F9F7] text-slate-800 min-h-screen flex flex-col font-body pb-12">
      {/* HEADER */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm py-3 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="font-headline font-bold text-slate-900 text-base md:text-lg truncate">
            {testData?.name || "NOM-035-STPS-2018 (Evaluación Integral)"}
          </h1>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 shadow-inner transition-all ${
            timeLeft <= 300 ? 'bg-red-100 border-red-500 text-red-900 animate-pulse' : 'bg-amber-100 border-amber-400 text-amber-900'
          }`}>
            <Timer size={20} aria-hidden="true" />
            <span className="font-mono font-extrabold text-lg tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 mt-6 space-y-6">
        {/* BARRA DE PROGRESO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="font-headline font-extrabold text-lg text-slate-900">
              Progreso de la evaluación
            </span>
            <span className="text-sm font-semibold text-slate-600">
              Pregunta {currentIndex + 1} de {totalItems} &bull; {answeredCount}/{totalItems} preguntas respondidas ({progressPercent}%)
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#416912] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Resumen de guías */}
          <div className="flex flex-wrap gap-2 pt-1">
            {guiaStats.map((g) => (
              <span
                key={g.key}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  g.key === currentGuia.key ? 'bg-[#BEEE89] text-[#001E28]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Guía {g.key} ({g.answered}/{g.count})
              </span>
            ))}
          </div>
        </div>

        {/* TARJETA DE GUÍA ACTUAL */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-[#416912] shadow-sm">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
            Guía {currentGuia.key} &bull; Pregunta {currentQuestion?.order_index || currentIndex + 1}
          </span>
          <h2 className="font-headline font-extrabold text-xl md:text-2xl text-[#001E28] mt-2">
            {currentGuia.titulo}
          </h2>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">{currentGuia.descripcion}</p>
        </div>

        {/* PREGUNTA ACTUAL */}
        {currentQuestion ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                Pregunta {currentQuestion.order_index}
              </span>
              {isAnsweredQuestion && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full">
                  Respuesta registrada
                </span>
              )}
            </div>

            <h3 className="text-lg md:text-xl text-slate-900 font-semibold mb-6">
              {getQuestionText(currentQuestion)}
            </h3>

            {currentGuia.tipo === 'si_no' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPCIONES_SI_NO.map((op) => {
                  const selected = userAnswers[currentQuestion.id] === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleSelect(currentQuestion, op)}
                      className={`flex items-center p-4 border-2 rounded-xl text-left transition-all ${
                        selected ? 'bg-[#BEEE89]/30 border-[#416912]' : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                      }`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-3 ${
                        selected ? 'bg-[#416912] text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {op === 'Sí' ? 'S' : 'N'}
                      </span>
                      <span className="font-semibold text-slate-800">{op}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {ESCALA_FRECUENCIA.map((op) => {
                  const selected = userAnswers[currentQuestion.id] === op.valor;
                  return (
                    <button
                      key={op.valor}
                      type="button"
                      onClick={() => handleSelect(currentQuestion, op.valor)}
                      className={`flex items-center w-full p-3 sm:p-4 border-2 rounded-xl transition-all ${
                        selected ? 'bg-[#BEEE89]/30 border-[#416912]' : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                      }`}
                    >
                      <span className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-full font-bold text-sm ${
                        selected ? 'bg-[#416912] text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {op.valor}
                      </span>
                      <span className={`ml-4 font-semibold ${selected ? 'text-[#001E28]' : 'text-slate-800'}`}>
                        {op.etiqueta}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Aviso condicional para la Guía I */}
            {currentGuia.key === 'I' && userAnswers[currentQuestion?.id] === 'Sí' && (
              <p className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                En caso de haber respondido afirmativamente a acontecimientos traumáticos severos, continúe con la evaluación para el seguimiento correspondiente.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            No se encontraron preguntas cargadas para esta evaluación en la base de datos.
          </div>
        )}

        {/* NAVEGACIÓN */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm ${
                currentIndex === 0 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span className="uppercase tracking-wider hidden sm:inline">Anterior</span>
            </button>

            <div className="text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
              {currentIndex + 1} de {totalItems} preguntas
            </div>

            {!isLast ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#BEEE89] text-[#001E28] hover:bg-[#a8e070] font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider hidden sm:inline">Siguiente</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finishTest()}
                className="flex items-center gap-2 bg-[#416912] text-white hover:bg-[#34540e] font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider">Finalizar Evaluación</span>
                <CheckCircle size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}