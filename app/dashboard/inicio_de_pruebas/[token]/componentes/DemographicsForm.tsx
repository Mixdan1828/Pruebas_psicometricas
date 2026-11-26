"use client";

import React, { memo } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';

export interface FormData {
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

interface DemographicsFormProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  loading: boolean;
  errorMessage: string;
  terminosAceptados: boolean;
  setTerminosAceptados: (val: boolean) => void;
}

export const DemographicsForm = memo(function DemographicsForm({
  onClose,
  onSubmit,
  formData,
  handleInputChange,
  loading,
  errorMessage,
  terminosAceptados,
  setTerminosAceptados,
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
              <a href="/terminos-de-servicio" target="_blank" className="text-[#416912] font-bold underline hover:text-[#123440]">
                Términos y Condiciones
              </a>{' '}
              y la
              <a href="/aviso-de-privacidad" target="_blank" className="text-[#416912] font-bold underline hover:text-[#123440]">
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

DemographicsForm.displayName = 'DemographicsForm';