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
  Loader2,
  X
} from 'lucide-react';
import SideNavBar from '../../../componentes/SideNavBar';
import { createClient } from '@/lib/supabase/client';

const ITEMS_PER_PAGE = 8;

type DateFilterType = 'todos' | 'hoy' | 'semana' | 'mes' | 'personalizado';

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
  
  // Filtros de estado y texto
  const [filterStatus, setFilterStatus] = useState<string>('Todos los estados');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filtros de fecha
  const [dateFilter, setDateFilter] = useState<DateFilterType>('todos');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cargar datos directos desde Supabase usando candidate_results.user_id
  useEffect(() => {
    async function fetchCandidateResults() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.warn('No hay sesión de usuario activa.');
          setPruebasData([]);
          setLoading(false);
          return;
        }

        // Consulta directa a candidate_results filtrando por user_id
        const { data: resultsData, error } = await supabase
          .from('candidate_results')
          .select(`
            id,
            candidate_id,
            user_id,
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
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false, nullsFirst: false });

        if (error) {
          console.error('Error al obtener candidate_results:', error);
          setPruebasData([]);
          return;
        }

        if (resultsData) {
          const formattedData: TestItem[] = resultsData.map((item: any) => {
            const candidate = Array.isArray(item.candidates) ? item.candidates[0] : item.candidates;
            const fullCandidateName = candidate 
              ? `${candidate.full_name || ''} ${candidate.paternal_surname || ''} ${candidate.maternal_surname || ''}`.trim()
              : 'Candidato Desconocido';

            const nameParts = fullCandidateName.split(' ').filter(Boolean);
            const iniciales = nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : (nameParts[0]?.[0] || 'C').toUpperCase();

            let estado: 'Completado' | 'En Proceso' | 'Pendiente' = 'Pendiente';
            let color = "bg-red-50 text-red-700 border-red-200";

            const rawStatus = String(item.status || '').toLowerCase().trim();
            if (rawStatus === 'completado' || rawStatus === 'completed' || item.completed_at) {
              estado = 'Completado';
              color = "bg-emerald-50 text-emerald-700 border-emerald-200";
            } else if (rawStatus === 'en_proceso' || rawStatus === 'in_progress' || item.started_at) {
              estado = 'En Proceso';
              color = "bg-blue-50 text-blue-700 border-blue-200";
            }

            const rawDate = item.completed_at || item.started_at;
            const fecha = rawDate 
              ? new Date(rawDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Sin fecha';

            const test = Array.isArray(item.tests) ? item.tests[0] : item.tests;

            return {
              id: String(item.id),
              candidateId: String(item.candidate_id || candidate?.id || item.id),
              paciente: fullCandidateName,
              iniciales,
              tipo: test?.name || 'Prueba Psicométrica',
              fecha,
              rawDate,
              estado,
              color
            };
          });

          setPruebasData(formattedData);
        }
      } catch (err) {
        console.error('Error inesperado en fetchCandidateResults:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCandidateResults();
  }, [supabase]);

  // Filtrado combinado (Búsqueda + Estado + Fechas)
  const filteredPruebas = useMemo(() => {
    return pruebasData.filter((item) => {
      const matchesSearch = 
        item.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'Todos los estados' || item.estado === filterStatus;

      let matchesDate = true;
      if (dateFilter !== 'todos') {
        if (!item.rawDate) {
          matchesDate = false;
        } else {
          const itemDate = new Date(item.rawDate);
          const now = new Date();

          if (dateFilter === 'hoy') {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            matchesDate = itemDate >= startOfToday && itemDate <= endOfToday;
          } else if (dateFilter === 'semana') {
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            matchesDate = itemDate >= startOfWeek && itemDate <= endOfWeek;
          } else if (dateFilter === 'mes') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            matchesDate = itemDate >= startOfMonth && itemDate <= endOfMonth;
          } else if (dateFilter === 'personalizado') {
            if (customStartDate) {
              const start = new Date(`${customStartDate}T00:00:00`);
              matchesDate = matchesDate && itemDate >= start;
            }
            if (customEndDate) {
              const end = new Date(`${customEndDate}T23:59:59`);
              matchesDate = matchesDate && itemDate <= end;
            }
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [pruebasData, searchQuery, filterStatus, dateFilter, customStartDate, customEndDate]);

  // Paginación
  const totalPages = Math.ceil(filteredPruebas.length / ITEMS_PER_PAGE) || 1;
  const paginatedPruebas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPruebas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPruebas, currentPage]);

  // Agrupación por paciente usando ID único de grupo
  const groupedPruebas = useMemo(() => {
    const groups: { [key: string]: { id: string; paciente: string; iniciales: string; pruebas: TestItem[] } } = {};
    
    paginatedPruebas.forEach((item) => {
      const groupKey = item.candidateId || item.paciente;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          paciente: item.paciente,
          iniciales: item.iniciales,
          pruebas: []
        };
      }
      groups[groupKey].pruebas.push(item);
    });

    return Object.values(groups);
  }, [paginatedPruebas]);

  // Navega a la vista de resultados pasando el ID del candidato (candidates.id).
  // La vista detallada consulta candidate_results por candidate_id para listar
  // todas las pruebas asociadas al candidato.
  const handleVerDetalles = (candidateId: string) => {
    router.push(`/dashboard/resultados?id=${candidateId}`);
  };

  const handleDescargarRespuestas = async (e: React.MouseEvent, item: TestItem) => {
  e.stopPropagation();
  try {
    const { data: answersData, error } = await supabase
      .from('candidate_results')
      .select('answers_json') // <--- Campo que contiene las respuestas en JSON
      .eq('id', item.id)
      .single();

    if (error) throw error;
    
    // Aquí puedes agregar tu lógica para exportar a PDF o descargar el archivo JSON
    alert(`Descargando respuestas de la prueba #${item.id}`);
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
                  Acceda y gestione el registro completo de análisis clínicos y psicométricos agrupados por paciente.
                </p>
              </div>
              <button className="flex items-center gap-2 bg-[#123440] hover:bg-[#1a4a5c] text-white px-5 py-2.5 rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer active:scale-95">
                <Download size={16} />
                <span>Exportar Reporte General</span>
              </button>
            </div>
          </section>

          {/* Filtros de Fecha y Estado */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3 bg-white p-3 rounded-xl flex flex-wrap items-center gap-3 border border-slate-100 shadow-sm relative">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-semibold">
                <CalendarDays size={14} />
                <span>Filtrar por:</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <button 
                  onClick={() => {
                    setDateFilter('todos');
                    setShowCustomPicker(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                    dateFilter === 'todos' 
                      ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" 
                      : "text-slate-500 font-semibold hover:bg-slate-50"
                  }`}
                >
                  Todos
                </button>

                <button 
                  onClick={() => {
                    setDateFilter('hoy');
                    setShowCustomPicker(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                    dateFilter === 'hoy' 
                      ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" 
                      : "text-slate-500 font-semibold hover:bg-slate-50"
                  }`}
                >
                  Hoy
                </button>

                <button 
                  onClick={() => {
                    setDateFilter('semana');
                    setShowCustomPicker(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                    dateFilter === 'semana' 
                      ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" 
                      : "text-slate-500 font-semibold hover:bg-slate-50"
                  }`}
                >
                  Esta Semana
                </button>

                <button 
                  onClick={() => {
                    setDateFilter('mes');
                    setShowCustomPicker(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                    dateFilter === 'mes' 
                      ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" 
                      : "text-slate-500 font-semibold hover:bg-slate-50"
                  }`}
                >
                  Este Mes
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowCustomPicker(!showCustomPicker)}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all flex items-center gap-1 cursor-pointer border ${
                      dateFilter === 'personalizado' 
                        ? "bg-[#9DBA3A] text-[#202221] font-bold border-[#9DBA3A] shadow-sm" 
                        : "text-slate-500 font-semibold border-slate-200 hover:border-[#9DBA3A]"
                    }`}
                  >
                    <span>
                      {dateFilter === 'personalizado' && (customStartDate || customEndDate)
                        ? `${customStartDate || '...'} a ${customEndDate || '...'}`
                        : 'Rango Personalizado'}
                    </span>
                    <ChevronDown size={12} className={`transition-transform ${showCustomPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showCustomPicker && (
                    <div className="absolute top-full left-0 mt-2 z-50 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-72 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-[#123440]">Seleccionar Fechas</span>
                        <button 
                          onClick={() => setShowCustomPicker(false)}
                          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha Inicial:</label>
                          <input 
                            type="date"
                            value={customStartDate}
                            onChange={(e) => {
                              setCustomStartDate(e.target.value);
                              setDateFilter('personalizado');
                              setCurrentPage(1);
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123440] text-slate-700 font-medium cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha Final:</label>
                          <input 
                            type="date"
                            value={customEndDate}
                            onChange={(e) => {
                              setCustomEndDate(e.target.value);
                              setDateFilter('personalizado');
                              setCurrentPage(1);
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123440] text-slate-700 font-medium cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setDateFilter('personalizado');
                            setShowCustomPicker(false);
                          }}
                          className="flex-1 bg-[#123440] text-white text-xs py-1.5 rounded-lg font-bold hover:bg-[#1a4a5c] transition-colors cursor-pointer"
                        >
                          Aplicar
                        </button>
                        <button
                          onClick={() => {
                            setCustomStartDate('');
                            setCustomEndDate('');
                            setDateFilter('todos');
                            setShowCustomPicker(false);
                            setCurrentPage(1);
                          }}
                          className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtro por Estado */}
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
              </select>
            </div>
          </section>

          {/* Tabla Agrupada de Resultados */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
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
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="flex items-center justify-center gap-2 font-medium">
                          <Loader2 className="animate-spin text-[#123440]" size={20} />
                          <span>Cargando evaluaciones de la base de datos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : groupedPruebas.length > 0 ? (
                    groupedPruebas.map((group) => (
                      <React.Fragment key={group.id}>
                        {group.pruebas.map((item, index) => (
                          <tr 
                            key={item.id} 
                            onClick={() => handleVerDetalles(item.candidateId)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
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
                                  onClick={() => handleVerDetalles(item.candidateId)}
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
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
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
            {/* Card de Resumen Semanal con letras blancas legibles */}
            <div className="bg-[#123440] text-[#FFFFFF] p-6 rounded-2xl relative overflow-hidden group shadow-md">
              <div className="relative z-10">
                <h3 className="text-white font-bold mb-1">Resumen Semanal</h3>
                <p className="text-slate-300 text-xs mb-4">Total de registros obtenidos: {pruebasData.length}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-white font-black text-[#FFFFFF]">+{pruebasData.length}</span>
                  <span className="text-[20px] text-white font-bold opacity-70 uppercase tracking-wider mb-1">evaluaciones</span>
                </div>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                <TrendingUp size={120} />
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 border border-slate-100 shadow-sm">
              <div className="w-full sm:w-1/4 aspect-video sm:aspect-square bg-[#f4f6f0] rounded-xl flex items-center justify-center text-[#69943A]">
                <Image 
                  src="/images/FDHZ_2025-Color_Vertical.png" 
                  alt="Validación Institucional" 
                  width={70} 
                  height={70} 
                  style={{ width: 'auto', height: 'auto' }}
                  className="object-contain opacity-40 grayscale" 
                />
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