/**
 * Tipos e interfaces compartidos para el flujo de inicio de pruebas.
 * Se separan del componente principal para aplicar SRP y permitir reuso.
 */

export interface AssignedTest {
  test_id: string;
  name: string;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
}

export interface LinkData {
  id: string;
  token: string;
  max_users: number;
  current_users: number | null;
}

export interface FormData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  edad: string;
  genero: string;
  sede: string;
  estado_civil: string;
  escolaridad: string;
  Fecha_Nacimiento: string;
}

/**
 * Representa una prueba asignada al candidato, tal como la devuelve
 * GET /api/candidate-evaluation (join candidate_results → tests).
 */
export interface CandidateTest {
  id: string;
  status: string;
  test_id: string;
  link_acceso: string | null;
  candidate_id: string | null;
  answers_json: unknown;
  tests: {
    id: string;
    name: string;
    type: string;
    tiempo: number | null;
    test_questions: unknown[];
  } | null;
}

/**
 * Fases de navegación del flujo del candidato.
 */
export type VideoInstructionPhase = 'checking' | 'videos' | 'registration' | 'exams' | 'error';
