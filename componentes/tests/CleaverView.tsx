"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, ChevronDown, CheckCircle } from 'lucide-react';

interface CleaverViewProps {
  testData: any;
  onComplete: (answers: Record<string, any>) => void;
}

// Diccionario de apoyo con definiciones comunes para las pruebas de Cleaver
const adjectiveDefinitions: Record<string, string> = {
  "persuasivo": "Lograr influir en las ideas, emociones o decisiones de los demás de manera ética y efectiva.",
  "gentil": "Amable, cortés y bien educado en el trato.",
  "humilde": "Que no hace alarde de sus virtudes o logros; modesto.",
  "original": "Que es único, creativo y diferente a lo común o convencional.",
  "agresivo": "Que actúa con fuerza, energía intensa o rapidez.",
  "alma de la fiesta": "Persona que anima y hace que los demás se diviertan en reuniones o eventos sociales.",
  "comodino": "Que busca la comodidad y evita esfuerzos o riesgos innecesarios.",
  "temeroso": "Que siente miedo o aprensión ante situaciones inciertas o peligrosas.",
  "agradable": "Que es placentero, simpático y fácil de tratar.",
  "temeroso de dios": "Que tiene un profundo respeto y reverencia hacia Dios y sus enseñanzas.",
  "tenaz": "Que se mantiene firme y perseverante en sus propósitos, a pesar de las dificultades.",
  "atractivo": "Que tiene cualidades que llaman la atención y resultan agradables o deseables.",
  "cauteloso": "Que actúa con precaución y prudencia para evitar riesgos o problemas.",
  "determinado": "Que tiene firmeza y resolución para alcanzar sus objetivos.",
  "convincente": "Que tiene la capacidad de persuadir y convencer a los demás con argumentos sólidos y claros.",
  "bonachon": "Que es bondadoso, amable y de buen corazón.",
  "docil": "Que es fácil de enseñar, guiar o influenciar; obediente y sumiso.",
  "atrevido": "Que se arriesga y enfrenta situaciones difíciles o peligrosas con valentía.",
  "leal": "Que es fiel, constante y comprometido con sus principios y personas.",
  "encantador": "Que tiene un atractivo especial que cautiva y fascina a los demás.",
  "dispuesto": "Que está listo y preparado para actuar o colaborar en cualquier situación.",
  "deseoso de agradar": "Que busca complacer y satisfacer a los demás con sus acciones o palabras.",
  "consecuente": "Que actúa de manera coherente y consistente con sus principios, valores o decisiones.",
  "entusiasta": "Que muestra gran interés, energía y pasión por lo que hace.",
  "fuerza de voluntad": "Capacidad de controlar los impulsos, emociones y deseos para lograr objetivos a largo plazo.",
  "mente abierta": "Que está dispuesto a considerar nuevas ideas, perspectivas y experiencias sin prejuicios.",
  "complaciente": "Que busca satisfacer los deseos o necesidades de los demás, a veces en exceso.",
  "animoso": "Que tiene energía, vitalidad y disposición para enfrentar desafíos o situaciones difíciles.",
  "confiado": "Que tiene seguridad en sí mismo y en sus capacidades, sin ser arrogante.",
  "simpatizador": "Que muestra apoyo, comprensión y afinidad hacia las ideas, causas o personas.",
  "tolerante": "Que respeta y acepta las diferencias de opiniones, creencias o comportamientos de los demás.",
  "afirmativo": "Que expresa sus ideas, opiniones o decisiones de manera clara y segura.",
  "ecuánime": "Que mantiene la calma y el equilibrio emocional ante situaciones difíciles o estresantes.",
  "preciso": "Que es exacto, cuidadoso y detallado en sus acciones o palabras.",
  "nervioso": "Que se siente inquieto, ansioso o preocupado ante situaciones inciertas o desafiantes.",
  "jovial": "Que es alegre, optimista y transmite buen humor a los demás.",
  "disciplinado": "Que sigue reglas, normas y rutinas de manera constante y organizada.",
  "generoso": "Que comparte y da sin esperar nada a cambio; desprendido y altruista.",
  "armonioso": "Que busca la paz, el equilibrio y evita los conflictos.",
  "persistente": "Que continúa esforzándose y trabajando hacia sus objetivos a pesar de los obstáculos o dificultades.",
  "competitivo": "Que busca destacar, superar metas y ganar en comparación con otros.",
  "alegre": "Que muestra felicidad, entusiasmo y buen ánimo en su comportamiento.",
  "cosiderado": "Que tiene en cuenta los sentimientos, necesidades y opiniones de los demás.",
  "admirable": "Que merece respeto, aprecio y reconocimiento por sus cualidades o acciones.",
  "bondadoso": "Que tiene un corazón generoso y compasivo, dispuesto a ayudar a los demás.",
  "resignado": "Que acepta con paciencia y sin protestar situaciones difíciles o desfavorables.",
  "caracter firme": "Que tiene una personalidad fuerte, decidida y consistente en sus acciones y decisiones.",  
  "odebiente": "Que sigue las órdenes, reglas o instrucciones sin cuestionarlas.",
  "quisquilloso": "Que es exigente, detallista y a veces difícil de complacer.",
  "inconquistable": "Que no puede ser vencido, superado o derrotado; invencible.",
  "jugueton": "Que tiene un carácter alegre, divertido y le gusta jugar o bromear.",
  "respetuoso": "Que muestra consideración, cortesía y deferencia hacia los demás.",
  "emprendedor": "Que tiene iniciativa, creatividad y disposición para iniciar proyectos o negocios.",
  "optimista": "Que tiende a ver el lado positivo de las cosas y espera resultados favorables.",
  "servicial": "Que está dispuesto a ayudar y colaborar con los demás de manera desinteresada.",
  "valiente ": "Que enfrenta situaciones difíciles o peligrosas con coraje y determinación.",
  "inspirador": "Que motiva, anima y estimula a los demás a alcanzar sus metas o mejorar.",
  "sumiso": "Que se somete a la autoridad o voluntad de otros sin resistencia.",
  "timido": "Que muestra inseguridad, falta de confianza o miedo al interactuar con los demás.",
  "adaptable": "Que se ajusta con facilidad a los cambios y nuevas situaciones.",
  "disputador": "Que tiende a discutir, debatir o confrontar opiniones y puntos de vista.",
  "indiferente": "Que no muestra interés, preocupación o emoción hacia algo o alguien.",
  "sangre liviana": "Que es relajado, despreocupado y no se altera fácilmente ante situaciones difíciles.",
  "amiguero": "Sociable, amigable y que disfruta mucho convivir con los demás.",
  "paciente": "Que sabe esperar con tranquilidad y tolera situaciones difíciles sin alterarse.",
  "confianza en si mismo": "Que tiene seguridad en sus capacidades, decisiones y juicio personal.",
  "musurado para hablar": "Que piensa antes de hablar, elige sus palabras con cuidado.",
  "conforme": "Que está satisfecho con lo que tiene o con la situación actual.",
  "confiable": "Que es digno de confianza, cumple sus promesas.",
  "pacivo": "Que evita la violencia, los conflictos y busca la armonía.",
  "postivo": "Que tiene una actitud optimista, esperanzadora y constructiva.",
  "aventurero": "Que busca experiencias nuevas, emocionantes y desafiantes.",
  "receptivo": "Que está abierto a nuevas ideas, sugerencias y experiencias.",
  "cordial": "Que es amable, afectuoso y muestra buena disposición.",
  "moderado": "Que actúa con equilibrio, prudencia y sin excesos.",
  "indulgente": "Que es tolerante, comprensivo y permite cierta flexibilidad.",
  "esteta": "Que aprecia y busca la belleza, el arte y la armonía.",
  "vigoroso": "Que tiene fuerza, energía y vitalidad.",
  "sociable": "Que disfruta de la compañía de otros y se relaciona fácilmente.",
  "parlanchin": "Que habla mucho, a menudo de manera animada o entusiasta.",
  "controlador ": "Que busca dirigir, supervisar o influir en las acciones de los demás.",
  "convencional": "Que sigue las normas establecidas y la tradición.",
  "decisivo": "Que toma decisiones con rapidez, claridad y firmeza.",
  "cohibido": "Que muestra timidez o inseguridad al interactuar.",
  "exacto": "Que es preciso, correcto y detallado.",
  "franco": "Que se expresa de manera directa y sincera.",
  "buen compañero": "Que es solidario y colaborativo.",
  "diplomatico": "Que actúa con tacto y prudencia.",
  "audaz": "Que es valiente, osado y se atreve a enfrentar retos.",
  "ferinado": "Que es firme, constante y perseverante.",
  "satisfecho": "Que se siente contento con su situación o logros.",
  "inquieto": "Que tiene gran energía y deseo de explorar.",
  "popular": "Que es conocido y apreciado por muchas personas.",
  "buen vecino": "Que es amable, considerado y dispuesto a ayudar.",
  "devoto": "Que dedica tiempo y esfuerzo a una causa con compromiso.",
};

const getWordDefinition = (wordText: string): string => {
  const cleanWord = wordText.toLowerCase().trim();
  return adjectiveDefinitions[cleanWord] || "Adjetivo evaluado en la prueba para identificar patrones de comportamiento.";
};

export default function CleaverView({ testData, onComplete }: CleaverViewProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, { mas?: any; menos?: any }>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const userAnswersRef = useRef(userAnswers);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const rawQuestions = testData?.test_questions || [];
  const allQuestions = rawQuestions.map((q: any, index: number) => {
    let parsedContent = q.content_jsonb;
    if (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent);
      } catch (e) {
        parsedContent = {};
      }
    }
    return {
      ...q,
      order_index: Number(q.order_index) || (index + 1),
      content_jsonb: parsedContent || {}
    };
  }).sort((a: any, b: any) => a.order_index - b.order_index);

  // Función de finalización centralizada
  const handleFinish = useCallback((isTimeOut: boolean = false) => {
    if (isSubmittedRef.current) return;

    // Calcular cuántos grupos no tienen la selección de MÁS (+) y MENOS (-) completa
    const incompleteGroups = allQuestions.filter((q: any) => {
      const ans = userAnswersRef.current[q.id];
      return !ans || ans.mas === undefined || ans.menos === undefined;
    }).length;

    if (!isTimeOut && incompleteGroups > 0) {
      const confirmFinish = window.confirm(
        `Tienes ${incompleteGroups} grupo(s) con selecciones incompletas. ¿Estás seguro de que deseas finalizar la prueba de todos modos?`
      );
      if (!confirmFinish) return;
    }

    isSubmittedRef.current = true;
    // Si el guardado falla en el resolver, se rehabilita y permite reintentar
    Promise.resolve(onComplete(userAnswersRef.current))
      .catch(() => {
        isSubmittedRef.current = false;
      });
  }, [allQuestions, onComplete]);

  // Manejo del temporizador y auto-envío al llegar a 0
  // El conteo solo decrece; la finalización se dispara en un efecto separado
  // para evitar efectos secundarios dentro del updater de estado.
  useEffect(() => {
    if (isSubmittedRef.current || timeLeft <= 0) return;

    const timeout = setTimeout(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [timeLeft, isSubmittedRef]);

  // Auto-finalización cuando el tiempo llega a 0 en la última serie
  useEffect(() => {
    if (timeLeft === 0 && allQuestions.length > 0) {
      handleFinish(true);
    }
  }, [timeLeft, handleFinish, allQuestions]);

  const handleSelect = (questionId: string, type: 'mas' | 'menos', optionValue: any) => {
    setUserAnswers((prev) => {
      const currentGroup = prev[questionId] || {};
      let newMas = currentGroup.mas;
      let newMenos = currentGroup.menos;

      if (type === 'mas') {
        if (newMas === optionValue) {
          newMas = undefined;
        } else {
          newMas = optionValue;
          if (newMenos === optionValue) newMenos = undefined;
        }
      } else {
        if (newMenos === optionValue) {
          newMenos = undefined;
        } else {
          newMenos = optionValue;
          if (newMas === optionValue) newMas = undefined;
        }
      }

      return {
        ...prev,
        [questionId]: { mas: newMas, menos: newMenos }
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAdjectiveText = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.texto || item.adjetivo || item.label || Object.values(item)[0] || '';
  };

  return (
    <div className="bg-[#fcf9f8] font-body text-[#1c1b1c] antialiased min-h-screen flex flex-col">
      <header className="bg-[#F9F9F7] sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight text-[#001E28]">
            {testData?.name || "Test de Cleaver"}
          </h1>
          <div className="flex items-center gap-3 px-4 py-2 bg-[#f0f5f7] rounded-xl border border-slate-200">
            <Timer className="text-[#001E28]" size={20} aria-hidden="true" />
            <span className="font-headline font-bold text-lg text-[#001E28] tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 pb-32 space-y-8">
        <section className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-[#416912]">
          <h2 className="font-headline text-2xl font-extrabold text-[#001E28] mb-2">Instrucciones</h2>
          <p className="text-slate-600 text-lg">
            De cada grupo de cuatro adjetivos, selecciona el que <span className="font-bold text-[#416912]">MÁS (+)</span> te describa y el que <span className="font-bold text-[#2563eb]">MENOS (-)</span> te describa. Puedes hacer clic en cualquier palabra para ver su definición.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {allQuestions.map((q: any, index: number) => {
            const qNum = q.order_index || index + 1;
            const content = q.content_jsonb;
            const palabras = content.palabras || content.opciones || content.options || content.adjetivos || [];
            const groupAns = userAnswers[q.id] || {};

            return (
              <div key={q.id} className="bg-white rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md border border-slate-200">
                <div className="bg-[#e2e2e3] px-6 py-3 border-b border-slate-200">
                  <span className="font-headline font-bold text-[#001E28]">GRUPO {qNum}</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-center text-xs uppercase tracking-widest text-slate-600 bg-[#f6f3f2]">
                      <th className="py-3 px-4 text-left font-semibold">Adjetivo (haz clic para ver significado)</th>
                      <th className="py-3 px-2 w-16 font-bold text-[#416912]">MÁS (+)</th>
                      <th className="py-3 px-2 w-16 font-bold text-[#2563eb]">MENOS (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {palabras.map((op: any, opIndex: number) => {
                      const val = typeof op === 'string' ? op : (op.id || op.letra || op.texto || opIndex);
                      const label = formatAdjectiveText(op);
                      const definition = getWordDefinition(label);
                      const isMas = groupAns.mas === val;
                      const isMenos = groupAns.menos === val;

                      return (
                        <tr key={opIndex} className="hover:bg-[#f6f3f2]/50 transition-colors align-top">
                          <td className="py-4 px-6 text-slate-800">
                            <details className="group cursor-pointer">
                              <summary className="font-medium text-slate-800 list-none flex items-center justify-between select-none">
                                <span className="hover:text-[#416912] transition-colors underline decoration-dotted underline-offset-4">
                                  {label}
                                </span>
                                <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" size={16} aria-hidden="true" />
                              </summary>
                              <p className="text-xs text-slate-500 mt-2 pl-2 border-l-2 border-[#416912]/40 font-normal leading-relaxed">
                                {definition}
                              </p>
                            </details>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelect(q.id, 'mas', val)}
                              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center font-bold cursor-pointer ${
                                isMas
                                  ? 'bg-[#BEEE89] text-[#001E28] border-[#416912] scale-95 shadow-sm'
                                  : 'border-[#416912]/20 text-[#416912] hover:bg-[#BEEE89]/30'
                              }`}
                            >
                              +
                            </button>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelect(q.id, 'menos', val)}
                              style={
                                isMenos
                                  ? { backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8' }
                                  : { backgroundColor: 'transparent', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }
                              }
                              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center font-bold cursor-pointer ${
                                isMenos ? 'scale-95 shadow-md' : 'hover:bg-blue-50'
                              }`}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="pt-8 flex justify-center">
          <button
            type="button"
            onClick={() => handleFinish(false)}
            style={{ backgroundColor: '#416912', color: '#ffffff' }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-headline font-bold hover:bg-[#34540e] transition-all duration-150 shadow-lg text-lg uppercase tracking-wider cursor-pointer"
          >
            <span>Finalizar Evaluación</span>
            <CheckCircle size={20} aria-hidden="true" />
          </button>
        </div>
      </main>
    </div>
  );
}