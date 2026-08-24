"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  History,
  Users,
  ClipboardPlus,
  HelpCircle,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

type UserRole = 'admin' | 'aplicador';

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
    roles: ['admin'] 
  },
  { 
    href: '/dashboard/aplicador_de_pruebas', 
    icon: LayoutDashboard, 
    label: 'Inicio Aplicador', 
    roles: ['aplicador'] 
  },
  { 
    href: '/dashboard/asignar_prueba', 
    icon: ClipboardPlus, 
    label: 'Asignar prueba', 
    roles: ['aplicador'] 
  },
  { 
    href: '/dashboard/historial_de_pruebas', 
    icon: History, 
    label: 'Historial de pruebas', 
    roles: ['aplicador'] 
  },
  { 
    href: '/dashboard/admin/agregar_usuarios/', 
    icon: Users, 
    label: 'Agregar nuevo usuario', 
    roles: ['admin'] 
  },
];

interface SideNavBarProps {
  title: string;
  role: UserRole;
}

export default function SideNavBar({ title, role }: SideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

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
      <nav className="flex-1 px-4 space-y-1">
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
      </nav>

      {/* Persistent Footer Actions */}
      <div className="px-4 mt-auto pt-6 border-t border-slate-200 space-y-1">
        <Link 
          href="/dashboard/ayuda" 
          className="text-slate-600 px-4 py-3 flex items-center gap-3 hover:bg-slate-200/60 transition-all rounded-xl"
        >
          <HelpCircle size={20} className="text-slate-400" />
          <span className="font-medium text-sm">Ayuda</span>
        </Link>
        <button 
          className="w-full text-red-600 px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-all rounded-xl text-left cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}