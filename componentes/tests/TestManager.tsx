"use client";

import React, { useState, useRef, useMemo, useCallback } from 'react';
import TestFinalizedView from './TestFinalizedView';
import CleaverView from './CleaverView';
import TermanView from './termanView'; // Asegúrate de importar tus vistas
import Nom035IntegralView from './Nom035IntegralView';

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
  // Guard anti doble-clic / doble onComplete (StrictMode, timers, reintentos)
  const isCompletingRef = useRef(false);

  // Deduplicar la lista: si el padre envía el mismo test una vez por usuario
  // asignado (ej. Terman x3), aquí queda una sola entrada por test.
  const uniqueTestsList = useMemo(() => {
    if (!testsList) return [];
    const seen = new Set<string>();
    return testsList.filter((t) => {
      const keySource = t?.id ?? `${t?.type ?? ''}|${t?.name ?? ''}`;
      const key = String(keySource).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [testsList]);

  // Nombres únicos preservando orden, para la vista final.
  const completedTestsNames = useMemo(() => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const t of uniqueTestsList) {
      const name = String(t?.name ?? '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
    }
    return unique.join(', ');
  }, [uniqueTestsList]);

  const handleTestComplete = useCallback((testId: string, answers: Record<string, any>) => {
    // Evita que un doble clic en "Finalizar" (o un onComplete disparado
    // dos veces por timer + botón) inserte/avance dos veces.
    if (isCompletingRef.current || isFinished) return;
    isCompletingRef.current = true;

    // Actualización funcional: evita closure stale de patientAnswers / currentTestIndex.
    setPatientAnswers((prev) => {
      const updated = { ...prev, [testId]: answers };
      console.log("Respuestas finales de todos los tests:", updated);
      return updated;
    });

    setCurrentTestIndex((prevIndex) => {
      if (prevIndex < uniqueTestsList.length - 1) {
        // Liberar el guard en el siguiente tick para permitir completar el siguiente test.
        setTimeout(() => { isCompletingRef.current = false; }, 0);
        return prevIndex + 1;
      }
      // Último test: calcular tiempo y finalizar una sola vez.
      const totalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setTimeElapsedStr(`${mins} minutos y ${secs} segundos`);
      setIsFinished(true);
      // No se libera el guard: la sesión ya terminó.
      return prevIndex;
    });
  }, [isFinished, uniqueTestsList.length]);

  // Validar si la lista de tests está vacía (después de los hooks para no romper reglas de hooks)
  if (!uniqueTestsList || uniqueTestsList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] text-slate-700 font-body">
        <p className="text-lg font-semibold">No hay tests asignados para este paciente.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <TestFinalizedView 
        patientName={patientName}
        testNames={completedTestsNames}
        timeElapsed={timeElapsedStr}
        onGoHome={() => window.location.href = '/'}
        
      />
    );
  }

  const safeIndex = Math.min(currentTestIndex, uniqueTestsList.length - 1);
  const currentTest = uniqueTestsList[safeIndex];

  // Renderizado dinámico según el tipo o nombre del test
  const renderCurrentTestView = () => {
    const testIdentifier = (currentTest.type || currentTest.name || "").toLowerCase();
    // key única por test: fuerza remount al avanzar y evita arrastrar
    // estado/respuestas del test anterior (causa de "duplicados" visuales).
    const viewKey = `${currentTest.id}-${safeIndex}`;

    if (testIdentifier.includes('terman') || testIdentifier.includes('merrill')) {
      return (
        <TermanView 
          key={viewKey}
          testData={currentTest} 
          onComplete={(answers) => handleTestComplete(currentTest.id, answers)} 
        />
      );
    }

    // NOM-035 Integral (Guías I, II y III - 137 preguntas)
    if (testIdentifier.includes('nom-035') || testIdentifier.includes('nom035') || testIdentifier.includes('integral')) {
      return (
        <Nom035IntegralView 
          key={viewKey}
          testData={currentTest} 
          onComplete={(answers) => handleTestComplete(currentTest.id, answers)} 
        />
      );
    }

    // Por defecto o si coincide con Cleaver
    return (
      <CleaverView 
        key={viewKey}
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