"use client";

import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AvisoPrivacidad() {
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
          <div className="flex items-center gap-3 mb-6 text-[#0E6433]">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#123440]">Aviso de Privacidad</h2>
              <p className="text-xs text-slate-400 text-justify">Última actualización: Enero de 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p className="text-justify">
              La <strong>Fundación Doctor Hernández Zurita, I.B.P.</strong>, con domicilio en Veracruz, México, es responsable del tratamiento y protección de los datos personales que nos proporcione a través de este Sistema de Pruebas Psicométricas.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">1. Datos Personales Recabados</h3>
            <p className="text-justify">
              Para cumplir con las finalidades establecidas en este aviso, recabamos datos de identificación y contacto obtenidos mediante su cuenta institucional de Google (nombre completo, correo electrónico y fotografía de perfil), así como información derivada de la gestión de evaluaciones psicométricas del personal y candidatos.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">2. Finalidades del Tratamiento</h3>
            <p className="text-justify">
              Los datos personales recabados serán utilizados para las siguientes finalidades esenciales: verificar la identidad del usuario, autorizar el acceso interno al portal institucional, administrar perfiles y roles de usuario, y dar seguimiento a los procesos de evaluación psicométrica.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">3. Protección y Seguridad</h3>
            <p className="text-justify">
              Implementamos medidas de seguridad administrativas, técnicas y físicas necesarias para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado, respaldados en infraestructura segura de bases de datos.
            </p>

            <h3 className="font-bold text-[#123440] text-base pt-2">4. Derechos ARCO</h3>
            <p className="text-justify">
              Usted tiene derecho a conocer qué datos tenemos de su persona, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}