"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // `loading` indica que estamos iniciando el flujo OAuth de Google.
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para la Ventana Emergente (Modal)
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  // Detectar estado devuelto por el callback de Google OAuth desde la URL
  // (?status=...) o (?error=...) para informar al usuario.
  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (status === 'email_confirmed') {
      setModal({
        isOpen: true,
        title: 'Correo Confirmado',
        message: 'Tu correo fue verificado correctamente. Ahora solo falta que un administrador autorice tu acceso.',
        type: 'success',
      });
    } else if (status === 'pending') {
      setModal({
        isOpen: true,
        title: 'Solicitud en Espera',
        message: 'Tu cuenta de Google fue registrada. Un administrador debe autorizar tu acceso antes de que puedas ingresar.',
        type: 'warning',
      });
    } else if (status === 'already_requested') {
      setModal({
        isOpen: true,
        title: 'Solicitud Previa Detectada',
        message: 'Ya habías registrado esta cuenta de Google anteriormente. Tu solicitud sigue en proceso de revisión.',
        type: 'warning',
      });
    } else if (error) {
      setModal({
        isOpen: true,
        title: 'Error de Autenticación',
        message: decodeURIComponent(error),
        type: 'error',
      });
    }
  }, [searchParams]);

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    router.replace('/'); // Limpia parámetros de la URL
  };

  // Único método de autenticación: Google OAuth.
  // El intercambio del `code` por sesión ocurre en /auth/callback (lado servidor).
  const getURL = () => {
    let url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    url = url.replace(/\/$/, '');
    return `${url}/auth/callback`;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getURL(),
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      console.error('Error al iniciar sesión con Google:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans overflow-x-hidden relative">

      {/* ========================================================================= */}
      {/* VENTANA EMERGENTE (MODAL)                                                */}
      {/* ========================================================================= */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              {modal.type === 'success' && (
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
              )}
              {modal.type === 'warning' && (
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <Clock size={32} />
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} />
                </div>
              )}
            </div>

            <h4 className="text-lg font-bold text-slate-800 mb-2">{modal.title}</h4>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{modal.message}</p>

            <button
              onClick={closeModal}
              className="w-full bg-[#123440] hover:bg-[#1A625F] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TARJETA DE INICIO DE SESIÓN (SOLO GOOGLE OAuth)                           */}
      {/* ========================================================================= */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-10 flex flex-col items-center text-center">

        {/* Logo de la aplicación */}
        <div className="mb-6">
          <Image
            src="/images/FDHZ_2025-Color_Vertical.png"
            alt="Logo Fundación"
            width={180}
            height={180}
            priority
            className="object-contain"
          />
        </div>

        <p className="text-[#123440] text-xs uppercase tracking-[0.2em] font-bold mb-6">
          Portal Psicométrico Interno
        </p>

        <h1 className="text-2xl font-bold text-[#202221] mb-1">Inicia sesión</h1>
        <p className="text-sm text-slate-500 mb-8">
          Accede con tu cuenta institucional de Google.
        </p>

        {errorMsg && (
          <div className="mb-3 w-full p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-left">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm text-sm cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            // Icono oficial de Google (4 colores).
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          {loading ? 'Redirigiendo a Google...' : 'Continuar con Google'}
        </button>

        <p className="text-[11px] text-slate-400 mt-6">
          Al continuar aceptas las políticas de acceso del portal interno.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#123440]" size={32} /></div>}>
      <LoginContent />
    </Suspense>
  );
}