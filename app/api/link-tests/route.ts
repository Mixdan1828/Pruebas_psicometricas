import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/link-tests?token=XXX
 *
 * Valida el enlace y retorna las pruebas asociadas ordenadas por step_order ASC,
 * incluyendo el video_url de cada test.
 * Usa service role porque el candidato no tiene sesión.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Token no especificado.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Validar que el enlace exista
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, token')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'El enlace de evaluación no existe o es inválido.' },
        { status: 404 }
      );
    }

    // 2. Obtener link_tests JOIN tests con video_url, ordenado por step_order ASC
    const { data: linkTests, error: testsError } = await supabase
      .from('link_tests')
      .select(`
        step_order,
        tests (
          id,
          name,
          video_url
        )
      `)
      .eq('link_id', link.id)
      .order('step_order', { ascending: true });

    if (testsError) {
      return NextResponse.json(
        { error: testsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ link_tests: linkTests || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error al cargar las pruebas del enlace.' },
      { status: 500 }
    );
  }
}