import { ArrowRight, MapPin, Users, GraduationCap } from 'lucide-react';
import Barra_Nav from '../componentes/Barra_Nav';
import { AiOutlineMedicineBox } from 'react-icons/ai';
import { LuHandHeart } from 'react-icons/lu';
import Image from 'next/image';
import Link from 'next/link'; // Importante para la navegación de Next.js

export default function Home() { 
  return (
    <>
      <Barra_Nav />

      {/* ========================================================================= */}
      {/* SECCIÓN DEL TÍTULO PRINCIPAL (Hero Section)                               */}
      {/* ========================================================================= */}
      {/* CORRECCIÓN: Fondo cambiado al Color 4 (#123440) de la paleta oficial */}
      <section className="bg-[#123440] w-full px-6 py-12 md:py-24 flex flex-col justify-center gap-6 md:px-16 min-h-[40vh] lg:min-h-[50vh]">
        <h1 className="text-white font-bold text-3xl text-center md:text-5xl md:text-left">
          Sistema de Pruebas Psicométricas
        </h1>
        
        <div className="w-full md:max-w-[60%] flex justify-center md:justify-start">
          <p className="text-white text-base text-center leading-relaxed md:text-lg md:text-left">
            Impulsamos el acceso a la salud especializada con un enfoque humano,
            transformando realidades a través de la medicina de vanguardia y la compasión social.
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-4 md:flex-row md:justify-start">
          {/* CORRECCIÓN: Botón cambiado al Color 2 (#9DBA3A) y hover al Color 5 (#69943A) */}
          <button className="bg-[#9DBA3A] hover:bg-[#69943A] transition-colors py-3 px-6 rounded-full flex items-center justify-center gap-2 w-full md:w-auto font-bold text-sm md:text-lg text-[#202221] cursor-pointer">
            <span>Nuestros Programas</span>
            <ArrowRight size={22} />
          </button>
          
          <button className="border border-white hover:bg-white/10 transition-colors py-3 px-6 rounded-full flex items-center justify-center w-full md:w-auto font-bold text-sm md:text-lg text-white cursor-pointer">
            Conocer Impacto
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: ACERCA DE NOSOTROS                                               */}
      {/* ========================================================================= */}
      <section className="bg-[#FFF] w-full flex flex-col items-center px-6 py-12 gap-8 border-t border-[#e2e3e0] md:flex-row md:justify-center md:py-20 md:px-16 md:gap-12">
        <div className="w-full flex items-center justify-center md:flex-1">
          <Image 
            src="/images/channels4_profile.jpg" 
            alt="Logo Fundación"
            width={500} 
            height={500}
            priority
            className="rounded-[30px] object-contain w-[180px] h-[180px] md:w-[500px] md:h-[500px]"
          />
        </div>

        <div className="w-full flex flex-col gap-4 items-center md:flex-[1.5] md:items-start">
          {/* CORRECCIÓN: Texto oscuro al Color 7 (#202221) */}
          <h2 className="font-semibold text-[#202221] text-2xl text-center md:text-4xl md:text-left mb-4">
            Acerca de Nosotros
          </h2>
          
          <p className="text-slate-600 text-sm text-center leading-relaxed md:text-base md:text-left">
            La Fundación Doctor Hernández Zurita, I.B.P., establecida en el año 2003, 
            es una institución de beneficencia privada y sin fines de lucro. Su objetivo 
            principal es otorgar servicios de salud a familias de escasos recursos económicos, 
            así como a los grupos y personas más necesitadas.
          </p>
          
          <p className="text-slate-600 text-sm text-center leading-relaxed md:text-base md:text-left">
            Esta labor se lleva a cabo mediante consultas médicas, intervenciones quirúrgicas y 
            diversas acciones orientadas al mejoramiento de la salud general. Asimismo, la 
            fundación se dedica a regalar y donar lentes, junto con los materiales 
            necesarios para la recuperación y cuidado de la salud visual.
          </p>

          <div className="w-full flex flex-col items-stretch py-8 gap-6 md:flex-row md:justify-center">
            <div className="flex flex-col border border-slate-300 rounded-xl p-6 shadow-md md:w-1/2 flex-1 bg-[#FFF]">
              <AiOutlineMedicineBox size={30} className="mb-3 text-[#1A625F] flex-shrink-0" />
              <h2 className="font-bold mb-3 text-[#202221] text-xl">Excelente Medicina</h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                Equipamiento de última generación y especialistas certificados.
              </p>
            </div>

            <div className="flex flex-col border border-slate-300 rounded-xl p-6 shadow-md md:w-1/2 flex-1 bg-[#FFF]">
              <LuHandHeart size={30} className="mb-3 text-[#1A625F] flex-shrink-0" />
              <h2 className="font-bold mb-3 text-[#202221] text-xl">Sentido Humano</h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                Trato digno, empático y personalizado para cada paciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN INDEPENDIENTE: MISIÓN Y VISIÓN                                    */}
      {/* ========================================================================= */}
      <section className="w-full bg-slate-50 border-t border-b border-slate-100 py-16 px-6 md:px-16">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-7xl mx-auto">
          {/* TARJETA: MISIÓN */}
          <div className="flex flex-col bg-[#FFF] border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm h-full justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-blue-50 text-[#123440] rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#202221] tracking-tight">Misión</h2>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                Ser una institución de beneficencia privada que mejora la calidad de vida y el acceso a la salud de personas con discapacidad visual, especialmente en sectores vulnerables del centro y sureste de México, a través de programas y proyectos oftalmológicos.
              </p>
            </div>
          </div>

          {/* TARJETA: VISIÓN */}
          <div className="flex flex-col bg-[#FFF] border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm h-full justify-between transition-all hover:shadow-md hover:border-[#9DBA3A]">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-emerald-50 text-[#0E6433] rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#202221] tracking-tight">Visión</h2>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                Ser la institución líder en oftalmología en el centro y sureste de México, ofreciendo servicios médicos y quirúrgicos de alta calidad, con tecnología avanzada y profesionales certificados, para mejorar la salud visual y la calidad de vida de nuestros pacientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: LLAMADO A LA ACCIÓN (CTA) - Tarjeta Flotante                     */}
      {/* ========================================================================= */}
      {/* CORRECCIÓN: Fondo cambiado al Color 3 (#0E6433), botón de candidato removido */}
      <section className="w-full bg-[#FFF] px-6 md:px-16 pb-12 pt-12 max-w-7xl mx-auto">
        <div className="w-full bg-[#0E6433] text-[#FFF] rounded-[40px] py-16 px-8 md:py-20 md:px-16 text-center shadow-lg">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight max-w-3xl mx-auto leading-tight">
            Acceso al Sistema Psicométrico
          </h2>
          <p className="text-sm md:text-base text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Portal exclusivo para aplicadores de pruebas y personal administrativo de la Fundación.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="w-full sm:w-auto bg-[#9DBA3A] text-[#202221] font-bold px-8 py-3.5 rounded-xl hover:bg-[#69943A] hover:text-white transition-all shadow-md hover:scale-105 active:scale-95 text-sm md:text-base cursor-pointer flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              Iniciar Sesión (Google)
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: FOOTER OFICIAL                                                   */}
      {/* ========================================================================= */}
      {/* CORRECCIÓN: Fondo cambiado al Color 6 (#1A625F) para contraste en el footer */}
      <footer className="w-full bg-[#1A625F] text-[#FFF] px-6 py-12 md:px-16 md:py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 flex flex-col gap-4">
              <h3 className="text-xl font-bold text-[#9DBA3A] tracking-wide">
                Fundación Doctor Hernández Zurita
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-sm">
                Trabajando incansablemente por la salud y el bienestar de los sectores más vulnerables de nuestra comunidad.
              </p>
              
              {/* Redes Sociales */}
              <div className="flex items-center gap-4 mt-2">
                <a href="https://www.facebook.com/share/1LxcDe33V8/" className="p-2 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="Facebook">
                  {/* ... SVG Facebook ... */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://www.instagram.com/fundacionzurita?igsh=MTFqdzhnNWxscXJpag==" className="p-2 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="Instagram">
                  {/* ... SVG Instagram ... */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://youtube.com/@fundacionzurita?feature=shared" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-[#9DBA3A] hover:text-[#123440] transition-all flex items-center justify-center" aria-label="YouTube">
                  {/* ... SVG YouTube ... */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recursos</h4>
              <ul className="flex flex-col gap-2 text-xs md:text-sm text-slate-200">
                <li><a href="#" className="hover:text-[#9DBA3A] transition-colors">Donaciones</a></li>
                <li><a href="#" className="hover:text-[#9DBA3A] transition-colors">Preguntas Frecuentes</a></li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Legal</h4>
              <ul className="flex flex-col gap-2 text-xs md:text-sm text-slate-200">
                <li><a href="#" className="hover:text-[#9DBA3A] transition-colors">Aviso de Privacidad</a></li>
                <li><a href="#" className="hover:text-[#9DBA3A] transition-colors">Términos de Servicio</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 text-center text-[10px] md:text-xs text-slate-300">
            <p>© 2026 Fundación Doctor Hernández Zurita. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}