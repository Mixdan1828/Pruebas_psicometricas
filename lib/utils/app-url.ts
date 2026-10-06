/**
 * URL base pública de la aplicación.
 * Única fuente de verdad para construir enlaces compartibles
 * (p. ej. ligas de pruebas para candidatos).
 *
 * Prioridad:
 *  1. `process.env.NEXT_PUBLIC_APP_URL` (producción oficial en Vercel).
 *  2. `window.location.origin` (desarrollo / respaldo en cliente).
 *
 * Así evitamos que las ligas hereden dominios de vista previa de Vercel
 * cuando se generan desde un deploy preview.
 */

export const PRODUCTION_APP_URL = 'https://pruebas-psicometricas-chi.vercel.app';

export function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return PRODUCTION_APP_URL;
}

export function buildTestLink(token: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inicio_de_pruebas/${token}`;
  }
  return `${getAppBaseUrl()}/dashboard/inicio_de_pruebas/${token}`;
}
