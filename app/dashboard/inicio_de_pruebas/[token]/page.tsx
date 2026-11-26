// app/dashboard/inicio_de_pruebas/[token]/page.tsx
// Flujo unificado: Videos (Intro -> tests -> Outro) -> Registro -> Exámenes (todo en una sola vista)
"use client";

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Eye,
  Heart,
  Clock,
  ArrowRight,
  AlertCircle,
  UserCheck,
  FileText,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
} from 'lucide-react';

const VIDEO_INTRO =
  'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Introduccion%20a%20pruebas.mp4';

const VIDEO_OUTRO =
  'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Despedida.mp4';

interface FormData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  edad: string;
  genero: string;
  sede: string;
  estado_civil: string;
  escolaridad: string;
  Fecha_Nacimiento: string;
}

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

/* ========================================================================
   Componente: Reproductor de lista de reproducción de videos
   ======================================================================== */

const VideoPlaylistPlayer = memo(function VideoPlaylistPlayer({
  playlist,
  onComplete,
}: {
  playlist: string[];
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const currentVideo = playlist[currentIndex];

  const playVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true));
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const nextVideo = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTime(0);
    } else {
      onComplete();
    }
  }, [currentIndex, playlist.length, onComplete]);

  const handleEnded = useCallback(() => {
    nextVideo();
  }, [nextVideo]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pauseVideo();
    else playVideo();
  }, [isPlaying, pauseVideo, playVideo]);

  const setVolumeLevel = useCallback(
    (val: number) => {
      setVolumeState(val);
      setIsMuted(val === 0);
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      setVolumeState(newMuted ? 0 : volume);
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isFullscreen) {
      video.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, [isFullscreen]);

  return (
    <div className="bg-[#123440] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
      <div className="relative aspect-video bg-black group flex-shrink-0">
        <video
          ref={videoRef}
          src={currentVideo}
          autoPlay
          playsInline
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="w-full h-full object-cover"
          muted={isMuted}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {!isPlaying && (
            <div
              className="bg-black/40 text-white p-6 rounded-full hover:bg-black/60 transition-all cursor-pointer"
              onClick={togglePlay}
            >
              <Play size={48} fill="white" />
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group-hover:bg-white/40 transition-all"
          onClick={(e) => {
            if (videoRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              videoRef.current.currentTime = duration * pos;
            }
          }}
        >
          <div
            className="h-full bg-[#beee89] transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start px-4">
          <div
            className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-medium border border-white/10"
          >
            <span>Video {currentIndex + 1} de {playlist.length}</span>
          </div>
          <div
            className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-medium border border-white/10"
          >
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm p-3 rounded-full hover:bg-black/80 transition-all cursor-pointer"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
        </div>
      </div>

      <div className="p-4 bg-[#123440] border-t border-slate-200 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
                setCurrentTime(0);
              }
            }}
            disabled={currentIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlay} className="p-2 text-white hover:text-[#beee89] transition-all">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => {
              if (currentIndex < playlist.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setCurrentTime(0);
              }
            }}
            disabled={currentIndex === playlist.length - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white transition-all"
          >
            {isMuted ? (
              <VolumeX size={20} fill="white" />
            ) : volume > 0.5 ? (
              <Volume2 size={20} fill="white" />
            ) : (
              <Volume1 size={20} fill="white" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
            className="w-24 accent-[#beee89] cursor-pointer"
          />
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-slate-400 hover:text-white transition-all"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      <div className="flex gap-1 p-4 bg-[#123440] border-t border-slate-200 justify-center flex-shrink-0">
        {playlist.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-white ring-2 ring-[#beee89]'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

VideoPlaylistPlayer.displayName = 'VideoPlaylistPlayer';

/* ========================================================================
   Componente: Formulario de registro (Demographics)
   ======================================================================== */

const DemographicsForm = memo(function DemographicsForm({
  onClose,
  onSubmit,
  formData,
  handleInputChange,
  loading,
  errorMessage,
  terminosAceptados,
  setTerminosAceptados,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  loading: boolean;
  errorMessage: string;
  terminosAceptados: boolean;
  setTerminosAceptados: (val: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="inline-block bg-[#beee89] text-[#123440] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full mb-1">
              Paso 1 de 2
            </span>
            <h2 className="text-xl font-bold text-[#123440]">Registro de Datos Obligatorio</h2>
          </div>
          <UserCheck className="text-[#416912]" size={28} />
        </div>

        <p className="text-xs text-slate-500">
          Por requerimiento clínico institucional, ingresa tus datos y acepta los términos antes de iniciar el examen.
        </p>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Nombre Completo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                id="nombre"
                required
                autoFocus
                type="text"
                name="nombre"
                placeholder="Nombre(s)"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              />
              <input
                id="apellido_paterno"
                required
                type="text"
                name="apellido_paterno"
                placeholder="A. Paterno"
                value={formData.apellido_paterno}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              />
              <input
                id="apellido_materno"
                type="text"
                name="apellido_materno"
                placeholder="A. Materno"
                value={formData.apellido_materno}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="Fecha_Nacimiento" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Fecha de nacimiento
            </label>
            <input
              id="Fecha_Nacimiento"
              required
              type="date"
              name="Fecha_Nacimiento"
              value={formData.Fecha_Nacimiento}
              onChange={handleInputChange}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edad" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Edad
              </label>
              <input
                id="edad"
                required
                type="number"
                min="15"
                max="100"
                name="edad"
                placeholder="Ej: 25"
                value={formData.edad}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              />
            </div>
            <div>
              <label htmlFor="genero" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Sexo (Género)
              </label>
              <select
                id="genero"
                required
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              >
                <option value="">Selecciona...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="sede" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Sede de Evaluación
            </label>
            <select
              id="sede"
              required
              name="sede"
              value={formData.sede}
              onChange={handleInputChange}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
            >
              <option value="">Selecciona tu sede correspondiente...</option>
              <option value="Puerta Grande">Puerta Grande</option>
              <option value="Tierra blanca">Tierra blanca</option>
              <option value="Tlapacoyan">Tlapacoyan</option>
              <option value="Torre Diez Sede">Torre Diez Sede</option>
              <option value="Torre Diez Oficinas">Torre Diez Oficinas</option>
              <option value="EMiliano Zarranza">EMiliano Zarranza</option>
              <option value="Coatepec 1">Coatepec 1</option>
              <option value="Coatepec 2">Coatepec 2</option>
              <option value="Coatzacoalcos">Coatzacoalcos</option>
              <option value="Cosamaloapan">Cosamaloapan</option>
              <option value="Acayucan">Acayucan</option>
              <option value="CD de Mexico">CD de Mexico</option>
              <option value="Tuxtepec">Tuxtepec</option>
              <option value="Consultorios">Consultorios</option>
              <option value="Cancha">Cancha</option>
              <option value="Merida">Merida</option>
              <option value="Boca del rio">Boca del rio</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estado_civil" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Estado Civil
              </label>
              <select
                id="estado_civil"
                required
                name="estado_civil"
                value={formData.estado_civil}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              >
                <option value="">Selecciona...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Unión Libre">Unión Libre</option>
              </select>
            </div>
            <div>
              <label htmlFor="escolaridad" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Escolaridad
              </label>
              <select
                id="escolaridad"
                required
                name="escolaridad"
                value={formData.escolaridad}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]"
              >
                <option value="">Selecciona nivel...</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Licenciatura Completa">Licenciatura Completa</option>
                <option value="Posgrado">Posgrado</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terminos"
              checked={terminosAceptados}
              onChange={(e) => setTerminosAceptados(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#123440] focus:ring-teal-600 cursor-pointer"
            />
            <label htmlFor="terminos" className="text-xs text-slate-600 select-none leading-relaxed">
              He leído y acepto los
              <a
                href="/terminos-de-servicio"
                target="_blank"
                className="text-[#416912] font-bold underline hover:text-[#123440]"
              >
                Términos y Condiciones
              </a>{' '}
              y la
              <a
                href="/aviso-de-privacidad"
                target="_blank"
                className="text-[#416912] font-bold underline hover:text-[#123440]"
              >
                Política de Privacidad
              </a>
              de la plataforma de evaluación institucional.
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 bg-gradient-to-r from-[#123440] to-[#0E6433] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Registrando...' : 'Confirmar e Ir al Paso 2'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

/* ========================================================================
   Error Boundary para la fase de exámenes
   ======================================================================== */

class ResolverErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[exams] Error de renderizado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center text-center p-6 font-body text-slate-700">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Ocurrió un error al mostrar la prueba
          </h2>
          <p className="text-sm max-w-md mb-6">
            No se pudo cargar la interfaz del test. Recarga la página o contacta al administrador
            si el problema persiste.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#416912] text-white font-bold hover:bg-[#34540e] cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ========================================================================
   Componente: Gestor de exámenes (inline, sin redirección)
   ======================================================================== */

function ExamManager({ token, candidateId }: { token: string; candidateId: string }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error' | 'finished'>('loading');
  const [candidateTests, setCandidateTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [patientName, setPatientName] = useState('Candidato');

  useEffect(() => {
    const saved = localStorage.getItem('candidato_nombre');
    if (saved) setPatientName(saved);
  }, []);

  const loadTests = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');

    if (!token) {
      setPhase('error');
      setErrorMessage('No se especificó un token de acceso.');
      return;
    }

    try {
      const urlParams = new URLSearchParams();
      urlParams.set('token', token);
      if (candidateId) urlParams.set('candidate_id', candidateId);

      const res = await fetch(`/api/candidate-evaluation?${urlParams.toString()}`);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPhase('error');
        setErrorMessage(payload?.error || 'Error al cargar la evaluación.');
        return;
      }

      const data = payload.tests as any[];
      const validTests = data.filter((item: any) => item.tests !== null);

      if (validTests.length === 0) {
        setPhase('error');
        setErrorMessage('No se encontraron pruebas válidas.');
        return;
      }

      setCandidateTests(validTests);
      const firstPending = validTests.findIndex((item: any) => item.status !== 'completo');
      if (firstPending !== -1) setCurrentTestIndex(firstPending);
      else setPhase('finished');

      setPhase('ready');
    } catch (err: any) {
      setPhase('error');
      setErrorMessage(err?.message || 'Error inesperado.');
    }
  }, [token, candidateId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const currentResult = candidateTests[currentTestIndex];
  const currentTest = currentResult?.tests;

  const getTestIdentifier = () => {
    const rawType = (currentTest?.type || '').toLowerCase();
    const rawName = (currentTest?.name || '').toLowerCase();
    if (rawType.includes('raven') || rawName.includes('raven')) return 'raven';
    if (rawType.includes('cleaver') || rawName.includes('cleaver')) return 'cleaver';
    if (
      rawType.includes('nom-035') ||
      rawType.includes('nom035') ||
      rawName.includes('nom-035') ||
      rawName.includes('integral')
    )
      return 'nom-035-integral';
    if (rawType.includes('terman') || rawName.includes('terman') || rawName.includes('merrill'))
      return 'terman';
    return rawType || 'terman';
  };

  const testType = getTestIdentifier();

  const handleTestComplete = async (answers: Record<string, any>) => {
    if (!currentResult) return;

    const isLastTest = currentTestIndex === candidateTests.length - 1;

    const res = await fetch('/api/candidate-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resultId: currentResult.id,
        token,
        answers,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (typeof window !== 'undefined') {
        window.alert('Ocurrió un error al guardar tus respuestas. Inténtalo de nuevo.');
      }
      throw new Error(payload?.error || 'Error al guardar respuestas.');
    }

    setCandidateTests((prev) =>
      prev.map((item, idx) =>
        idx === currentTestIndex ? { ...item, status: 'completo' } : item
      )
    );

    if (!isLastTest) {
      setCurrentTestIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPhase('finished');
    }
  };

  const renderActiveTest = () => {
    const viewKey = `${currentResult?.id ?? 'test'}-${currentTestIndex}`;
    switch (testType) {
      case 'cleaver':
        return (
          <CleaverView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />
        );
      case 'nom-035-integral':
        return (
          <Nom035IntegralView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />
        );
      case 'raven':
        return (
          <RavenView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />
        );
      case 'terman':
      default:
        return (
          <TermanView key={viewKey} testData={currentTest} onComplete={handleTestComplete} />
        );
    }
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <p className="animate-pulse text-[#123440] font-semibold">Cargando evaluación...</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#123440] mb-2">Error al cargar la evaluación</h2>
        <p className="text-sm text-slate-600 max-w-md">{errorMessage}</p>
      </div>
    );
  }

  if (phase === 'finished') {
    const completedTestsNames = candidateTests
      .map((t) => t?.tests?.name)
      .filter(Boolean);

    return (
      <TestFinalizedView
        testNames={completedTestsNames}
        onGoHome={() => {
          // Limpiamos los datos del localStorage al salir de la evaluación finalizada
          localStorage.removeItem('candidato_id');
          localStorage.removeItem('candidato_nombre');
          localStorage.removeItem('candidato_apellido_paterno');
          localStorage.removeItem('candidato_apellido_materno');
          localStorage.removeItem('token_actual');
          window.location.href = '/';
        }}
      />
    );
  }
  }

  return (
    <ResolverErrorBoundary>
      {currentTest ? renderActiveTest() : (
        <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-[#123440] mb-2">Evaluación no disponible</h2>
          <p className="text-sm text-slate-600 max-w-md">
            No se encontró un test válido para este enlace.
          </p>
        </div>
      )}
    </ResolverErrorBoundary>
  );
}

/* ========================================================================
   Importaciones de vistas de prueba
   ======================================================================== */
import TermanView from '../tests/termanView';
import CleaverView from '../tests/CleaverView';
import Nom035IntegralView from '../tests/Nom035IntegralView';
import RavenView from '../tests/RavenView';
import TestFinalizedView from '../tests/TestFinalizedView';

/* ========================================================================
   Página principal
   ======================================================================== */

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
      // Si ya hay candidato registrado, saltar videos e ir directo a exámenes
      const existingCandidateId = localStorage.getItem('candidato_id');
      if (existingCandidateId) {
        setPhase('exams');
        setCheckingToken(false);
        return;
      }

      if (!token) {
        setPageError('Token no especificado en la URL.');
        setCheckingToken(false);
        return;
      }

      try {
        // Validar enlace
        const res = await fetch(`/api/candidate-link?token=${encodeURIComponent(token)}`);
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(payload?.error || 'El enlace de evaluación no existe o es inválido.');
        }

        setLinkInfo(payload.link as LinkData);

        // Obtener videos de pruebas asociadas al enlace
        const videosRes = await fetch(`/api/link-tests?token=${encodeURIComponent(token)}`);
        const videosPayload = await videosRes.json().catch(() => ({}));

        if (!videosRes.ok) {
          throw new Error(videosPayload?.error || 'Error al cargar los videos de la evaluación.');
        }

        const linkTests: TestVideoRow[] = videosPayload.link_tests || [];

        // Construir playlist: Intro -> videos de pruebas (step_order ASC) -> Outro
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

  /* ------------------------------------------------------------------ */
  /* Callback cuando terminan todos los videos                          */
  /* ------------------------------------------------------------------ */
  const handleVideosComplete = useCallback(() => {
    setVideosCompleted(true);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Manejo del registro de candidato                                   */
  /* ------------------------------------------------------------------ */
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

        // Guardar ID del candidato en localStorage
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

  /* ------------------------------------------------------------------ */
  /* Pantalla de carga / error                                          */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /* Layout principal                                                   */
  /* ------------------------------------------------------------------ */
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

          <div className="flex gap-8">
            <a className="text-[#416912] font-bold border-b-2 border-[#416912] pb-1 text-sm" href="#">
              Bienvenida
            </a>
            <a className="text-[#123440] opacity-70 text-sm" href="#">
              Ayuda
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================
           FASE 1: VIDEOS
           ======================================================================== */}
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

        {/* ========================================================================
           FASE 2: REGISTRO
           ======================================================================== */}
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

        {/* ========================================================================
           FASE 3: EXÁMENES (inline)
           ======================================================================== */}
        {phase === 'exams' && (
          <ExamManager
            token={token}
            candidateId={localStorage.getItem('candidato_id') || ''}
          />
        )}
      </main>

      {/* Toast de error para registro */}
      {phase === 'registration' && errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
}