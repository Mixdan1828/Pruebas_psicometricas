"use client";

import React, { useEffect, useState } from 'react';

interface FinalizedProps {
  patientName?: string;
  testNames: string | string[];
  timeElapsed: string;
  onGoHome: () => void;
  onClose: () => void;
}

/**
 * Deduplica nombres de pruebas preservando el orden de aparición.
 * Acepta string separado por comas ("Terman, Terman, Terman") o arreglo.
 * Comparación insensible a mayúsculas/minúsculas y espacios.
 */
function dedupeTestNames(input: string | string[]): string {
  const rawList: string[] = Array.isArray(input)
    ? input
    : String(input ?? '').split(',');

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const raw of rawList) {
    const name = String(raw ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(name);
    }
  }

  return unique.join(', ');
}

export default function TestFinalizedView({ patientName: initialPatientName, testNames, timeElapsed, onGoHome, onClose }: FinalizedProps) {
  const [patientName, setPatientName] = useState(initialPatientName || "Candidato");

  // Nombre único de la prueba: aunque el padre envíe "Terman, Terman, Terman"
  // (un registro por usuario asignado), aquí se muestra una sola vez.
  const displayTestNames = dedupeTestNames(testNames);

  useEffect(() => {
    // El prop tiene prioridad; solo se usa localStorage como respaldo.
    if (initialPatientName) {
      setPatientName(initialPatientName);
      return;
    }
    const savedName = localStorage.getItem('candidato_nombre');
    if (savedName) {
      setPatientName(savedName);
    }
  }, [initialPatientName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Public+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <main className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Barra superior con color forzado */}
        <div style={{ background: 'linear-gradient(90deg, #001E28 0%, #416912 50%, #BEEE89 100%)' }} className="h-2 w-full shrink-0"></div>
        
        <div className="overflow-y-auto p-6 md:p-10 flex flex-col items-center text-center">
          
          {/* Icono */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-[#BEEE89] blur-2xl opacity-30 rounded-full"></div>
            <div className="relative h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BEEE89' }}>
              <span className="material-symbols-outlined !text-4xl" style={{ color: '#001E28', fontVariationSettings: "'wght' 600" }}>check_circle</span>
            </div>
          </div>

          <header className="mb-6">
            <h1 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight leading-tight" style={{ color: '#001E28' }}>
              ¡Felicitaciones,<br/>Evaluación Finalizada!
            </h1>
          </header>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
            {/* Cuadro Paciente */}
            <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: '#f0eded' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#434749' }}>Paciente</span>
              <p className="text-base font-headline font-bold" style={{ color: '#001E28' }}>{patientName}</p>
            </div>
            {/* Cuadro Tiempo */}
            <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: '#f0eded' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#434749' }}>Tiempo total</span>
              <p className="text-base font-headline font-bold flex items-center gap-2" style={{ color: '#001E28' }}>
                <span className="material-symbols-outlined text-sm">schedule</span>
                {timeElapsed}
              </p>
            </div>
            {/* Cuadro Evaluaciones */}
            <div className="col-span-1 md:col-span-2 text-white p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#001E28' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c2c7c9' }}>Evaluaciones Realizadas</span>
                <p className="text-base font-headline font-bold">{displayTestNames}</p>
              </div>
              <span className="material-symbols-outlined !text-3xl" style={{ color: '#c2c7c9' }}>psychology</span>
            </div>
          </div>

          <div className="max-w-lg mb-8">
            <p className="text-sm leading-relaxed font-medium" style={{ color: '#434749' }}>
              Tus respuestas han sido registradas correctamente. Recibirás tus resultados detallados una vez que el personal encargado realice la revisión correspondiente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button 
              onClick={onGoHome}
              style={{ backgroundColor: '#001E28', color: 'white' }}
              className="px-8 py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Regresar al Inicio
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-xl font-headline font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#001E28]/20 text-[#001E28] hover:bg-slate-100"
            >
              Cerrar vista
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-[#c4c7c8]/20 flex justify-between items-center shrink-0" style={{ backgroundColor: '#f0eded' }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ backgroundColor: '#001E28' }}>
              <span className="text-[9px] text-white font-black">HZ</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-tighter" style={{ color: '#001E28' }}>Fundación Hernández Zurita</span>
          </div>
        </footer>
      </main>
    </div>
  );
}