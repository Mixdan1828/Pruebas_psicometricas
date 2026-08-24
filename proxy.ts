import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas que exigen sesión Y estado 'autorizado'
const PROTECTED_PREFIXES = ['/dashboard'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Protect: redirect de rutas privadas o de la pantalla de espera sin sesión => /login
  if (!user) {
    if (isProtected || pathname === '/pending-approval') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 2. Consultar el estado del usuario en public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();

  // Solo los perfiles 'autorizado' pueden entrar a zonas protegidas
  const isAuthorized = profile?.status === 'autorizado';

  // 3. En la pantalla de espera, si ya fue autorizado, lo llevamos al dashboard
  if (pathname === '/pending-approval') {
    if (isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 4. Zonas protegidas: bloquear usuarios no autorizados (pendiente o sin perfil)
  if (isProtected && !isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/pending-approval';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/pending-approval/:path*'],
};