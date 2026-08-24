"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  ChevronRight,
  ArrowLeft,
  Eye,
  Printer,
  Edit3,
  Save,
  CheckCircle2
} from 'lucide-react';
import SideNavBar from '../../../componentes/SideNavBar';

export default function DetalleResultados() {
  const [observaciones, setObservaciones] = useState(
    "El paciente presenta niveles de HbA1c ligeramente por encima del rango objetivo de control. Se recomienda ajuste en dieta y monitoreo semanal de glucosa capilar. No se observan anomalías en hemoglobina total. Próxima revisión en 3 meses."
  );

  return (
    <div className="bg-[#f9f9f7] text-[#202221] flex min-h-screen font-sans overflow-x-hidden">
      <SideNavBar role="aplicador_de_pruebas" title="Portal de Seguimiento" />

      {/* ========================================================================= */}
      {/* CONTENEDOR PRINCIPAL                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        
        {/* Barra Superior (TopAppBar) */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center px-8 py-4 shadow-sm">
          <div className="relative w-64 hidden lg:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar pacientes o folios..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all placeholder:text-slate-400 font-medium text-[#202221]"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors relative cursor-pointer text-[#123440]">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#123440] font-bold text-xs border border-slate-200">
              A
            </div>
          </div>
        </header>

        {/* Sección del Contenido Reticulado (Canvas) */}
        <main className="mt-16 p-8 flex-1 flex flex-col">
          
          {/* Breadcrumbs y Título Principal */}
          <section className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
                  <span className="hover:text-[#69943A] cursor-pointer transition-colors">Resultados</span>
                  <ChevronRight size={12} />
                  <span className="text-[#123440] font-bold">Detalle de Prueba #H-2023-1012</span>
                </nav>
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-[#123440]">
                  Resultados de Prueba
                </h1>
              </div>

              {/* Botones de Acción de Cabecera */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link href="/dashboard/historial_de_pruebas" className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#69943A] hover:bg-[#9DBA3A]/10 rounded-full transition-all border border-[#9DBA3A]/40 cursor-pointer">
                  <ArrowLeft size={14} />
                  <span>Regresar al Historial</span>
                </Link>
                <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#69943A] border border-[#9DBA3A] hover:bg-[#9DBA3A]/10 rounded-xl transition-all cursor-pointer">
                  <Eye size={14} />
                  <span>Ver Original</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#123440] hover:bg-[#1a4a5c] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95">
                  <Printer size={14} />
                  <span>Imprimir Resultado</span>
                </button>
              </div>
            </div>
          </section>

          {/* Panel de Datos Estilo Bento Grid */}
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* Columna Izquierda: Información del Paciente y Diagnóstico Visual */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              {/* Tarjeta del Paciente */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(18,52,64,0.04)]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[#123440] flex items-center justify-center text-white font-headline text-xl font-bold shadow-sm">
                    AM
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#123440]">Ana Martínez</h3>
                    <p className="text-xs text-slate-400 font-medium">Paciente ID: 44920-1</p>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Prueba</span>
                    <span className="font-bold text-[#123440]">Hemoglobina Glicosilada</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Fecha</span>
                    <span className="font-bold text-[#123440]">Oct 12, 2023</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-400 font-medium">Estado</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#9DBA3A]/15 text-[#69943A] text-[10px] font-bold uppercase rounded-full border border-[#9DBA3A]">
                      <CheckCircle2 size={10} />
                      Completado
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Indicador Visual Clínico */}
              <div className="bg-[#123440] text-white p-6 rounded-2xl relative overflow-hidden shadow-md">
                <div className="relative z-10">
                  <p className="text-[#9DBA3A] text-[10px] font-bold uppercase tracking-widest mb-1">
                    Nivel de HbA1c Detectado
                  </p>
                  <h4 className="text-4xl font-headline font-black mb-5 flex items-baseline gap-1">
                    6.8<span className="text-lg font-medium opacity-80">%</span>
                  </h4>
                  
                  {/* Barra de Rango */}
                  <div className="w-full bg-white/10 h-2 rounded-full mb-3 overflow-hidden">
                    <div className="bg-[#9DBA3A] h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  
                  {/* Leyendas de Rango Médico */}
                  <div className="flex justify-between text-[9px] uppercase font-bold tracking-tight text-slate-300">
                    <span>Normal (&lt;5.7)</span>
                    <span>Prediabetes</span>
                    <span className="text-[#9DBA3A]">Diabetes (&gt;6.5)</span>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#9DBA3A]/20 rounded-full blur-3xl pointer-events-none"></div>
              </div>

            </div>

            {/* Columna Derecha: Tabla Métrica Detallada e Historial Clínico */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* Tabla de Resultados Clínicos */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_-4px_rgba(18,52,64,0.04)]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                  <h3 className="font-headline text-sm font-bold text-[#123440]">Resultados Detallados</h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 font-bold">Parámetro</th>
                        <th className="pb-3 font-bold text-center">Resultado</th>
                        <th className="pb-3 font-bold text-center">Rango Referencia</th>
                        <th className="pb-3 font-bold text-right">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 font-bold text-[#123440]">HbA1c Total</td>
                        <td className="py-4 text-center font-black text-rose-600 text-sm">6.8</td>
                        <td className="py-4 text-center text-slate-400 font-normal">4.0 - 5.6</td>
                        <td className="py-4 text-right text-[#123440] font-semibold">%</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 font-bold text-[#123440]">Glucosa Promedio Estimada (eAG)</td>
                        <td className="py-4 text-center font-bold text-slate-700">148</td>
                        <td className="py-4 text-center text-slate-400 font-normal">70 - 126</td>
                        <td className="py-4 text-right text-[#123440] font-semibold">mg/dL</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 font-bold text-[#123440]">Hemoglobina Total</td>
                        <td className="py-4 text-center font-bold text-slate-700">14.2</td>
                        <td className="py-4 text-center text-slate-400 font-normal">12.0 - 16.0</td>
                        <td className="py-4 text-right text-[#123440] font-semibold">g/dL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cuadro de Observaciones Médicas */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(18,52,64,0.04)]">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 size={16} className="text-[#69943A]" />
                  <h3 className="font-headline text-sm font-bold text-[#123440]">Cuadro de Información Adicional</h3>
                </div>
                <textarea 
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full h-40 bg-slate-100 border border-transparent rounded-xl p-4 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all resize-none placeholder:text-slate-400" 
                  placeholder="Escriba aquí sus observaciones médicas, notas adicionales o recomendaciones para el paciente..."
                />
                <div className="mt-4 flex justify-end">
                  <button className="px-6 py-2.5 bg-[#123440] hover:bg-[#1a4a5c] text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1.5">
                    <Save size={14} />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}