import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/candidate-evaluation?token=XXX
 *
 * Lee en el SERVIDOR (con SUPABASE_SERVICE_ROLE_KEY, omitiendo RLS)
 * la asignación del candidato por token y el catálogo de preguntas:
 *   candidate_results (por link_acceso) -> tests -> test_questions
 *
 * El candidato no tiene sesión, así que el cliente (anon key) no puede
 * leer estas tablas. Esta ruta es pública (el token es el secreto).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'No se especificó un token de acceso en la URL.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: candidateData, error: candidateError } = await supabase
      .from('candidate_results')
      .select(
        `
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
        `
      )
      .eq('link_acceso', token)
      .order('id', { ascending: true });

    if (candidateError) {
      console.error('[candidate-evaluation] Error consultando asignación:', candidateError.message);
      return NextResponse.json(
        { error: 'Ocurrió un error al consultar la evaluación.' },
        { status: 500 }
      );
    }

    if (!candidateData || candidateData.length === 0) {
      return NextResponse.json(
        { error: 'El enlace no tiene una prueba asignada o el token es inválido.' },
        { status: 404 }
      );
    }

    // Ordenar preguntas de cada test por order_index en el servidor.
    const formatted = candidateData.map((item: any) => {
      if (item.tests?.test_questions) {
        item.tests.test_questions.sort(
          (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        );
      }
      return item;
    });

    const validTests = formatted.filter((item: any) => item.tests !== null);

    if (validTests.length === 0) {
      return NextResponse.json(
        { error: 'La asignación no tiene un test válido vinculado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tests: validTests });
  } catch (err: any) {
    console.error('[candidate-evaluation] Error general:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Ocurrió un error al consultar la evaluación.' },
      { status: 500 }
    );
  }
}
