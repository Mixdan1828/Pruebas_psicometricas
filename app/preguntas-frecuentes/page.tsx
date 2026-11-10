"use client";

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FaqItem {
  pregunta: string;
  respuesta: string;
}

const faqs: FaqItem[] = [
  {
    pregunta: "¿Quiénes pueden acceder al Sistema de Pruebas Psicométricas?",
    respuesta: "El acceso está reservado exclusivamente para aplicadores autorizados y personal administrativo de la Fundación Doctor Hernández Zurita, I.B.P. Se requiere una cuenta institucional de Google y la autorización previa de un administrador."
  },
  {
    pregunta: "¿Cómo se solicita una cuenta o acceso como aplicador?",
    respuesta: "Al iniciar sesión por primera vez con tu cuenta institucional de Google, tu registro quedará en estado 'Pendiente'. Un administrador del sistema deberá revisar y autorizar tus permisos antes de que puedas ingresar al panel principal."
  },
  {
    pregunta: "¿Qué pruebas psicométricas se gestionan en este portal?",
    respuesta: "El sistema permite administrar, asignar y consultar el historial y los resultados de las evaluaciones psicológicas aplicadas a los candidatos evaluados por la institución en sus distintos procesos de selección."
  },
  {
    pregunta: "¿Qué debo hacer si olvidé mi contraseña o tengo problemas de acceso?",
    respuesta: "Dado que el acceso se realiza mediante autenticación segura de Google OAuth, la plataforma no almacena contraseñas locales. Si experimentas bloqueos o problemas al iniciar sesión, contacta directamente con el departamento de sistemas o administración general."
  },
  {
    pregunta: "¿Cómo se asigna una nueva prueba a un candidato?",
    respuesta: "Una vez que hayas iniciado sesión con tu cuenta de aplicador autorizado, dirígete al módulo de asignación de pruebas, ingresa los datos correspondientes del candidato y genera el enlace único de evaluación."
  },
  {
    pregunta: "¿Los candidatos pueden resolver las pruebas desde su teléfono celular?",
    respuesta: "Sí, la plataforma está diseñada con un diseño web responsivo (adaptable), lo que permite a los candidatos resolver las evaluaciones de forma cómoda desde computadoras, tabletas o teléfonos inteligentes."
  },
  {
    pregunta: "¿Dónde se pueden consultar los resultados una vez finalizada la prueba?",
    respuesta: "Todos los resultados y reportes detallados quedan almacenados de forma segura en el historial de pruebas del panel de administración y aplicadores, permitiendo su consulta o revisión en cualquier momento."
  },
  {
    pregunta: "¿La información y los resultados de las evaluaciones son confidenciales?",
    respuesta: "Absolutamente. Todos los datos personales y los resultados psicométricos son tratados bajo estrictas políticas de privacidad y seguridad institucional, cumpliendo con nuestro aviso de privacidad."
  },
  {
    pregunta: "¿Qué son las pruebas psicométricas?",
    respuesta: "Las pruebas psicométricas son instrumentos estandarizados utilizados para evaluar características mentales y conductuales de los individuos, como habilidades cognitivas, personalidad y actitudes."
  },
  {
    pregunta: "¿Cuál es la finalidad de las pruebas psicométricas?",
    respuesta: "El objetivo principal de las pruebas psicométricas es proporcionar información objetiva y cuantificable sobre las capacidades, aptitudes y rasgos de personalidad de los candidatos, ayudando a tomar decisiones informadas en procesos de selección y desarrollo."
  },
  {
    pregunta: "¿Qué tipos de pruebas psicométricas existen?",
    respuesta: "Existen diversos tipos de pruebas psicométricas, incluyendo pruebas de inteligencia, de personalidad, de habilidades específicas y de aptitudes. Cada tipo está diseñado para evaluar diferentes aspectos del comportamiento y la capacidad cognitiva."
  },
  {
    pregunta: "¿Cómo se garantiza la validez y confiabilidad de las pruebas psicométricas?",
    respuesta: "La validez y confiabilidad de las pruebas psicométricas se asegura mediante rigurosos procesos de desarrollo, estandarización y validación. Las pruebas son sometidas a estudios estadísticos y revisiones por expertos para garantizar que midan lo que pretenden medir de manera consistente."
  },
  {
    pregunta: "¿Dónde puedo encontrar más información sobre las pruebas psicométricas?",
    respuesta: "Puedes consultar la documentación disponible en el sitio web del centro de evaluación o contactar directamente con nuestro equipo de soporte técnico para obtener información detallada sobre las pruebas y su aplicación."
  },
  {
    pregunta: "¿Para que sirven las pruebas psicométricas?",
    respuesta: "Las pruebas psicométricas sirven para evaluar y medir características mentales y conductuales de los individuos, proporcionando información objetiva y cuantificable que ayuda en procesos de selección, desarrollo y comprensión del comportamiento humano."
  }
];

export default function PreguntasFrecuentes() {
  const [abiertoIndex, setAbiertoIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setAbiertoIndex(abiertoIndex === index ? null : index);
  };

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
        <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500">Centro de Ayuda</h1>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-[#123440]/10 text-[#123440] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HelpCircle size={24} />
          </div>
          <span className="text-[#0E6433] font-bold text-xs uppercase tracking-widest block mb-2">Resolviendo tus dudas</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#123440] tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Encuentra respuestas rápidas sobre el acceso, funcionamiento y gestión de las evaluaciones en el sistema.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = abiertoIndex === index;
            return (
              <div 
                key={index}
                className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left font-bold text-[#123440] flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm md:text-base">{faq.pregunta}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#123440]' : ''}`} 
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}