"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, UserPlus, FileCheck, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  urlDestino: string;
  fecha?: string;
  tipo: 'registro' | 'test_iniciado' | 'test_completado';
}

export default function NotificadorTiempoReal() {
  const [listaNotificaciones, setListaNotificaciones] = useState<NotificacionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'aplicador' | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let profilesChannel: any;
    let resultsChannel: any;

    const inicializarSistema = async () => {
      try {
        setLoading(true);

        // 1. Obtener usuario autenticado actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }

        // 2. Verificar el rol del usuario consultando la tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError || !profileData || !['admin', 'aplicador'].includes(profileData.role ?? '')) {
          if (isMounted) {
            setUserRole(null);
            setLoading(false);
          }
          return;
        }

        const rol = profileData.role as 'admin' | 'aplicador';
        if (isMounted) setUserRole(rol);

        // 3. Obtener IDs de notificaciones ya descartadas por este usuario
        const { data: descartadasData } = await supabase
          .from('notification_dismissals')
          .select('notification_id')
          .eq('user_id', user.id);

        const idsDescartados = new Set(descartadasData?.map((d) => d.notification_id) || []);
        const notifsIniciales: NotificacionItem[] = [];

        // ==========================================
        // FLUJO PARA ADMINISTRADOR: Nuevos Registros
        // ==========================================
        if (rol === 'admin') {
          const { data: perfilesRecientes, error: errorPerfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

          if (!errorPerfiles && perfilesRecientes) {
            perfilesRecientes.forEach((perfil: any) => {
              const idNotif = `profile-reg-${perfil.id}`;
              if (!idsDescartados.has(idNotif)) {
                notifsIniciales.push({
                  id: idNotif,
                  titulo: 'Nuevo Registro',
                  mensaje: `El usuario ${perfil.full_name || perfil.email || 'Nuevo integrante'} se ha registrado en el sistema.`,
                  urlDestino: `/dashboard/admin`,
                  fecha: perfil.created_at,
                  tipo: 'registro'
                });
              }
            });
          }

          // Suscripción en tiempo real para nuevos registros
          profilesChannel = supabase
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

        // ==========================================
        // FLUJO PARA APLICADOR: Tests Iniciados y Completados
        // ==========================================
        if (rol === 'aplicador') {
          // Consultar candidate_results uniendo con candidates y tests
          const { data: resultadosRecientes, error: errorResultados } = await supabase
            .from('candidate_results')
            .select(`
              id,
              status,
              updated_at,
              created_at,
              user_id,
              candidates (full_name, paternal_surname, maternal_surname),
              tests (name)
            `)
            .eq('user_id', user.id)
            .in('status', ['en_proceso', 'completo'])
            .order('updated_at', { ascending: false })
            .limit(25);

          if (!errorResultados && resultadosRecientes) {
            resultadosRecientes.forEach((item: any) => {
              const candidatoObj = item.candidates;
              const nombreCandidato = candidatoObj 
                ? [candidatoObj.full_name, candidatoObj.paternal_surname, candidatoObj.maternal_surname].filter(Boolean).join(' ')
                : 'Candidato';

              const nombreTest = item.tests?.name || 'Evaluación Psicométrica';
              const timestamp = item.updated_at || item.created_at;

              if (item.status === 'en_proceso') {
                const idNotif = `test-proc-${item.id}`;
                if (!idsDescartados.has(idNotif)) {
                  notifsIniciales.push({
                    id: idNotif,
                    titulo: 'Test Iniciado',
                    mensaje: `El candidato ${nombreCandidato} ha comenzado la evaluación: ${nombreTest}.`,
                    urlDestino: `/dashboard/aplicador_de_pruebas`,
                    fecha: timestamp,
                    tipo: 'test_iniciado'
                  });
                }
              } else if (item.status === 'completo') {
                const idNotif = `test-comp-${item.id}`;
                if (!idsDescartados.has(idNotif)) {
                  notifsIniciales.push({
                    id: idNotif,
                    titulo: 'Test Completado',
                    mensaje: `El candidato ${nombreCandidato} ha finalizado la evaluación: ${nombreTest}.`,
                    urlDestino: `/dashboard/aplicador_de_pruebas`,
                    fecha: timestamp,
                    tipo: 'test_completado'
                  });
                }
              }
            });
          }

          // Suscripción en tiempo real a candidate_results para este aplicador
          resultsChannel = supabase
            .channel(`realtime_aplicador_results_${user.id}`)
            .on(
              'postgres_changes',
              { 
                event: '*', // Escucha INSERT y UPDATE para detectar cambios de estado
                schema: 'public', 
                table: 'candidate_results',
                filter: `user_id=eq.${user.id!}`
              },
              async (payload) => {
                const nuevoReg = payload.new as any;
                if (!nuevoReg || !['en_proceso', 'completo'].includes(nuevoReg.status)) return;

                // Consultar nombre del candidato y de la prueba para enriquecer el mensaje en tiempo real
                const [{ data: candData }, { data: testData }] = await Promise.all([
                  supabase.from('candidates').select('full_name, paternal_surname, maternal_surname').eq('id', nuevoReg.candidate_id).maybeSingle(),
                  supabase.from('tests').select('name').eq('id', nuevoReg.test_id).maybeSingle()
                ]);

                const nombreCandidato = candData 
                  ? [candData.full_name, candData.paternal_surname, candData.maternal_surname].filter(Boolean).join(' ')
                  : 'Candidato';
                const nombreTest = testData?.name || 'Evaluación Psicométrica';

                const esProceso = nuevoReg.status === 'en_proceso';
                const idNotif = esProceso ? `test-proc-${nuevoReg.id}` : `test-comp-${nuevoReg.id}`;
                
                const nuevaNotif: NotificacionItem = {
                  id: idNotif,
                  titulo: esProceso ? 'Test Iniciado' : 'Test Completado',
                  mensaje: esProceso 
                    ? `El candidato ${nombreCandidato} ha comenzado la evaluación: ${nombreTest}.`
                    : `El candidato ${nombreCandidato} ha finalizado la evaluación: ${nombreTest}.`,
                  urlDestino: `/dashboard/aplicador_de_pruebas`,
                  fecha: nuevoReg.updated_at || nuevoReg.created_at || new Date().toISOString(),
                  tipo: esProceso ? 'test_iniciado' : 'test_completado'
                };

                setListaNotificaciones((prev) => {
                  // Evitar duplicados si ya existe la notificación
                  const filtered = prev.filter((n) => n.id !== nuevaNotif.id);
                  return [nuevaNotif, ...filtered];
                });
              }
            )
            .subscribe();
        }

        notifsIniciales.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());

        if (isMounted) {
          setListaNotificaciones(notifsIniciales.slice(0, 15));
          setLoading(false);
        }

      } catch (err) {
        console.error("Error al inicializar notificaciones:", err);
        if (isMounted) setLoading(false);
      }
    };

    inicializarSistema();

    return () => {
      isMounted = false;
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (resultsChannel) supabase.removeChannel(resultsChannel);
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

  if (!userRole && !loading) {
    return null;
  }

  const totalNoLeidas = listaNotificaciones.length;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer flex items-center justify-center text-[#123440]"
        title="Notificaciones"
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
                {userRole === 'admin' ? 'Nuevos Registros' : 'Actividad de Evaluaciones'} ({totalNoLeidas})
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
                <p className="p-6 text-xs text-slate-400 text-center">Cargando notificaciones...</p>
              ) : listaNotificaciones.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 text-center">
                  {userRole === 'admin' ? 'No hay nuevos registros en el sistema.' : 'No tienes notificaciones recientes.'}
                </p>
              ) : (
                listaNotificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => manejarClickNotificacion(n)}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 text-left"
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      n.tipo === 'registro' ? 'bg-sky-50 text-sky-600' : 
                      n.tipo === 'test_iniciado' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {n.tipo === 'registro' ? <UserPlus size={16} /> : 
                       n.tipo === 'test_iniciado' ? <Clock size={16} /> : <FileCheck size={16} />}
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