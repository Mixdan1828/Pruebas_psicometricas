"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface RavenViewProps {
  testData: any;
  onComplete: (respuestasSeleccionadas: any[]) => void;
}

export default function RavenView({ testData, onComplete }: RavenViewProps) {
  // Soportamos tanto test_questions (como viene del orquestador) como questions
  const questions = testData?.test_questions || testData?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [respuestasUsuario, setRespuestasUsuario] = useState<any[]>([]);

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-2xl mx-auto">
        <p className="text-xs font-bold text-slate-500">No hay reactivos registrados para esta evaluación de Raven.</p>
      </div>
    );
  }

  const handleSelect = (opcionLetra: string) => {
    setSelectedOption(opcionLetra);
  };

  const handleSiguientePregunta = () => {
    if (!selectedOption) return;

    // Registramos la respuesta del reactivo actual
    const nuevaRespuesta = {
      question_id: currentQuestion.id,
      serie: currentQuestion.content_jsonb?.serie || 'A',
      order_index: currentQuestion.order_index,
      respuesta_seleccionada: selectedOption
    };

    const updatedRespuestas = [...respuestasUsuario, nuevaRespuesta];
    setRespuestasUsuario(updatedRespuestas);
    setSelectedOption(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Al finalizar todas las preguntas, enviamos el arreglo completo al flujo principal
      onComplete(updatedRespuestas);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
            Serie {currentQuestion.content_jsonb?.serie || 'A'}
          </span>
          <h3 className="font-headline font-bold text-[#123440] text-sm mt-1">
            Reactivo {currentIndex + 1} de {questions.length}
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-bold">
          {Math.round(((currentIndex + 1) / questions.length) * 100)}% Completado
        </span>
      </div>

      <p className="text-xs font-bold text-[#123440] text-center">
        {currentQuestion.content_jsonb?.pregunta || 'Selecciona la figura que completa la matriz correctamente:'}
      </p>

      {/* Imagen Principal de la Matriz */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Matriz Principal</span>
        {currentQuestion.content_jsonb?.imagen_principal && (
          <div className="relative w-full max-w-[280px] h-44">
            <Image 
              src={currentQuestion.content_jsonb.imagen_principal} 
              alt="Matriz Raven" 
              fill 
              className="object-contain rounded-lg border border-slate-200 bg-white"
            />
          </div>
        )}
      </div>

      {/* Opciones de Respuesta Visuales */}
      <div className="space-y-2">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Selecciona una opción:</span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {currentQuestion.content_jsonb?.opciones?.map((op: any, i: number) => {
            const opcionId = op.opcion || op.letra || String(i + 1);
            const textoOpcion = op.texto || op.text || '';
            const isSelected = selectedOption === opcionId;

            return (
              <div 
                key={i}
                onClick={() => handleSelect(opcionId)}
                className={`cursor-pointer bg-white rounded-xl p-2 border-2 text-center transition-all flex flex-col items-center ${
                  isSelected 
                    ? 'border-indigo-600 shadow-md bg-indigo-50/30' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 mb-1">{opcionId}</span>
                {textoOpcion.startsWith('http') ? (
                  <div className="relative w-full h-16 bg-white rounded">
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

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button 
          onClick={handleSiguientePregunta}
          disabled={!selectedOption}
          className="bg-[#123440] hover:bg-[#1a4a5c] text-white px-6 py-2.5 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>{currentIndex === questions.length - 1 ? 'Finalizar y Guardar' : 'Siguiente Reactivo'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}