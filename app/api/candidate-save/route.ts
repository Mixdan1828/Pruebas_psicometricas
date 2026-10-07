import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface SaveBody {
  resultId?: string;
  token?: string;
  answers?: Record<string, any>;
}

/**
 * POST /api/candidate-save
 *
 * Guarda las respuestas del candidato en el SERVIDOR
 * (con SUPABASE_SERVICE_ROLE_KEY, omitiendo RLS):
 * actualiza `candidate_results` con answers_json + status completo.
 * El candidato no tiene sesión, así que la anon key no puede hacer el UPDATE.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SaveBody;
    const resultId = (body.resultId ?? '').trim();
    const token = (body.token ?? '').trim();
    const answers = body.answers ?? {};

    if (!resultId) {
      return NextResponse.json(
        { error: 'Falta el identificador del resultado.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que el resultado exista (y pertenezca al token si se envía)
    let query = supabase.from('candidate_results').select('id, link_acceso').eq('id', resultId).single();
    const { data: existing, error: fetchErr } = await query;

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Resultado no encontrado.' },
        { status: 404 }
      );
    }

    if (token && (existing as any).link_acceso !== token) {
      return NextResponse.json(
        { error: 'El resultado no corresponde a este enlace.' },
        { status: 403 }
      );
    }

    const { error: updateErr } = await supabase
      .from('candidate_results')
      .update({
        answers_json: answers,
        status: 'completo',
        completed_at: new Date().toISOString(),
      } as any)
      .eq('id', resultId);

    if (updateErr) {
      console.error('[candidate-save] Error actualizando:', updateErr.message);
      return NextResponse.json(
        { error: `Error al guardar respuestas: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[candidate-save] Error general:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Error al guardar respuestas.' },
      { status: 500 }
    );
  }
}
