import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RegisterBody {
  token?: string;
  linkId?: string;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  edad?: string | number;
  genero?: string;
  sede?: string;
  estado_civil?: string;
  escolaridad?: string;
}

/**
 * POST /api/candidate-register
 *
 * Registra al candidato en el SERVIDOR (con SUPABASE_SERVICE_ROLE_KEY,
 * omitiendo RLS): verifica cupo en `links`, lee `link_tests`, crea el
 * `candidate`, crea los `candidate_results` y actualiza `current_users`.
 * Todo con service role porque el candidato no tiene sesión.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegisterBody;
    const token = (body.token ?? '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Token no especificado.' },
        { status: 400 }
      );
    }

    const nombre = (body.nombre ?? '').trim();
    const apellidoPaterno = (body.apellido_paterno ?? '').trim();
    const apellidoMaterno = (body.apellido_materno ?? '').trim();
    const edad = Number(body.edad);
    const genero = (body.genero ?? '').trim();
    const sede = (body.sede ?? '').trim();
    const estadoCivil = (body.estado_civil ?? '').trim();
    const escolaridad = (body.escolaridad ?? '').trim();

    if (
      !nombre ||
      !apellidoPaterno ||
      !Number.isFinite(edad) ||
      edad <= 0 ||
      !genero ||
      !sede ||
      !estadoCivil ||
      !escolaridad
    ) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios del registro.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Verificar estado actual de cupos del enlace
    const { data: currentLinkStatus, error: checkErr } = await supabase
      .from('links')
      .select('id, current_users, max_users, created_by')
      .eq('token', token)
      .single();

    if (checkErr || !currentLinkStatus) {
      return NextResponse.json(
        { error: 'El enlace de evaluación no existe o es inválido.' },
        { status: 404 }
      );
    }

    const activeUsers = currentLinkStatus.current_users ?? 0;
    const limitUsers = currentLinkStatus.max_users ?? 0;

    if (activeUsers >= limitUsers) {
      return NextResponse.json(
        { error: 'El límite de usuarios se alcanzó justo antes de tu registro.' },
        { status: 403 }
      );
    }

    if (!currentLinkStatus.created_by) {
      return NextResponse.json(
        { error: 'La liga o token de la prueba no es válida.' },
        { status: 404 }
      );
    }

    // 2. Obtener las pruebas asociadas al enlace
    const { data: linkedTests, error: testsErr } = await supabase
      .from('link_tests')
      .select('test_id')
      .eq('link_id', currentLinkStatus.id);

    if (testsErr || !linkedTests || linkedTests.length === 0) {
      return NextResponse.json(
        { error: 'No hay pruebas configuradas o asociadas a este enlace.' },
        { status: 404 }
      );
    }

    // 3. Crear el registro del candidato
    const { data: nuevoCandidato, error: errorCandidate } = await supabase
      .from('candidates')
      .insert({
        full_name: nombre,
        paternal_surname: apellidoPaterno,
        maternal_surname: apellidoMaterno,
        age: edad,
        sex: genero,
        headquarter: sede,
        marital_status: estadoCivil,
        education_level: escolaridad,
      } as any)
      .select('id')
      .single();

    if (errorCandidate || !nuevoCandidato) {
      console.error('[candidate-register] Error creando candidato:', errorCandidate?.message);
      return NextResponse.json(
        { error: `Error en datos del candidato: ${errorCandidate?.message || 'No se generó ID'}` },
        { status: 500 }
      );
    }

    // 4. Crear los registros en candidate_results para cada test asociado
    const resultsToInsert = linkedTests.map((item) => ({
      candidate_id: nuevoCandidato.id,
      test_id: item.test_id,
      user_id: currentLinkStatus.created_by,
      status: 'en_proceso',
      started_at: new Date().toISOString(),
      link_acceso: token,
    }));

    const { error: errorResult } = await supabase
      .from('candidate_results')
      .insert(resultsToInsert as any);

    if (errorResult) {
      console.error('[candidate-register] Error creando candidate_results:', errorResult.message);
      return NextResponse.json(
        { error: `Error al iniciar examen: ${errorResult.message}` },
        { status: 500 }
      );
    }

    // 5. Incrementar el contador de usuarios registrados en el enlace
    const { error: errorUpdateLink } = await supabase
      .from('links')
      .update({ current_users: activeUsers + 1 } as any)
      .eq('id', currentLinkStatus.id);

    if (errorUpdateLink) {
      console.error('[candidate-register] Error actualizando cupos:', errorUpdateLink.message);
      return NextResponse.json(
        { error: `Error al actualizar cupos: ${errorUpdateLink.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, candidateId: nuevoCandidato.id });
  } catch (err: any) {
    console.error('[candidate-register] Error general:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Error al procesar el registro.' },
      { status: 500 }
    );
  }
}
