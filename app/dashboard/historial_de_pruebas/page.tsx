"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Download, 
  CalendarDays, 
  ChevronDown, 
  Filter, 
  Eye, 
  FileDown, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  Search,
  Bell,
  Settings,
  Loader2
} from 'lucide-react';
import SideNavBar from '../../../componentes/SideNavBar';
import { createClient } from '@/lib/supabase/client';

const ITEMS_PER_PAGE = 8;

interface TestItem {
  id: string;
  candidateId: string;
  paciente: string;
  iniciales: string;
  tipo: string;
  fecha: string;
  rawDate: string | null;
  estado: 'Completado' | 'En Proceso' | 'Pendiente';
  color: string;
}

export default function HistorialPruebas() {
  const router = useRouter();
  const supabase = createClient();

  const [pruebasData, setPruebasData] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('Todos los estados');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Cargar datos reales desde Supabase
  useEffect(() => {
    async function fetchCandidateResults() {
      try {
        setLoading(true);

        const { data: resultsData, error } = await supabase
          .from('candidate_results')
          .select(`
            id,
            candidate_id,
            status,
            started_at,
            completed_at,
            candidates (
              id,
              full_name,
              paternal_surname,
              maternal_surname
            ),
            tests (
              id,
              name
            )
          `)
          .order('completed_at', { ascending: false, nullsFirst: false });

        if (error) {
          console.error('Error al obtener datos de Supabase:', error);
          return;
        }

        if (resultsData) {
          // Transformación y normalización de la información recibida
          const formattedData: TestItem[] = resultsData.map((item: any) => {
            const candidate = item.candidates;
            const fullCandidateName = candidate 
              ? `${candidate.full_name || ''} ${candidate.paternal_surname || ''} ${candidate.maternal_surname || ''}`.trim()
              : 'Candidato Desconocido';

            // Generar iniciales del candidato
            const nameParts = fullCandidateName.split(' ').filter(Boolean);
            const iniciales = nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : (nameParts[0]?.[0] || 'C').toUpperCase();

            // Determinar estado y estilos
            let estado: 'Completado' | 'En Proceso' | 'Pendiente' = 'Pendiente';
            let color = "bg-red-50 text-red-600 border-red-200";

            const rawStatus = String(item.status || '').toLowerCase().trim();
            if (rawStatus === 'completado' || rawStatus === 'completed' || item.completed_at) {
              estado = 'Completado';
              color = "bg-[#9DBA3A]/15 text-[#69943A] border-[#9DBA3A]";
            } else if (rawStatus === 'en_proceso' || rawStatus === 'in_progress' || item.started_at) {
              estado = 'En Proceso';
              color = "bg-blue-50 text-blue-600 border-blue-200";
            }

            // Formatear fecha
            const rawDate = item.completed_at || item.started_at;
            const fecha = rawDate 
              ? new Date(rawDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Sin fecha';

            return {
              id: String(item.id),
              candidateId: String(item.candidate_id || candidate?.id || item.id),
              paciente: fullCandidateName,
              iniciales,
              tipo: item.tests?.name || 'Prueba Psicométrica',
              fecha,
              rawDate,
              estado,
              color
            };
          });

          setPruebasData(formattedData);
        }
      } catch (err) {
        console.error('Error inesperado:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCandidateResults();
  }, [supabase]);

  // 2. Filtrado dinámico
  const filteredPruebas = useMemo(() => {
    return pruebasData.filter((item) => {
      const matchesSearch = 
        item.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'Todos los estados' || item.estado === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [pruebasData, searchQuery, filterStatus]);

  // 3. Paginación configurada a 8 registros
  const totalPages = Math.ceil(filteredPruebas.length / ITEMS_PER_PAGE) || 1;
  const paginatedPruebas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPruebas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPruebas, currentPage]);

  // 4. Agrupación por candidato de las pruebas paginadas
  const groupedPruebas = useMemo(() => {
    const groups: { [key: string]: { paciente: string; iniciales: string; pruebas: TestItem[] } } = {};
    
    paginatedPruebas.forEach((item) => {
      const groupKey = item.candidateId || item.paciente;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          paciente: item.paciente,
          iniciales: item.iniciales,
          pruebas: []
        };
      }
      groups[groupKey].pruebas.push(item);
    });

    return Object.values(groups);
  }, [paginatedPruebas]);

  // Redirección a la vista detallada de las preguntas/respuestas del test
  const handleVerDetalles = (id: string) => {
    router.push(`/historial/${id}`);
  };

  // Descarga directa del archivo de preguntas y respuestas
  const handleDescargarRespuestas = async (e: React.MouseEvent, item: TestItem) => {
    e.stopPropagation();
    try {
      // Consulta adicional a Supabase para obtener las preguntas/respuestas especificas si es necesario
      const { data: answersData, error } = await supabase
        .from('candidate_results')
        .select('answers_json')
        .eq('id', item.id)
        .single();

      if (error) throw error;

      console.log(`Descargando respuestas para la prueba ${item.id}:`, answersData?.answers_json);
      
      // Ejemplo: Generar o disparar la descarga de la hoja en PDF
      alert(`Iniciando descarga de hoja de preguntas y respuestas para la prueba #${item.id}`);
    } catch (err) {
      console.error('Error al descargar las respuestas:', err);
    }
  };

  return (
    <div className="bg-[#f9f9f7] text-slate-800 flex min-h-screen font-sans">
      <SideNavBar role="aplicador" title="Portal Clínico" />

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Navbar Superior */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm flex justify-between items-center px-8 h-16">
          <div className="flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all placeholder:text-slate-400 text-[#202221]"
                placeholder="Buscar paciente, ID o prueba..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#123440]">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors relative cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="mt-16 p-8 flex-1">
          <div className="space-y-8">
          
          {/* Encabezado */}
          <section className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-black tracking-tight text-[#123440] mb-2">Historial de Pruebas</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Acceda y gestione el registro completo de análisis clínicos y psicológicos agrupados por paciente.
                </p>
              </div>
              <button className="flex items-center gap-2 bg-[#123440] hover:bg-[#1a4a5c] text-white px-5 py-2.5 rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer active:scale-95">
                <Download size={16} />
                <span>Exportar Reporte General</span>
              </button>
            </div>
          </section>

          {/* Filtros y Controles */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3 bg-white p-3 rounded-xl flex flex-wrap items-center gap-3 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-semibold">
                <CalendarDays size={14} />
                <span>Filtrar por:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#9DBA3A] text-[#202221] shadow-sm">Hoy</button>
                <button className="px-3.5 py-1.5 text-xs font-semibold rounded-full text-slate-500 hover:bg-slate-50 transition-colors">Esta Semana</button>
                <button className="px-3.5 py-1.5 text-xs font-semibold rounded-full text-slate-500 hover:bg-slate-50 transition-colors">Este Mes</button>
                <button className="px-3.5 py-1.5 text-xs font-semibold rounded-full text-slate-500 border border-slate-200 hover:border-[#9DBA3A] transition-all flex items-center gap-1">
                  <span>Rango Personalizado</span>
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-sm">
              <Filter size={16} className="text-[#69943A]" />
              <select 
                value={filterStatus} 
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option>Todos los estados</option>
                <option>Completado</option>
                <option>En Proceso</option>
                <option>Pendiente</option>
              </select>
            </div>
          </section>

          {/* Tabla Agrupada de Resultados */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input type="checkbox" className="rounded border-slate-300 text-[#9DBA3A] focus:ring-[#9DBA3A]" />
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Paciente</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipo de Prueba</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <div className="flex items-center justify-center gap-2 font-medium">
                          <Loader2 className="animate-spin text-[#123440]" size={20} />
                          <span>Cargando evaluaciones de la base de datos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : groupedPruebas.length > 0 ? (
                    groupedPruebas.map((group) => (
                      <React.Fragment key={group.paciente}>
                        {group.pruebas.map((item, index) => (
                          <tr 
                            key={item.id} 
                            onClick={() => handleVerDetalles(item.id)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-slate-300 text-[#9DBA3A] focus:ring-[#9DBA3A]" />
                            </td>

                            {/* Renderizado agrupado del candidato usando rowSpan */}
                            {index === 0 && (
                              <td 
                                className="px-6 py-4 align-top bg-white border-r border-slate-50" 
                                rowSpan={group.pruebas.length}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-[#123440] border border-slate-200 group-hover:bg-[#123440] group-hover:text-white transition-colors">
                                    {group.iniciales}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#123440] group-hover:text-[#69943A] transition-colors">
                                      {group.paciente}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                      {group.pruebas.length} {group.pruebas.length === 1 ? 'prueba' : 'pruebas'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            )}

                            <td className="px-6 py-4 text-slate-600 font-medium">
                              <div>
                                <p className="font-semibold">{item.tipo}</p>
                                <p className="text-[11px] text-slate-400 font-medium">ID: {item.id}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">{item.fecha}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.color}`}>
                                {item.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => handleVerDetalles(item.id)}
                                  className="p-1.5 text-[#123440] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                                  title="Ver Preguntas y Respuestas"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={(e) => handleDescargarRespuestas(e, item)}
                                  className="p-1.5 text-[#69943A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                                  title="Descargar Hoja de Respuestas PDF"
                                >
                                  <FileDown size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                        No se encontraron registros que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-3.5 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Mostrando {filteredPruebas.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredPruebas.length)} de {filteredPruebas.length} resultados
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 text-slate-400 hover:text-[#123440] hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-[#9DBA3A] text-[#202221] shadow-sm"
                        : "hover:bg-white text-slate-600 font-medium"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-slate-400 hover:text-[#123440] hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid Inferior */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#123440] text-white p-6 rounded-2xl relative overflow-hidden group shadow-md">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Resumen Semanal</h3>
                <p className="text-slate-300 text-xs mb-4">Total de registros obtenidos: {pruebasData.length}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-white">+{pruebasData.length}</span>
                  <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">evaluaciones</span>
                </div>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                <TrendingUp size={120} />
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 border border-slate-100 shadow-sm">
              <div className="w-full sm:w-1/4 aspect-video sm:aspect-square bg-[#f4f6f0] rounded-xl flex items-center justify-center text-[#69943A]">
                <Image src="/images/FDHZ_2025-Color_Vertical.png" alt="Validación Institucional" width={70} height={70} className="object-contain opacity-40 grayscale" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#123440] mb-1">Protocolos de Calidad</h3>
                <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                  Todos los resultados generados en este portal siguen los estándares institucionales de la fundación para expedientes clínicos y psicométricos. El manejo del historial es privado y encriptado.
                </p>
                <a className="inline-flex items-center gap-1 text-[#69943A] font-bold text-xs hover:underline" href="#">
                  <span>Aviso de privacidad de datos</span>
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  );
}