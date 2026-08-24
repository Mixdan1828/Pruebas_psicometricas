"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TermanView from '@/componentes/tests/termanView';
import CleaverView from '@/componentes/tests/CleaverView';
import TestFinalizedView from '@/componentes/tests/TestFinalizedView';

export default function ResolverOrchestrator() {
  const params = useParams();
  const token = params?.token as string;
  const supabase = createClient();

  const [candidateTests, setCandidateTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      if (!token) return;

      try {
        setLoading(true);

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

        if (candidateError) {
          console.error("Error al consultar candidate_results:", candidateError.message);
          setLoading(false);
          return;
        }

        if (!candidateData || candidateData.length === 0) {
          console.warn("No se encontraron resultados para el token:", token);
          setLoading(false);
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
          console.error("Los registros existen pero no tienen un 'test_id' asignado o válido.");
          setLoading(false);
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

      } catch (err) {
        console.error("Error general al cargar la evaluación:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [token, supabase]);

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
      console.error("Error al guardar respuestas de la prueba:", error.message);
      return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center font-body text-slate-600">
        <p className="animate-pulse font-semibold">Cargando evaluación...</p>
      </div>
    );
  }

  if (candidateTests.length === 0 || (!currentTest && !isFinished)) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center font-body text-slate-600 p-6 text-center">
        <h2 className="text-xl font-bold text-[#123440] mb-2">Evaluación no disponible</h2>
        <p className="text-sm max-w-md">
          No hay pruebas asignadas a este enlace o el token es inválido. Verifica que la prueba esté correctamente vinculada al candidato.
        </p>
      </div>
    );
  }

  if (isFinished) {
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
  }

  switch (testType) {
    case 'cleaver':
      return <CleaverView testData={currentTest} onComplete={handleTestComplete} />;
    case 'terman':
    default:
      return <TermanView testData={currentTest} onComplete={handleTestComplete} />;
  }
}