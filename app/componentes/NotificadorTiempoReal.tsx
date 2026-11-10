"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Timer } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  urlDestino: string;
  fecha?: string;
  tipo: 'inicio' | 'fin';
}

export default function NotificadorTiempoReal() {
  const [listaNotificaciones, setListaNotificaciones] = useState<NotificacionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    const inicializarSistema = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: descartadasData } = await supabase
          .from('notification_dismissals')
          .select('notification_id')
          .eq('user_id', user.id);

        const idsDescartados = new Set(descartadasData?.map((d) => d.notification_id) || []);

        let { data: resultados, error } = await supabase
          .from('candidate_results')
          .select(`
            id,
            candidate_id,
            user_id,
            status,
            started_at,
            completed_at,
            candidates (
              full_name,
              paternal_surname
            ),
            tests (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(20);

        if (!error && (!resultados || resultados.length === 0)) {
          const { data: fallbackData } = await supabase
            .from('candidate_results')
            .select(`
              id,
              candidate_id,
              user_id,
              status,
              started_at,
              completed_at,
              candidates!inner (
                full_name,
                paternal_surname,
                links!inner (
                  created_by
                )
              ),
              tests (
                name
              )
            `)
            .eq('candidates.links.created_by', user.id)
            .order('started_at', { ascending: false })
            .limit(20);

          if (fallbackData) {
            resultados = fallbackData;
          }
        }

        const notifsIniciales: NotificacionItem[] = [];

        if (resultados) {
          resultados.forEach((item: any) => {
            const cand = Array.isArray(item.candidates) ? item.candidates[0] : item.candidates;
            const test = Array.isArray(item.tests) ? item.tests[0] : item.tests;
            const nombreCandidato = [cand?.full_name, cand?.paternal_surname].filter(Boolean).join(' ') || 'Un candidato';
            const nombreTest = test?.name || 'Prueba psicométrica';

            const idFin = `${item.id}-fin`;
            if ((item.status === 'completo' || item.status === 'completed' || item.completed_at) && item.completed_at) {
              if (!idsDescartados.has(idFin)) {
                notifsIniciales.push({
                  id: idFin,
                  titulo: 'Test Finalizado',
                  mensaje: `El usuario ${nombreCandidato} ha finalizado el test ${nombreTest}.`,
                  urlDestino: `/dashboard/resultados?id=${item.candidate_id}`,
                  fecha: item.completed_at,
                  tipo: 'fin'
                });
              }
            }

            const idInicio = `${item.id}-inicio`;
            if (item.started_at) {
              if (!idsDescartados.has(idInicio)) {
                notifsIniciales.push({
                  id: idInicio,
                  titulo: 'Test Iniciado',
                  mensaje: `El usuario ${nombreCandidato} ha iniciado el test ${nombreTest}.`,
                  urlDestino: `/dashboard/historial_de_pruebas`,
                  fecha: item.started_at,
                  tipo: 'inicio'
                });
              }
            }
          });
        }

        notifsIniciales.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());

        if (isMounted) {
          setListaNotificaciones(notifsIniciales.slice(0, 15));
          setLoading(false);

          channel = supabase
            .channel(`alertas_aplicador_${user.id}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'candidate_results' },
              async (payload) => {
                const row = payload.new as any;
                if (!row) return;
                if (row.user_id && row.user_id !== user.id) return;

                const { data: infoExtra } = await supabase
                  .from('candidate_results')
                  .select(`
                    candidate_id,
                    status,
                    started_at,
                    completed_at,
                    candidates (
                      full_name,
                      paternal_surname
                    ),
                    tests (
                      name
                    )
                  `)
                  .eq('id', row.id)
                  .maybeSingle();

                if (!infoExtra) return;

                const cand = Array.isArray(infoExtra.candidates) ? infoExtra.candidates[0] : infoExtra.candidates;
                const test = Array.isArray(infoExtra.tests) ? infoExtra.tests[0] : infoExtra.tests;
                const nombreCandidato = [cand?.full_name, cand?.paternal_surname].filter(Boolean).join(' ') || 'Un candidato';
                const nombreTest = test?.name || 'Prueba psicométrica';

                if ((row.status === 'completo' || row.status === 'completed' || row.completed_at) && payload.eventType === 'UPDATE') {
                  const idFin = `${row.id}-fin`;
                  const nuevaNotif: NotificacionItem = {
                    id: idFin,
                    titulo: 'Test Finalizado',
                    mensaje: `El usuario ${nombreCandidato} ha finalizado el test ${nombreTest}.`,
                    urlDestino: `/dashboard/resultados?id=${row.candidate_id}`,
                    fecha: row.completed_at || new Date().toISOString(),
                    tipo: 'fin'
                  };
                  setListaNotificaciones((prev) => [nuevaNotif, ...prev]);
                } else if (payload.eventType === 'INSERT' || (row.started_at && payload.eventType === 'UPDATE')) {
                  const idInicio = `${row.id}-inicio`;
                  const nuevaNotif: NotificacionItem = {
                    id: idInicio,
                    titulo: 'Test Iniciado',
                    mensaje: `El usuario ${nombreCandidato} ha iniciado el test ${nombreTest}.`,
                    urlDestino: `/dashboard/historial_de_pruebas`,
                    fecha: row.started_at || new Date().toISOString(),
                    tipo: 'inicio'
                  };
                  setListaNotificaciones((prev) => {
                    if (prev.some((n) => n.id === nuevaNotif.id)) return prev;
                    return [nuevaNotif, ...prev];
                  });
                }
              }
            )
            .subscribe();
        }

      } catch (err) {
        console.error("Error al inicializar notificaciones:", err);
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
          {/* Fondo oscuro translúcido para cerrar al tocar fuera en móviles */}
          <div 
            className="fixed inset-0 z-[998] bg-black/10 sm:hidden" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Contenedor adaptativo: fixed y centrado en móviles, absolute a la derecha en PC */}
          <div className="fixed left-4 right-4 mx-auto top-20 max-w-sm sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[999] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-xs font-bold text-[#123440] uppercase tracking-wider">
                Notificaciones ({totalNoLeidas})
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
                <p className="p-6 text-xs text-slate-400 text-center">No hay notificaciones recientes para tus pruebas.</p>
              ) : (
                listaNotificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => manejarClickNotificacion(n)}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 text-left"
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      n.tipo === 'fin' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {n.tipo === 'fin' ? <CheckCircle2 size={16} /> : <Timer size={16} />}
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