import { createClient } from '@supabase/supabase-js';
import type { Database } from './database';

/**
 * Cliente de Supabase con SERVICE ROLE (solo servidor).
 *
 * Omite las restricciones de RLS: úsalo ÚNICAMENTE en Route Handlers
 * o Server Components para el flujo público de candidatos (sin sesión),
 * que de otro modo no podría leer `links`, `link_tests`, `candidate_results`,
 * `tests` ni `test_questions` con la anon key.
 *
 * NUNCA importes este módulo desde un Client Component ("use client"),
 * pues expondría la service role key en el navegador.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Falta configuración del servidor: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
