"use client";

import React from 'react';
import { 
  Users,
  Activity,
  History,
  Settings, 
  Search, 
  Bell, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import SideNavBar from '../../../../componentes/SideNavBar';

// 1. Tipado estricto de TypeScript para el modelo de datos
interface User {
  id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'Administrador' | 'Técnico';
  lastConnection: string;
  avatarUrl: string;
  isActiveNow?: boolean;
}

// 2. Mock de datos extraído del HTML original
const initialUsers: User[] = [
  {
    id: '#HZ-9042',
    name: 'Ricardo Villalobos',
    email: 'r.villalobos@fundacionhz.org',
    role: 'Doctor',
    lastConnection: 'Hace 2 horas',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0ObjFiZTkJR3bl5bahtqzeWk5fWHaAx3CRDhEg6Ydn9XPimNUx-90JSfxwNs8UPc9ZaBePvy-63piaVEltZpE7Oq3cuq6_SumzkDG2KC9DCIx4yGVlXRXX2WVWm53dfOOSMkY__aJ_vuN_YCdUUFTmmAhWtfmDrG30tmY9h8LeQ9rO1SP38yDqRpABZc0p1ChDmRdKMwFuoJABirheeZS3CpEOCSWsA3o_gP_ObeAQb3sh4QMrzyhJP255p60-xbRRfGAU0evI0U'
  },
  {
    id: '#HZ-8812',
    name: 'Elena Martínez',
    email: 'e.martinez@fundacionhz.org',
    role: 'Administrador',
    lastConnection: 'Activo ahora',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx9pGKAlg-wzt4Jzd0V6BWwsAJwTmMllUiNVLRiZlatBDc2NDOZIhLRHjT4oDmRAHZyRx2Ffmo32uJrttyhf6oYTGhj4agRj9NRlCMOZDo-fclnPNfwTskKu59eL2qHeYhA-EAwK5yQjWAyFZ2nyod7L8BbCsSaS2a2Gb6CVCT0PeZwLl929HdY4_H0S-8H6IqDWQvcROqz19IQtcQzM986wycrnY_V_BRPFyOEHsGndEKJ03X2F99e8guTLJSNHdSgALDIk_6tRY',
    isActiveNow: true
  },
  {
    id: '#HZ-7721',
    name: 'Jorge Sánchez',
    email: 'j.sanchez@fundacionhz.org',
    role: 'Técnico',
    lastConnection: 'Hace 5 horas',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXw-foOT8LOmHzCNMvzpwT-2FW6oPe8qNgF7LbIkip7aZZJXTyZTi7KUCnAOmbA2CCxB1PMPu6j_PQjbkREtLSJOLuwbcDURH7mKSMDtN-yKn_PzTnVfS5ue88QXg5NxadkMxu2Q_CxvpqjDRA-LNf0rfA0WL1y-JJAeRoI_6M6euzNT6wGsmMtLbxsvf4idb0vQh0sj6-uOceJf0h8gs04-awBxO7tam_JRM34chfjUk94SCdIOjjUaN23WszyZp1q82XZMDBhV8'
  },
  {
    id: '#HZ-9102',
    name: 'Ana Morales',
    email: 'a.morales@fundacionhz.org',
    role: 'Doctor',
    lastConnection: 'Ayer, 18:30',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Dboj9W44f0_y7LSRC08BwNxgjmxBqdWVyBq0ASzPFfEY5p3-iSdnf6SIAaXFL_UkJKuTgYZzkWxd-YWjtPyT4bDLXMPCUEH29q_klHaQJ5T55G_u7v58YQDNKUeXOsVQPQVxvjpBdXmOw30ZBYP7mKa-o_JqZpQGpM9e2ZVS_hV5Em8aacQmH00_7geMWkvoS02sbUUmB_dNS5aPVv1ftBv9V_JBbqdjWra_Ea6lqxl0_V7VBTMGciEVP27WH9b6qZ2IuTG71bY'
  }
];

export default function GestionUsuarios() {
  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1c] font-sans min-h-screen flex antialiased selection:bg-lime-500/30">
      
      <SideNavBar title="Panel de Administración" role="admin" />

      {/* Main Content Wrapper */}
      <main className="pl-72 min-h-screen flex flex-col w-full">
        
        {/* TopNavBar Component */}
        <header className="flex justify-between items-center w-full px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-[#f6f3f2] border-none rounded-full text-sm focus:ring-2 focus:ring-lime-500/20 transition-all outline-none" 
                placeholder="Search users or roles..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-500">
              <button className="hover:text-lime-600 transition-all p-1.5 hover:bg-slate-50 rounded-full">
                <Bell size={18} />
              </button>
              <button className="hover:text-lime-600 transition-all p-1.5 hover:bg-slate-50 rounded-full">
                <Settings size={18} />
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <img 
                alt="Administrator Profile" 
                className="h-10 w-10 rounded-full object-cover border-2 border-lime-500/20" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_FLr1ik57d81zLTSRjjfxSQ3Q9rvrn0UIOWrfhnSI097PhJNFXpma8Hy-vFdcNkmU_4L1SHXWSPWWsQDIunymrh0Bgxccykh9IMFU9esOxAfj2GnQ6tvEb7NOxgesNvYpBFMd7DdFM7Spo_cQoInWB59GshysU4bmJCyCPoD2x98Yb3QoTUMpqlJV6PQ3tnbNpG9Ese2Zzo9MtrSZJ98V3FlRBBO6VSU_rFHoay6Vvh_y6ZxuGn9O-fIDXJSV7PMnFECNAvl03r8" 
              />
            </div>
          </div>
        </header>

        {/* Page Canvas Content */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-grow">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Gestión de Usuarios</h1>
              <p className="text-slate-500 max-w-2xl text-sm">
                Administra el acceso del personal médico, administrativo y técnico a la plataforma de la fundación.
              </p>
            </div>
            <button className="bg-[#123440] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-slate-900/10 whitespace-nowrap">
              <Plus size={16} />
              <span>Agregar Usuario</span>
            </button>
          </div>

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-2 border-transparent hover:border-lime-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-lime-100 group-hover:text-lime-700 transition-colors">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-lime-600">+4%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total Usuarios</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">124</h3>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-2 border-transparent hover:border-lime-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-lime-100 group-hover:text-lime-700 transition-colors">
                  <Activity size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Doctores Activos</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">48</h3>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-2 border-transparent hover:border-lime-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-lime-100 group-hover:text-lime-700 transition-colors">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Administradores</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">12</h3>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-2 border-transparent hover:border-lime-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-lime-100 group-hover:text-lime-700 transition-colors">
                  <History size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Sesiones Hoy</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">89</h3>
            </div>
          </div>

          {/* Main Table Section */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f6f3f2]">
                  <tr>
                    <th className="px-8 py-5 text-sm font-semibold text-slate-600 uppercase tracking-wider">Nombre del Usuario</th>
                    <th className="px-8 py-5 text-sm font-semibold text-slate-600 uppercase tracking-wider">Correo Electrónico</th>
                    <th className="px-8 py-5 text-sm font-semibold text-slate-600 uppercase tracking-wider">Rol Actual</th>
                    <th className="px-8 py-5 text-sm font-semibold text-slate-600 uppercase tracking-wider">Última Conexión</th>
                    <th className="px-8 py-5 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <img 
                            className="h-10 w-10 rounded-full object-cover bg-slate-100" 
                            alt={user.name} 
                            src={user.avatarUrl} 
                          />
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-600 text-sm font-medium font-mono">{user.email}</td>
                      <td className="px-8 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                          user.role === 'Doctor' ? 'bg-lime-50 text-lime-700 hover:bg-lime-100' :
                          user.role === 'Administrador' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' :
                          'bg-[#fff2e7] text-[#655d55] hover:bg-[#ede0d6]'
                        }`}>
                          <span>{user.role}</span>
                          <ChevronDown size={14} />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {user.isActiveNow ? (
                          <div className="flex items-center gap-2 text-sm text-slate-900 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-lime-500 animate-pulse"></span>
                            <span>Activo ahora</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                            <span>{user.lastConnection}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-300 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50" title="Eliminar Acceso">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="p-6 bg-[#f6f3f2] border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium">Mostrando 4 de 124 usuarios</p>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-slate-200 bg-white shadow-sm text-slate-400 disabled:opacity-50" disabled>
                  <ChevronLeft size={14} />
                </button>
                <button className="p-2 rounded-lg border border-slate-200 bg-white shadow-sm font-bold text-xs px-4">1</button>
                <button className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-medium text-xs px-4">2</button>
                <button className="p-2 rounded-lg border border-slate-200 bg-white shadow-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Card / Role Guide */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#123440] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-slate-900/5">
            <div className="md:col-span-2 space-y-4 relative z-10">
              <h2 className="text-3xl font-bold tracking-tight">Guía de Roles y Permisos</h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Asegúrese de asignar los niveles de acceso correctos para mantener la integridad de los datos médicos. Los roles definen qué acciones puede realizar cada usuario dentro de la base de datos de pacientes y resultados.
              </p>
              <button className="bg-[#BEEE89] text-[#123440] px-8 py-3 rounded-full font-bold text-sm hover:brightness-105 transition-all shadow-md">
                Ver Detalles de Permisos
              </button>
            </div>
            <div className="hidden md:block relative z-10 justify-self-end text-white/20">
              <ShieldAlert size={120} strokeWidth={1} />
            </div>
            {/* Decorative element background */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-br from-lime-500/20 to-transparent rounded-full blur-3xl"></div>
          </section>

        </div>
      </main>
    </div>
  );
}