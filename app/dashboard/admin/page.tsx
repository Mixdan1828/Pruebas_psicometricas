"use client";

import React, { useState } from 'react';
import {  
  UserPlus, 
  Search, 
  Bell, 
  Settings, 
  TrendingUp, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import SideNavBar from '../../../componentes/SideNavBar';

export default function UserManagementDashboard() {
  // Filtro de pestañas activo
  const [activeTab, setActiveTab] = useState<'all' | 'doctors' | 'admins'>('all');

  // Datos mockeados que se sustituyen con la respuesta de Supabase RPC o tabla 'perfiles_usuarios'
  const usersData = [
    { id: 1, name: 'Alejandro Zurita', email: 'a.zurita@fundacion.org', status: 'Active', role: 'Senior Pathologist', lastActivity: 'Today, 09:42 AM', init: 'AZ', color: 'bg-cyan-100 text-cyan-700' },
    { id: 2, name: 'Mariana Lopez', email: 'm.lopez@fundacion.org', status: 'Active', role: 'Admin Supervisor', lastActivity: 'Yesterday, 11:20 PM', init: 'ML', color: 'bg-emerald-100 text-emerald-700' },
    { id: 3, name: 'Ricardo Herrera', email: 'r.herrera@fundacion.org', status: 'Offline', role: 'Junior Analyst', lastActivity: '3 days ago', init: 'RH', color: 'bg-slate-100 text-slate-700' },
    { id: 4, name: 'Elena Mendez', email: 'e.mendez@fundacion.org', status: 'Restricted', role: 'Intern', lastActivity: 'Today, 07:15 AM', init: 'EM', color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1c] font-sans min-h-screen flex antialiased">
      
      <SideNavBar role="admin" title="Panel Clínico" />

      {/* Main Content Canvas */}
      <main className="ml-64 flex-grow min-h-screen flex flex-col">
        
        {/* TopAppBar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg shadow-sm flex justify-between items-center w-full px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-bold text-lg text-cyan-950 tracking-tight">Panel de Control General</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="bg-neutral-50 border-none rounded-full py-2 pl-10 pr-4 w-64 text-xs focus:ring-2 focus:ring-lime-600/20 transition-all outline-none" 
                placeholder="Buscar personal o folios..." 
                type="text" 
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-neutral-100 pl-6">
              <button className="text-slate-600 hover:text-[#0E6433] transition-colors">
                <Bell size={18} />
              </button>
              <button className="text-slate-600 hover:text-[#0E6433] transition-colors">
                <Settings size={18} />
              </button>
              <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-neutral-100 shadow-sm">
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="p-8 flex-grow">
          
          {/* Header Section with Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-lime-700 font-bold tracking-widest text-xs uppercase mb-1 block">Administración del Sistema</span>
              <h1 className="text-3xl font-headline font-extrabold text-cyan-950 tracking-tight">Control de Usuarios</h1>
              <p className="text-slate-500 text-xs mt-1 max-w-lg">Administra los niveles de acceso, perfiles y permisos de seguridad del personal clínico y psicólogos evaluadores.</p>
            </div>
            <button className="bg-gradient-to-r from-[#0E6433] to-[#69943A] text-white px-6 py-3.5 rounded-full text-xs font-bold shadow-xl shadow-lime-900/10 hover:shadow-lime-900/20 transition-all flex items-center gap-2">
              <UserPlus size={16} />
              <span>Alta de Nuevo Usuario</span>
            </button>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Personal Total</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">142</p>
              <div className="mt-3 flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                <TrendingUp size={12} className="mr-1" /> 8% este mes
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Activos Ahora</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">38</p>
              <div className="mt-3 flex items-center text-[10px] font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Servidor Online
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Solicitudes Pendientes</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">5</p>
              <div className="mt-3 flex items-center text-[10px] font-semibold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded">
                Requiere Acción
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Roles Configurados</p>
              <p className="text-2xl font-headline font-extrabold text-cyan-950">12</p>
              <div className="mt-3 text-[10px] text-cyan-600 font-medium cursor-pointer hover:underline">
                Ver mapa de jerarquías
              </div>
            </div>
          </div>

          {/* Users Table Container */}
          <div className="bg-neutral-100 rounded-2xl p-0.5 overflow-hidden shadow-sm">
            <div className="bg-white rounded-xl">
              <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-neutral-900 text-white' : 'text-slate-500 hover:bg-neutral-50'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setActiveTab('doctors')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'doctors' ? 'bg-neutral-900 text-white' : 'text-slate-500 hover:bg-neutral-50'}`}
                  >
                    Médicos / Evaluadores
                  </button>
                  <button 
                    onClick={() => setActiveTab('admins')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'admins' ? 'bg-neutral-900 text-white' : 'text-slate-500 hover:bg-neutral-50'}`}
                  >
                    Administradores
                  </button>
                </div>
                <button className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-950 transition-colors text-xs font-bold">
                  <Filter size={14} />
                  <span>Filtrar</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-neutral-50">
                      <th className="px-6 py-3">Detalle del Usuario</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Rol Asignado</th>
                      <th className="px-6 py-3">Última Actividad</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 text-xs">
                    {usersData.map((user) => (
                      <tr key={user.id} className="group hover:bg-neutral-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${user.color}`}>
                              {user.init}
                            </div>
                            <div>
                              <p className="font-bold text-cyan-950">{user.name}</p>
                              <p className="text-slate-400 text-[11px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                            user.status === 'Restricted' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`h-1 w-1 rounded-full mr-1.5 ${
                              user.status === 'Active' ? 'bg-emerald-500' :
                              user.status === 'Restricted' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {user.lastActivity}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-cyan-900 hover:bg-neutral-50 rounded-lg transition-all" title="Editar Permisos">
                              <Edit2 size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Revocar Acceso">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              <div className="px-6 py-3 border-t border-neutral-50 bg-neutral-50/20 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <p>Mostrando 4 de 142 integrantes</p>
                <div className="flex gap-1">
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-white text-slate-400 hover:bg-neutral-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-[#0E6433] text-white font-bold">1</button>
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-white hover:bg-neutral-50">2</button>
                  <button className="h-7 w-7 flex items-center justify-center rounded border border-neutral-200 bg-white hover:bg-neutral-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Matriz de Roles Clínicos e Integridad de Accesos */}
          <div className="mt-12">
            <h3 className="text-lg font-headline font-bold text-cyan-950 mb-4 flex items-center gap-2">
              <ShieldAlert className="text-[#0E6433]" size={20} />
              <span>Jerarquía Clínico-Administrativa y Niveles de Seguridad</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f0f5f7] p-5 rounded-2xl border border-white relative overflow-hidden">
                <h4 className="font-bold text-cyan-950 text-sm mb-1">Administrador del Sistema</h4>
                <p className="text-xs text-slate-600 mb-4">Control total de la base de datos de pacientes, auditoría de folios e inhabilitación de cuentas.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[11px] font-medium text-cyan-800">
                    <CheckCircle2 size={12} /> Configuración de Criterios Clínicos
                  </li>
                  <li className="flex items-center gap-2 text-[11px] font-medium text-cyan-800">
                    <CheckCircle2 size={12} /> Descarga de Reportes e Historiales
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-100">
                <h4 className="font-bold text-cyan-950 text-sm mb-1">Personal Médico / Psicólogos</h4>
                <p className="text-xs text-slate-600 mb-4">Gestión activa de expedientes de pacientes, envío de enlaces psicométricos e interpretación de resultados.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Alta de Fichas Demográficas
                  </li>
                  <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Autorización de Reportes Diagnósticos
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-100">
                <h4 className="font-bold text-cyan-950 text-sm mb-1">Analistas de Admisión / Técnicos</h4>
                <p className="text-xs text-slate-600 mb-4">Captura inicial de datos del solicitante y seguimiento logístico presencial en sedes.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 size={12} className="text-slate-400" /> Monitoreo del Avance del Test
                  </li>
                  <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <CheckCircle2 size={12} className="text-slate-400" /> Registro Inicial de Sedes
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}