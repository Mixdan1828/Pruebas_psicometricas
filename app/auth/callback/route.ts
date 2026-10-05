import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getHomeRouteForRole } from '@/lib/utils/roles';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // 1. Validar que el código de autorización exista
  if (!code) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'Falta el código de autorización de Google.');
    return NextResponse.redirect(url);
  }

  // 2. Inicializar cliente de servidor de Supabase pasando las cookies
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 3. Intercambiar el `code` por una sesión
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('Error intercambiando código OAuth por sesión:', error?.message);
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'No se pudo completar la autenticación con Google.');
    return NextResponse.redirect(url);
  }

  const userId = data.user.id;

  // 4. Consultar el `status` y el `role` del usuario en public.profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', userId)
    .maybeSingle();

  let profile = existingProfile;

  // 5. Si no existe perfil, crearlo por defecto con estado 'pendiente'
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: data.user.email ?? '',
        full_name: data.user.user_metadata?.full_name || 'Usuario Google',
        role: 'aplicador',
        status: 'pendiente',
      })
      .select('status, role')
      .single();

    if (insertError) {
      console.error('Error creando perfil Google:', insertError.message);
    } else {
      profile = newProfile;
    }
  }

  // 6. Validar estado de aprobación.
  //    IMPORTANTE: el enum `user_status` de tu base de datos usa 'autorizado'
  //    (no 'aprobado') como el valor que concede acceso. Si aquí usáramos
  //    'aprobado' nunca coincidiría y nadie pasaría del /pending-approval.
  const isApproved = profile?.status === 'autorizado';

  if (!isApproved) {
    return NextResponse.redirect(new URL('/pending-approval', origin));
  }

  // 7. Redirigir inteligentemente según el rol asignado.
  //    Usamos el mismo helper que /login y proxy.ts para que el mapeo
  //    rol -> ruta sea consistente en toda la app.
  const homeRoute = getHomeRouteForRole(profile?.role);
  return NextResponse.redirect(new URL(homeRoute, origin));
}