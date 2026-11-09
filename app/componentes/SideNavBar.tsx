"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/utils/roles';
import {
  History,
  Users,
  ClipboardPlus,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  StickyNote,
  Loader2,
  X,
  Menu,
  ChevronLeft,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard/admin',
    icon: LayoutDashboard,
    label: 'Inicio Administrador',
    roles: ['admin'],
  },
  {
    href: '/dashboard/aplicador_de_pruebas',
    icon: LayoutDashboard,
    label: 'Inicio Aplicador',
    roles: ['aplicador'],
  },
  {
    href: '/dashboard/asignar_prueba',
    icon: ClipboardPlus,
    label: 'Asignar prueba',
    roles: ['aplicador'],
  },
  {
    href: '/dashboard/historial_de_pruebas',
    icon: History,
    label: 'Historial de pruebas',
    roles: ['aplicador'],
  },
  {
    href: '/dashboard/admin/agregar_usuarios/',
    icon: Users,
    label: 'Agregar nuevo usuario',
    roles: ['admin'],
  },
];

interface SideNavBarProps {
  title: string;
  role: UserRole;
  candidateId?: string | null;
  onToggleCollapse?: (collapsed: boolean) => void; // Callback para notificar cambios de colapso
}

export default function SideNavBar({ title, role, candidateId, onToggleCollapse }: SideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };

  // Estado para colapsar/expandir la barra lateral
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Estado para dispositivos móviles (mostrar/ocultar completamente)
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Estado de la nota contextual del candidato activo
  const [notaEvaluador, setNotaEvaluador] = useState<string | null>(null);
  const [cargandoNota, setCargandoNota] = useState<boolean>(false);

  // Estado del modal de ayuda
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState<boolean>(false);

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  useEffect(() => {
    let activo = true;

    async function cargarNotaCandidato() {
      if (!candidateId) {
        setNotaEvaluador(null);
        setCargandoNota(false);
        return;
      }

      setCargandoNota(true);
      setNotaEvaluador(null);

      try {
        const { data, error } = await supabase
          .from('candidate_results')
          .select('examiner_notes')
          .eq('candidate_id', candidateId)
          .order('started_at', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (activo) {
          setNotaEvaluador(data?.examiner_notes || null);
        }
      } catch (err) {
        console.error('Error al cargar examiner_notes:', err);
        if (activo) setNotaEvaluador(null);
      } finally {
        if (activo) setCargandoNota(false);
      }
    }

    cargarNotaCandidato();

    return () => {
      activo = false;
    };
  }, [candidateId, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir la barra en móviles/tablets */}
      <button
        onClick={() => setIsOpenMobile(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0d313f] text-white p-2.5 rounded-xl shadow-md hover:bg-[#164a5c] transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Fondo oscuro traslúcido para móviles cuando el menú está abierto */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Barra lateral principal */}
      <aside
        className={`fixed left-0 top-0 h-full border-r border-slate-200 bg-white flex flex-col py-6 z-50 shadow-sm transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Botón para contraer / expandir en escritorio y cerrar en móvil */}
        <div className="absolute -right-3.5 top-6 hidden md:flex">
          <button
            onClick={handleToggle}
            className="bg-white border border-slate-200 text-slate-600 hover:text-[#0d313f] p-1.5 rounded-full shadow-md hover:bg-slate-50 transition-colors cursor-pointer"
            title={isCollapsed ? "Expandir barra" : "Contraer barra"}
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Botón de cierre para móvil */}
        <div className="absolute right-4 top-4 md:hidden">
          <button
            onClick={() => setIsOpenMobile(false)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand & Logo Header */}
        <div className={`px-4 mb-6 flex flex-col items-center text-center ${isCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center justify-center relative mb-2 transition-all ${isCollapsed ? 'w-12 h-12' : 'w-full max-w-[280px] h-[100px]'}`}>
            <Image
              alt="Logo Fundación"
              src="/images/miLogo.png"
              width={380}
              height={380}
              className="object-contain max-h-full max-w-full"
              priority
            />
          </div>
          {!isCollapsed && (
            <p className="text-[#0d313f] text-[10px] uppercase tracking-widest font-bold border-t border-slate-200 pt-2 w-full truncate">
              {title}
            </p>
          )}
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`px-3 py-3 flex items-center gap-3 transition-all rounded-xl group ${
                  isActive
                    ? 'bg-slate-200/80 text-[#0d313f] font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 ${isActive ? 'text-[#70a444]' : 'text-slate-400 group-hover:text-[#0d313f]'}`}
                />
                {!isCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Nota contextual del candidato activo (Solo se muestra expandido) */}
          {candidateId && !isCollapsed && (
            <div
              className={`mt-4 mx-1 rounded-xl border p-4 ${
                notaEvaluador
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#0d313f] mb-1.5">
                <StickyNote size={14} className="text-[#70a444]" />
                Nota del evaluador
              </p>
              {cargandoNota ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Cargando nota...
                </div>
              ) : notaEvaluador ? (
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {notaEvaluador}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Este candidato aún no tiene observaciones registradas.
                </p>
              )}
            </div>
          )}
        </nav>

        {/* Persistent Footer Actions */}
        <div className="px-3 mt-auto pt-4 border-t border-slate-200 space-y-1">
          <button
            onClick={() => setModalAyudaAbierto(true)}
            title={isCollapsed ? "Ayuda" : undefined}
            className={`w-full text-slate-600 px-3 py-3 flex items-center gap-3 hover:bg-slate-200/60 transition-all rounded-xl text-left cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} className="text-slate-400 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm truncate">Ayuda</span>}
          </button>
          <button
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className={`w-full text-red-600 px-3 py-3 flex items-center gap-3 hover:bg-red-50 transition-all rounded-xl text-left cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            onClick={handleLogout}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-bold text-sm truncate">Cerrar Sesión</span>}
          </button>
        </div>

        {/* Modal de Ayuda */}
        {modalAyudaAbierto && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setModalAyudaAbierto(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-[#0d313f] flex items-center gap-2">
                  <HelpCircle size={18} className="text-[#70a444]" />
                  Centro de Ayuda
                </h3>
                <button
                  onClick={() => setModalAyudaAbierto(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 text-sm text-slate-600 space-y-3">
                <p>
                  ¿Necesitas ayuda para usar el portal? Revisa la guía de usuario
                  o contacta al administrador del sistema.
                </p>
                <p className="text-xs text-slate-400">
                  Si tienes problemas con tus credenciales o el flujo de pruebas,
                  comunícate con soporte técnico.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setModalAyudaAbierto(false)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0d313f] rounded-lg hover:bg-[#164a5c] transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}