"use client";

import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TerminosServicio() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#202221] font-sans">
      {/* Barra superior de navegación simple */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-[#123440] hover:text-[#1A625F] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Regresar al inicio</span>
        </Link>
        <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500">Documento Legal</h1>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3 mb-6 text-[#123440]">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <FileText size={26} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#123440]">Términos de Servicio</h2>
              <p className="text-xs text-slate-400">Última actualización: Enero de 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Bienvenido al Portal y Sistema de Pruebas Psicométricas de la <strong>Fundación Doctor Hernández Zurita, I.B.P.</strong> Al acceder o utilizar nuestra plataforma, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">1. Uso Autorizado</h3>
            <p>
              Esta plataforma es de carácter estrictamente interno y está destinada al uso exclusivo del personal autorizado, aplicadores y administradores de la Fundación. Queda prohibido el acceso no autorizado, la divulgación de credenciales o el uso indebido de la información contenida en el sistema.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">2. Cuentas y Credenciales de Acceso</h3>
            <p>
              El acceso al sistema se realiza mediante autenticación federada con cuentas institucionales de Google. El usuario es responsable de mantener la confidencialidad de su sesión y de todas las actividades que ocurran bajo su cuenta.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">3. Propiedad Intelectual</h3>
            <p>
              Todo el software, código fuente, interfaces, logotipos, bases de datos y contenidos visuales del Sistema Psicométrico son propiedad exclusiva de la Fundación Doctor Hernández Zurita o cuentan con las licencias respectivas, estando protegidos por las leyes de propiedad intelectual aplicables.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">4. Modificaciones y Suspensión</h3>
            <p>
              La administración se reserva el derecho de modificar, suspender o interrumpir temporal o permanentemente el acceso al sistema en cualquier momento por motivos de mantenimiento, seguridad institucional o actualización de políticas operativas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}