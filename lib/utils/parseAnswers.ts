// lib/utils/parseAnswers.ts
// ---------------------------------------------------------------------------
// Utilidad de deserialización y formateo de `answers_json` de la tabla
// `candidate_results`. El campo guarda un objeto cuyas claves son los `id` de
// las preguntas (`test_questions.id`) y cuyos valores son las respuestas elegidas.
// ---------------------------------------------------------------------------

// --------------- Tipos de dominio ---------------

/** Un valor de respuesta puede ser un escalar, un arreglo o un objeto anidado. */
export type ValorRespuesta =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | ValorRespuesta[];

/** Tipología de respuesta detectada para poder renderizarla mejor en el PDF. */
export type TipoRespuesta =
  | "opcion_multiple"
  | "escala_likert"
  | "numerica"
  | "texto"
  | "desconocido";

/** Pregunta tal y como llega desde la relación `tests.test_questions`. */
export interface PreguntaCruda {
  id: string;
  order_index?: number | null;
  content_jsonb?: unknown;
}

/** Relación `tests` obtenida en la consulta de resultados. */
export interface TestRelacionado {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  description?: string | null;
  test_questions?: PreguntaCruda[] | null;
}

/** Fila de `candidate_results` con sus relaciones. */
export interface ResultadoCrudo {
  id?: string | null;
  status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  score_json?: unknown;
  examiner_notes?: string | null;
  answers_json?: unknown;
  tests?: TestRelacionado | TestRelacionado[] | null;
}

/** Pregunta normalizada: lista para ser desplegada o impresa. */
export interface QuestionAnswer {
  id: string;
  numero: number;
  tipo: TipoRespuesta;
  pregunta: string;
  respuesta: string;
  respondida: boolean;
  respuestaCruda: ValorRespuesta | null;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Convierte un valor (que puede ser una cadena JSON) en un objeto. */
function normalizarContenido(valor: unknown): Record<string, unknown> | null {
  if (valor == null) return null;
  if (typeof valor === "object") return valor as Record<string, unknown>;
  if (typeof valor === "string") {
    const recortado = valor.trim();
    if (!recortado) return null;
    try {
      const parseado = JSON.parse(recortado) as unknown;
      if (parseado && typeof parseado === "object") {
        return parseado as Record<string, unknown>;
      }
      // Es una cadena simple que no es JSON.
      return { texto: recortado };
    } catch {
      return { texto: recortado };
    }
  }
  return { texto: String(valor) };
}

/** Coerción segura a cadena para cualquier valor, evitando "[object Object]". */
function aCadena(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") return JSON.stringify(valor) ?? "";
  return String(valor);
}

/**
 * Extrae el texto legible de una pregunta a partir de su `content_jsonb`.
 * Soporta las variantes usadas en los tests (enunciado, pregunta, texto,
 * oraciones, series numéricas, listas de palabras/adjetivos, etc.).
 */
export function extraerTextoPregunta(contentJsonb: unknown): string {
  const contenido = normalizarContenido(contentJsonb);
  if (!contenido) return "Pregunta sin texto";

  const clavesTexto = [
    "enunciado",
    "pregunta",
    "texto",
    "text",
    "oracion",
    "oracion_desordenada",
    "frase",
    "palabra",
    "title",
  ] as const;

  for (const clave of clavesTexto) {
    const valor = contenido[clave];
    const texto = aCadena(valor).trim();
    if (texto) return texto;
  }

  // Colecciones de palabras / adjetivos (e.g. Cleaver).
  for (const clave of ["palabras", "adjetivos"] as const) {
    const valor = contenido[clave];
    if (Array.isArray(valor) && valor.length > 0) {
      const lista = valor.map((item) => extraerTextoDeOpcion(item)).filter(Boolean);
      if (lista.length) return lista.join(", ");
    }
  }

  // Series numéricas (secuencia), opciones u otros arreglos.
  for (const clave of ["secuencia", "numeros", "opciones", "options", "choices"] as const) {
    const valor = contenido[clave];
    if (Array.isArray(valor) && valor.length > 0) {
      const lista = valor.map((item) => extraerTextoDeOpcion(item)).filter(Boolean);
      if (lista.length) return lista.join(", ");
    }
    const simple = aCadena(valor).trim();
    if (simple) return simple;
  }

  // Último recurso: cualquier primera propiedad con texto, o el JSON completo.
  const primeraPropiedad = Object.entries(contenido).find(
    ([, v]) => aCadena(v).trim().length > 0
  );
  if (primeraPropiedad) return aCadena(primeraPropiedad[1]).trim();

  return "Pregunta sin texto";
}
/** Extrae texto de un ítem de opción (objeto `{label}`/`{texto}` o escalar). */
function extraerTextoDeOpcion(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && !Array.isArray(valor)) {
    const obj = valor as Record<string, unknown>;
    const candidatas = [
      obj["texto"],
      obj["text"],
      obj["label"],
      obj["value"],
      obj["opcion"],
      obj["nombre"],
    ];
    for (const c of candidatas) {
      const t = aCadena(c).trim();
      if (t) return t;
    }
    const primero = Object.values(obj)[0];
    const texto = aCadena(primero).trim();
    return texto;
  }
  return aCadena(valor).trim();
}

/** Formatea un objeto de respuesta en una cadena descriptiva legible. */
function formatearObjeto(obj: Record<string, unknown>): string {
  // Series numéricas (preguntas 163-173): { num1, num2 }.
  if ("num1" in obj || "num2" in obj) {
    const num1 = aCadena(obj["num1"]).trim();
    const num2 = aCadena(obj["num2"]).trim();
    return [num1, num2].filter(Boolean).join("  •  ") || "Sin responder";
  }

  // Ordenación de oraciones (preguntas 128-144): { oracionOrdenada, verdadFalso }.
  if ("oracionOrdenada" in obj) {
    const oracion = aCadena(obj["oracionOrdenada"]).trim();
    const vf = obj["verdadFalso"] == null ? "" : aCadena(obj["verdadFalso"]).trim();
    return [oracion, vf].filter(Boolean).join(" — ");
  }

  // Escala Likert Cleaver: { mas?, menos? }.
  if ("mas" in obj || "menos" in obj) {
    const partes: string[] = [];
    if (obj["mas"] != null) partes.push(`Más: ${aCadena(obj["mas"]).trim()}`);
    if (obj["menos"] != null) partes.push(`Menos: ${aCadena(obj["menos"]).trim()}`);
    return partes.length ? partes.join("  |  ") : "Sin responder";
  }

  // Objeto genérico: `clave: valor`.
  const entradas = Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && aCadena(v).trim() !== "")
    .map(([k, v]) => `${k}: ${aCadena(v).trim()}`);

  return entradas.length ? entradas.join("; ") : "Sin responder";
}
/**
 * Convierte cualquier valor de respuesta en una cadena legible para el PDF.
 */
export function formatearRespuesta(valor: ValorRespuesta | null | undefined): string {
  if (valor === null || valor === undefined) return "Sin responder";
  if (Array.isArray(valor)) {
    const lista = valor
      .map((v) => formatearRespuesta(v as ValorRespuesta))
      .filter((t) => t && t !== "Sin responder");
    return lista.length ? lista.join(", ") : "Sin responder";
  }
  if (typeof valor === "object") {
    return formatearObjeto(valor as Record<string, unknown>);
  }
  const t = aCadena(valor).trim();
  return t || "Sin responder";
}

/** Clasifica el tipo de respuesta según la forma del valor. */
function clasificarTipo(valor: ValorRespuesta | null | undefined): TipoRespuesta {
  if (valor === null || valor === undefined) return "desconocido";
  if (typeof valor === "number" || typeof valor === "boolean") return "numerica";
  if (typeof valor === "object" && !Array.isArray(valor)) {
    const obj = valor as Record<string, unknown>;
    if ("num1" in obj || "num2" in obj) return "numerica";
    return "escala_likert";
  }
  return "opcion_multiple";
}

/**
 * Determina si el JSON de respuestas está vacío (o es nulo / corrupto).
 */
export function tieneRespuestas(answersJson: unknown): boolean {
  if (answersJson == null) return false;
  if (typeof answersJson !== "object") return true;
  return Object.keys(answersJson as Record<string, unknown>).length > 0;
}

// ------------- Accesores de las relaciones -------------

/** Obtiene la relación `tests` (manejando arreglo o un solo objeto). */
export function obtenerTest(resultado: ResultadoCrudo | null | undefined): TestRelacionado | null {
  const t = resultado?.tests;
  if (Array.isArray(t)) return t[0] ?? null;
  return t ?? null;
}

/** Obtiene la lista de preguntas de una prueba (manejando el arreglo). */
export function obtenerPreguntas(resultado: ResultadoCrudo | null | undefined): PreguntaCruda[] {
  const test = obtenerTest(resultado);
  if (!test?.test_questions) return [];
  return test.test_questions;
}

// ------------- Función principal de parsing -------------

/**
 * Cruza `answers_json` con la lista de preguntas y devuelve un arreglo
 * normalizado y ordenado de `QuestionAnswer` listo para imprimir.
 *
 * Lanza errores descriptivos si el JSON es nulo o corrupto, o si no hay
 * preguntas registradas para el examen.
 */
export function parseRespuestas(
  answersJson: unknown,
  preguntas: PreguntaCruda[] | null | undefined
): QuestionAnswer[] {
  if (answersJson == null) {
    throw new Error("El registro no contiene respuestas (answers_json es nulo).");
  }

  const raw = answersJson as Record<string, unknown>;
  const preguntasLista = preguntas ?? [];
  const preguntasConId = preguntasLista.filter((p) => p && Boolean(p.id));

  if (preguntasConId.length === 0) {
    throw new Error("No se encontraron preguntas registradas para este examen.");
  }

  return preguntasConId
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((pregunta, indice) => {
      const cruda = raw[pregunta.id] as ValorRespuesta | undefined;
      const respondida =
        cruda !== undefined &&
        cruda !== null &&
        !(Array.isArray(cruda) && cruda.length === 0) &&
        !(
          typeof cruda === "object" &&
          !Array.isArray(cruda) &&
          Object.keys(cruda as Record<string, unknown>).length === 0
        );

      return {
        id: pregunta.id,
        numero: pregunta.order_index ?? indice + 1,
        tipo: clasificarTipo(cruda),
        pregunta: extraerTextoPregunta(pregunta.content_jsonb),
        respuesta: formatearRespuesta(cruda),
        respondida,
        respuestaCruda: cruda ?? null,
      } satisfies QuestionAnswer;
    });
}