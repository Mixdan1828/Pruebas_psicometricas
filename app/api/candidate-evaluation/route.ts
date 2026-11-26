import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/candidate-evaluation?token=XXX
 *
 * Lee en el SERVIDOR (con SUPABASE_SERVICE_ROLE_KEY, omitiendo RLS)
 * la asignación del candidato por token y el catálogo de preguntas.
 *
 * Flujo:
 *   1. Intenta leer candidate_results (ya existen si el candidato se registró).
 *   2. FALLBACK: si no hay candidate_results (token nuevo, primera apertura),
 *      consulta link_tests para obtener las pruebas asignadas al enlace.
 *
 * El candidato no tiene sesión, así que el cliente (anon key) no puede
 * leer estas tablas. Esta ruta es pública (el token es el secreto).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') ?? '').trim();
    const candidate_id = (searchParams.get('candidate_id') ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'No se especificó un token de acceso en la URL.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // ------------------------------------------------------------------
    // 1. Primero intentar obtener resultados existentes del candidato
    // ------------------------------------------------------------------
    let query = supabase
      .from('candidate_results')
      .select(
        `
          id,
          status,
          test_id,
          link_acceso,
          candidate_id,
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
      .eq('link_acceso', token);

    // Filtrar por el candidato actual solo si se proporciona candidate_id.
    // Esto evita devolver resultados de otros usuarios que hayan usado
    // el mismo enlace.
    if (candidate_id) {
      query = query.eq('candidate_id', candidate_id);
    }

    const { data: candidateData, error: candidateError } = await query
      .order('id', { ascending: true });

    if (candidateError) {
      console.error('[candidate-evaluation] Error consultando asignación:', candidateError.message);
      return NextResponse.json(
        { error: 'Ocurrió un error al consultar la evaluación.' },
        { status: 500 }
      );
    }

    // Si hay resultados de candidato, devolverlos (flujo existente para usuarios registrados)
    if (candidateData && candidateData.length > 0) {
      const formatted = candidateData.map((item: any) => {
        if (item.tests?.test_questions) {
          item.tests.test_questions.sort(
            (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
          );
        }
        return item;
      });

      const validTests = formatted.filter((item: any) => item.tests !== null);

      if (validTests.length > 0) {
        return NextResponse.json({ tests: validTests });
      }
    }

    // ------------------------------------------------------------------
    // 2. FALLBACK: token nuevo sin candidate_results aún.
    // Obtener las pruebas asignadas al enlace desde link_tests.
    // ------------------------------------------------------------------
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .single();

    if (!linkError && linkData) {
      const { data: linkedTests, error: testsErr } = await supabase
        .from('link_tests')
        .select(`
          test_id,
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
        .eq('link_id', linkData.id);

      if (!testsErr && linkedTests && linkedTests.length > 0) {
        const formatted = linkedTests.map((item: any) => ({
          id: item.test_id,
          status: 'en_proceso',
          test_id: item.test_id,
          link_acceso: token,
          candidate_id: null,
          answers_json: null,
          tests: item.tests,
        }));

        const validTests = formatted.filter((item: any) => item.tests !== null);

        if (validTests.length > 0) {
          return NextResponse.json({ tests: validTests });
        }
      }
    }

    // ------------------------------------------------------------------
    // 3. No se encontraron pruebas ni en candidate_results ni en link_tests
    // ------------------------------------------------------------------
    return NextResponse.json(
      { error: 'El enlace no tiene una prueba asignada o el token es inválido.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[candidate-evaluation] Error general:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Ocurrió un error al consultar la evaluación.' },
      { status: 500 }
    );
  }
}
