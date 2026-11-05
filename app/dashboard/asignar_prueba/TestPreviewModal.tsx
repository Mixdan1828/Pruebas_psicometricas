// app/dashboard/asignar_prueba/TestPreviewModal.tsx
import React from 'react';
import { X, ClipboardList, Clock, ListChecks, RefreshCw } from 'lucide-react';
import CleaverPreview from './vistas/CleaverPreview';
import TermanPreview from './vistas/TermanPreview';
import Nom035Preview from './vistas/Nom035Preview';
import RavenPreview from './vistas/RavenPreview'; // <--- Importamos la nueva vista de Raven

interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewTest: any;
  previewQuestions: any[];
  loadingPreview: boolean;
}

export default function TestPreviewModal({
  isOpen,
  onClose,
  previewTest,
  previewQuestions,
  loadingPreview,
}: TestPreviewModalProps) {
  if (!isOpen) return null;

  const testName = previewTest?.name || '';
  const testType = previewTest?.type || '';

  const isCleaver = testType === 'cleaver' || testName === 'Test Cleaver';
  const isNom035 = testName.includes('NOM-035') || testType === 'nom_035';
  const isRaven = testName.toLowerCase().includes('raven') || testType === 'raven'; // <--- Identificador para Raven

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-headline font-bold text-[#123440] text-lg">{previewTest?.name}</h3>
            <span className="text-xs text-slate-500 font-medium">Tipo: {previewTest?.type || previewTest?.name}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Resumen */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#f4f6f0] text-[#69943A] flex items-center justify-center shrink-0"><ClipboardList size={16} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prueba</p>
              <p className="text-xs font-bold text-[#123440] truncate">{previewTest?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#f4f6f0] text-[#69943A] flex items-center justify-center shrink-0"><Clock size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Duración</p>
              <p className="text-xs font-bold text-[#123440]">Estimada: {previewTest?.tiempo ?? 60} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#f4f6f0] text-[#69943A] flex items-center justify-center shrink-0"><ListChecks size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ítems</p>
              <p className="text-xs font-bold text-[#123440]">{previewTest?.config_json?.totalItems || previewQuestions.length || 137} total</p>
            </div>
          </div>
        </div>
        
        {/* Cuerpo dinámico */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f9f9f7]">
          {loadingPreview ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="animate-spin text-[#69943A]" size={24} />
            </div>
          ) : previewQuestions.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No hay reactivos registrados para esta prueba aún.</p>
          ) : (
            isCleaver ? (
              <CleaverPreview questions={previewQuestions} />
            ) : isNom035 ? (
              <Nom035Preview questions={previewQuestions} />
            ) : isRaven ? (
              <RavenPreview questions={previewQuestions} /> // <--- Renderizado de la vista Raven
            ) : (
              <TermanPreview questions={previewQuestions} />
            )
          )}
        </div>

      </div>
    </div>
  );
}