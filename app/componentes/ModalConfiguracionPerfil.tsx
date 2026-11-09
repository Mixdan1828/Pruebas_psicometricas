// components/ModalConfiguracionPerfil.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Upload, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface ModalConfiguracionPerfilProps {
  isOpen: boolean;
  onClose: () => void;
  onPerfilActualizado?: () => void;
}

export default function ModalConfiguracionPerfil({ isOpen, onClose, onPerfilActualizado }: ModalConfiguracionPerfilProps) {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', error: false });

  useEffect(() => {
    if (isOpen) {
      cargarPerfil();
    }
  }, [isOpen]);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
      }
    } catch (e) {
      console.error("Error al cargar perfil:", e);
    }
  };

  const manejarCambioArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setSubiendo(true);
      setMensaje({ texto: '', error: false });

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setSubiendo(false);
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      setMensaje({ texto: 'Error al subir la imagen.', error: true });
      setSubiendo(false);
    }
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', error: false });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      setMensaje({ texto: 'Perfil actualizado correctamente.', error: false });
      if (onPerfilActualizado) onPerfilActualizado();
      
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error: any) {
      setMensaje({ texto: error.message || 'Error al guardar cambios.', error: true });
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-[#123440] text-base">Editar Perfil</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={guardarCambios} className="p-6 space-y-5">
          
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-slate-400" />
              )}
              {subiendo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>

            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              <Upload size={14} />
              <span>Seleccionar foto de archivos</span>
              <input type="file" accept="image/*" onChange={manejarCambioArchivo} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Ej. Juan Daniel Mixteco"
            />
          </div>

          {mensaje.texto && (
            <p className={`text-xs text-center font-medium ${mensaje.error ? 'text-red-500' : 'text-emerald-600'}`}>
              {mensaje.texto}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || subiendo}
              className="px-4 py-2 text-xs font-bold text-white bg-[#123440] hover:bg-[#1a4a5b] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Guardar cambios</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}