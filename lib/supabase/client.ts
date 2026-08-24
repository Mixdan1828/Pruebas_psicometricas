import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database';

// Cliente de navegador: es seguro compartir UNA sola instancia en toda la app,
// pues su estado de sesión vive en las cookies del usuario, no en el objeto.
// Guardarlo en `globalThis` evita que el Hot Reload de Next.js en desarrollo
// (o cada render de un Server/Client Component) cree instancias duplicadas.
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

const globalForSupabase = globalThis as unknown as {
  supabaseBrowserClient?: SupabaseBrowserClient;
};

export const createClient = (): SupabaseBrowserClient => {
  // Singleton: reutiliza la instancia existente si el Hot Reload ya la creó.
  if (!globalForSupabase.supabaseBrowserClient) {
    globalForSupabase.supabaseBrowserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return globalForSupabase.supabaseBrowserClient;
};