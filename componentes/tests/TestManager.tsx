"use client";

import React, { useState, useRef } from 'react';
import TestFinalizedView from './TestFinalizedView';
import CleaverView from './CleaverView';
import TermanView from './termanView'; // Asegúrate de importar tus vistas

interface TestItem {
  id: string;
  name: string;
  type?: string; // Campo opcional para identificar el tipo de test
  test_questions: any[];
  [key: string]: any;
}

interface TestManagerProps {
  patientName: string;
  testsList: TestItem[];
}

export default function TestManager({ patientName, testsList }: TestManagerProps) {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeElapsedStr, setTimeElapsedStr] = useState('');
  
  // Estado para acumular las respuestas de todos los tests realizados
  const [patientAnswers, setPatientAnswers] = useState<Record<string, any>>({});

  // Referencia para medir el tiempo exacto desde que arranca el primer test
  const startTimeRef = useRef<number>(Date.now());

  // Validar si la lista de tests está vacía
  if (!testsList || testsList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] text-slate-700 font-body">
        <p className="text-lg font-semibold">No hay tests asignados para este paciente.</p>
      </div>
    );
  }

  const handleTestComplete = (testId: string, answers: Record<string, any>) => {
    // Guardar las respuestas del test actual
    const updatedAnswers = { ...patientAnswers, [testId]: answers };
    setPatientAnswers(updatedAnswers);

    if (currentTestIndex < testsList.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    } else {
      // Calcular el tiempo total transcurrido al finalizar el último test
      const totalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setTimeElapsedStr(`${mins} minutos y ${secs} segundos`);

      setIsFinished(true);
      
      // Opcional: Aquí podrías enviar 'updatedAnswers' a tu API para guardarlos en la BD
      console.log("Respuestas finales de todos los tests:", updatedAnswers);
    }
  };

  if (isFinished) {
    const completedTestsNames = testsList.map(t => t.name).join(', ');

    return (
      <TestFinalizedView 
        patientName={patientName}
        testNames={completedTestsNames}
        timeElapsed={timeElapsedStr}
        onGoHome={() => window.location.href = '/'}
        onClose={() => setIsFinished(false)}
      />
    );
  }

  const currentTest = testsList[currentTestIndex];

  // Renderizado dinámico según el tipo o nombre del test
  const renderCurrentTestView = () => {
    const testIdentifier = (currentTest.type || currentTest.name || "").toLowerCase();

    if (testIdentifier.includes('terman') || testIdentifier.includes('merrill')) {
      return (
        <TermanView 
          testData={currentTest} 
          onComplete={(answers) => handleTestComplete(currentTest.id, answers)} 
        />
      );
    }

    // Por defecto o si coincide con Cleaver
    return (
      <CleaverView 
        testData={currentTest} 
        onComplete={(answers) => handleTestComplete(currentTest.id, answers)} 
      />
    );
  };

  return (
    <div className="w-full">
      {renderCurrentTestView()}
    </div>
  );
}