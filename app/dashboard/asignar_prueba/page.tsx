"use client";

import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import { 
  Brain, UserSearch, TrendingUp, Activity, ClipboardList, Users, Link2, 
  CheckCircle2, RefreshCw, Copy, Search, Bell, ShieldAlert, Eye, Trash2, Grid
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import SideNavBar from '../../../componentes/SideNavBar';
import TestPreviewModal from './TestPreviewModal';

interface IconMeta {
  icon: LucideIcon;
  color: string;
}

const ICON_MAP: { [key: string]: IconMeta } = {
  'Test Cleaver': { icon: UserSearch, color: 'bg-slate-100 text-slate-700' },
  'Evaluación Cognitiva': { icon: Brain, color: 'bg-[#9DBA3A]/20 text-[#69943A]' },
  'Prueba de Aptitud': { icon: TrendingUp, color: 'bg-blue-50 text-blue-700' },
  'Evaluación de Estrés Post-Traumático': { icon: Activity, color: 'bg-rose-50 text-rose-700' },
  'Examen Psicológico General': { icon: ClipboardList, color: 'bg-amber-50 text-amber-700' },
  'Test de Habilidades Sociales': { icon: Users, color: 'bg-purple-50 text-purple-700' },
  'NOM-035-STPS-2018 (Evaluación Integral)': { icon: ShieldAlert, color: 'bg-rose-50 text-rose-700' },
  'Test de Raven': { icon: Grid, color: 'bg-indigo-50 text-indigo-700' }
};

export default function AsignarPrueba() {
  const supabase = createClient();

  const [catalogoPruebas, setCatalogoPruebas] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [limiteUsuarios, setLimiteUsuarios] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedLinkId, setGeneratedLinkId] = useState<string | null>(null);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para el Modal de Previsualización
  const [modalOpen, setModalOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState<any>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        const { data, error } = await supabase
          .from('tests')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data) {
          setCatalogoPruebas(data);
          if (data.length > 0) setSelectedTests([data[0]]);
        }
      } catch (error: any) {
        console.error('Error al conectar con Supabase:', error.message);
      } finally {
        setLoading(false);
      }
    }
    cargarCatalogo();
  }, [supabase]);

  const toggleTestSelection = (prueba: any) => {
    const exists = selectedTests.some(t => t.id === prueba.id);
    if (exists) {
      if (selectedTests.length > 1) {
        setSelectedTests(selectedTests.filter(t => t.id !== prueba.id));
      }
    } else {
      setSelectedTests([...selectedTests, prueba]);
    }
  };

  const handleGenerateAndAssign = async () => {
    if (selectedTests.length === 0) return;

    setIsGenerating(true);
    setGeneratedLink('');
    setGeneratedLinkId(null);
    setErrorMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("No se detectó una sesión activa. Inicia sesión nuevamente.");
      }

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
      const token = nanoid(12);
      const link = `${baseUrl}/dashboard/inicio_de_pruebas/${token}`;

      const { data: linkData, error: linkError } = await supabase
        .from('links')
        .insert({
          token,
          created_by: user.id,
          max_users: Math.max(1, Number(limiteUsuarios)),
          current_users: 0,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (linkError) {
        throw new Error(`Error en 'links': ${linkError.message}`);
      }

      const rowsToInsertRelations = selectedTests.map((test, index) => ({
        link_id: linkData.id,
        test_id: test.id,
        step_order: index + 1
      }));

      const { error: relationError } = await supabase
        .from('link_tests')
        .insert(rowsToInsertRelations);

      if (relationError) {
        throw new Error(`Error en 'link_tests': ${relationError.message}`);
      }

      await navigator.clipboard.writeText(link);
      setGeneratedLink(link);
      setGeneratedLinkId(linkData.id);

    } catch (error: any) {
      console.error("Error al asignar la prueba:", error);
      setErrorMessage(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!generatedLinkId) return;
    setIsUpdatingLimit(true);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('links')
        .update({ max_users: Math.max(1, Number(limiteUsuarios)) })
        .eq('id', generatedLinkId);

      if (error) throw error;

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error al actualizar el límite:', error);
      setErrorMessage(error.message || 'Error al actualizar el límite.');
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  const abrirPrevisualizacion = async (prueba: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTest(prueba);
    setModalOpen(true);
    setLoadingPreview(true);
    setPreviewQuestions([]);

    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', prueba.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) setPreviewQuestions(data);
    } catch (error: any) {
      console.error('Error al cargar preguntas:', error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7]">
        <div className="text-center">
          <RefreshCw className="animate-spin text-[#69943A] mx-auto mb-4" size={32} />
          <p className="text-xs font-semibold text-slate-500">Cargando catálogo desde la base de datos...</p>
        </div>
      </div>
    );
  }

  const pruebasFiltradas = catalogoPruebas.filter(prueba => 
    prueba.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prueba.description && prueba.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#f9f9f7] text-[#202221] flex min-h-screen font-sans overflow-x-hidden relative">
      <SideNavBar role="aplicador" title="Portal Clínico" />

      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#123440] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 size={20} className="text-[#9DBA3A]" />
          <p className="text-xs font-bold">¡Límite de usuarios actualizado con éxito!</p>
        </div>
      )}

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center px-8 py-4 shadow-sm">
          <div className="relative w-64 hidden lg:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar pruebas..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all placeholder:text-slate-400 font-medium text-[#202221]"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto text-[#123440]">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors relative cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <main className="mt-16 p-8 flex-1 flex flex-col">
          <section className="mb-8">
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-[#123440] mb-2">
              Asignación de Evaluaciones
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Selecciona una o varias pruebas, define el límite de usuarios y genera tu enlace único.
            </p>
          </section>

          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-sm font-bold text-[#123440]">Catálogo de Pruebas Disponibles</h3>
                <span className="text-xs font-bold bg-[#123440]/10 text-[#123440] px-3 py-1 rounded-full">
                  {selectedTests.length} seleccionada{selectedTests.length === 1 ? '' : 's'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pruebasFiltradas.map((prueba) => {
                  const meta = ICON_MAP[prueba.name] || { icon: Brain, color: 'bg-slate-100 text-slate-700' };
                  const IconComponent = meta.icon;
                  const isSelected = selectedTests.some(t => t.id === prueba.id);

                  return (
                    <div 
                      key={prueba.id}
                      onClick={() => toggleTestSelection(prueba)}
                      className={`p-6 rounded-2xl transition-all cursor-pointer relative overflow-hidden bg-white border group ${
                        isSelected 
                          ? 'border-2 border-[#123440] shadow-[0_4px_20px_-4px_rgba(18,52,64,0.08)]' 
                          : 'border-slate-100 hover:border-slate-200 shadow-[0_4px_20px_-4px_rgba(18,52,64,0.03)]'
                      }`}
                    >
                      <button 
                        onClick={(e) => abrirPrevisualizacion(prueba, e)}
                        className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-[#123440] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Ver detalles del test"
                      >
                        <Eye size={18} />
                      </button>

                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-[#123440] text-white p-2 rounded-bl-xl z-10">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${meta.color}`}>
                        <IconComponent size={22} />
                      </div>
                      <h4 className="font-headline text-sm font-bold text-[#123440] mb-1.5 pr-8">{prueba.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2 font-medium line-clamp-2">{prueba.description}</p>

                      {(() => {
                        const totalItems = Number(prueba.config_json?.totalItems || 0);
                        const duration = Number(prueba.tiempo || 0);
                        const extraTags: string[] = Array.isArray(prueba.config_json?.tags)
                          ? (prueba.config_json.tags as string[])
                          : [];
                        const badges = [
                          totalItems > 0 ? `${totalItems} Preguntas` : '',
                          duration > 0 ? `${duration} Minutos` : '',
                          ...extraTags
                        ].filter(Boolean);
                        return badges.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {badges.map((badge, i) => (
                              <span key={i} className="text-[10px] font-bold bg-[#f4f6f0] text-[#69943A] px-2.5 py-1 rounded-md">
                                {badge}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                          {prueba.category || 'Psicométrica'}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#123440]' : 'text-[#69943A]'}`}>
                          {isSelected ? 'Seleccionada ✓' : 'Seleccionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 sticky top-24">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(18,52,64,0.04)] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#123440] flex items-center justify-center text-white">
                    <Link2 size={16} />
                  </div>
                  <h3 className="font-headline text-sm font-bold text-[#123440]">Generar Enlace de Asignación</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Pruebas Seleccionadas ({selectedTests.length})
                    </label>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl max-h-40 overflow-y-auto space-y-2">
                      {selectedTests.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">Ninguna prueba seleccionada</p>
                      ) : (
                        selectedTests.map(test => (
                          <div key={test.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 truncate">
                              <CheckCircle2 size={14} className="text-[#69943A] shrink-0" />
                              <span className="font-bold text-[#123440] text-xs truncate">{test.name}</span>
                            </div>
                            {selectedTests.length > 1 && (
                              <button 
                                onClick={() => toggleTestSelection(test)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                title="Quitar prueba"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">URL Única Generada</label>
                    {generatedLink ? (
                      <div className="bg-[#9DBA3A]/10 border border-[#9DBA3A]/40 p-3.5 rounded-xl text-center space-y-1">
                        <p className="text-xs text-[#69943A] font-bold">¡Enlace generado y copiado!</p>
                        <p className="text-[10px] text-slate-600 font-mono break-all bg-white p-2 rounded-lg border border-slate-100">{generatedLink}</p>
                      </div>
                    ) : errorMessage ? (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center space-y-1">
                        <p className="text-xs text-rose-600 font-bold">Error al generar enlace</p>
                        <p className="text-[10px] text-rose-700 font-mono break-all bg-white p-2 rounded-lg border border-rose-100">{errorMessage}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400 font-medium">El enlace aparecerá aquí tras generarlo.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Límite de usuarios</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="500" 
                        value={limiteUsuarios} 
                        onChange={(e) => setLimiteUsuarios(Number(e.target.value))} 
                        className="w-20 bg-slate-100 border border-transparent rounded-xl py-2 px-3 text-center text-xs font-bold text-[#123440] focus:outline-none focus:ring-2 focus:ring-[#123440] focus:bg-white transition-all" 
                      />
                      <button 
                        onClick={handleUpdateLimit}
                        disabled={!generatedLinkId || isUpdatingLimit}
                        className="flex-1 bg-slate-200 hover:bg-[#123440] hover:text-white text-[#123440] py-2 px-3 rounded-xl font-headline font-bold text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                        title={generatedLink ? "Actualizar límite en la base de datos" : "Primero genera un enlace"}
                      >
                        {isUpdatingLimit ? <RefreshCw size={12} className="animate-spin" /> : null}
                        <span>{isUpdatingLimit ? 'Actualizando...' : 'Actualizar Límite'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Personas autorizadas para usar este enlace.</p>
                  </div>

                  <button 
                    onClick={handleGenerateAndAssign}
                    disabled={isGenerating || selectedTests.length === 0}
                    className="w-full bg-[#123440] hover:bg-[#1a4a5c] text-white py-3 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : generatedLink ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Copiar de Nuevo / Generar Otro</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Generar y Copiar Enlace ({selectedTests.length} pruebas)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL MODULARIZADO DE PREVISUALIZACIÓN */}
      <TestPreviewModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        previewTest={previewTest}
        previewQuestions={previewQuestions}
        loadingPreview={loadingPreview}
      />
    </div>
  );
}