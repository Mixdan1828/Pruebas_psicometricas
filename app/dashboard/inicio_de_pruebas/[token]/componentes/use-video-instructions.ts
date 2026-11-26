'use client';

import { useState, useCallback } from 'react';

/**
 * Clave de almacenamiento para rastrear si el candidato ya vio los videos
 * de instrucciones. Se scopepea por token para evitar conflictos entre
 * diferentes evaluaciones en el mismo navegador.
 */
const VIDEO_WATCHED_PREFIX = 'videos_instructions_watched_';

/**
 * Hook que encapsula toda la lógica de estado de reproducción de videos.
 * Separa la responsabilidad de persistencia/estado del componente de página.
 *
 * @param token - Token de acceso del candidato (se usa como namespace del localStorage)
 */
export function useVideoInstructions(token: string) {
  const storageKey = `${VIDEO_WATCHED_PREFIX}${token}`;

  const [hasWatchedInstructions, setHasWatchedInstructions] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  /**
   * Marca los videos como vistos, persistiendo en localStorage y actualizando el estado.
   */
  const markAsWatched = useCallback(() => {
    setHasWatchedInstructions(true);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // localStorage no disponible o cuota excedida: continuar sin persistir
      }
    }
  }, [storageKey]);

  /**
   * Reinicia el estado de videos vistos (útil para pruebas o para forzar re-visualización).
   */
  const reset = useCallback(() => {
    setHasWatchedInstructions(false);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
  }, [storageKey]);

  return { hasWatchedInstructions, markAsWatched, reset };
}
