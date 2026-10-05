"use client";

import { Component, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TermanView from '@/componentes/tests/termanView';
import CleaverView from '@/componentes/tests/CleaverView';
import Nom035IntegralView from '@/componentes/tests/Nom035IntegralView';
import TestFinalizedView from '@/componentes/tests/TestFinalizedView';

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
  const supabase = createClient();

  const [candidateTests, setCandidateTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [phase, setPhase] = useState<FetchPhase>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);

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
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidate_results')
        .select(`
          id, 
          status, 
          test_id, 
          link_acceso, 
          answers_json,
          tests (
            id,
            name,
            type,
            tiempo,
            test_questions (
              id,
              order_index,
              content_jsonb
            )
          )
        `)
        .eq('link_acceso', token)
        .order('id', { ascending: true });

      console.log('[resolver] Respuesta de candidate_results:', { candidateData, candidateError });

      if (candidateError) {
        throw new Error(candidateError.message);
      }

      if (!candidateData || candidateData.length === 0) {
        console.warn('[resolver] No se encontraron asignaciones para el token:', token);
        setPhase('not_found');
        setErrorMessage('El enlace no tiene una prueba asignada o el token es inválido.');
        return;
      }

      // Ordenamos las preguntas de cada test por order_index
      const formattedData = candidateData.map((item: any) => {
        if (item.tests?.test_questions) {
          item.tests.test_questions.sort(
            (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
          );
        }
        return item;
      });

      const validTests = formattedData.filter((item: any) => item.tests !== null);

      if (validTests.length === 0) {
        console.error("[resolver] Los registros existen pero no tienen un 'test_id' asignado o válido.");
        setPhase('not_found');
        setErrorMessage('La asignación no tiene un test válido vinculado.');
        return;
      }

      setCandidateTests(validTests);

      // Posicionar directamente en la primera prueba pendiente (no completada)
      const firstPendingIndex = validTests.findIndex((item: any) => item.status !== 'completo');

      if (firstPendingIndex !== -1) {
        setCurrentTestIndex(firstPendingIndex);
      } else {
        // Si todas están completas en BD, mostrar vista final
        setIsFinished(true);
      }

      setPhase('ready');
    } catch (err: any) {
      console.error('[resolver] Error general al cargar la evaluación:', err);
      setPhase('error');
      setErrorMessage(err?.message || 'Ocurrió un error al consultar la evaluación.');
    }
  }, [token, supabase]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const currentResult = candidateTests[currentTestIndex];
  const currentTest = currentResult?.tests;
  const testType = (currentTest?.type || 'terman').toLowerCase();

  const handleTestComplete = async (answers: Record<string, any>) => {
    if (!currentResult) return;

    const isLastTest = currentTestIndex === candidateTests.length - 1;

    // 1. Cada prueba finalizada cambia su propio estado a 'completo'
    const { error } = await supabase
      .from('candidate_results')
      .update({
        answers_json: answers,
        status: 'completo',
        completed_at: new Date().toISOString()
      })
      .eq('id', currentResult.id);

    if (error) {
      console.error("[resolver] Error al guardar respuestas de la prueba:", error.message);
      if (typeof window !== 'undefined') {
        window.alert("Ocurrió un error al guardar tus respuestas. Inténtalo de nuevo.");
      }
      throw new Error(`Error al guardar respuestas: ${error.message}`);
    }

    // 2. Actualizar el estado local para reflejar que esta prueba ya se completó
    setCandidateTests((prev) =>
      prev.map((item, idx) =>
        idx === currentTestIndex ? { ...item, status: 'completo' } : item
      )
    );

    // 3. Avanzar a la siguiente prueba o finalizar la sesión completa
    if (!isLastTest) {
      setCurrentTestIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFinished(true);
    }
  };

  // Selecciona y renderiza la vista según el tipo detectado.
  // Mantiene Cleaver, Terman y las Guías NOM-035 existentes intactos.
  const renderActiveTest = () => {
    console.log('[resolver] Seleccionando componente... tipo:', testType, '| test:', currentTest?.name);

    switch (testType) {
      case 'cleaver':
        return <CleaverView key={currentResult.id} testData={currentTest} onComplete={handleTestComplete} />;
      case 'nom-035-integral':
        return <Nom035IntegralView key={currentResult.id} testData={currentTest} onComplete={handleTestComplete} />;
      case 'terman':
      default:
        // fallback seguro para Terman y cualquier otro tipo no registrado explícitamente
        return <TermanView key={currentResult.id} testData={currentTest} onComplete={handleTestComplete} />;
    }
  };

  return (
    <ResolverErrorBoundary>
      {/* CARGA */}
      {phase === 'loading' && (
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center font-body text-slate-600">
          <p className="animate-pulse font-semibold">Cargando evaluación...</p>
        </div>
      )}

      {/* NO ENCONTRADO */}
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

      {/* ERROR */}
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

      {/* LISTO: vista final o test activo */}
      {phase === 'ready' && (
        isFinished ? (
          (() => {
            const completedTestsNames = candidateTests
              .map((t) => t?.tests?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <TestFinalizedView
                patientName="Candidato"
                testNames={completedTestsNames}
                timeElapsed="Completado con éxito"
                onGoHome={() => window.location.href = '/'}
                onClose={() => setIsFinished(false)}
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