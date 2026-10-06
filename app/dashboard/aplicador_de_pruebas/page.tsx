"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  FlaskConical, 
  Timer, 
  CheckCircle2,
  FileSpreadsheet,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Settings,
} from 'lucide-react';

import SideNavBar from '../../../componentes/SideNavBar';
import { createClient } from '@/lib/supabase/client';

const DAILY_TIPS = [
  {
    quote: "La precisión en el diagnóstico es el primer paso hacia el bienestar. Verifique siempre las referencias normativas antes del reporte final.",
    author: "Evaluación Clínica"
  },
  {
    quote: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    author: "Robert Collier"
  },
  {
    quote: "Una evaluación objetiva y empática transforma la toma de decisiones profesionales.",
    author: "Buenas Prácticas"
  },
  {
    quote: "La constancia no es hacer cosas extraordinarias, sino hacer las cosas ordinarias con un compromiso extraordinario.",
    author: "Anónimo"
  },
  {
    quote: "El aprendizaje continuo y la atención al detalle garantizan la calidad de cada expediente.",
    author: "Desarrollo Profesional"
  },
  {
    quote: "No cuentes los días, haz que los días cuenten.",
    author: "Muhammad Ali"
  },
  {
    quote: "La claridad en la comunicación de resultados fortalece la confianza del paciente.",
    author: "Ética Profesional"
  }
];

interface TestDetail {
  id: string;
  test_name: string;
  date_info: string;
  status: 'completado' | 'en_proceso' | 'pendiente';
}

interface CandidateGroup {
  candidate_id: string;
  candidate_name: string;
  tests: TestDetail[];
}

export default function AplicadorDePruebas() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Cargando...');
  
  const [recentActivities, setRecentActivities] = useState<CandidateGroup[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [dailyTip, setDailyTip] = useState(DAILY_TIPS[0]);

  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    completedToday: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    setDailyTip(DAILY_TIPS[tipIndex]);

    async function fetchData() {
      try {
        setLoadingActivity(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserName('Usuario');
          setLoadingActivity(false);
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        setUserName(profileData?.full_name || 'Usuario');

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // 1. Métricas de links habilitados
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('max_users, current_users')
          .eq('created_by', user.id);

        let calculatedTotalUsers = 0;
        let calculatedPendingUsers = 0;

        if (!linksError && linksData) {
          linksData.forEach((link) => {
            const max = link.max_users || 0;
            const current = link.current_users || 0;
            calculatedTotalUsers += max;
            calculatedPendingUsers += Math.max(0, max - current);
          });
        }

        // 2. Conteo de pruebas completadas hoy (usando user_id directo primero)
        let todayCount = 0;
        const { count: directCount } = await supabase
          .from('candidate_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('completed_at', startOfToday.toISOString())
          .lte('completed_at', endOfToday.toISOString());

        if (directCount && directCount > 0) {
          todayCount = directCount;
        } else {
          const { count: relCount } = await supabase
            .from('candidate_results')
            .select('id, candidates!inner(links!inner(created_by))', { count: 'exact', head: true })
            .eq('candidates.links.created_by', user.id)
            .gte('completed_at', startOfToday.toISOString())
            .lte('completed_at', endOfToday.toISOString());
          
          todayCount = relCount || 0;
        }

        setMetrics({
          total: calculatedTotalUsers,
          pending: calculatedPendingUsers,
          completedToday: todayCount,
        });

        // 3. Obtención de candidate_results con estrategia dual
        // Intento 1: Filtrar por candidate_results.user_id directo
        let { data: resultsData, error: resultsError } = await supabase
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
              name
            )
          `)
          .eq('user_id', user.id)
          .limit(30);

        // Intento 2: Si por user_id no trajo nada, intentar mediante candidates -> links -> created_by
        if (!resultsError && (!resultsData || resultsData.length === 0)) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('candidate_results')
            .select(`
              id,
              candidate_id,
              user_id,
              status,
              started_at,
              completed_at,
              candidates!inner (
                id,
                full_name,
                paternal_surname,
                maternal_surname,
                link_id,
                links!inner (
                  created_by
                )
              ),
              tests (
                name
              )
            `)
            .eq('candidates.links.created_by', user.id)
            .limit(30);

          if (!fallbackError && fallbackData) {
            resultsData = fallbackData;
          } else if (fallbackError) {
            console.error('Error al consultar candidate_results (fallback):', fallbackError.message);
          }
        } else if (resultsError) {
          console.error('Error al consultar candidate_results:', resultsError.message);
        }

        if (resultsData && resultsData.length > 0) {
          // Ordenar cliente-side por timestamp de completado o inicio si están disponibles
          resultsData.sort((a: any, b: any) => {
            const timeA = new Date(a.completed_at || a.started_at || 0).getTime();
            const timeB = new Date(b.completed_at || b.started_at || 0).getTime();
            return timeB - timeA;
          });

          const groupsMap = new Map<string, CandidateGroup>();

          resultsData.forEach((item: any) => {
            const candidate = Array.isArray(item.candidates) ? item.candidates[0] : item.candidates;
            const candidateId = item.candidate_id || candidate?.id || item.id;
            const candidateName = candidate 
              ? `${candidate.full_name || ''} ${candidate.paternal_surname || ''}`.trim() 
              : 'Sin candidato asignado';

            const test = Array.isArray(item.tests) ? item.tests[0] : item.tests;
            const testName = test?.name || 'Prueba psicométrica';

            let status: 'completado' | 'en_proceso' | 'pendiente' = 'pendiente';
            const rawStatus = String(item.status || '').toLowerCase().trim();

            if (rawStatus === 'completado' || rawStatus === 'completed' || item.completed_at) {
              status = 'completado';
            } else if (rawStatus === 'en_proceso' || rawStatus === 'in_progress' || item.started_at) {
              status = 'en_proceso';
            } else {
              status = 'pendiente';
            }

            let dateInfo = '';
            switch (status) {
              case 'completado':
                dateInfo = item.completed_at ? formatDate(item.completed_at) : 'Prueba finalizada';
                break;
              case 'en_proceso':
                dateInfo = item.started_at ? `Iniciada: ${formatDate(item.started_at)}` : 'En proceso de respuesta';
                break;
              case 'pendiente':
              default:
                dateInfo = 'El usuario no ha respondido la prueba';
                break;
            }

            const testObj: TestDetail = {
              id: item.id,
              test_name: testName,
              date_info: dateInfo,
              status: status,
            };

            if (!groupsMap.has(candidateId)) {
              groupsMap.set(candidateId, {
                candidate_id: candidateId,
                candidate_name: candidateName,
                tests: [testObj],
              });
            } else {
              groupsMap.get(candidateId)!.tests.push(testObj);
            }
          });

          setRecentActivities(Array.from(groupsMap.values()));
        } else {
          setRecentActivities([]);
        }
      } catch (error) {
        console.error('Error general al obtener los datos:', error);
      } finally {
        setLoadingActivity(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Filtrado por barra de búsqueda
  const filteredActivities = recentActivities.filter((group) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const matchesCandidate = group.candidate_name.toLowerCase().includes(query);
    const matchesTest = group.tests.some((t) => t.test_name.toLowerCase().includes(query));
    return matchesCandidate || matchesTest;
  });

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE) || 1;
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completado':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Completado</span>;
      case 'en_proceso':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase">En Proceso</span>;
      case 'pendiente':
      default:
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full uppercase">Pendiente</span>;
    }
  };

  return (
    <div className="bg-[#f9f9f7] text-slate-800 flex min-h-screen font-sans">
      <SideNavBar role="aplicador" title="Panel de Aplicador" />

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm flex justify-between items-center px-8 h-16">
          <div className="flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all placeholder:text-slate-400 text-[#202221]"
                placeholder="Buscar paciente, prueba o expediente..."
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

        <main className="mt-16 p-8 flex-1">
          <div className="space-y-8">
            <section className="mb-8 relative overflow-hidden rounded-3xl bg-[#123440] p-8 text-white min-h-[180px] flex items-center shadow-lg">
              <div className="relative z-10 max-w-xl">
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">Bienvenido, {userName}</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Hoy tiene resultados pendientes de revisión y nuevas pruebas asignadas. Su labor impacta directamente la salud de nuestra comunidad.
                </p>
                <div className="mt-4">
                  <Link href="/dashboard/asignar_prueba" className="bg-[#9DBA3A] hover:bg-[#69943A] text-[#202221] px-5 py-2.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md cursor-pointer active:scale-95">
                    <PlusCircle size={16} />
                    <span>Asignar nueva prueba</span>
                  </Link>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none bg-gradient-to-br from-transparent to-[#9DBA3A]"></div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full border-[20px] border-white/5 pointer-events-none"></div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-slate-100 text-[#123440] rounded-xl">
                    <FlaskConical size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-[#69943A] bg-emerald-50 px-2 py-0.5 rounded-full">Capacidad Total</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#123440]">
                    {loadingActivity ? '--' : metrics.total}
                  </p>
                  <p className="text-xs font-medium text-slate-400">Pruebas Totales Habilitadas</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Timer size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Por Resolver</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#123440]">
                    {loadingActivity ? '--' : metrics.pending}
                  </p>
                  <p className="text-xs font-medium text-slate-400">Pruebas Pendientes / Faltantes</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#f4f6f0] text-[#69943A] rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-[#69943A] bg-emerald-50 px-2 py-0.5 rounded-full">Hoy</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-[#123440]">
                    {loadingActivity ? '--' : metrics.completedToday}
                  </p>
                  <p className="text-xs font-medium text-slate-400">Pruebas Realizadas Hoy</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#123440]">Actividad Reciente</h3>
                    <p className="text-xs text-slate-400">Últimas pruebas registradas por tu usuario</p>
                  </div>
                  <Link href="/dashboard/historial_de_pruebas" className="text-[#123440] hover:text-[#69943A] text-xs font-bold flex items-center gap-1 transition-colors">
                    <span>Historial completo</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Prueba</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalle / Fecha</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {loadingActivity ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                              Cargando actividad reciente...
                            </td>
                          </tr>
                        ) : filteredActivities.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                              {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'No tienes pruebas registradas aún.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedActivities.map((group) => {
                            const hasMultipleTests = group.tests.length > 1;

                            if (hasMultipleTests) {
                              return (
                                <tr key={group.candidate_id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-[#123440] align-top">
                                    <div>{group.candidate_name}</div>
                                    <span className="text-[10px] font-normal text-slate-400 block mt-1">
                                      {group.tests.length} pruebas asignadas
                                    </span>
                                  </td>
                                  <td colSpan={3} className="px-6 py-3.5">
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                                      {group.tests.map((test) => (
                                        <div 
                                          key={test.id} 
                                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 last:pb-0 last:border-b-0"
                                        >
                                          <div>
                                            <p className="font-semibold text-[#123440] text-xs">{test.test_name}</p>
                                            <p className="text-[11px] text-slate-500 italic mt-0.5">{test.date_info}</p>
                                          </div>
                                          <div>
                                            {renderStatusBadge(test.status)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            const singleTest = group.tests[0];
                            return (
                              <tr key={singleTest.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-[#123440]">{group.candidate_name}</td>
                                <td className="px-6 py-3.5 text-slate-600">{singleTest.test_name}</td>
                                <td className="px-6 py-3.5 text-xs text-slate-500 italic">
                                  {singleTest.date_info}
                                </td>
                                <td className="px-6 py-3.5">
                                  {renderStatusBadge(singleTest.status)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!loadingActivity && filteredActivities.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                      <span className="text-xs text-slate-500">
                        Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredActivities.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)} de {filteredActivities.length} registros
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Página anterior"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-[#123440] text-white'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Página siguiente"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[#123440] mb-1">Acciones Rápidas</h3>
                
                <Link href="/dashboard/asignar_prueba" className="w-full bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-[#9DBA3A] hover:shadow-md transition-all text-left group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-[#f4f6f0] text-[#69943A] flex items-center justify-center group-hover:bg-[#9DBA3A] group-hover:text-[#202221] transition-colors">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-[#123440] text-xs">Asignar nueva prueba</span>
                    <p className="text-[11px] text-slate-400">Registrar paciente y análisis</p>
                  </div>
                </Link>

                <Link href="/dashboard/historial_de_pruebas" className="w-full bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-[#123440] hover:shadow-md transition-all text-left group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-[#123440] group-hover:text-white transition-colors">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-[#123440] text-xs">Historial Psicométrico</span>
                    <p className="text-[11px] text-slate-400">Métricas acumuladas del mes</p>
                  </div>
                </Link>

                <div className="mt-2 p-5 bg-[#f4f6f0] rounded-2xl border border-[#dce3d5]">
                  <div className="flex items-center gap-2 mb-2 text-[#69943A]">
                    <Lightbulb size={18} />
                    <h4 className="font-bold text-xs uppercase tracking-wider">Consejo del día</h4>
                  </div>
                  <p className="text-xs text-[#123440]/90 leading-relaxed italic mb-2">
                    &quot;{dailyTip.quote}&quot;
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold text-right">
                    — {dailyTip.author}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}