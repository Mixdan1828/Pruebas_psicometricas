"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Asegúrate de ajustar tu ruta de importación
import { UserCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function AccesoLinkPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados del formulario para la tabla 'candidates'
  const [formData, setFormData] = useState({
    name: '',
    paternal_surname: '',
    headquarter: '',
    maternal_surname: '',
    sex: '',
    marital_status: '',
    education_level: '',
    age: '',
  });

  // 1. Validar el token al cargar la página
  useEffect(() => {
    async function validateToken() {
      if (!token) return;

      try {
        // Consultamos el link por su token
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !data) {
          setErrorMsg('El enlace de evaluación no es válido o ya expiró.');
          return;
        }

        // Validamos si ya alcanzó el límite de usuarios
        if (data.current_users !== null && data.max_users !== null && data.current_users >= data.max_users) {
          setErrorMsg('Este enlace ya ha alcanzado el límite máximo de usuarios permitidos.');
          return;
        }

        setLinkData(data);
      } catch (err) {
        console.error('Error validando token:', err);
        setErrorMsg('Ocurrió un error al verificar el enlace.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 2. Registrar al candidato y actualizar el conteo del link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData) return;

    setSubmitting(true);
    try {
      // A. Insertar el candidato en la tabla 'candidates'
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .insert([
          {
            link_id: linkData.id,
            full_name: `${formData.name} ${formData.paternal_surname} ${formData.maternal_surname}`.trim(),
            headquarter: formData.headquarter,
            paternal_surname: formData.paternal_surname,
            maternal_surname: formData.maternal_surname,
            sex: formData.sex,
            marital_status: formData.marital_status,
            education_level: formData.education_level,
            age: parseInt(formData.age),
            general_status: 'pendiente',
          }
        ])
        .select()
        .single();

      if (candidateError) throw candidateError;

      // B. Incrementar el contador current_users en la tabla 'links'
      const { error: updateError } = await supabase
        .from('links')
        .update({ current_users: (linkData.current_users || 0) + 1 })
        .eq('id', linkData.id);

      if (updateError) console.error('Error al actualizar contador del link:', updateError);

      // C. Redirigir a la pantalla donde comenzará sus pruebas (puedes ajustar la ruta)
      router.push(`/evaluacion/test/${candidateData.id}`);

    } catch (err: any) {
      console.error('Error al registrar candidato:', err);
      alert('Hubo un error al guardar tus datos. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pantalla de Carga
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#123440]" size={36} />
          <p className="text-sm font-medium text-slate-500">Verificando enlace de acceso...</p>
        </div>
      </div>
    );
  }

  // Pantalla de Error / Link inválido o lleno
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#123440]">Acceso no disponible</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // Formulario de Registro del Candidato
  return (
    <div className="min-h-screen bg-[#f9f9f7] py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-[#f4f6f0] text-[#69943A] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserCheck size={24} />
          </div>
          <h1 className="text-2xl font-black text-[#123440]">Registro de Evaluación</h1>
          <p className="text-xs text-slate-400 mt-1">
            Por favor, completa tus datos personales para acceder a las pruebas asignadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Nombre(s)
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. María Fernanda"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Apellidos
              </label>
              <div className="flex gap-2">
                <input
                  type="text" name="paternal_surname" required value={formData.paternal_surname} onChange={handleChange}
                  placeholder="Paterno"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
                />
                <input
                  type="text" name="maternal_surname" required value={formData.maternal_surname} onChange={handleChange}
                  placeholder="Materno"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Sede / Unidad Académica
              </label>
              <input
                type="text"
                name="headquarter"
                required
                value={formData.headquarter}
                onChange={handleChange}
                placeholder="Ej. Campus Central"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Edad
              </label>
              <input
                type="number"
                name="age"
                required
                min={15}
                max={99}
                value={formData.age}
                onChange={handleChange}
                placeholder="Ej. 22"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Sexo
              </label>
              <select
                name="sex"
                required
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              >
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Estado Civil
              </label>
              <select
                name="marital_status"
                required
                value={formData.marital_status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              >
                <option value="">Seleccionar</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Unión libre">Unión libre</option>
                <option value="Divorciado/a">Divorciado/a</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123440] uppercase tracking-wider mb-1.5">
                Nivel de Estudio
              </label>
              <select
                name="education_level"
                required
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all text-[#202221]"
              >
                <option value="">Seleccionar</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Posgrado">Posgrado</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#123440] hover:bg-[#1a4a5c] text-white py-3 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <span>Comenzar Evaluación</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}