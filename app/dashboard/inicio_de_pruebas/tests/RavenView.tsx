"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface RavenViewProps {
  testData: any;
  onComplete: (respuestasSeleccionadas: any[]) => void;
}

export default function RavenView({ testData, onComplete }: RavenViewProps) {
  const questions = testData?.test_questions || testData?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState<any[]>([]);
  
  // Temporizador de 20 minutos (20 * 60 segundos = 1200 segundos)
  const [timeLeft, setTimeLeft] = useState(1200);

  const currentQuestion = questions[currentIndex];

  // Recuperar respuesta previa si el usuario retrocede de pregunta
  const respuestaActualGuardada = respuestasUsuario.find(
    (r) => r.question_id === currentQuestion?.id
  )?.respuesta_seleccionada || null;

  const [selectedOption, setSelectedOption] = useState<string | null>(respuestaActualGuardada);

  // Efecto para sincronizar la opción seleccionada al cambiar de índice
  useEffect(() => {
    if (currentQuestion) {
      const respPrevia = respuestasUsuario.find(
        (r) => r.question_id === currentQuestion.id
      )?.respuesta_seleccionada || null;
      setSelectedOption(respPrevia);
    }
  }, [currentIndex, currentQuestion, respuestasUsuario]);

  // Manejo del Temporizador de 20 minutos
  useEffect(() => {
    if (timeLeft <= 0) {
      // Al acabarse el tiempo, finalizamos automáticamente con lo que se tenga respondido
      onComplete(respuestasUsuario);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, respuestasUsuario, onComplete]);

  // Formatear el tiempo restante a MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const guardarRespuestaActual = (opcionSeleccionada: string | null) => {
    if (!opcionSeleccionada) return respuestasUsuario;

    const nuevaRespuesta = {
      question_id: currentQuestion.id,
      serie: currentQuestion.content_jsonb?.serie || 'A',
      order_index: currentQuestion.order_index,
      respuesta_seleccionada: opcionSeleccionada
    };

    const indexExistente = respuestasUsuario.findIndex(r => r.question_id === currentQuestion.id);
    let updatedRespuestas = [...respuestasUsuario];

    if (indexExistente >= 0) {
      updatedRespuestas[indexExistente] = nuevaRespuesta;
    } else {
      updatedRespuestas.push(nuevaRespuesta);
    }

    setRespuestasUsuario(updatedRespuestas);
    return updatedRespuestas;
  };

  const handleSiguientePregunta = () => {
    if (!selectedOption) return;

    const updatedRespuestas = guardarRespuestaActual(selectedOption);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(updatedRespuestas);
    }
  };

  const handleAnteriorPregunta = () => {
    // Guardar temporalmente la actual antes de retroceder si existe selección
    if (selectedOption) {
      guardarRespuestaActual(selectedOption);
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const porcentajeProgreso = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* 🌟 TÍTULO PRINCIPAL DESTACADO EN LA PARTE SUPERIOR */}
      <div className="bg-[#123440] text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 bg-[#70a444] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
            <Sparkles size={12} /> Evaluación Psicométrica Activa
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Test de Matrices Progresivas de Raven
          </h1>
          <p className="text-xs text-slate-300">
            Mide la capacidad de razonamiento analógico, percepción y abstracción.
          </p>
        </div>

        {/* Cronómetro Global Integrado en el Banner */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-xs font-bold shadow-inner shrink-0 ${
          timeLeft < 180 ? 'bg-rose-500 text-white border-rose-400 animate-pulse' : 'bg-white/10 text-white border-white/20'
        }`}>
          <Clock size={16} />
          <span>Tiempo: {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DE LA PREGUNTA */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">

        {/* CABECERA DE PROGRESO Y SERIE */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
              Serie {currentQuestion.content_jsonb?.serie || 'A'}
            </span>
            <h3 className="font-headline font-bold text-[#123440] text-sm">
              Reactivo {currentIndex + 1} de {questions.length}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {porcentajeProgreso}% Completado
          </span>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#123440] h-full transition-all duration-300"
            style={{ width: `${porcentajeProgreso}%` }}
          />
        </div>

        <p className="text-xs font-bold text-[#123440] text-center">
          {currentQuestion.content_jsonb?.pregunta || 'Selecciona la figura que completa la matriz correctamente:'}
        </p>

        {/* IMAGEN PRINCIPAL DE LA MATRIZ (AGRANDADA) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Matriz Principal</span>
          {currentQuestion.content_jsonb?.imagen_principal && (
            <div className="relative w-full max-w-[420px] h-64 sm:h-72">
              <Image 
                src={currentQuestion.content_jsonb.imagen_principal} 
                alt="Matriz Raven" 
                fill 
                className="object-contain rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            </div>
          )}
        </div>

        {/* OPCIONES DE RESPUESTA VISUALES (AGRANDADAS) */}
        <div className="space-y-3">
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
                  className={`cursor-pointer bg-white rounded-2xl p-3 border-2 text-center transition-all flex flex-col items-center ${
                    isSelected 
                      ? 'border-indigo-600 shadow-md bg-indigo-50/30 ring-2 ring-indigo-600/20' 
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700 mb-1.5 bg-slate-100 px-2 py-0.5 rounded-full">{opcionId}</span>
                  {textoOpcion.startsWith('http') ? (
                    <div className="relative w-full h-24 sm:h-28 bg-white rounded-lg">
                      <Image 
                        src={textoOpcion} 
                        alt={`Opción ${opcionId}`} 
                        fill 
                        className="object-contain rounded-md"
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

        {/* BOTONES DE NAVEGACIÓN (ANTERIOR Y SIGUIENTE) */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button 
            onClick={handleAnteriorPregunta}
            disabled={currentIndex === 0}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Anterior</span>
          </button>

          <button 
            onClick={handleSiguientePregunta}
            disabled={!selectedOption}
            className="bg-[#123440] hover:bg-[#1a4a5c] text-white px-6 py-2.5 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span>{currentIndex === questions.length - 1 ? 'Finalizar y Guardar' : 'Siguiente Reactivo'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}