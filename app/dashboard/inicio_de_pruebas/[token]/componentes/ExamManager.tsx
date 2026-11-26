"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, UserCheck } from 'lucide-react';
import TermanView from '../../tests/termanView';
import CleaverView from '../../tests/CleaverView';
import Nom035IntegralView from '../../tests/Nom035IntegralView';
import RavenView from '../../tests/RavenView';
import TestFinalizedView from '../../tests/TestFinalizedView';
import { ResolverErrorBoundary } from './ResolverErrorBoundary';

interface ExamManagerProps {
  token: string;
  candidateId: string;
}

export function ExamManager({ token, candidateId }: ExamManagerProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error' | 'finished'>('loading');
  const [candidateTests, setCandidateTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [patientName, setPatientName] = useState('Candidato');

  useEffect(() => {
    const saved = localStorage.getItem('candidato_nombre');
    if (saved) setPatientName(saved);
  }, []);

  const loadTests = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');

    if (!token) {
      setPhase('error');
      setErrorMessage('No se especificó un token de acceso.');
      return;
    }

    try {
      const urlParams = new URLSearchParams();
      urlParams.set('token', token);
      if (candidateId) urlParams.set('candidate_id', candidateId);

      const res = await fetch(`/api/candidate-evaluation?${urlParams.toString()}`);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPhase('error');
        setErrorMessage(payload?.error || 'Error al cargar la evaluación.');
        return;
      }

      const data = payload.tests as any[];
      const validTests = data.filter((item: any) => item.tests !== null);

      if (validTests.length === 0) {
        setPhase('error');
        setErrorMessage('No se encontraron pruebas válidas.');
        return;
      }

      setCandidateTests(validTests);
      const firstPending = validTests.findIndex((item: any) => item.status !== 'completo');
      if (firstPending !== -1) setCurrentTestIndex(firstPending);
      else setPhase('finished');

      setPhase('ready');
    } catch (err: any) {
      setPhase('error');
      setErrorMessage(err?.message || 'Error inesperado.');
    }
  }, [token, candidateId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const currentResult = candidateTests[currentTestIndex];
  const currentTest = currentResult?.tests;

  const getTestIdentifier = () => {
    const rawType = (currentTest?.type || '').toLowerCase();
    const rawName = (currentTest?.name || '').toLowerCase();
    if (rawType.includes('raven') || rawName.includes('raven')) return 'raven';
    if (rawType.includes('cleaver') || rawName.includes('cleaver')) return 'cleaver';
    if (rawType.includes('nom-035') || rawType.includes('nom035') || rawName.includes('nom-035') || rawName.includes('integral'))
      return 'nom-035-integral';
    if (rawType.includes('terman') || rawName.includes('terman') || rawName.includes('merrill'))
      return 'terman';
    return rawType || 'terman';
  };

  const testType = getTestIdentifier();

  const handleTestComplete = async (answers: Record<string, any>) => {
    if (!currentResult) return;

    const isLastTest = currentTestIndex === candidateTests.length - 1;

    const res = await fetch('/api/candidate-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resultId: currentResult.id,
        token,
        answers,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (typeof window !== 'undefined') {
        window.alert('Ocurrió un error al guardar tus respuestas. Inténtalo de nuevo.');
      }
      throw new Error(payload?.error || 'Error al guardar respuestas.');
    }

    setCandidateTests((prev) =>
      prev.map((item, idx) => (idx === currentTestIndex ? { ...item, status: 'completo' } : item))
    );

    if (!isLastTest) {
      setCurrentTestIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPhase('finished');
    }
  };

  const renderActiveTest = () => {
    const viewKey = `${currentResult?.id ?? 'test'}-${currentTestIndex}`;
    switch (testType) {
      case 'cleaver':
        return <CleaverView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />;
      case 'nom-035-integral':
        return <Nom035IntegralView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />;
      case 'raven':
        return <RavenView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />;
      case 'terman':
      default:
        return <TermanView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />;
    }
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <p className="animate-pulse text-[#123440] font-semibold">Cargando evaluación...</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#123440] mb-2">Error al cargar la evaluación</h2>
        <p className="text-sm text-slate-600 max-w-md">{errorMessage}</p>
      </div>
    );
  }

  if (phase === 'finished') {
    const completedTestsNames = candidateTests.map((t) => t?.tests?.name).filter(Boolean);
    return (
      <TestFinalizedView
        testNames={completedTestsNames}
        onGoHome={() => {
          localStorage.removeItem('candidato_id');
          localStorage.removeItem('candidato_nombre');
          localStorage.removeItem('candidato_apellido_paterno');
          localStorage.removeItem('candidato_apellido_materno');
          localStorage.removeItem('token_actual');
          window.location.href = '/';
        }}
      />
    );
  }

  return (
    <ResolverErrorBoundary>
      {currentTest ? (
        renderActiveTest()
      ) : (
        <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-[#123440] mb-2">Evaluación no disponible</h2>
          <p className="text-sm text-slate-600 max-w-md">No se encontró un test válido para este enlace.</p>
        </div>
      )}
    </ResolverErrorBoundary>
  );
}