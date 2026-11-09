"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Barra_Nav() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Función limpia para alternar el menú libre de bloqueos
  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuAbierto(!menuAbierto);
  };

  return (
    <nav className="bg-[#C2C3C6] w-full h-[85px] px-4 md:px-8 flex justify-between items-center shadow-md relative z-50">
      
      {/* SECCIÓN DEL LOGO */}
      <div className="flex items-center h-[85px] max-w-[60%] py-2 select-none">
        <Image 
          src="/images/miLogo.png" 
          alt="Logo" 
          width={280}
          height={85}
          priority
          className="object-contain h-full w-auto max-h-[75px] md:max-h-[85px] md:w-[280px]"
        />
      </div>

      {/* MENÚ EN ESCRITORIO (Computadora) */}
      <div className="hidden md:flex gap-10 text-black font-medium items-center">
        <button type="button" className="hover:text-gray-600 transition-colors cursor-pointer">Misión</button>
        <button type="button" className="hover:text-gray-600 transition-colors cursor-pointer">Contacto</button>
        <button type="button" className="hover:text-gray-600 transition-colors cursor-pointer">Acerca de nosotros</button>
        
        {/* 🛠️ CORREGIDO: URL limpia sin el "/page.tsx" */}
        <Link 
          href="/login"
          className="bg-white text-[#0b2c37] font-bold px-5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 transition-all text-sm md:text-base shadow-sm text-center"
        >
          Iniciar Sesión
        </Link>
      </div>

      {/* BOTÓN HAMBURGUESA (Celular) */}
      <button 
        type="button"
        onClick={toggleMenu} 
        className="md:hidden text-black p-3 active:bg-slate-300 rounded-lg transition-colors relative z-50 select-none block"
        style={{ touchAction: 'manipulation' }}
        aria-label="Menú de navegación"
      >
        {menuAbierto ? <X size={30} /> : <Menu size={30} />}
      </button>

      {/* DESPLEGABLE MÓVIL */}
      {menuAbierto && (
        <div className="absolute top-[85px] left-0 w-full bg-[#1e293b] flex flex-col items-center gap-6 py-8 text-white text-lg font-medium border-t border-slate-700 shadow-xl md:hidden z-40">
          
          {/* 🛠️ CORREGIDO: URL limpia también aquí */}
          <Link 
            href="/login"
            onClick={() => setMenuAbierto(false)}
            className="bg-white text-[#0b2c37] font-bold px-5 py-2.5 rounded-xl border border-transparent text-sm md:text-base shadow-sm text-center w-[80%]"
          >
            Iniciar Sesión
          </Link>
          
          <button type="button" onClick={() => setMenuAbierto(false)} className="w-full text-center py-2 active:bg-slate-800">Misión</button>
          <button type="button" onClick={() => setMenuAbierto(false)} className="w-full text-center py-2 active:bg-slate-800">Contacto</button>
        </div>
      )}

    </nav>
  );
}