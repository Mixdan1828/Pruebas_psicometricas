"use client";

import { Component, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import TermanView from '../../../../tests/termanView';
import CleaverView from '../../../../tests/CleaverView';
import Nom035IntegralView from '../../../../tests/Nom035IntegralView';
import TestFinalizedView from '../../../../tests/TestFinalizedView';
import RavenView from '../../../../tests/RavenView';

/* ------------------------------------------------------------------ */
/* ErrorBoundary: evita pantalla en blanco ante errores de renderizado */
/* ------------------------------------------------------------------ */
class ResolverErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[resolver] Error de renderizado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center text-center p-6 font-body text-slate-700">
          <h2 className="text-xl font-bold text-red-600 mb-2">Ocurrió un error al mostrar la prueba</h2>
          <p className="text-sm max-w-md mb-6">
            No se pudo cargar la interfaz del test. Recarga la página o contacta al administrador
            si el problema persiste.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#416912] text-white font-bold hover:bg-[#34540e] cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Normaliza el segmento [token] (string o arreglo) a un string plano. */
function resolveToken(segment: unknown): string {
  if (Array.isArray(segment)) return String(segment[0] ?? '');
  if (typeof segment === 'string') return segment;
  if (segment !== null && segment !== undefined) return String(segment);
  return '';
}

/* Fases explícitas de la pantalla: carga, lista, error o no encontrado. */
type FetchPhase = 'loading' | 'ready' | 'error' | 'not_found';

export default function ResolverOrchestrator() {
  const params = useParams();
  const token = resolveToken(params?.token);

  const [candidateTests, setCandidateTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [phase, setPhase] = useState<FetchPhase>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [patientName, setPatientName] = useState('Candidato');

  // Recupera el nombre del candidato capturado en el registro (flujo temporal entre pantallas)
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('candidato_nombre');
    if (saved) setPatientName(saved);
  }, []);

  const loadTests = useCallback(async () => {
    console.log('[resolver] Token recibido desde URL:', token);
    setPhase('loading');
    setErrorMessage('');

    if (!token) {
      console.warn('[resolver] Token vacío o ausente en la URL.');
      setPhase('not_found');
      setErrorMessage('No se especificó un token de acceso en la URL.');
      return;
    }

    try {
      const res = await fetch(`/api/candidate-evaluation?token=${encodeURIComponent(token)}`);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.warn('[resolver] Evaluación no disponible:', payload?.error);
        setPhase('not_found');
        setErrorMessage(
          payload?.error || 'El enlace no tiene una prueba asignada o el token es inválido.'
        );
        return;
      }

      const candidateData = payload.tests as any[];

      if (!candidateData || candidateData.length === 0) {
        console.warn('[resolver] No se encontraron asignaciones para el token:', token);
        setPhase('not_found');
        setErrorMessage('El enlace no tiene una prueba asignada o el token es inválido.');
        return;
      }

      const validTests = candidateData.filter((item: any) => item.tests !== null);

      if (validTests.length === 0) {
        console.error("[resolver] Los registros existen pero no tienen un 'test_id' asignado o válido.");
        setPhase('not_found');
        setErrorMessage('La asignación no tiene un test válido vinculado.');
        return;
      }

      setCandidateTests(validTests);

      const firstPendingIndex = validTests.findIndex((item: any) => item.status !== 'completo');

      if (firstPendingIndex !== -1) {
        setCurrentTestIndex(firstPendingIndex);
      } else {
        setIsFinished(true);
      }

      setPhase('ready');
    } catch (err: any) {
      console.error('[resolver] Error general al cargar la evaluación:', err);
      setPhase('error');
      setErrorMessage(err?.message || 'Ocurrió un error al consultar la evaluación.');
    }
  }, [token]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const currentResult = candidateTests[currentTestIndex];
  const currentTest = currentResult?.tests;

  // Detección robusta del tipo de test considerando tanto el campo type como el nombre
  const getTestIdentifier = () => {
    const rawType = (currentTest?.type || '').toLowerCase();
    const rawName = (currentTest?.name || '').toLowerCase();
    
    if (rawType.includes('raven') || rawName.includes('raven')) return 'raven';
    if (rawType.includes('cleaver') || rawName.includes('cleaver')) return 'cleaver';
    if (rawType.includes('nom-035') || rawType.includes('nom035') || rawName.includes('nom-035') || rawName.includes('integral')) return 'nom-035-integral';
    if (rawType.includes('terman') || rawName.includes('terman') || rawName.includes('merrill')) return 'terman';
    
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
      console.error('[resolver] Error al guardar respuestas de la prueba:', payload?.error);
      if (typeof window !== 'undefined') {
        window.alert('Ocurrió un error al guardar tus respuestas. Inténtalo de nuevo.');
      }
      throw new Error(payload?.error || 'Error al guardar respuestas.');
    }

    setCandidateTests((prev) =>
      prev.map((item, idx) =>
        idx === currentTestIndex ? { ...item, status: 'completo' } : item
      )
    );

    if (!isLastTest) {
      setCurrentTestIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFinished(true);
    }
  };

  const renderActiveTest = () => {
    console.log('[resolver] Seleccionando componente... tipo detectado:', testType, '| test:', currentTest?.name);
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

  return (
    <ResolverErrorBoundary>
      {phase === 'loading' && (
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center font-body text-slate-600">
          <p className="animate-pulse font-semibold">Cargando evaluación...</p>
        </div>
      )}

      {phase === 'not_found' && (
        <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center font-body text-slate-600 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-600 mb-2">Evaluación no disponible</h2>
          <p className="text-sm max-w-md">
            {errorMessage || 'No hay pruebas asignadas a este enlace o el token es inválido. Verifica que la prueba esté correctamente vinculada al candidato.'}
          </p>
          <button
            type="button"
            onClick={() => loadTests()}
            className="mt-6 px-6 py-3 rounded-xl bg-[#416912] text-white font-bold hover:bg-[#34540e] cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center font-body text-slate-700 p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar la evaluación</h2>
          <p className="text-sm max-w-md">{errorMessage || 'Ocurrió un problema inesperado.'}</p>
          <button
            type="button"
            onClick={() => loadTests()}
            className="mt-6 px-6 py-3 rounded-xl bg-[#416912] text-white font-bold hover:bg-[#34540e] cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {phase === 'ready' && (
        isFinished ? (
          (() => {
            const completedTestsNames = candidateTests
              .map((t) => t?.tests?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <TestFinalizedView
                patientName={patientName}
                testNames={completedTestsNames}
                onGoHome={() => window.location.href = '/'}
              />
            );
          })()
        ) : (
          currentTest ? renderActiveTest() : (
            <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center font-body text-slate-600 p-6 text-center">
              <h2 className="text-xl font-bold text-[#123440] mb-2">Evaluación no disponible</h2>
              <p className="text-sm max-w-md">
                No se encontró un test válido para este enlace.
              </p>
            </div>
          )
        )
      )}
    </ResolverErrorBoundary>
  );
}