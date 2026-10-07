import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/candidate-link?token=XXX
 *
 * Valida en el SERVIDOR (con SUPABASE_SERVICE_ROLE_KEY, omitiendo RLS)
 * que el token exista en `links` y tenga cupo disponible.
 * El candidato no tiene sesión: la anon key no puede leer `links`.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Token no especificado en la URL.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: linkData, error } = await supabase
      .from('links')
      .select('id, token, max_users, current_users')
      .eq('token', token)
      .single();

    if (error || !linkData) {
      return NextResponse.json(
        { error: 'El enlace de evaluación no existe o es inválido.' },
        { status: 404 }
      );
    }

    const currentUsers = linkData.current_users ?? 0;
    const maxUsers = linkData.max_users ?? 0;

    if (currentUsers >= maxUsers) {
      return NextResponse.json(
        { error: 'El límite de participantes para esta evaluación ha sido alcanzado.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ link: linkData });
  } catch (err: any) {
    console.error('[candidate-link] Error general:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Ocurrió un error al validar el enlace.' },
      { status: 500 }
    );
  }
}
