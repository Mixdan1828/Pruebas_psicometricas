"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, RefreshCw, LogOut, Hourglass } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(false);

  // Revisa la sesión y el estado del perfil;
  // si ya fue autorizado, redirige automáticamente al dashboard.
  const checkStatus = async () => {
    setChecking(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.status === 'autorizado') {
        router.replace('/dashboard');
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Se difiere la llamada inicial a una tarea/macrotarea para no disparar
    // setState de forma síncrona dentro del effect (regla react-hooks).
    const initial = setTimeout(() => {
      checkStatus();
    }, 10);

    // Comprueba periódicamente si el administrador ya aprobó la solicitud
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
          <Hourglass size={44} />
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Solicitud en Revisión</h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          Tu cuenta ha sido registrada correctamente. Un administrador debe
          autorizar tu acceso antes de que puedas ingresar al portal.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={checkStatus}
            disabled={checking}
            className="w-full bg-[#123440] hover:bg-[#1A625F] text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            Revisar estado
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-green-500" />
          Esta página se actualiza automáticamente al ser aprobada tu cuenta.
        </p>
      </div>
    </div>
  );
}