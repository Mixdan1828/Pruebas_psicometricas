"use client";

import React, { useState, useCallback, useEffect, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Play, 
  VolumeX, 
  Eye, 
  Heart, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  UserCheck,
  FileText
} from 'lucide-react';

interface FormData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  edad: string;
  genero: string;
  sede: string;
  estado_civil: string;
  escolaridad: string;
}

interface LinkData {
  id: string;
  token: string;
  max_users: number;
  current_users: number | null;
}

interface DemographicsFormProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  loading: boolean;
  errorMessage: string;
}

const DemographicsForm = memo(function DemographicsForm({
  onClose,
  onSubmit,
  formData,
  handleInputChange,
  loading,
  errorMessage,
}: DemographicsFormProps) {
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

        <p className="text-xs text-slate-500">Por requerimiento clínico institucional, ingresa tus datos antes de iniciar el examen.</p>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre Completo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input id="nombre" required autoFocus type="text" name="nombre" placeholder="Nombre(s)" value={formData.nombre} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]" />
              <input id="apellido_paterno" required type="text" name="apellido_paterno" placeholder="A. Paterno" value={formData.apellido_paterno} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]" />
              <input id="apellido_materno" type="text" name="apellido_materno" placeholder="A. Materno" value={formData.apellido_materno} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edad" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Edad</label>
              <input id="edad" required type="number" min="15" max="100" name="edad" placeholder="Ej: 25" value={formData.edad} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]" />
            </div>
            <div>
              <label htmlFor="genero" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sexo (Género)</label>
              <select id="genero" required name="genero" value={formData.genero} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]">
                <option value="">Selecciona...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="sede" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sede de Evaluación</label>
            <select id="sede" required name="sede" value={formData.sede} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]">
              <option value="">Selecciona tu sede correspondiente...</option>
              <option value="Sede Central Orizaba">Sede Central Orizaba</option>
              <option value="Sede Córdoba">Sede Córdoba</option>
              <option value="Sede Veracruz Puerto">Sede Veracruz Puerto</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estado_civil" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado Civil</label>
              <select id="estado_civil" required name="estado_civil" value={formData.estado_civil} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]">
                <option value="">Selecciona...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Unión Libre">Unión Libre</option>
              </select>
            </div>
            <div>
              <label htmlFor="escolaridad" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Escolaridad</label>
              <select id="escolaridad" required name="escolaridad" value={formData.escolaridad} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-teal-600 text-[#202221]">
                <option value="">Selecciona nivel...</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Licenciatura Completa">Licenciatura Completa</option>
                <option value="Posgrado">Posgrado</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="w-1/3 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="w-2/3 py-3 bg-gradient-to-r from-[#123440] to-[#0E6433] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Registrando...' : 'Confirmar e Ir al Paso 2'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function BienvenidaEvaluacion() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const supabase = createClient();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [linkInfo, setLinkInfo] = useState<LinkData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageError, setPageError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    edad: '',
    genero: '',
    sede: '',
    estado_civil: '',
    escolaridad: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const validateTokenOnLoad = async () => {
      if (!token) {
        setPageError('Token no especificado en la URL.');
        setCheckingToken(false);
        return;
      }

      try {
        const { data: linkData, error } = await supabase
          .from('links')
          .select('id, token, max_users, current_users')
          .eq('token', token)
          .single();

        if (error || !linkData) {
          throw new Error('El enlace de evaluación no existe o es inválido.');
        }

        const currentUsers = linkData.current_users ?? 0;
        const maxUsers = linkData.max_users ?? 0;

        if (currentUsers >= maxUsers) {
          throw new Error('El límite de participantes para esta evaluación ha sido alcanzado.');
        }

        setLinkInfo(linkData as LinkData);
      } catch (err: any) {
        setPageError(err.message);
      } finally {
        setCheckingToken(false);
      }
    };

    validateTokenOnLoad();
  }, [token, supabase]);

  const handleStartTest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (!linkInfo) throw new Error('Enlace no disponible.');

      // 1. Verificar estado actual de cupos del enlace
      const { data: currentLinkStatus, error: checkErr } = await supabase
        .from('links')
        .select('id, current_users, max_users')
        .eq('id', linkInfo.id)
        .single();

      if (checkErr || !currentLinkStatus) {
        throw new Error('Error al verificar el estado del enlace.');
      }

      const activeUsers = currentLinkStatus.current_users ?? 0;
      const limitUsers = currentLinkStatus.max_users ?? 0;

      if (activeUsers >= limitUsers) {
        throw new Error('El límite de usuarios se alcanzó justo antes de tu registro.');
      }

      // 2. Obtener las pruebas asociadas al enlace desde la tabla relacional links_tests
      const { data: linkedTests, error: testsErr } = await supabase
        .from('link_tests')
        .select('test_id')
        .eq('link_id', linkInfo.id);

      if (testsErr || !linkedTests || linkedTests.length === 0) {
        throw new Error('No hay pruebas configuradas o asociadas a este enlace.');
      }

      // 3. Crear el registro del candidato
      const { data: nuevoCandidato, error: errorCandidate } = await supabase
        .from('candidates')
        .insert({
          full_name: formData.nombre,
          paternal_surname: formData.apellido_paterno,
          maternal_surname: formData.apellido_materno,
          age: parseInt(formData.edad, 10),
          sex: formData.genero,
          headquarter: formData.sede,
          marital_status: formData.estado_civil,
          education_level: formData.escolaridad,
        } as any)
        .select('id')
        .single();

      if (errorCandidate || !nuevoCandidato) {
        throw new Error(`Error en datos del candidato: ${errorCandidate?.message || 'No se generó ID'}`);
      }

      // 4. Obtener el creador de la liga para asignarlo como user_id en candidate_results
      const tokenFromParams = token;
      const { data: linkOwner, error: linkOwnerError } = await supabase
        .from('links')
        .select('created_by')
        .eq('token', tokenFromParams)
        .single();

      if (linkOwnerError || !linkOwner || !linkOwner.created_by) {
        throw new Error('La liga o token de la prueba no es válida.');
      }

      // 5. Crear los registros en candidate_results para cada test asociado al enlace
      const resultsToInsert = linkedTests.map((item) => ({
        candidate_id: nuevoCandidato.id,
        test_id: item.test_id,
        user_id: linkOwner.created_by, // 👈 Asignación del creador de la liga
        status: 'en_proceso',
        started_at: new Date().toISOString(),
        link_acceso: token,
      }));

      const { error: errorResult } = await supabase
        .from('candidate_results')
        .insert(resultsToInsert as any);

      if (errorResult) throw new Error(`Error al iniciar examen: ${errorResult.message}`);

      // 6. Incrementar el contador de usuarios registrados en el enlace
      const { error: errorUpdateLink } = await supabase
        .from('links')
        .update({ current_users: activeUsers + 1 } as any)
        .eq('id', linkInfo.id);

      if (errorUpdateLink) throw new Error(`Error al actualizar cupos: ${errorUpdateLink.message}`);

      const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno || ''}`.trim();
      localStorage.setItem('candidato_nombre', nombreCompleto);
      localStorage.setItem('token_actual', token);

      router.push(`/dashboard/inicio_de_pruebas/${token}/resolver`);

    } catch (error: any) {
      setErrorMessage(error.message || 'Error al procesar el registro.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [formData, linkInfo, token, router, supabase]);

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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#123440] text-white flex items-center justify-center text-xs font-bold">1</div>
              <span className="text-xs font-bold text-[#123440]">Paso 1: Instrucciones y Registro</span>
            </div>
            <div className="w-8 h-[2px] bg-slate-200"></div>
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-xs font-medium text-slate-500">Paso 2: Resolución</span>
            </div>
          </div>

          <div className="flex gap-8">
            <a className="text-[#416912] font-bold border-b-2 border-[#416912] pb-1 text-sm" href="#">Bienvenida</a>
            <a className="text-[#123440] opacity-70 text-sm" href="#">Ayuda</a>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#beee89]/40 text-[#123440] text-xs font-extrabold uppercase tracking-wide">
                <FileText size={14} /> Paso 1: Introducción y Datos
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#123440] tracking-tight">
                Bienvenido a tu Evaluación Digital
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
                Por favor, tómate un momento para ver este breve video tutorial antes de comenzar la prueba.
              </p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#123440] shadow-xl group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-[#beee89] text-[#123440] p-5 rounded-full shadow-lg transform group-hover:scale-110 transition-all">
                  <Play size={32} fill="#123440" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                <div className="h-1 bg-white/30 flex-grow rounded-full overflow-hidden">
                  <div className="h-full bg-[#beee89] w-1/3"></div>
                </div>
                <span className="text-white text-xs font-mono">01:15 / 03:45</span>
              </div>
            </div>
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
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-[#123440] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#001e28] transition-all shadow-lg shadow-[#123440]/10 cursor-pointer"
              >
                <span>Completar Paso 1 (Registro)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </aside>
        </section>
      </main>

      {showModal && (
        <DemographicsForm
          onClose={() => setShowModal(false)}
          onSubmit={handleStartTest}
          formData={formData}
          handleInputChange={handleInputChange}
          loading={loading}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}