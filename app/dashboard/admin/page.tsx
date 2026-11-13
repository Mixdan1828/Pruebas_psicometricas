"use client";

import React, { useState, useEffect } from 'react';
import {  
  Search, 
  Settings, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Loader2,
  AlertTriangle 
} from 'lucide-react';
import SideNavBar from '../../componentes/SideNavBar';
import ModalConfiguracionPerfil from '@/app/componentes/ModalConfiguracionPerfil';
import NotificadorTiempoReal from '@/app/componentes/NotificadorTiempoReal';
import { createClient } from '@/lib/supabase/client';
import { eliminarUsuarioAdmin } from './actions'; // Importamos la Server Action segura

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  status: 'pendiente' | 'autorizado' | null | undefined;
  role: 'admin' | 'aplicador' | null | undefined;
  avatar_url?: string | null;
}

export default function UserManagementDashboard() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados para usuario actual, avatar, modal de perfil
  const [userName, setUserName] = useState('Administrador');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);

  // Estado para el control dinámico del ancho del SideNavBar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Estados para el Modal de Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Cargar datos del usuario en sesión actual (para el avatar y nombre del header)
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
        setUserName(profileData.full_name || 'Administrador');
        setAvatarUrl(profileData.avatar_url || null);
      }
    } catch (error) {
      console.error('Error al cargar perfil del usuario:', error);
    }
  };

  // Cargar perfiles de la tabla profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles((data as Profile[]) || []);
    } catch (err) {
      console.error('Error al cargar perfiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosUsuario();
    fetchProfiles();
  }, [supabase]);

  // Manejar cambios de Estado (status) con aserción de tipos
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const statusValue = newStatus === 'null' ? null : (newStatus as 'pendiente' | 'autorizado');

      const { error } = await supabase
        .from('profiles')
        .update({ status: statusValue })
        .eq('id', userId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: statusValue } : p))
      );
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('No se pudo actualizar el estado del usuario.');
    }
  };

  // Manejar cambios de Rol (role) con aserción de tipos
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const roleValue = newRole === 'null' ? null : (newRole as 'admin' | 'aplicador');

      const { error } = await supabase
        .from('profiles')
        .update({ role: roleValue })
        .eq('id', userId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: roleValue } : p))
      );
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      alert('No se pudo actualizar el rol del usuario.');
    }
  };

  // Confirmar eliminación
  const confirmarEliminacion = (profile: Profile) => {
    setUserToDelete(profile);
    setShowDeleteModal(true);
  };

  // Ejecutar eliminación completa del usuario (Auth + Profiles) mediante Server Action
  const ejecutarEliminacion = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      
      // Llamamos a la Server Action segura del servidor
      await eliminarUsuarioAdmin(userToDelete.id);

      // Actualizamos el estado local para reflejar la eliminación inmediatamente
      setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      alert(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar perfiles por barra de búsqueda
  const filteredProfiles = profiles.filter((p) => {
    const query = searchQuery.toLowerCase();
    const name = (p.full_name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Métricas para las Tarjetas
  const totalRegistradas = profiles.length;
  const solicitudesPendientes = profiles.filter(
    (p) => !p.role || p.role === null || !p.status || p.status === 'pendiente'
  ).length;

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1c] font-sans min-h-screen flex antialiased overflow-x-hidden">
      
      {/* SideNavBar con callback para el estado de colapso */}
      <SideNavBar 
        role="admin" 
        title="Panel Clínico" 
        onToggleCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />

      {/* Main Content Canvas con ajuste responsivo y fluido según el estado del menú lateral */}
      <main className={`flex-grow min-h-screen flex flex-col w-full transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* TopAppBar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg shadow-sm flex justify-between items-center w-full px-4 md:px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-bold text-base md:text-lg text-cyan-950 tracking-tight">Panel de Control General</h2>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="bg-neutral-50 border-none rounded-full py-2 pl-10 pr-4 w-48 md:w-64 text-xs focus:ring-2 focus:ring-lime-600/20 transition-all outline-none text-slate-800" 
                placeholder="Buscar personal o correos..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 border-l border-neutral-100 pl-4 md:pl-6">
              
              {/* Notificador en tiempo real de nuevos registros */}
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
                      {userName ? userName.charAt(0).toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
                <Settings size={16} />
              </button>
            </div>
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

        {/* Dashboard Content con ancho máximo fluido */}
        <section className="p-4 md:p-8 flex-grow w-full max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-lime-700 font-bold tracking-widest text-xs uppercase mb-1 block">Administración del Sistema</span>
              <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-cyan-950 tracking-tight">Control de Usuarios</h1>
              <p className="text-slate-500 text-xs mt-1 max-w-lg">Administra los niveles de acceso, perfiles y permisos de seguridad del personal clínico y psicólogos evaluadores.</p>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Personas Registradas</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">{totalRegistradas}</p>
              <div className="mt-3 flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                <TrendingUp size={12} className="mr-1" /> Base de datos activa
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Solicitudes Pendientes</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">{solicitudesPendientes}</p>
              <div className="mt-3 flex items-center text-[10px] font-semibold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded">
                Requiere Revisión
              </div>
            </div>
          </div>

          {/* Users Table Container */}
          <div className="bg-neutral-100 rounded-2xl p-0.5 overflow-hidden shadow-sm">
            <div className="bg-white rounded-xl">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-neutral-50">
                      <th className="px-6 py-3">Detalle del Usuario</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Rol Asignado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400">
                          <Loader2 className="animate-spin inline mr-2 text-cyan-950" size={20} />
                          Cargando usuarios desde Supabase...
                        </td>
                      </tr>
                    ) : filteredProfiles.length > 0 ? (
                      filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-neutral-50/60 transition-colors">
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-cyan-950/10 text-cyan-950 flex items-center justify-center font-bold text-xs shrink-0">
                                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-cyan-950">{profile.full_name || 'Sin nombre registrado'}</p>
                                <p className="text-slate-400 text-[11px]">{profile.email || 'Sin correo electrónico'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <select
                              value={profile.status || 'pendiente'}
                              onChange={(e) => handleStatusChange(profile.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer transition-colors ${
                                profile.status === 'autorizado'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : profile.status === 'pendiente'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <option value="autorizado">Autorizado</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="null">Sin definir (Null)</option>
                            </select>
                          </td>

                          <td className="px-6 py-4">
                            <select
                              value={profile.role || 'null'}
                              onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-slate-700 border-none outline-none cursor-pointer hover:bg-neutral-200 transition-colors"
                            >
                              <option value="aplicador">Aplicador</option>
                              <option value="admin">Admin</option>
                              <option value="null">Por defecto (Null)</option>
                            </select>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => confirmarEliminacion(profile)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Usuario"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                          No se encontraron usuarios registrados en la tabla profiles.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 border-t border-neutral-50 bg-neutral-50/20 flex justify-between items-center text-[11px] text-slate-500 font-medium flex-wrap gap-2">
                <p>Mostrando {filteredProfiles.length} de {profiles.length} integrantes</p>
                <div className="flex gap-1">
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-white text-slate-400 hover:bg-neutral-50 cursor-pointer">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-[#0E6433] text-white font-bold">1</button>
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-cyan-950">¿Estás seguro de eliminar este usuario?</h3>
                <p className="text-xs text-slate-500">Esta acción eliminará permanentemente su cuenta y perfil de la base de datos.</p>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-3 mb-6 text-xs text-slate-600 space-y-1 border border-neutral-100">
              <p><strong>Nombre:</strong> {userToDelete?.full_name || 'Sin nombre'}</p>
              <p><strong>Correo:</strong> {userToDelete?.email || 'Sin correo'}</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button 
                disabled={deleting} 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-neutral-100 rounded-xl cursor-pointer hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button 
                disabled={deleting} 
                onClick={ejecutarEliminacion} 
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
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