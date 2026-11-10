"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  urlDestino: string;
  fecha?: string;
  tipo: 'registro';
}

export default function NotificadorTiempoReal() {
  const [listaNotificaciones, setListaNotificaciones] = useState<NotificacionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    const inicializarSistema = async () => {
      try {
        setLoading(true);

        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }

        // 2. Verificar si el usuario actual es ADMIN consultando la tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError || !profileData || profileData.role !== 'admin') {
          // Si no es admin, no cargamos notificaciones de registros
          if (isMounted) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        if (isMounted) setIsAdmin(true);

        // 3. Obtener IDs de notificaciones ya descartadas por este admin
        const { data: descartadasData } = await supabase
          .from('notification_dismissals')
          .select('notification_id')
          .eq('user_id', user.id);

        const idsDescartados = new Set(descartadasData?.map((d) => d.notification_id) || []);

        // 4. Consultar los perfiles registrados recientemente (últimos 20)
        const { data: perfilesRecientes, error: errorPerfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        const notifsIniciales: NotificacionItem[] = [];

        if (!errorPerfiles && perfilesRecientes) {
          perfilesRecientes.forEach((perfil: any) => {
            const idNotif = `profile-reg-${perfil.id}`;
            
            if (!idsDescartados.has(idNotif)) {
              notifsIniciales.push({
                id: idNotif,
                titulo: 'Nuevo Registro',
                mensaje: `El usuario ${perfil.full_name || perfil.email || 'Nuevo integrante'} se ha registrado en el sistema.`,
                urlDestino: `/dashboard/admin`, // Redirige al panel de control de usuarios
                fecha: perfil.created_at,
                tipo: 'registro'
              });
            }
          });
        }

        notifsIniciales.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());

        if (isMounted) {
          setListaNotificaciones(notifsIniciales.slice(0, 15));
          setLoading(false);

          // 5. Suscripción en tiempo real a la tabla 'profiles' para detectar nuevos registros
          channel = supabase
            .channel('realtime_admin_profiles')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'profiles' },
              (payload) => {
                const nuevoPerfil = payload.new as any;
                if (!nuevoPerfil) return;

                const idNotif = `profile-reg-${nuevoPerfil.id}`;
                const nuevaNotif: NotificacionItem = {
                  id: idNotif,
                  titulo: 'Nuevo Registro',
                  mensaje: `El usuario ${nuevoPerfil.full_name || nuevoPerfil.email || 'Nuevo integrante'} se ha registrado en el sistema.`,
                  urlDestino: `/dashboard/admin`,
                  fecha: nuevoPerfil.created_at || new Date().toISOString(),
                  tipo: 'registro'
                };

                setListaNotificaciones((prev) => {
                  if (prev.some((n) => n.id === nuevaNotif.id)) return prev;
                  return [nuevaNotif, ...prev];
                });
              }
            )
            .subscribe();
        }

      } catch (err) {
        console.error("Error al inicializar notificaciones de registros:", err);
        if (isMounted) setLoading(false);
      }
    };

    inicializarSistema();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const manejarClickNotificacion = async (n: NotificacionItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notification_dismissals').insert({
          user_id: user.id,
          notification_id: n.id
        });
      }
    } catch (e) {
      console.error("Error al registrar notificación como vista:", e);
    }

    setListaNotificaciones((prev) => prev.filter((item) => item.id !== n.id));
    router.push(n.urlDestino);
    setIsOpen(false);
  };

  const limpiarTodas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && listaNotificaciones.length > 0) {
        const payloadInserts = listaNotificaciones.map((n) => ({
          user_id: user.id,
          notification_id: n.id
        }));

        await supabase.from('notification_dismissals').upsert(payloadInserts, { onConflict: 'user_id,notification_id' });
      }
    } catch (e) {
      console.error("Error al limpiar notificaciones:", e);
    }

    setListaNotificaciones([]);
  };

  // Si no es admin, no renderizamos el componente de campana
  if (!isAdmin && !loading) {
    return null;
  }

  const totalNoLeidas = listaNotificaciones.length;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer flex items-center justify-center text-[#123440]"
        title="Notificaciones de registros"
      >
        <Bell size={18} />
        {totalNoLeidas > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {totalNoLeidas}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[998] bg-black/10 sm:hidden" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="fixed left-4 right-4 mx-auto top-20 max-w-sm sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[999] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-xs font-bold text-[#123440] uppercase tracking-wider">
                Nuevos Registros ({totalNoLeidas})
              </h4>
              {totalNoLeidas > 0 && (
                <button 
                  type="button"
                  onClick={limpiarTodas}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <p className="p-6 text-xs text-slate-400 text-center">Cargando registros...</p>
              ) : listaNotificaciones.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 text-center">No hay nuevos registros en el sistema.</p>
              ) : (
                listaNotificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => manejarClickNotificacion(n)}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 text-left"
                  >
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-sky-50 text-sky-600">
                      <UserPlus size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#123440]">{n.titulo}</p>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{n.mensaje}</p>
                      {n.fecha && (
                        <span className="text-[9px] text-slate-400 mt-1 block font-mono">
                          {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(n.fecha).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}