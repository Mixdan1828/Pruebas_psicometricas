'use server';

import { createAdminClient } from "@/lib/supabase/admin";

export async function eliminarUsuarioAdmin(userId: string) {
  // Este cliente usa la service_role_key y solo corre en el servidor
  const supabaseAdmin = createAdminClient();

  // 1. Eliminar al usuario de Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    throw new Error(`Error al eliminar de Auth: ${authError.message}`);
  }

  // 2. Gracias al ON DELETE CASCADE que configuramos antes en la base de datos,
  // el perfil en public.profiles se borrará automáticamente al borrarse de auth.users.
  
  return { success: true };
}