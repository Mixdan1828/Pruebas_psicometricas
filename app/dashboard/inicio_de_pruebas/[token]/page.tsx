// app/dashboard/inicio_de_pruebas/[token]/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { FileText, Clock, ArrowRight, AlertCircle, VolumeX, Eye, Heart } from 'lucide-react';
import { VideoPlaylistPlayer, VIDEO_INTRO, VIDEO_OUTRO } from './componentes/VideoInstructionsPlayer';
import { DemographicsForm, FormData } from './componentes/DemographicsForm';
import { ExamManager } from './componentes/ExamManager';

interface LinkData {
  id: string;
  token: string;
  max_users: number;
  current_users: number | null;
}

interface TestVideoRow {
  step_order: number;
  tests: {
    id: string;
    name: string;
    video_url: string | null;
  } | null;
}

type Phase = 'videos' | 'registration' | 'exams';

export default function BienvenidaEvaluacion() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [phase, setPhase] = useState<Phase>('videos');
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [linkInfo, setLinkInfo] = useState<LinkData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    edad: '',
    genero: '',
    sede: '',
    estado_civil: '',
    escolaridad: '',
    Fecha_Nacimiento: '',
  });

  const [playlist, setPlaylist] = useState<string[]>([]);
  const [videosCompleted, setVideosCompleted] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setPageError('Token no especificado en la URL.');
        setCheckingToken(false);
        return;
      }

      try {
        // 1. Limpiar datos previos si el token de la URL es diferente al almacenado
        const savedToken = localStorage.getItem('token_actual');
        if (savedToken && savedToken !== token) {
          localStorage.removeItem('candidato_id');
          localStorage.removeItem('candidato_nombre');
          localStorage.removeItem('candidato_apellido_paterno');
          localStorage.removeItem('candidato_apellido_materno');
          localStorage.removeItem('token_actual');
        }

        // 2. Validar enlace en la API
        const res = await fetch(`/api/candidate-link?token=${encodeURIComponent(token)}`);
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(payload?.error || 'El enlace de evaluación no existe o es inválido.');
        }

        setLinkInfo(payload.link as LinkData);

        // 3. Revisar si ya existe un registro de candidato válido para este token
        const existingCandidateId = localStorage.getItem('candidato_id');
        if (existingCandidateId) {
          setPhase('exams');
          setCheckingToken(false);
          return;
        }

        // 4. Cargar videos de la evaluación
        const videosRes = await fetch(`/api/link-tests?token=${encodeURIComponent(token)}`);
        const videosPayload = await videosRes.json().catch(() => ({}));

        if (!videosRes.ok) {
          throw new Error(videosPayload?.error || 'Error al cargar los videos de la evaluación.');
        }

        const linkTests: TestVideoRow[] = videosPayload.link_tests || [];
        const videoUrls: string[] = [VIDEO_INTRO];
        linkTests.forEach((vt) => {
          if (vt.tests?.video_url) {
            videoUrls.push(vt.tests.video_url);
          }
        });
        videoUrls.push(VIDEO_OUTRO);

        setPlaylist(videoUrls);
      } catch (err: any) {
        setPageError(err.message);
      } finally {
        setCheckingToken(false);
      }
    };

    init();
  }, [token]);

  const handleVideosComplete = useCallback(() => {
    setVideosCompleted(true);
  }, []);

  const handleStartTest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');

      if (!terminosAceptados) {
        setErrorMessage('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
        return;
      }

      setLoading(true);

      try {
        if (!linkInfo) throw new Error('Enlace no disponible.');

        const res = await fetch('/api/candidate-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            linkId: linkInfo.id,
            nombre: formData.nombre,
            apellido_paterno: formData.apellido_paterno,
            apellido_materno: formData.apellido_materno,
            edad: formData.edad,
            genero: formData.genero,
            sede: formData.sede,
            estado_civil: formData.estado_civil,
            escolaridad: formData.escolaridad,
            Fecha_Nacimiento: formData.Fecha_Nacimiento,
          }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(payload?.error || 'Error al procesar el registro.');
        }

        if (payload.candidateId) {
          localStorage.setItem('candidato_id', String(payload.candidateId));
        }

        const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno || ''}`.trim();
        localStorage.setItem('candidato_nombre', nombreCompleto);
        localStorage.setItem('candidato_apellido_paterno', formData.apellido_paterno);
        localStorage.setItem('candidato_apellido_materno', formData.apellido_materno);
        localStorage.setItem('token_actual', token);

        setShowRegistrationModal(false);
        setPhase('exams');
      } catch (error: any) {
        setErrorMessage(error.message || 'Error al procesar el registro.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [formData, linkInfo, token, terminosAceptados]
  );

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] text-[#123440]">
        <p className="text-sm font-semibold animate-pulse">Validando enlace de acceso...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#123440]">Acceso no disponible</h2>
          <p className="text-xs text-slate-600">{pageError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1c] flex flex-col min-h-screen font-sans antialiased">
      <header className="fixed top-0 w-full z-40 bg-[#f9f9f7]/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-12 w-36 rounded flex items-center justify-center text-xs font-bold text-slate-400">
              <Image
                src="/images/miLogo.png"
                alt="Logo"
                width={280}
                height={85}
                priority
                className="object-contain h-full w-auto max-h-[75px] md:max-h-[85px] md:w-[280px]"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {phase === 'videos' && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#123440] text-white flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-xs font-bold text-[#123440]">Paso 1: Videos Instructivos</span>
              </div>
            )}
            {phase === 'registration' && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#123440] text-white flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-xs font-bold text-[#123440]">Paso 1: Registro</span>
              </div>
            )}
            {phase === 'exams' && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#123440] text-white flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-xs font-bold text-[#123440]">Paso 2: Resolución</span>
              </div>
            )}
            <div className="w-8 h-[2px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  phase !== 'videos' ? 'bg-[#123440] text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                {phase === 'videos' ? '1' : '2'}
              </div>
              <span className={`text-xs font-medium ${phase !== 'videos' ? 'text-[#123440]' : 'text-slate-500'}`}>
                {phase === 'videos' ? 'Paso 1: Videos' : 'Paso 2: Pruebas'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        {phase === 'videos' && playlist.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#beee89]/40 text-[#123440] text-xs font-extrabold uppercase tracking-wide">
                  <FileText size={14} /> Paso 1: Videos Instructivos
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#123440] tracking-tight">
                  Bienvenido a tu Evaluación Digital
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
                  Por favor, mira los videos instructivos antes de comenzar. El registro se habilitará automáticamente al finalizar todos los videos.
                </p>
              </div>

              <VideoPlaylistPlayer playlist={playlist} onComplete={handleVideosComplete} />
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#123440]">Instrucciones Claras</h2>

                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm text-slate-600">
                    <VolumeX className="text-[#416912] flex-shrink-0" size={20} />
                    <span>Asegúrate de estar en un lugar tranquilo.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-600">
                    <Eye className="text-[#416912] flex-shrink-0" size={20} />
                    <span>Lee cada pregunta con atención.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-600">
                    <Heart className="text-[#416912] flex-shrink-0" size={20} />
                    <span>Responde con total sinceridad.</span>
                  </li>
                </ul>

                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <Clock className="text-[#123440]" size={24} />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Duración estimada</p>
                    <p className="text-base font-extrabold text-[#123440]">25 Minutos</p>
                  </div>
                </div>

                <button
                  disabled={!videosCompleted}
                  onClick={() => {
                    setShowRegistrationModal(true);
                    setPhase('registration');
                  }}
                  className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    videosCompleted
                      ? 'bg-[#123440] text-white hover:bg-[#001e28] cursor-pointer'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <span>Completar Paso 1 (Registro)</span>
                  <ArrowRight size={18} />
                </button>
                <p className="text-xs text-slate-500 text-center">
                  {videosCompleted ? 'Habilitado - Puedes continuar' : 'Esperando a que finalicen los videos...'}
                </p>
              </div>
            </aside>
          </section>
        )}

        {phase === 'registration' && (
          <div className="max-w-lg mx-auto">
            {showRegistrationModal && (
              <DemographicsForm
                onClose={() => {
                  setShowRegistrationModal(false);
                  setPhase('videos');
                }}
                onSubmit={handleStartTest}
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                errorMessage={errorMessage}
                terminosAceptados={terminosAceptados}
                setTerminosAceptados={setTerminosAceptados}
              />
            )}
            {!showRegistrationModal && (
              <div className="text-center py-20">
                <AlertCircle size={48} className="text-amber-500 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-[#123440] mb-2">Registro requerido</h2>
                <p className="text-sm text-slate-600 mb-8">
                  Debes completar el registro antes de continuar a las pruebas.
                </p>
                <button
                  onClick={() => {
                    setShowRegistrationModal(true);
                    setPhase('registration');
                  }}
                  className="px-8 py-3 bg-[#123440] text-white rounded-xl font-bold hover:bg-[#001e28] transition-all cursor-pointer"
                >
                  Abrir formulario de registro
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'exams' && (
          <ExamManager
            token={token}
            candidateId={localStorage.getItem('candidato_id') || ''}
          />
        )}
      </main>

      {phase === 'registration' && errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
}