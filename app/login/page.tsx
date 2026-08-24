"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react'; 
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del Formulario
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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

  // Detectar respuesta de Google OAuth desde la URL (?status=pending)
  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (status === 'pending') {
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

  // Google OAuth Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Login Email/Password Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoading(false);
      setErrorMsg("Credenciales inválidas o cuenta no confirmada.");
      return;
    }

    // Validar status en profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user.id)
      .maybeSingle();

    // Si no existe fila en `profiles` o aún no está autorizado => queda en espera.
    // Importante: un perfil nulo se trata como 'pendiente', no como autorizado.
    if (!profile || profile.status !== 'autorizado') {
      setLoading(false);
      router.push('/pending-approval');
      return;
    }

    setLoading(false);
    router.push('/dashboard'); 
    router.refresh();
  };

  // Registro Manual Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Verificar si el correo ya existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, status')
        .eq('email', regEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        setLoading(false);
        setModal({
          isOpen: true,
          title: 'Solicitud Ya Existente',
          message: 'Ya existe una solicitud enviada para este correo. Por favor espera a que el administrador autorice tu acceso.',
          type: 'warning',
        });
        return;
      }

      // 2. Crear usuario si no existe
      const { error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            full_name: regNombre,
            role: 'aplicador',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setLoading(false);

      if (signUpError) {
        setErrorMsg(signUpError.message);
      } else {
        setModal({
          isOpen: true,
          title: 'Solicitud Enviada',
          message: 'Tu solicitud ha sido enviada con éxito. Por favor espera a que un administrador autorice tu cuenta.',
          type: 'success',
        });
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Ocurrió un error inesperado al procesar la solicitud.");
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

      {/* CONTENEDOR ESCRITORIO */}
      <div className="bg-white w-full max-w-4xl h-[680px] rounded-[32px] shadow-2xl border border-slate-200 relative overflow-hidden hidden md:flex">
        
        {/* Formulario Login */}
        <div className="w-1/2 h-full p-10 flex flex-col justify-center z-10">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-[#202221]">Iniciar Sesión</h3>
            <p className="text-xs text-slate-500 mt-1">Ingresa al portal psicométrico interno.</p>
          </div>

          {errorMsg && isLogin && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleLoginSubmit}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Correo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="ejemplo@fundacion.org" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#123440] focus:bg-white text-[#202221]" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-12 pr-12 text-sm focus:outline-none focus:border-[#123440] focus:bg-white text-[#202221]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123440] cursor-pointer">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#123440] hover:bg-[#1A625F] text-white font-bold py-2.5 px-4 rounded-xl mt-1 transition-all flex items-center justify-center gap-2 group shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">O ingresa con</span></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm text-sm cursor-pointer disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        {/* Formulario Registro */}
        <div className="w-1/2 h-full p-10 flex flex-col justify-center z-10">
          <div className="mb-3">
            <h3 className="text-2xl font-bold text-[#202221]">Crear Cuenta</h3>
            <p className="text-xs text-slate-500 mt-1">Solicita tu acceso como personal autorizado.</p>
          </div>

          {errorMsg && !isLogin && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleRegisterSubmit}>
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} placeholder="Dr. Juan Pérez" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#123440] text-[#202221]" />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="ejemplo@fundacion.org" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#123440] text-[#202221]" />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#123440] text-[#202221]" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#9DBA3A] hover:bg-[#69943A] text-[#202221] font-bold py-2.5 px-4 rounded-xl mt-1 transition-all flex items-center justify-center gap-2 group shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <span>Enviar Solicitud</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">O regístrate con</span></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm text-sm cursor-pointer disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        {/* Panel Deslizable */}
        <div className={`w-1/2 h-full bg-slate-50 absolute top-0 left-0 transition-transform duration-700 ease-in-out z-20 flex flex-col items-center justify-center p-10 text-center border-x border-slate-200 ${
          isLogin ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <div className="mb-6 flex items-center justify-center w-full max-w-[210px] h-[210px]">
            <Image src="/images/FDHZ_2025-Color_Vertical.png" alt="Logo Fundación" width={250} height={250} className="object-contain" priority />
          </div>

          <div className="w-full px-4">
            <p className="text-[#123440] text-xs uppercase tracking-[0.2em] font-bold mb-6">Portal Psicométrico Interno</p>
            {isLogin ? (
              <div className="flex flex-col items-center">
                <p className="text-slate-600 text-xs max-w-xs mb-5">¿Eres un nuevo aplicador y no tienes cuenta?</p>
                <button type="button" onClick={() => setIsLogin(false)} className="bg-transparent border-2 border-[#123440] hover:bg-[#123440] text-[#123440] hover:text-white font-bold px-8 py-2.5 rounded-xl text-sm transition-all cursor-pointer">
                  Registrarse aquí
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-slate-600 text-xs max-w-xs mb-5">¿Ya cuentas con tus credenciales asignadas?</p>
                <button type="button" onClick={() => setIsLogin(true)} className="bg-[#123440] hover:bg-[#1A625F] text-white font-bold px-8 py-2.5 rounded-xl text-sm transition-all cursor-pointer">
                  Iniciar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

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