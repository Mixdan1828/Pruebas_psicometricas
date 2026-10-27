# 🎯 SKILL: Generación Dinámica de Hoja de Respuestas PDF (Terman-Merril)

## 1. OBJETIVO Y ARQUITECTURA
Implementar un sistema modular de reportes en PDF dentro de la plataforma que:
- Obtenga de forma dinámica el ID actual del candidato/resultado desde los parámetros de la ruta (`params.id`).
- Consulte las tablas de Supabase para identificar qué pruebas completó el candidato.
- Renderice de manera condicional la hoja de respuestas correspondiente (en este caso, **Terman-Merril**).
- **Regla de Escalabilidad y Limpieza:** Ningún archivo debe superar las **800 líneas de código**. Si la lógica crece demasiado, debe modularizarse obligatoriamente en componentes auxiliares o helpers independientes.

---

## 2. UBICACIÓN DE LOS ARCHIVOS
Crea o modifica los archivos estrictamente en estas rutas del proyecto:
- **Vista contenedora / Dinámica:** `app/dashboard/resultados/[id]/page.tsx`
- **Componente PDF / Plantilla Terman:** `app/dashboard/resultados/TermanPdfDocument.tsx`
- **Utilidades / Helpers (Parseo):** `app/dashboard/resultados/utils/formatters.ts` (para mantener la regla de las 800 líneas).

---

## 3. EXTRACCIÓN DE DATOS DE LA BASE DE DATOS (SUPABASE)
Realiza la consulta extrayendo explícitamente las siguientes columnas para asegurar la integridad:

### A. Tabla `candidates` (Datos generales)
- `full_name` -> Para el campo "Nombre:"
- `sex` -> Para el campo "Sexo:"
- `fecha_nacimiento` -> Para el campo "Fecha de nacimiento:"
- `age` -> Para el campo "Edad:"

### B. Tabla `candidate_results` (Datos de aplicación)
- `started_at` (o fecha de aplicación) -> Para el campo "Fecha de aplicación"
- `answers_json` -> Objeto JSON flexible que almacena las respuestas del usuario mapeadas por ID de pregunta.

---
## 4. DISEÑO Y MAQUETADO VISUAL

## Paleta de Colores:

El diseño general del PDF debe ser estrictamente en blanco y negro (bordes, textos, fondos y líneas tabulares en tonos oscuros o negros sobre fondo blanco) para no perder la atención del evaluador.

Excepción Única: El logotipo institucional (images/FDHZ_2025-Color_Vertical.png) se mantiene en su color original.

## Encabezado General:

Título destacado: TERMAN - MERRIL (HOJA DE RESPUESTAS) en la parte superior derecha/central.

Campos de Datos Generales: Nombre, Sexo, Fecha de nacimiento, Fecha de aplicación y Edad.

Logotipo Institucional: Integrar la imagen estática en la ruta "images/FDHZ_2025-Color_Vertical.png" ubicada en la esquina inferior derecha.

---
## 5. Estructura en 10 Columnas (Series I a X):

Maqueta una tabla con celdas en cascada vertical que contenga exactamente las 10 series del test:

- Serie I-2: Reactivos del 1 al 16
- Serie II-2: Reactivos del 1 al 11
- Serie III-2: Reactivos del 1 al 30 (dividida visualmente en dos bloques: 1-15 y 16-30)
- Serie IV-3: Reactivos del 1 al 18
- Serie V-5: Reactivos del 1 al 12
- Serie VI-2: Reactivos del 1 al 20
- Serie VII-2: Reactivos del 1 al 20
- Serie VIII-3: Reactivos del 1 al 17
- Serie IX-3: Reactivos del 1 al 18
- Serie X-4: Reactivos del 1 al 11

## Reglas de Estilo y Librería:
 - Librería de PDF: Utilizar estrictamente jsPDF asegurando que el contenido encaje de manera limpia, legible y sin desbordamientos en  una sola página estándar.

- Celdas: Cada casilla de reactivo debe mostrar claramente el número de pregunta y la respuesta procesada por el formateador (en blanco si no hay respuesta).

- Márgenes y Bordes: Bordes finos (border-solid, color negro/gris oscuro) simulando una hoja de pruebas impresa física.

- Unidades de jsPDF: Inicializar el documento con unidades métricas (unit: 'mm') para calcular con precisión milimétrica las posiciones de la tabla y garantizar que todo el contenido coexista sin desbordarse en una sola página tamaño Carta.
---

## 6. CRITERIOS DE VERIFICACIÓN


- [ ] La ruta captura correctamente el ID dinámico del candidato ([id]).
- [ ] Se consultan las columnas exactas de Supabase sin arrojar errores de columnas inexistentes.
- [ ] Se implementa el helper de parseo para traducir respuestas de texto a notación oficial (i, o, v, f, etc.).
- [ ] El diseño respeta el esquema en blanco y negro, con la única excepción del logotipo a color en la esquina inferior derecha.
- [ ] El archivo generado con jsPDF encaja de forma perfecta en una sola página.
- [ ] Ningún archivo supera las 800 líneas de código (modularizado correctamente).


## 7. LÓGICA DE PARSEO Y FORMATO DE RESPUESTAS (`answers_json`)
Dado que `answers_json` almacena estructuras variadas (textos, arreglos, objetos numéricos o de juicios), implementa la siguiente función de transformación visual para adaptarlo a la notación de la hoja de respuestas oficial sin alterar la base de datos:

```typescript
export function formatearRespuestaParaPDF(valor: any): string {
  if (!valor) return "";

  // 1. Si es un arreglo (opciones múltiples o pares)
  if (Array.isArray(valor)) {
    return valor.join(", ");
  }

  // 2. Si es un objeto (ej. juicios, oraciones ordenadas o valores numéricos)
  if (typeof valor === "object") {
    if (valor.verdadFalso) return valor.verdadFalso === "Verdadero" ? "v" : "f";
    if (valor.num1) return `${valor.num1}`;
    if (valor.oracionOrdenada) return valor.oracionOrdenada;
    return JSON.stringify(valor);
  }

  // 3. Transformaciones de texto a notación oficial de Terman
  const texto = String(valor).trim().toLowerCase();
  if (texto === "igual") return "i";
  if (texto === "opuesto") return "o";
  if (texto === "verdadero") return "v";
  if (texto === "falso") return "f";

  // 4. Texto libre, letras de opción múltiple o números directos
  return String(valor);

}




