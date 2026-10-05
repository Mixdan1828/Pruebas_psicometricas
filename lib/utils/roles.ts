/**
 * Mapeo centralizado de ROL -> ruta de inicio en el dashboard.
 *
 * Mantén aquí la única fuente de verdad de a dónde debe ir cada rol
 * después de iniciar sesión. Así /login, proxy.ts y el callback OAuth
 * usan exactamente la misma lógica y no varían entre sí.
 *
 * Roles actuales de la plataforma:
 *  - 'admin'      -> /dashboard/admin
 *  - 'aplicador'  -> /dashboard/aplicador_de_pruebas
 */
export const ROLE_HOME_ROUTES: Record<string, string> = {
  admin: '/dashboard/admin',
  aplicador: '/dashboard/aplicador_de_pruebas',
  // Ejemplo listo para extender si en el futuro se agrega un rol 'evaluador':
  // evaluador: '/dashboard/resultados',
};

/**
 * Ruta de respaldo para roles desconocidos, nulos o perfiles sin rol.
 * En la app el rol por defecto al crear un perfil es 'aplicador',
 * por lo que usamos su home como destino seguro.
 */
export const DEFAULT_HOME_ROUTE = '/dashboard/aplicador_de_pruebas';

/**
    Devuelve la ruta de inicio correspondiente al rol del usuario.
    Nunca devuelve undefined: ante un rol inesperado o ausente cae
    en DEFAULT_HOME_ROUTE.
**/
export function getHomeRouteForRole(role?: string | null): string {
  if (role && ROLE_HOME_ROUTES[role]) {
    return ROLE_HOME_ROUTES[role];
  }
  return DEFAULT_HOME_ROUTE;
}