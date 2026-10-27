// ---------------------------------------------------------------------------
// Helper de parseo y formato de respuestas para PDF (Terman-Merril)
// ---------------------------------------------------------------------------
// Convierte estructuras variadas de `answers_json` (textos, arreglos, objetos)
// a la notación oficial de la hoja de respuestas Terman-Merril (i, o, v, f, etc.)
// Sin alterar la base de datos; solo transformación visual para el reporte.
// ---------------------------------------------------------------------------

export interface ParseResult {
  texto: string;
  symbol: string;
  raw: unknown;
}

/**
 * Formatea un valor de respuesta a la notación oficial de Terman-Merril
 * para su visualización en la hoja de respuestas PDF.
 *
 * @param valor - Valor cru de answers_json (puede ser string, number, boolean, object, array, null/undefined)
 * @returns Cadena de texto en notación oficial (i, o, v, f, o valor directo)
 */
export function formatearRespuestaParaPDF(valor: unknown): string {
  if (valor === null || valor === undefined) return "";

  // 1. Si es un arreglo (opciones múltiples o pares)
  if (Array.isArray(valor)) {
    const elementos = valor
      .map((v) => formatearRespuestaParaPDF(v))
      .filter((v) => v.length > 0);
    return elementos.join(", ");
  }

  // 2. Si es un objeto (ej. juicios, oraciones ordenadas o valores numéricos)
  if (typeof valor === "object") {
    const obj = valor as Record<string, unknown>;

    // Detectar tipos de preguntas específicos de Terman-Merril
    if (obj.verdadFalso !== undefined && obj.verdadFalso !== null) {
      const texto = String(obj.verdadFalso).trim().toLowerCase();
      if (texto === "verdadero" || texto === "true") return "v";
      if (texto === "falso" || texto === "false") return "f";
      return String(obj.verdadFalso);
    }

    if (obj.num1 !== undefined && obj.num1 !== null) {
      return String(obj.num1);
    }

    if (obj.oracionOrdenada !== undefined && obj.oracionOrdenada !== null) {
      return String(obj.oracionOrdenada);
    }

    if (obj.descripcion !== undefined && obj.descripcion !== null) {
      return String(obj.descripcion);
    }

    // Si tiene pregunta/reactivo específico dentro del objeto
    if (obj.texPregunta !== undefined) {
      return String(obj.texPregunta);
    }

    // Para objetos numéricos complejos, usar num1 como fallback
    if (obj.num1 !== undefined) {
      return String(obj.num1);
    }

    // Para objetos con variantes
    if (obj.verdadero !== undefined && obj.falso !== undefined) {
      return "v/f";
    }

    // Renderizar objeto genérico como JSON
    return JSON.stringify(valor);
  }

  // 3. Transformaciones de texto a notación oficial de Terman
  const texto = String(valor).trim().toLowerCase();

  // Notación de opciones
  if (texto === "i" || texto === "igual" || texto === "equal" || texto === "same") return "i";
  if (texto === "o" || texto === "opuesto" || texto === "opposite") return "o";
  if (texto === "v" || texto === "verdadero" || texto === "true" || texto === "yes") return "v";
  if (texto === "f" || texto === "falso" || texto === "false" || texto === "no") return "f";

  // 4. Texto libre, letras de opción múltiple o números directos
  return String(valor).trim();
}

// ---------------------------------------------------------------------------
// Funciones auxiliares de extracción y verificación de respuestas
// ---------------------------------------------------------------------------

/**
 * Extrae la respuesta correspondiente a un reactivo específico del answers_json.
 * Maneja diferentes formatos de almacenamiento:
 * - { "1": "v", "2": "f", ... }  → objeto mapeado por ID
 * - { "1": ["v"], "2": ["f"], ... } → array envuelto
 * - { preguntas: [...] }          → estructura anidada
 */
export function obtenerRespuestaReactivo(
  answersJson: unknown,
  numeroReactivo: number
): unknown {
  if (answersJson === null || answersJson === undefined) return null;

  // Caso 1: Objeto directo mapeado por número de reactivo
  if (typeof answersJson === "object") {
    const obj = answersJson as Record<string, unknown>;

    // Intentar con diferentes claves
    const claves = [
      String(numeroReactivo),
      `reactivo_${numeroReactivo}`,
      `pregunta_${numeroReactivo}`,
      `r_${numeroReactivo}`,
      `q_${numeroReactivo}`,
    ];

    for (const clave of claves) {
      if (obj.hasOwnProperty(clave)) {
        return obj[clave];
      }
    }

    // Si el objeto tiene un campo 'answers' o similar
    if (obj.answers !== undefined) {
      return obtenerRespuestaReactivo(obj.answers, numeroReactivo);
    }

    // Si el objeto tiene un campo 'data'
    if (obj.data !== undefined) {
      return obtenerRespuestaReactivo(obj.data, numeroReactivo);
    }

    // Profundizar en preguntas/cuerpo del test
    if (obj.preguntas !== undefined) {
      return obtenerRespuestaReactivo(obj.preguntas, numeroReactivo);
    }
    if (obj.questions !== undefined) {
      return obtenerRespuestaReactivo(obj.questions, numeroReactivo);
    }
  }

  // Caso 2: Arreglo de preguntas
  if (Array.isArray(answersJson)) {
    for (const item of answersJson) {
      const resultado = obtenerRespuestaReactivo(item, numeroReactivo);
      if (resultado !== null && resultado !== undefined) {
        return resultado;
      }
    }
  }

  return null;
}

/**
 * Verifica si existen respuestas para el reactivo especificado.
 */
export function tieneRespuestaReactivo(
  answersJson: unknown,
  numeroReactivo: number
): boolean {
  const respuesta = obtenerRespuestaReactivo(answersJson, numeroReactivo);
  return respuesta !== null && respuesta !== undefined;
}

/**
 * Formatea una fecha a la representación legible usada en reportes.
 */
export function formatearFechaReporte(fecha: string | null | undefined): string {
  if (!fecha) return "Sin registrar";
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(fecha);
  }
}

/**
 * Limpia y normaliza texto para PDF (quita caracteres especiales).
 */
export function limpiarTextoParaPDF(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[•·]/g, "*")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
