"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, 
  ChevronDown, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  Search,
  Bell,
  Settings,
  Loader2,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import SideNavBar from '../../componentes/SideNavBar';
import NotificadorTiempoReal from '../../componentes/NotificadorTiempoReal';
import ModalConfiguracionPerfil from '@/app/componentes/ModalConfiguracionPerfil';
import { createClient } from '@/lib/supabase/client';
import { obtenerHistorialPruebas, eliminarPruebaYResultado, TestItem } from './historialService';

const ITEMS_PER_PAGE = 8;
type DateFilterType = 'todos' | 'hoy' | 'semana' | 'mes' | 'personalizado';

export default function HistorialPruebas() {
  const router = useRouter();
  const supabase = createClient();

  const [pruebasData, setPruebasData] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtros de sede y texto
  const [filterSede, setFilterSede] = useState<string>('Todas las sedes');
  const [sedesDisponibles, setSedesDisponibles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filtros de fecha
  const [dateFilter, setDateFilter] = useState<DateFilterType>('todos');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  // Estados para el Modal de Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<TestItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Estados para usuario, avatar, modal de perfil y barra lateral colapsable
  const [userName, setUserName] = useState('Usuario');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);

  const cargarDatosUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.full_name || 'Usuario');
        setAvatarUrl(profileData.avatar_url || null);
      }
    } catch (error) {
      console.error('Error al cargar perfil del usuario:', error);
    }
  };

  // Cargar datos usando el servicio modular y perfil de usuario
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPruebasData([]);
          setLoading(false);
          return;
        }

        // Cargar nombre y avatar del perfil
        await cargarDatosUsuario();

        const resultsData = await obtenerHistorialPruebas(user.id);
        const sedesSet = new Set<string>();

        const formattedData: TestItem[] = resultsData.map((item: any) => {
          const candidate = Array.isArray(item.candidates) ? item.candidates[0] : item.candidates;
          const fullCandidateName = candidate 
            ? `${candidate.full_name || ''} ${candidate.paternal_surname || ''} ${candidate.maternal_surname || ''}`.trim()
            : 'Candidato Desconocido';

          const sedeCandidate = candidate?.headquarter ? String(candidate.headquarter).trim() : 'Sin sede';
          sedesSet.add(sedeCandidate);

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
            color,
            sede: sedeCandidate
          };
        });

        setPruebasData(formattedData);
        setSedesDisponibles(Array.from(sedesSet));
      } catch (err) {
        console.error('Error al cargar historial:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Filtrado combinado (Búsqueda + Sede + Fechas)
  const filteredPruebas = useMemo(() => {
    return pruebasData.filter((item) => {
      const matchesSearch = 
        item.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSede = filterSede === 'Todas las sedes' || item.sede === filterSede;

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

      return matchesSearch && matchesSede && matchesDate;
    });
  }, [pruebasData, searchQuery, filterSede, dateFilter, customStartDate, customEndDate]);

  // Paginación y Agrupación
  const totalPages = Math.ceil(filteredPruebas.length / ITEMS_PER_PAGE) || 1;
  const paginatedPruebas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPruebas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPruebas, currentPage]);

  const groupedPruebas = useMemo(() => {
    const groups: { [key: string]: { id: string; paciente: string; iniciales: string; pruebas: TestItem[] } } = {};
    paginatedPruebas.forEach((item) => {
      const groupKey = item.candidateId || item.paciente;
      if (!groups[groupKey]) {
        groups[groupKey] = { id: groupKey, paciente: item.paciente, iniciales: item.iniciales, pruebas: [] };
      }
      groups[groupKey].pruebas.push(item);
    });
    return Object.values(groups);
  }, [paginatedPruebas]);

  const handleVerDetalles = (candidateId: string) => {
    router.push(`/dashboard/resultados?id=${candidateId}`);
  };

  // Abrir modal de confirmación para eliminar
  const confirmarEliminacion = (e: React.MouseEvent, item: TestItem) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Ejecutar eliminación llamando al servicio
  const ejecutarEliminacion = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await eliminarPruebaYResultado(itemToDelete.id, itemToDelete.candidateId);
      
      setPruebasData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error detallado al eliminar:', err);
      alert(`Error al eliminar de la base de datos: ${err.message || 'Error desconocido'}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#f9f9f7] text-slate-800 flex min-h-screen font-sans overflow-x-hidden">
      <SideNavBar 
        role="aplicador" 
        title="Portal Clínico" 
        onToggleCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)} 
      />

      {/* Contenedor principal adaptable según si el menú lateral está colapsado (w-20) o expandido (w-64) */}
      <div className={`flex-1 min-h-screen flex flex-col w-full transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* Navbar dinámico adaptado al ancho del sidebar */}
        <header className={`fixed top-0 right-0 left-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm flex justify-between items-center px-4 md:px-8 h-16 transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>
          <div className="flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all placeholder:text-slate-400 text-[#202221]"
                placeholder="Buscar paciente, ID o prueba..."
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto text-[#123440]">
            <NotificadorTiempoReal />
          
            {/* Botón de configuración de perfil con Avatar */}
            <button 
              onClick={() => setIsPerfilModalOpen(true)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#123440]"
              title="Configuración de perfil"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-600">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Modal de Configuración de Perfil */}
        <ModalConfiguracionPerfil 
          isOpen={isPerfilModalOpen}
          onClose={() => setIsPerfilModalOpen(false)}
          onPerfilActualizado={() => {
            cargarDatosUsuario();
          }}
        />

        {/* Main con ancho fluido total */}
        <main className="mt-16 p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          <div className="space-y-8">
            <section className="mb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <h1 className="text-3xl font-black tracking-tight text-[#123440] mb-2">Historial de Pruebas</h1>
                  <p className="text-slate-500 text-sm leading-relaxed">Acceda y gestione el registro completo de análisis clínicos y psicométricos agrupados por paciente.</p>
                </div>
              </div>
            </section>

            {/* Filtros de Fecha y Sede */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="lg:col-span-3 bg-white p-3 rounded-xl flex flex-wrap items-center gap-3 border border-slate-100 shadow-sm relative">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-semibold"><CalendarDays size={14} /><span>Filtrar por:</span></div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => { setDateFilter('todos'); setShowCustomPicker(false); setCurrentPage(1); }} className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${dateFilter === 'todos' ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" : "text-slate-500 font-semibold hover:bg-slate-50"}`}>Todos</button>
                  <button onClick={() => { setDateFilter('hoy'); setShowCustomPicker(false); setCurrentPage(1); }} className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${dateFilter === 'hoy' ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" : "text-slate-500 font-semibold hover:bg-slate-50"}`}>Hoy</button>
                  <button onClick={() => { setDateFilter('semana'); setShowCustomPicker(false); setCurrentPage(1); }} className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${dateFilter === 'semana' ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" : "text-slate-500 font-semibold hover:bg-slate-50"}`}>Esta Semana</button>
                  <button onClick={() => { setDateFilter('mes'); setShowCustomPicker(false); setCurrentPage(1); }} className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${dateFilter === 'mes' ? "bg-[#9DBA3A] text-[#202221] font-bold shadow-sm" : "text-slate-500 font-semibold hover:bg-slate-50"}`}>Este Mes</button>
                  
                  <div className="relative">
                    <button onClick={() => setShowCustomPicker(!showCustomPicker)} className={`px-3.5 py-1.5 text-xs rounded-full transition-all flex items-center gap-1 cursor-pointer border ${dateFilter === 'personalizado' ? "bg-[#9DBA3A] text-[#202221] font-bold border-[#9DBA3A] shadow-sm" : "text-slate-500 font-semibold border-slate-200"}`}>
                      <span>{dateFilter === 'personalizado' && (customStartDate || customEndDate) ? `${customStartDate || '...'} a ${customEndDate || '...'}` : 'Rango Personalizado'}</span>
                      <ChevronDown size={12} />
                    </button>
                    {showCustomPicker && (
                      <div className="absolute top-full left-0 mt-2 z-50 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-72 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100"><span className="text-xs font-bold text-[#123440]">Seleccionar Fechas</span><button onClick={() => setShowCustomPicker(false)}><X size={14} /></button></div>
                        <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha Inicial:</label><input type="date" value={customStartDate} onChange={(e) => { setCustomStartDate(e.target.value); setDateFilter('personalizado'); setCurrentPage(1); }} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha Final:</label><input type="date" value={customEndDate} onChange={(e) => { setCustomEndDate(e.target.value); setDateFilter('personalizado'); setCurrentPage(1); }} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de Sede */}
              <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-sm">
                <Filter size={16} className="text-[#69943A]" />
                <select 
                  value={filterSede} 
                  onChange={(e) => { setFilterSede(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Todas las sedes">Todas las sedes</option>
                  {sedesDisponibles.map((sede) => (
                    <option key={sede} value={sede}>{sede}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Tabla */}
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
                      <tr><td colSpan={5} className="text-center py-12 text-slate-400"><Loader2 className="animate-spin inline mr-2 text-[#123440]" size={20} />Cargando evaluaciones...</td></tr>
                    ) : groupedPruebas.length > 0 ? (
                      groupedPruebas.map((group) => (
                        <React.Fragment key={group.id}>
                          {group.pruebas.map((item, index) => (
                            <tr key={item.id} onClick={() => handleVerDetalles(item.candidateId)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                              {index === 0 && (
                                <td className="px-6 py-4 align-top bg-white border-r border-slate-50" rowSpan={group.pruebas.length}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-[#123440] border border-slate-200 group-hover:bg-[#123440] group-hover:text-white transition-colors">{group.iniciales}</div>
                                    <div>
                                      <p className="font-bold text-[#123440] group-hover:text-[#69943A] transition-colors">{group.paciente}</p>
                                      <p className="text-[11px] text-slate-400 font-medium">{group.pruebas.length} {group.pruebas.length === 1 ? 'prueba' : 'pruebas'}</p>
                                    </div>
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4 text-slate-600 font-medium"><p className="font-semibold">{item.tipo}</p></td>
                              <td className="px-6 py-4 text-slate-400 text-xs">{item.fecha}</td>
                              <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.color}`}>{item.estado}</span></td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleVerDetalles(item.candidateId)} className="p-1.5 text-[#123440] hover:bg-slate-100 rounded-lg cursor-pointer" title="Ver Detalles"><Eye size={16} /></button>
                                  {/* Botón de Eliminar */}
                                  <button onClick={(e) => confirmarEliminacion(e, item)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" title="Eliminar Registro"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No se encontraron registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-6 py-3.5 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mostrando {filteredPruebas.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredPruebas.length)} de {filteredPruebas.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 text-slate-400 hover:bg-white rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg ${currentPage === page ? "bg-[#9DBA3A] text-[#202221] shadow-sm" : "text-slate-600"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 text-slate-400 hover:bg-white rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="text-base font-bold text-[#123440]">¿Estás seguro de eliminar este registro?</h3>
                <p className="text-xs text-slate-500">Se eliminará el resultado y el candidato si no tiene más pruebas.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-6 text-xs text-slate-600 space-y-1 border border-slate-100">
              <p><strong>Paciente:</strong> {itemToDelete?.paciente}</p>
              <p><strong>Prueba:</strong> {itemToDelete?.tipo}</p>
              <p><strong>Fecha:</strong> {itemToDelete?.fecha}</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button disabled={deleting} onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer">Cancelar</button>
              <button disabled={deleting} onClick={ejecutarEliminacion} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}