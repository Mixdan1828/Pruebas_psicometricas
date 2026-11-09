// app/dashboard/resultados/vistas-previas/VistaPreviaTerman.tsx
import React from "react";

interface VistaPreviaTermanProps {
  candidato: any;
  prueba: any;
  formatearFecha: (fecha: string | null | undefined) => string;
}

export function VistaPreviaTerman({
  candidato,
  prueba,
  formatearFecha,
}: VistaPreviaTermanProps) {
  
  // Lógica interna para mapear los reactivos de Terman por serie
  const obtenerDatosPreguntaSerie = (numeroSerie: number, numPreguntaLocal: number) => {
    const testObj = Array.isArray(prueba?.tests) ? prueba.tests[0] : prueba?.tests;
    if (!testObj || !testObj.test_questions) return { respuesta: "—", respuesta2: "—" };

    const preguntasSerie = testObj.test_questions
      .filter((q: any) => {
        const parsed = typeof q.content_jsonb === 'string' ? JSON.parse(q.content_jsonb || "{}") : (q.content_jsonb || {});
        return Number(parsed?.serie) === numeroSerie;
      })
      .sort((a: any, b: any) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

    const preguntaItem = preguntasSerie[numPreguntaLocal - 1];
    if (!preguntaItem) return { respuesta: "—", respuesta2: "—" };

    const preguntaId = preguntaItem.id;
    const contenidoJson = typeof preguntaItem.content_jsonb === 'string' ? JSON.parse(preguntaItem.content_jsonb || "{}") : (preguntaItem.content_jsonb || {});
    const respuestasJson = prueba?.answers_json || {};
    let respuestaUsuario = respuestasJson[preguntaId];

    if (respuestaUsuario === undefined || respuestaUsuario === null || respuestaUsuario === "") {
      return { respuesta: "—", respuesta2: "—" };
    }

    if (typeof respuestaUsuario === 'string' && (respuestaUsuario.startsWith('{') || respuestaUsuario.startsWith('['))) {
      try {
        respuestaUsuario = JSON.parse(respuestaUsuario);
      } catch {}
    }

    if (numeroSerie === 3) {
      const valStr = String(respuestaUsuario).trim().toLowerCase();
      if (valStr.startsWith('ig') || valStr === 'i') return { respuesta: 'i', respuesta2: '—' };
      if (valStr.startsWith('op') || valStr === 'o') return { respuesta: 'o', respuesta2: '—' };
      return { respuesta: valStr.charAt(0), respuesta2: '—' };
    }

    if (numeroSerie === 4) {
      const opciones = contenidoJson.opciones || contenidoJson.options || contenidoJson.choices || [];
      if (Array.isArray(respuestaUsuario)) {
        const letrasElegidas = respuestaUsuario.map((resp: any) => {
          if (typeof resp === 'string' && resp.length <= 2) return resp.toLowerCase();
          const idx = opciones.findIndex((opt: any) => {
            const textoOpt = typeof opt === 'object' ? (opt.texto || opt.label || '') : String(opt);
            return textoOpt.trim().toLowerCase() === String(resp).trim().toLowerCase();
          });
          return idx !== -1 ? String.fromCharCode(97 + idx) : String(resp).charAt(0).toLowerCase();
        });
        return {
          respuesta: letrasElegidas[0] || "—",
          respuesta2: letrasElegidas[1] || "—"
        };
      }
    }

    if (numeroSerie === 8) {
      if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
        const vf = respuestaUsuario.verdadFalso || respuestaUsuario.vf || respuestaUsuario.respuesta || "";
        const vfStr = String(vf).trim().toLowerCase();
        if (vfStr.startsWith('v')) return { respuesta: 'v', respuesta2: '—' };
        if (vfStr.startsWith('f')) return { respuesta: 'f', respuesta2: '—' };
      }
    }

    if (typeof respuestaUsuario === "object" && respuestaUsuario !== null) {
      if (respuestaUsuario.oracionOrdenada) {
        return { respuesta: String(respuestaUsuario.oracionOrdenada).trim(), respuesta2: '—' };
      }
      if (respuestaUsuario.texto) {
        return { respuesta: String(respuestaUsuario.texto).trim(), respuesta2: '—' };
      }

      const n1 = respuestaUsuario.num1 ?? respuestaUsuario.val1 ?? respuestaUsuario.n1 ?? "";
      const n2 = respuestaUsuario.num2 ?? respuestaUsuario.val2 ?? respuestaUsuario.n2 ?? "";

      if (n1 !== "" || n2 !== "") {
        const part1 = n1 !== "" ? String(n1) : "";
        const part2 = n2 !== "" ? String(n2) : "";
        const combinado = part1 && part2 ? `${part1}, ${part2}` : part1 || part2;
        return { respuesta: combinado || "—", respuesta2: '—' };
      }

      return { respuesta: "—", respuesta2: '—' };
    }

    const opciones = contenidoJson.opciones || contenidoJson.options || contenidoJson.choices || [];
    if (opciones.length > 0 && [1, 2, 5, 6, 7, 9, 10].includes(numeroSerie)) {
      const indexEncontrado = opciones.findIndex((opt: any) => {
        const textoOpt = typeof opt === 'object' ? (opt.texto || opt.label || '') : String(opt);
        const letraOpt = typeof opt === 'object' ? (opt.letra || '') : '';
        return (
          String(respuestaUsuario).trim().toLowerCase() === textoOpt.trim().toLowerCase() ||
          String(respuestaUsuario).trim().toLowerCase() === letraOpt.trim().toLowerCase()
        );
      });

      if (indexEncontrado !== -1) {
        const optObj = opciones[indexEncontrado];
        if (typeof optObj === 'object' && optObj.letra) {
          return { respuesta: optObj.letra.toLowerCase(), respuesta2: '—' };
        }
        return { respuesta: String.fromCharCode(97 + indexEncontrado), respuesta2: '—' };
      }
    }

    if (Array.isArray(respuestaUsuario)) {
      return { respuesta: respuestaUsuario.join(", "), respuesta2: '—' };
    }

    return { respuesta: String(respuestaUsuario).trim(), respuesta2: '—' };
  };

  return (
    <div>
      <div className="flex justify-end w-full mb-4">
        <div className="w-35 h-15 border-2 border-black bg-white shadow-sm flex items-center justify-center"></div>
      </div>

      <h5 className="text-center font-bold text-sm text-[#0d313f] uppercase mb-4 pb-2">
        Terman - Merrill (Hoja de Respuesta) 
      </h5>

      <div className="border-3 border-black mb-6 text-xs text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-3 border-black divide-y md:divide-y-0 md:divide-x-2 divide-black">
          <div className="md:col-span-8 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Nombre completo:</span>
            <span className="text-slate-900 font-medium">
              {candidato?.full_name || ""} {candidato?.paternal_surname || ""} {candidato?.maternal_surname || ""}
            </span>
          </div>
          <div className="md:col-span-4 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Fecha:</span>
            <span className="text-slate-900 font-medium">
              {formatearFecha(prueba.started_at)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-black">
          <div className="md:col-span-4 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Sexo:</span>
            <span className="text-slate-900 font-medium">
              {candidato?.sex || "No especificado"}
            </span>
          </div>
          <div className="md:col-span-4 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Fecha de nacimiento:</span>
            <span className="text-slate-900 font-medium">
              {candidato?.Fecha_Nacimiento ? (() => { const [anio, mes, dia] = String(candidato.Fecha_Nacimiento).split("T")[0].split("-"); return `${dia}/${mes}/${anio}`; })() : "No registrada"}
            </span>
          </div>
          <div className="md:col-span-4 p-2.5 flex items-center gap-2">
            <span className="font-bold uppercase">Edad:</span>
            <span className="text-slate-900 font-medium">
              {candidato?.age != null ? `${candidato.age} años` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* 10 COLUMNAS */}
      <div className="mb-6 overflow-x-auto">
        <div className="grid grid-cols-10 gap-1.5 min-w-[780px] text-center items-start">
          
          {/* I-2 (16) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">I-2</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(1, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* II-2 (11) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">II-2</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(2, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* III-2 (30) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">III-2</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(3, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IV-3 (18) - 3 Subcolumnas */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">IV-3</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(4, num);
                return (
                  <div key={num} className="grid grid-cols-3 items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5 text-center">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                    <span className="font-bold text-slate-900">{res.respuesta2}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* V-5 (12) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">V-5</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(5, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VI-2 (20) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VI-2</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(6, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VII-2 (20) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VII-2</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(7, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIII-3 (17) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">VIII-3</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(8, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IX-3 (18) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">IX-3</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(9, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-4 (11) */}
          <div className="border-2 border-black bg-slate-50 rounded text-xs shadow-sm flex flex-col">
            <div className="bg-slate-200 text-slate-900 font-bold p-1.5 border-b-2 border-black text-[11px]">X-4</div>
            <div className="p-1 space-y-0.5">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => {
                const res = obtenerDatosPreguntaSerie(10, num);
                return (
                  <div key={num} className="flex justify-between items-center border-b border-slate-200 text-[10px] px-0.5 py-0.5">
                    <span className="font-semibold text-slate-500">{num}</span>
                    <span className="font-bold text-slate-900">{res.respuesta}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* IMAGEN EN LA PARTE INFERIOR DERECHA */}
      <div className="flex justify-end mt-6">
        <img
          src="/images/FDHZ_2025-Color_Vertical.png"
          alt="Logo institucional"
          className="w-32 h-auto object-contain"
        />
      </div>
    </div>
  );
}