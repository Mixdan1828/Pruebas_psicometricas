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
  /** ID del candidato activo. Si se provee, la barra carga y muestra sus
   *  observaciones (candidate_results.examiner_notes) de forma contextual. */
  candidateId?: string | null;
}

export default function SideNavBar({ title, role, candidateId }: SideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Estado de la nota contextual del candidato activo
  const [notaEvaluador, setNotaEvaluador] = useState<string | null>(null);
  const [cargandoNota, setCargandoNota] = useState<boolean>(false);

  // Estado del modal de ayuda
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState<boolean>(false);

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  // Carga las observaciones (examiner_notes) del candidato activo.
  // Se omite el score/puntuación a propósito (requisito de la vista).
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
        // Toma el resultado más reciente del candidato para mostrar su nota.
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
        // No bloqueamos la navegación por un fallo al leer la nota.
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
      router.push('/login'); // Redirige a la página de inicio de sesión
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white flex flex-col py-8 z-50 shadow-sm">
      {/* Brand & Logo Header */}
      <div className="px-6 mb-8 flex flex-col items-center text-center">
        <div className="w-full max-w-[280px] h-[130px] flex items-center justify-center relative mb-2">
          <Image
            alt="Logo Fundación"
            src="/images/miLogo.png"
            width={380}
            height={380}
            className="object-contain max-h-full max-w-full"
            priority
          />
        </div>
        <p className="text-[#0d313f] text-[10px] uppercase tracking-widest font-bold border-t border-slate-200 pt-2 w-full">
          {title}
        </p>
      </div>

      {/* Dynamic Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 flex items-center gap-3 transition-all rounded-xl group ${
                isActive
                  ? 'bg-slate-200/80 text-[#0d313f] font-bold'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-[#70a444]' : 'text-slate-400 group-hover:text-[#0d313f]'}
              />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Nota contextual del candidato activo (examiner_notes) */}
        {candidateId && (
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
      <div className="px-4 mt-auto pt-6 border-t border-slate-200 space-y-1">
        <button
          onClick={() => setModalAyudaAbierto(true)}
          className="w-full text-slate-600 px-4 py-3 flex items-center gap-3 hover:bg-slate-200/60 transition-all rounded-xl text-left cursor-pointer"
        >
          <HelpCircle size={20} className="text-slate-400" />
          <span className="font-medium text-sm">Ayuda</span>
        </button>
        <button
          className="w-full text-red-600 px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-all rounded-xl text-left cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Cerrar Sesión</span>
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
  );
}