import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getHomeRouteForRole } from '@/lib/utils/roles';

// Rutas que exigen sesión Y estado 'autorizado'
const PROTECTED_PREFIXES = ['/dashboard'];

// Rutas que comienzan con /dashboard pero son públicas para los candidatos
const PUBLIC_DASHBOARD_EXCEPTIONS = ['/dashboard/iniciar_prueba']; 
// (Si tu ruta tiene otro nombre, por ejemplo '/dashboard/examen', agrégala aquí también en el arreglo)

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

  // 1. SI LA RUTA ES PÚBLICA DEL EXAMEN, LA DEJAMOS PASAR DIRECTAMENTE SIN PEDIR LOGIN
  const isPublicException = PUBLIC_DASHBOARD_EXCEPTIONS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublicException) {
    return response;
  }

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

  // 2. Consultar el estado y el rol del usuario en public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', user.id)
    .maybeSingle();

  // Solo los perfiles 'autorizado' pueden entrar a zonas protegidas.
  const isAuthorized = profile?.status === 'autorizado';

  // 3. En la pantalla de espera, si ya fue autorizado, lo llevamos a su panel según su rol.
  if (pathname === '/pending-approval') {
    if (isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = getHomeRouteForRole(profile?.role);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 4. Usuario YA autenticado y autorizado no debe quedarse en /login
  if (pathname === '/login' && isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = getHomeRouteForRole(profile?.role);
    return NextResponse.redirect(url);
  }

  // 5. El stub genérico /dashboard (y su barra final) no es una vista real:
  if ((pathname === '/dashboard' || pathname === '/dashboard/') && isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = getHomeRouteForRole(profile?.role);
    return NextResponse.redirect(url);
  }

  // 6. Zonas protegidas: bloquear usuarios no autorizados (pendiente o sin perfil)
  if (isProtected && !isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/pending-approval';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/pending-approval/:path*', '/login/:path*'],
};