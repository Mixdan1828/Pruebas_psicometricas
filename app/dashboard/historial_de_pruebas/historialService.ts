// app/dashboard/historial_de_pruebas/historialService.ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface TestItem {
  id: string;
  candidateId: string;
  paciente: string;
  iniciales: string;
  tipo: string;
  fecha: string;
  rawDate: string | null;
  estado: 'Completado' | 'En Proceso' | 'Pendiente';
  color: string;
  sede: string;
}

export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Sin registrar";
  try {
    return new Date(fecha).toLocaleDateString("es-MX", {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  } catch {
    return String(fecha);
  }
}

export async function obtenerHistorialPruebas(userId: string) {
  // Aquí seleccionamos "headquarter" desde la tabla candidates
  const { data: resultsData, error } = await supabase
    .from('candidate_results')
    .select(`
      id,
      candidate_id,
      user_id,
      status,
      started_at,
      completed_at,
      candidates (
        id,
        full_name,
        paternal_surname,
        maternal_surname,
        headquarter
      ),
      tests (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return resultsData || [];
}

export async function eliminarPruebaYResultado(resultId: string, candidateId: string) {
  // 1. Intentar eliminar el resultado de la prueba
  const { data, error: errorResult } = await supabase
    .from('candidate_results')
    .delete()
    .eq('id', resultId)
    .select(); // .select() es importante para confirmar que el registro fue borrado

  if (errorResult) {
    console.error("Error al eliminar candidate_results:", errorResult);
    throw new Error(errorResult.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No se pudo eliminar el registro. Revisa las políticas RLS en Supabase para 'candidate_results'.");
  }

  // 2. Verificar si el candidato se queda sin más pruebas asociadas
  const { count, error: countError } = await supabase
    .from('candidate_results')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', candidateId);

  if (!countError && count === 0) {
    const { error: errorCandidate } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidateId)
      .select();

    if (errorCandidate) {
      console.error("No se pudo eliminar el candidato asociado:", errorCandidate);
    }
  }
}