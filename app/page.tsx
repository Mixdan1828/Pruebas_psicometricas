"use client";

import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AiOutlineMedicineBox } from 'react-icons/ai';
import { LuHandHeart } from 'react-icons/lu';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() { 
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuAbierto(!menuAbierto);
  };

  // Función para desplazarse suavemente a una sección por su ID
  const scrollToSection = (id: string) => {
    setMenuAbierto(false); // Cierra el menú móvil si está abierto
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#202221] font-sans min-h-screen selection:bg-[#9DBA3A] selection:text-[#123440]">
      
      {/* ========================================================================= */}
      {/* BARRA DE NAVEGACIÓN INTEGRADA                                             */}
      {/* ========================================================================= */}
      <nav className="bg-white/90 backdrop-blur-md w-full h-[85px] px-4 md:px-8 flex justify-between items-center shadow-sm sticky top-0 z-50 border-b border-slate-100">
        
        {/* SECCIÓN DEL LOGO */}
        <div className="flex items-center h-[85px] max-w-[60%] py-2 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
        <div className="hidden md:flex gap-8 text-slate-700 font-medium items-center text-sm">
          <button 
            type="button" 
            onClick={() => scrollToSection('mision-vision')} 
            className="hover:text-[#123440] font-semibold transition-colors cursor-pointer"
          >
            Misión y Visión
          </button>
          <button 
            type="button" 
            onClick={() => scrollToSection('acerca-de')} 
            className="hover:text-[#123440] font-semibold transition-colors cursor-pointer"
          >
            Acerca de nosotros
          </button>
          <button 
            type="button" 
            onClick={() => scrollToSection('contacto-footer')} 
            className="hover:text-[#123440] font-semibold transition-colors cursor-pointer"
          >
            Contacto
          </button>
          
          <Link 
            href="/login"
            className="bg-[#123440] hover:bg-[#1A625F] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-md hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* BOTÓN HAMBURGUESA (Celular) */}
        <button 
          type="button"
          onClick={toggleMenu} 
          className="md:hidden text-[#123440] p-3 active:bg-slate-100 rounded-lg transition-colors relative z-50 select-none block cursor-pointer"
          style={{ touchAction: 'manipulation' }}
          aria-label="Menú de navegación"
        >
          {menuAbierto ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* DESPLEGABLE MÓVIL */}
        {menuAbierto && (
          <div className="absolute top-[85px] left-0 w-full bg-[#123440] flex flex-col items-center gap-6 py-8 text-white text-base font-medium border-t border-slate-700/50 shadow-2xl md:hidden z-40">
            <Link 
              href="/login"
              onClick={() => setMenuAbierto(false)}
              className="bg-[#9DBA3A] text-[#202221] font-bold px-6 py-3 rounded-xl text-center w-[85%] shadow-md"
            >
              Iniciar Sesión
            </Link>
            
            <button 
              type="button" 
              onClick={() => scrollToSection('mision-vision')} 
              className="w-full text-center py-2 text-slate-200 hover:text-white active:bg-white/10 cursor-pointer"
            >
              Misión y Visión
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('acerca-de')} 
              className="w-full text-center py-2 text-slate-200 hover:text-white active:bg-white/10 cursor-pointer"
            >
              Acerca de nosotros
            </button>
            <Link 
              href="/preguntas-frecuentes"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center py-2 text-slate-200 hover:text-white active:bg-white/10 cursor-pointer"
            >
              Preguntas Frecuentes
            </Link>
            <button 
              type="button" 
              onClick={() => scrollToSection('contacto-footer')} 
              className="w-full text-center py-2 text-slate-200 hover:text-white active:bg-white/10 cursor-pointer"
            >
              Contacto
            </button>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* SECCIÓN DEL TÍTULO PRINCIPAL (Hero Section)                               */}
      {/* ========================================================================= */}
      <section className="bg-[#123440] w-full px-6 py-16 md:py-28 flex flex-col justify-center gap-6 md:px-16 min-h-[45vh] lg:min-h-[55vh] relative overflow-hidden">
        <div className="max-w-4xl z-10">
          <span className="text-[#9DBA3A] font-bold text-xs uppercase tracking-[0.25em] mb-3 block">
            Fundación Doctor Hernández Zurita, I.B.P.
          </span>
          <h1 className="text-white font-extrabold text-3xl md:text-5xl lg:text-6xl tracking-tight leading-tight">
            Sistema de Pruebas Psicométricas
          </h1>
          
          <p className="text-slate-300 text-base md:text-lg mt-4 max-w-2xl leading-relaxed text-justify">
            Impulsamos el acceso a la salud especializada con un enfoque humano, transformando realidades a través de la medicina de vanguardia y la compasión social.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center gap-4 mt-4 z-10">
          <button 
            type="button"
            onClick={() => scrollToSection('mision-vision')}
            className="bg-[#9DBA3A] hover:bg-[#69943A] transition-all py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto font-bold text-sm md:text-base text-[#202221] cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          >
            <span>Conocer Misión</span>
            <ArrowRight size={18} />
          </button>
          
          <button 
            type="button"
            onClick={() => scrollToSection('acerca-de')}
            className="border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all py-3.5 px-8 rounded-xl flex items-center justify-center w-full sm:w-auto font-bold text-sm md:text-base text-white cursor-pointer"
          >
            Nuestra Historia
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: ACERCA DE NOSOTROS                                               */}
      {/* ========================================================================= */}
      <section id="acerca-de" className="bg-white w-full flex flex-col items-center px-6 py-16 gap-10 md:py-24 md:px-16 md:gap-16 scroll-mt-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="w-full flex items-center justify-center md:flex-1">
            <div className="relative w-[220px] h-[220px] md:w-[420px] md:h-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50 bg-slate-100">
              <Image 
                src="/images/channels4_profile.jpg" 
                alt="Logo Fundación"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div className="w-full flex flex-col gap-5 md:flex-[1.4] text-center md:text-left">
            <span className="text-[#0E6433] font-bold text-xs uppercase tracking-widest">Institución de Beneficencia Privada</span>
            <h2 className="font-extrabold text-[#123440] text-3xl md:text-4xl tracking-tight">
              Acerca de Nosotros
            </h2>
            
            <p className="text-slate-600 text-sm md:text-base leading-relaxed text-justify">
              La Fundación Doctor Hernández Zurita, I.B.P., establecida en el año 2003, es una institución de beneficencia privada y sin fines de lucro. Su objetivo principal es otorgar servicios de salud a familias de escasos recursos económicos, así como a los grupos y personas más necesitadas.
            </p>
            
            <p className="text-slate-600 text-sm md:text-base leading-relaxed text-justify">
              Esta labor se lleva a cabo mediante consultas médicas, intervenciones quirúrgicas y diversas acciones orientadas al mejoramiento de la salud general. Asimismo, la fundación se dedica a regalar y donar lentes, junto con los materiales necesarios para la recuperación y cuidado de la salud visual.
            </p>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex flex-col border border-slate-200/80 rounded-2xl p-6 shadow-sm bg-slate-50/50 hover:border-[#9DBA3A] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#123440]/10 text-[#123440] flex items-center justify-center mb-4">
                  <AiOutlineMedicineBox size={22} />
                </div>
                <h3 className="font-bold mb-2 text-[#123440] text-base">Excelente Medicina</h3>
                <p className="text-slate-600 leading-relaxed text-xs md:text-sm text-justify">
                  Equipamiento de última generación y especialistas certificados.
                </p>
              </div>

              <div className="flex flex-col border border-slate-200/80 rounded-2xl p-6 shadow-sm bg-slate-50/50 hover:border-[#9DBA3A] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#0E6433]/10 text-[#0E6433] flex items-center justify-center mb-4">
                  <LuHandHeart size={22} />
                </div>
                <h3 className="font-bold mb-2 text-[#123440] text-base">Sentido Humano</h3>
                <p className="text-slate-600 leading-relaxed text-xs md:text-sm text-justify">
                  Trato digno, empático y personalizado para cada paciente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN INDEPENDIENTE: MISIÓN Y VISIÓN                                    */}
      {/* ========================================================================= */}
      <section id="mision-vision" className="w-full bg-slate-50/70 py-20 px-6 md:px-16 scroll-mt-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#0E6433] font-bold text-xs uppercase tracking-widest block mb-2">Filosofía Institucional</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#123440] tracking-tight">Misión y Visión</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* TARJETA: MISIÓN */}
            <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm h-full justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-[#123440]/10 text-[#123440] rounded-2xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#123440] tracking-tight">Misión</h3>
                </div>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed text-justify">
                  Ser una institución de beneficencia privada que mejora la calidad de vida y el acceso a la salud de personas con discapacidad visual, especialmente en sectores vulnerables del centro y sureste de México, a través de programas y proyectos oftalmológicos.
                </p>
              </div>
            </div>

            {/* TARJETA: VISIÓN */}
            <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm h-full justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-[#0E6433]/10 text-[#0E6433] rounded-2xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#123440] tracking-tight">Visión</h3>
                </div>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed text-justify">
                  Ser la institución líder en oftalmología en el centro y sureste de México, ofreciendo servicios médicos y quirúrgicos de alta calidad, con tecnología avanzada y profesionales certificados, para mejorar la salud visual y la calidad de vida de nuestros pacientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: FUNCIONES AVANZADAS PARA EL SISTEMA PSICOMÉTRICO                 */}
      {/* ========================================================================= */}
      <section className="w-full bg-white py-20 px-6 md:px-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Título y Descripción */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            <span className="text-[#0E6433] font-bold text-xs uppercase tracking-widest block">
              Optimización Institucional
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#123440] tracking-tight leading-tight">
              Funciones avanzadas para optimizar la evaluación de personal
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed text-justify">
              Realice evaluaciones psicométricas en línea de manera rápida y confiable, para el reclutamiento y selección del personal de la fundación.
            </p>
          </div>

          {/* Columna Derecha: Cuadrícula de Tarjetas Personalizadas */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Tarjeta 1: Fácil acceso para resolver las pruebas */}
            <div className="bg-[#f4f7f6] border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div className="w-12 h-12 bg-[#123440]/10 text-[#123440] rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-[#123440] text-lg mb-2">Fácil acceso para resolver</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-justify">
                  Los candidatos pueden ingresar de forma sencilla mediante enlaces seguros generados por los aplicadores autorizados.
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Disponibilidad 24/7 */}
            <div className="bg-[#fcf7f2] border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div className="w-12 h-12 bg-[#9DBA3A]/20 text-[#123440] rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-[#123440] text-lg mb-2">Disponibilidad 24/7</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-justify">
                  Los candidatos pueden responder los exámenes psicométricos en cualquier horario y desde cualquier dispositivo adaptable.
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Sobre el Sistema y Gestión Interna */}
            <div className="bg-[#f2f7f4] border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div className="w-12 h-12 bg-[#0E6433]/10 text-[#0E6433] rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-[#123440] text-lg mb-2">Control del Sistema</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-justify">
                  Plataforma exclusiva protegida por autenticación institucional de Google OAuth con supervisión y autorización de administradores.
                </p>
              </div>
            </div>

            {/* Tarjeta 4: Facilidad de uso y Reportes */}
            <div className="bg-[#faf2f2] border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-700 rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-5-5-3 3"/></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-[#123440] text-lg mb-2">Facilidad de uso</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-justify">
                  Los resultados y reportes detallados se generan de forma inmediata al momento en que cada candidato concluye sus evaluaciones.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: LLAMADO A LA ACCIÓN (CTA)                                        */}
      {/* ========================================================================= */}
      <section className="w-full bg-white px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="w-full bg-[#123440] text-white rounded-[35px] py-16 px-8 md:py-20 md:px-16 text-center shadow-xl relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight max-w-3xl mx-auto leading-tight">
            Acceso al Sistema Psicométrico
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed text-justify">
            Portal exclusivo para aplicadores de pruebas y personal administrativo autorizado de la Fundación.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/login"
              className="w-full sm:w-auto bg-[#9DBA3A] text-[#202221] font-bold px-8 py-4 rounded-xl hover:bg-[#69943A] hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95 text-sm md:text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              Iniciar Sesión (Google)
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: FOOTER OFICIAL                                                   */}
      {/* ========================================================================= */}
      <footer id="contacto-footer" className="w-full bg-[#1A625F] text-white px-6 py-14 md:px-16 md:py-16 border-t border-white/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#9DBA3A] tracking-wide">
                Fundación Doctor Hernández Zurita, I.B.P.
              </h3>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-sm text-justify">
                Trabajando incansablemente por la salud y el bienestar de los sectores más vulnerables de nuestra comunidad.
              </p>
              
              {/* Redes Sociales */}
              <div className="flex items-center gap-3 mt-2">
                <a href="https://www.facebook.com/share/1LxcDe33V8/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://www.instagram.com/fundacionzurita?igsh=MTFqdzhnNWxscXJpag==" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://youtube.com/@fundacionzurita?feature=shared" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recursos</h4>
              <ul className="flex flex-col gap-2 text-xs md:text-sm text-slate-300">
                <li>
                  <Link href="/preguntas-frecuentes" className="hover:text-[#9DBA3A] transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Legal</h4>
              <ul className="flex flex-col gap-2 text-xs md:text-sm text-slate-300">
                <li>
                  <Link href="/aviso-de-privacidad" className="hover:text-[#9DBA3A] transition-colors">
                    Aviso de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terminos-de-servicio" className="hover:text-[#9DBA3A] transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 text-center text-[10px] md:text-xs text-slate-200">
            <p className="text-justify">© 2026 Fundación Doctor Hernández Zurita. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}