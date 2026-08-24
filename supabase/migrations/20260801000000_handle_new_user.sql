-- ============================================================================
-- Garantiza la creación del perfil en `public.profiles` para TODOS los usuarios
-- nuevos, sin importar el método de registro (correo/contraseña o Google OAuth).
-- Hereda el estado por defecto 'pendiente' hasta que un administrador lo autorice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Trigger al INSERTAR un usuario en auth.users (primer registro)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    'aplicador',
    'pendiente'
  )
  -- Importante: si la app ya creó el perfil, NO lo duplicamos ni pisamos su estado
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2) Trigger al ACTUALIZAR un usuario (p. ej. confirmar el correo).
--    Sincroniza email/nombre sin tocar `status` para no revocar autorizaciones.
-- ----------------------------------------------------------------------------
create or replace function public.handle_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, status)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    'pendiente'
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Triggers sobre auth.users
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_sync();

-- ----------------------------------------------------------------------------
-- Índice de apoyo para búsquedas frecuentes por email en profiles
-- ----------------------------------------------------------------------------
create index if not exists profiles_email_idx on public.profiles (email);

-- ============================================================================
-- NOTA sobre Row Level Security (RLS):
--   La función se define como `security definer`, por lo que el INSERT se ejecuta
--   con los permisos de su propietario y crea el perfil aunque RLS esté activo.
--   Si ya tienes RLS habilitado en `profiles`, asegúrate de que el usuario
--   autenticado pueda LEER su propia fila (necesario en /login, /pending-approval
--   y proxy). Ejemplo:
--
--   create policy "Ver perfil propio" on public.profiles for select
--     using (auth.uid() = id);
-- ============================================================================