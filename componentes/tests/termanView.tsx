"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

interface TermanViewProps {
  testData: any;
  onComplete: (answers: Record<string, any>) => void;
}

const SERIES_DEFINITIONS = [
  { title: "Serie I: Preguntas de opción múltiple", start: 1, end: 16, timeMinutes: 2, defaultInstruction: "Seleccione la opción que complete correctamente la oración." },
  { title: "Serie II: Juicio", start: 17, end: 27, timeMinutes: 2, defaultInstruction: "Seleccione la opción que responda mejor a la pregunta de sentido común." },
  { title: "Serie III: Vocabulario", start: 28, end: 57, timeMinutes: 2, defaultInstruction: "Seleccione si las dos palabras tienen el mismo significado (Igual) o significados opuestos (Opuesto)." },
  { title: "Serie IV: Selección Lógica", start: 58, end: 75, timeMinutes: 3, defaultInstruction: "Seleccione exactamente 2 opciones." },
  { title: "Serie V: Aritmética", start: 76, end: 87, timeMinutes: 5, defaultInstruction: "Resuelva el problema matemático y escriba la respuesta numérica correcta." },
  { title: "Serie VI: Juicio Práctico", start: 88, end: 107, timeMinutes: 2, defaultInstruction: "Responda Sí o No según corresponda." },
  { title: "Serie VII: Analogías", start: 108, end: 127, timeMinutes: 2, defaultInstruction: "Seleccione la opción que complete la relación analógica adecuadamente." },
  { title: "Serie VIII: Ordenación de Oraciones", start: 128, end: 144, timeMinutes: 3, defaultInstruction: "Ordene mentalmente la oración y determine si es Verdadera o Falsa." },
  { title: "Serie IX: Clasificación", start: 145, end: 162, timeMinutes: 3, defaultInstruction: "Seleccione la palabra que no pertenece a la misma categoría." },
  { title: "Serie X: Series Numéricas", start: 163, end: 173, timeMinutes: 4, defaultInstruction: "Escriba los dos números que continúan la secuencia lógica." }
];

export default function TermanView({ testData, onComplete }: TermanViewProps) {
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const hasCompletedRef = useRef(false);

  const [seriesTimes, setSeriesTimes] = useState<number[]>(() =>
    SERIES_DEFINITIONS.map(def => def.timeMinutes * 60)
  );

  const userAnswersRef = useRef(userAnswers);
  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Memorización de preguntas para evitar re-parsear JSON en cada render
  const allQuestions = useMemo(() => {
    const rawQuestions = testData?.test_questions || [];
    return rawQuestions.map((q: any, index: number) => {
      let parsedContent = q.content_jsonb;
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch {
          parsedContent = {};
        }
      }
      return {
        ...q,
        order_index: Number(q.order_index) || (index + 1),
        content_jsonb: parsedContent || {}
      };
    });
  }, [testData?.test_questions]);

  const finishTest = useCallback(() => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onCompleteRef.current(userAnswersRef.current);
    }
  }, []);

  // Temporizador independiente por serie
  useEffect(() => {
    if (hasCompletedRef.current) return;

    const timer = setInterval(() => {
      setSeriesTimes((prevTimes) => {
        if (prevTimes[currentSeriesIndex] <= 0) return prevTimes;
        const newTimes = [...prevTimes];
        newTimes[currentSeriesIndex] -= 1;
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSeriesIndex]);

  // Expiración de tiempo por serie
  useEffect(() => {
    if (seriesTimes[currentSeriesIndex] === 0 && !hasCompletedRef.current) {
      if (currentSeriesIndex < SERIES_DEFINITIONS.length - 1) {
        setCurrentSeriesIndex((prev) => prev + 1);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        finishTest();
      }
    }
  }, [seriesTimes, currentSeriesIndex, finishTest]);

  const formatOptionText = useCallback((item: any): string => {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (typeof item === 'object') {
      if (item.letra && item.texto) return `${item.letra}) ${item.texto}`;
      if (item.texto) return item.texto;
      if (item.palabra) return item.palabra;
      if (item.enunciado) return item.enunciado;
      if (item.label) return item.label;
      return Object.values(item).filter(v => typeof v === 'string').join(' ');
    }
    return '';
  }, []);

  const handleSelectAnswer = (questionId: string, answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkIsAnswered = useCallback((qNum: number, ans: any) => {
    if (ans === undefined || ans === null || ans === '') return false;
    if (qNum >= 58 && qNum <= 75) {
      return Array.isArray(ans) && ans.length === 2;
    }
    if (qNum >= 128 && qNum <= 144) {
      const tieneTexto = Boolean(ans?.oracionOrdenada && typeof ans.oracionOrdenada === 'string' && ans.oracionOrdenada.trim() !== '');
      return Boolean(tieneTexto && ans?.verdadFalso);
    }
    if (qNum >= 163 && qNum <= 173) {
      return Boolean(ans?.num1 !== undefined && ans?.num1 !== '' && ans?.num2 !== undefined && ans?.num2 !== '');
    }
    return true;
  }, []);

  const currentSeriesDef = SERIES_DEFINITIONS[currentSeriesIndex];
  const timeLeft = seriesTimes[currentSeriesIndex];

  const seriesQuestions = useMemo(() => {
    return allQuestions.filter((q: any) => {
      const qNum = q.order_index;
      return qNum >= currentSeriesDef.start && qNum <= currentSeriesDef.end;
    });
  }, [allQuestions, currentSeriesDef]);

  const totalAnsweredGlobal = useMemo(() => {
    return allQuestions.filter((q: any) => checkIsAnswered(q.order_index, userAnswers[q.id])).length;
  }, [allQuestions, userAnswers, checkIsAnswered]);

  const globalProgressPercent = allQuestions.length > 0 ? Math.round((totalAnsweredGlobal / allQuestions.length) * 100) : 0;

  const handleNextSeries = () => {
    if (currentSeriesIndex < SERIES_DEFINITIONS.length - 1) {
      setCurrentSeriesIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishTest();
    }
  };

  const handlePrevSeries = () => {
    if (currentSeriesIndex > 0) {
      setCurrentSeriesIndex((prev) => prev - 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#F9F9F7] text-slate-800 min-h-screen flex flex-col font-body pb-12">
      {/* HEADER */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm py-3 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="font-headline font-bold text-slate-900 text-base md:text-lg truncate">
            {testData?.name || "Test Terman Merrill"}
          </h1>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 shadow-inner transition-all ${
            timeLeft <= 30 ? 'bg-red-100 border-red-500 text-red-900 animate-pulse' : 'bg-amber-100 border-amber-400 text-amber-900'
          }`}>
            <span className="material-symbols-outlined text-xl">timer</span>
            <span className="font-mono font-extrabold text-lg tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 mt-6 space-y-6">
        
        {/* TARJETA DE TÍTULO Y NAVEGACIÓN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="text-center">
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl text-slate-900 mb-1">
              {currentSeriesDef.title}
            </h2>
            <p className="text-slate-500 font-semibold text-sm">
              Preguntas {currentSeriesDef.start} a {currentSeriesDef.end} &bull; Progreso total: {totalAnsweredGlobal}/{allQuestions.length} ({globalProgressPercent}%)
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrevSeries}
              disabled={currentSeriesIndex === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm ${
                currentSeriesIndex === 0 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span className="uppercase tracking-wider hidden sm:inline">Anterior</span>
            </button>

            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Serie {currentSeriesIndex + 1} de {SERIES_DEFINITIONS.length}
            </span>

            {currentSeriesIndex < SERIES_DEFINITIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSeries}
                className="flex items-center gap-2 bg-[#BEEE89] text-[#001E28] hover:bg-[#a8e070] font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider hidden sm:inline">Siguiente</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={finishTest}
                className="flex items-center gap-2 bg-[#416912] text-white hover:bg-[#34540e] font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm text-sm"
              >
                <span className="uppercase tracking-wider">Finalizar</span>
                <span className="material-symbols-outlined text-base">check_circle</span>
              </button>
            )}
          </div>
        </div>

        {/* LISTA DE PREGUNTAS DE LA SERIE */}
        {seriesQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            No se encontraron preguntas cargadas para esta serie específica en la base de datos.
          </div>
        ) : (
          seriesQuestions.map((q: any) => {
            const qNum = q.order_index;
            const content = q.content_jsonb;
            const ans = userAnswers[q.id];
            const isAnswered = checkIsAnswered(qNum, ans);
            
            const opciones = content.opciones || content.options || content.choices || [];
            const questionTitle = formatOptionText(content.pregunta || content.text || content.enunciado || content.title) || 
              ((qNum >= 28 && qNum <= 57) ? "¿Las siguientes palabras son Iguales u Opuestas?" : `Pregunta ${qNum}`);
            const instruction = content.instruccion || content.instrucciones || currentSeriesDef.defaultInstruction;

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                    PREGUNTA {qNum}
                  </span>
                  {isAnswered && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full">
                      Respuesta registrada
                    </span>
                  )}
                </div>

                <h3 className="text-lg md:text-xl text-slate-900 font-semibold mb-6">
                  {questionTitle}
                </h3>

                {/* OPCIONES MÚLTIPLES */}
                {((qNum >= 1 && qNum <= 27) || (qNum >= 108 && qNum <= 127) || (qNum >= 145 && qNum <= 162)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opciones.map((op: any, opIndex: number) => {
                      const val = typeof op === 'object' ? (op.letra || op.id || op.texto || op.label || opIndex) : op;
                      const label = formatOptionText(op);
                      const letter = String.fromCharCode(65 + opIndex);
                      const isSelected = ans === val;

                      return (
                        <button
                          key={opIndex}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, val)}
                          className={`flex items-center p-4 border-2 rounded-xl text-left transition-all ${
                            isSelected ? 'bg-[#BEEE89]/30 border-[#416912]' : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                          }`}
                        >
                          <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-3 ${
                            isSelected ? 'bg-[#416912] text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <span className="font-medium text-slate-800">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Serie III: Vocabulario */}
                {(qNum >= 28 && qNum <= 57) && (() => {
                  const p1 = formatOptionText(content.palabra_1 || content.palabra1 || content.p1);
                  const p2 = formatOptionText(content.palabra_2 || content.palabra2 || content.p2);
                  const palabrasArr = Array.isArray(content.palabras) ? content.palabras : null;

                  return (
                    <div className="space-y-4">
                      {(p1 || p2) ? (
                        <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-slate-800">
                          {p1} <span className="text-[#416912] mx-2">&mdash;</span> {p2}
                        </div>
                      ) : palabrasArr && (
                        <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-slate-800">
                          {palabrasArr.map(formatOptionText).join(' — ')}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {['Igual', 'Opuesto'].map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, op)}
                            className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                              ans === op ? 'bg-[#BEEE89]/30 border-[#416912] text-slate-900' : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-700'
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Serie IV: Selección Lógica */}
                {(qNum >= 58 && qNum <= 75) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opciones.map((op: any, opIndex: number) => {
                      const val = typeof op === 'object' ? (op.letra || op.id || op.texto || opIndex) : op;
                      const label = formatOptionText(op);
                      const currentSelected: string[] = Array.isArray(ans) ? ans : [];
                      const isChecked = currentSelected.includes(val);

                      const handleCheckboxClick = () => {
                        if (isChecked) {
                          handleSelectAnswer(q.id, currentSelected.filter(item => item !== val));
                        } else {
                          if (currentSelected.length < 2) {
                            handleSelectAnswer(q.id, [...currentSelected, val]);
                          } else {
                            handleSelectAnswer(q.id, [currentSelected[1], val]);
                          }
                        }
                      };

                      return (
                        <button
                          key={opIndex}
                          type="button"
                          onClick={handleCheckboxClick}
                          className={`flex items-center p-4 rounded-xl border-2 text-left transition-all ${
                            isChecked ? 'bg-[#BEEE89]/30 border-[#416912]' : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                            isChecked ? 'bg-[#416912] border-[#416912] text-white' : 'border-slate-400 bg-white'
                          }`}>
                            {isChecked && <span className="material-symbols-outlined text-xs font-bold">check</span>}
                          </div>
                          <span className="font-medium text-slate-800">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Serie V: Aritmética */}
                {(qNum >= 76 && qNum <= 87) && (
                  <input
                    type="text"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-[#416912] focus:outline-none"
                    placeholder="Escribe el resultado numérico..."
                    value={ans || ''}
                    onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                  />
                )}

                {/* Serie VI: Juicio Práctico */}
                {(qNum >= 88 && qNum <= 107) && (
                  <div className="grid grid-cols-2 gap-4">
                    {['Sí', 'No'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => handleSelectAnswer(q.id, op)}
                        className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                          ans === op ? 'bg-[#BEEE89]/30 border-[#416912] text-slate-900' : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-700'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                {/* Serie VIII: Ordenación + V/F */}
                {(qNum >= 128 && qNum <= 144) && (() => {
                  const rawOracion = content.oracion_desordenada || content.oracion || "";
                  const oracionTexto = typeof rawOracion === 'string' ? rawOracion : formatOptionText(rawOracion);
                  const currentObj = (typeof ans === 'object' && ans !== null) ? ans : {};

                  return (
                    <div className="space-y-4">
                      {oracionTexto && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center font-bold text-amber-900">
                          &quot;{oracionTexto}&quot;
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Escribe la oración ordenada..."
                        className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-[#416912] focus:outline-none"
                        value={currentObj.oracionOrdenada || ''}
                        onChange={(e) => handleSelectAnswer(q.id, { ...currentObj, oracionOrdenada: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        {['Verdadero', 'Falso'].map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, { ...currentObj, verdadFalso: op })}
                            className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                              currentObj.verdadFalso === op ? 'bg-[#BEEE89]/30 border-[#416912] text-slate-900' : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-700'
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Serie X: Series Numéricas */}
                {(qNum >= 163 && qNum <= 173) && (() => {
                  const secuencia = 
                    content.secuencia || 
                    content.numeros || 
                    content.opciones || 
                    content.options || 
                    content.pregunta || 
                    content.texto || 
                    content.text || 
                    content.enunciado || 
                    (typeof content === 'string' ? content : '');

                  let textoSecuencia = '';
                  if (Array.isArray(secuencia)) {
                    textoSecuencia = secuencia.map(formatOptionText).join(', ');
                  } else if (typeof secuencia === 'object' && secuencia !== null) {
                    textoSecuencia = Object.values(secuencia).map(formatOptionText).join(', ');
                  } else {
                    textoSecuencia = String(secuencia || '');
                  }

                  const currentObj = (typeof ans === 'object' && ans !== null) ? ans : {};

                  return (
                    <div className="space-y-4">
                      {textoSecuencia ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-xl text-slate-900 tracking-wider">
                          {textoSecuencia}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-sm">
                          Secuencia numérica (Pregunta {qNum})
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Número 1"
                          className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-[#416912] focus:outline-none font-mono font-bold text-center"
                          value={currentObj.num1 ?? ''}
                          onChange={(e) => handleSelectAnswer(q.id, { ...currentObj, num1: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Número 2"
                          className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-[#416912] focus:outline-none font-mono font-bold text-center"
                          value={currentObj.num2 ?? ''}
                          onChange={(e) => handleSelectAnswer(q.id, { ...currentObj, num2: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })()}

                <p className="mt-4 text-center text-slate-400 text-xs italic">
                  {instruction}
                </p>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}