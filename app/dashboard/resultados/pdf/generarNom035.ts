// app/dashboard/resultados/pdf/generarNom035.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GenerarPDFNom035Props {
  candidato: any;
  prueba: any;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

export const esTestNom035 = (prueba: any) => {
  const tName = (prueba?.tests?.name || prueba?.test_name || "").toLowerCase();
  const tType = (prueba?.tests?.type || "").toLowerCase();
  return tName.includes('nom-035') || tName.includes('nom035') || tName.includes('integral') || tType.includes('nom');
};

export const generarPDFHojaRespuestasNom035 = ({
  candidato,
  prueba,
  fechaAplicacion,
  onError,
}: GenerarPDFNom035Props) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 187.9 mm exactos
    let currentY = 15;

    // 1. LOGO CON 2 CM DE ALTO (20mm) Y BARRA VERDE
    const logoImg = new Image();
    logoImg.src = '/images/miLogo.png';
    try {
      doc.addImage(logoImg, 'PNG', margin, currentY, 48, 20);
    } catch {}

    doc.setFillColor(65, 105, 18); // #416912
    doc.roundedRect(margin + 51, currentY + 5, contentWidth - 51, 10, 1, 1, 'F');

    currentY += 24;

    // 2. TÍTULO CENTRADO
    const testName = prueba?.tests?.name || prueba?.test_name || "NOM-035 Integral - Hoja de Respuesta";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(13, 49, 63);
    doc.text(testName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;

    // 3. DATOS DEL CANDIDATO (Estructura robusta de 6 columnas tipo Raven para asegurar alineación perfecta)
    const nombreCompleto = [
      candidato?.full_name,
      candidato?.paternal_surname,
      candidato?.maternal_surname,
    ].filter(Boolean).join(" ").trim() || "Sin nombre";

    const formatFechaStr = (fechaStr: string | null | undefined) => {
      if (!fechaStr) return 'No registrada';
      const partes = String(fechaStr).split('T')[0].split('-');
      if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
      return fechaStr;
    };

    let fechaFormateada = "No registrada";
    const rawFecha = fechaAplicacion || prueba?.started_at || prueba?.completed_at;
    if (rawFecha) {
      const d = new Date(rawFecha);
      if (!isNaN(d.getTime())) {
        fechaFormateada = d.toLocaleDateString() + ", " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    const fechaNacFormatted = formatFechaStr(candidato?.Fecha_Nacimiento || candidato?.fecha_nacimiento);
    
    // Obtención segura de la edad desde múltiples posibles campos
    const edadVal = candidato?.age ?? candidato?.edad ?? prueba?.edad ?? null;
    const edadStr = edadVal != null ? `${edadVal} años` : 'N/A';
    const sexoStr = candidato?.sex || candidato?.genero || 'No especificado';

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [
        [
          { content: `NOMBRE COMPLETO: ${nombreCompleto}`, colSpan: 4, styles: { fontStyle: 'bold' } },
          { content: `FECHA: ${fechaFormateada}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        ],
        [
          { content: `SEXO: ${sexoStr}`, colSpan: 2, styles: { fontStyle: 'bold' } },
          { content: `F. NACIMIENTO: ${fechaNacFormatted}`, colSpan: 2, styles: { fontStyle: 'bold' } },
          { content: `EDAD: ${edadStr}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        ],
      ],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: [30, 41, 59],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 31.3 },
        1: { cellWidth: 31.3 },
        2: { cellWidth: 31.3 },
        3: { cellWidth: 31.3 },
        4: { cellWidth: 31.3 },
        5: { cellWidth: 31.4 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    const testQuestions = prueba?.tests?.test_questions || prueba?.test_questions || [];
    const allQuestionsMap = new Map<number, any>();
    testQuestions.forEach((q: any, index: number) => {
      let parsed = q.content_jsonb;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
      }
      const orderIdx = Number(q.order_index) || (index + 1);
      allQuestionsMap.set(orderIdx, { ...q, order_index: orderIdx, content_jsonb: parsed || {} });
    });

    const candidateAnswers = prueba?.answers_json || prueba?.answers || {};

    const SECTIONS = [
      {
        id: 1,
        title: "Sección 1",
        subtitle: "Cuestionario para identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.",
        groups: [
          { id: '1-1', start: 1, end: 6, title: "1. Acontecimiento traumático severo" },
          { id: '1-2', start: 7, end: 8, title: "2. Recuerdos persistentes sobre el acontecimiento (durante los últimos meses)" },
          { id: '1-3', start: 9, end: 15, title: "3. Esfuerzo para evitar circunstancias parecidas o asociadas al acontecimiento (durante el último mes)" },
          { id: '1-4', start: 16, end: 20, title: "4. Afectación (durante el último mes)" },
        ]
      },
      {
        id: 2,
        title: "Sección 2",
        subtitle: "Cuestionario para identificar los factores de riesgo psicosocial en los centros de trabajo.",
        groups: [
          { id: '2-1', start: 21, end: 29, title: "Para responder las siguientes preguntas considere las condiciones de su trabajo, así como la cantidad y ritmo de trabajo." },
          { id: '2-2', start: 30, end: 33, title: "Las preguntas siguientes están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene." },
          { id: '2-3', start: 34, end: 37, title: "Las siguientes preguntas están relacionadas con el tiempo destinado a su trabajo y sus responsabilidades familiares." },
          { id: '2-4', start: 38, end: 42, title: "Las siguientes preguntas están relacionadas con las decisiones que puede tomar en su trabajo." },
          { id: '2-5', start: 43, end: 47, title: "Las siguientes preguntas están relacionadas con la capacitación e información que recibe sobre su trabajo." },
          { id: '2-6', start: 48, end: 60, title: "Las siguientes preguntas se refieren a las relaciones con sus compañeros de trabajo y su jefe." },
          { id: '2-7', start: 61, end: 61, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios." },
          { id: '2-8', start: 62, end: 64, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
          { id: '2-9', start: 65, end: 65, title: "La siguiente pregunta está relacionada con las actitudes de los trabajadores que supervisa." },
          { id: '2-10', start: 66, end: 68, title: "Las siguientes preguntas están relacionadas con las actitudes de los trabajadores que supervisa." },
        ]
      },
      {
        id: 3,
        title: "Sección 3",
        subtitle: "Cuestionario para identificar los factores de riesgo psicosocial y evaluar el entorno organizacional en los centros de trabajo.",
        groups: [
          { id: '3-1', start: 69, end: 73, title: "Para responder las siguientes preguntas considere las condiciones ambientales de su centro de trabajo." },
          { id: '3-2', start: 74, end: 76, title: "Para responder las siguientes preguntas piense en la cantidad y ritmo de trabajo que tiene." },
          { id: '3-3', start: 77, end: 80, title: "Las siguientes preguntas están relacionadas con el esfuerzo mental que exige su trabajo." },
          { id: '3-4', start: 81, end: 84, title: "Las siguientes preguntas están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene." },
          { id: '3-5', start: 85, end: 90, title: "Las siguientes preguntas están relacionadas con su jornada de trabajo." },
          { id: '3-6', start: 91, end: 96, title: "Las siguientes preguntas están relacionadas con las decisiones que puede tomar en su trabajo." },
          { id: '3-7', start: 97, end: 98, title: "Las siguientes preguntas están relacionadas con cualquier tipo de cambio que ocurra en su trabajo (considere los últimos cambios realizados)." },
          { id: '3-8', start: 99, end: 104, title: "Las siguientes preguntas están relacionadas con la capacitación e información que se le proporciona sobre su trabajo." },
          { id: '3-9', start: 105, end: 109, title: "Las siguientes preguntas están relacionadas con el o los jefes con quien tiene contacto." },
          { id: '3-10', start: 110, end: 114, title: "Las siguientes preguntas se refieren a las relaciones con sus compañeros." },
          { id: '3-11', start: 115, end: 125, title: "Las siguientes preguntas están relacionadas con la información que recibe sobre su rendimiento en el trabajo, el reconocimiento, el sentido de pertenencia y estabilidad que le ofrece su trabajo." },
          { id: '3-12', start: 126, end: 133, title: "Las siguientes preguntas están relacionadas con actos de violencia laboral (malos tratos, acoso, hostigamiento, acoso psicológico)." },
          { id: '3-13', start: 134, end: 134, title: "La siguiente pregunta está relacionada con la atención a clientes y usuarios." },
          { id: '3-14', start: 135, end: 138, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
          { id: '3-15', start: 139, end: 139, title: "La siguiente pregunta está relacionada con los trabajadores que supervisa." },
          { id: '3-16', start: 140, end: 143, title: "Si su respuesta fue Sí, responda las siguientes preguntas." },
        ]
      }
    ];

    SECTIONS.forEach((sec) => {
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      // TÍTULOS DE SECCIÓN CENTRADOS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(65, 105, 18);
      doc.text(sec.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;

      // SUBTÍTULO EN NEGRITAS Y CENTRADO
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(sec.subtitle, pageWidth / 2, currentY, { align: 'center', maxWidth: contentWidth });
      currentY += 8;

      sec.groups.forEach((group) => {
        const groupQuestions: any[] = [];
        for (let i = group.start; i <= group.end; i++) {
          if (allQuestionsMap.has(i)) {
            groupQuestions.push(allQuestionsMap.get(i));
          }
        }
        if (groupQuestions.length === 0) return;

        if (currentY > 245) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(group.title, margin, currentY);
        currentY += 5;

        const firstContent = groupQuestions[0]?.content_jsonb || {};
        const headerOptions: string[] = firstContent.options || ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];

        const tableHeaders = ["N°", "Pregunta", ...headerOptions];
        const tableBody: any[] = [];

        groupQuestions.forEach((q) => {
          const qNum = q.order_index;
          const content = q.content_jsonb || {};
          const textPregunta = content.pregunta || content.text || `Pregunta ${qNum}`;
          const optionsList: string[] = content.options || headerOptions;
          
          const rawAnswer = 
            candidateAnswers[q.id] || 
            candidateAnswers[String(q.id)] || 
            candidateAnswers[qNum] || 
            candidateAnswers[String(qNum)] || 
            "";

          const rowData: any[] = [String(qNum), textPregunta];

          optionsList.forEach((opt) => {
            const normCandidate = String(rawAnswer).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normOpt = String(opt).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const isChecked = normCandidate === normOpt && normCandidate !== "";

            rowData.push(isChecked ? "X" : "");
          });

          tableBody.push(rowData);
        });

        // CÁLCULO ESTRICTO DE ANCHOS (Suma exacta = contentWidth = 187.9mm)
        const colNumWidth = 10;
        const optionColWidth = 18; // Ancho fijo por columna de opción
        const totalOptionsWidth = headerOptions.length * optionColWidth;
        const colPreguntaWidth = contentWidth - colNumWidth - totalOptionsWidth;

        const columnStylesConfig: Record<number, any> = {
          0: { halign: 'center', cellWidth: colNumWidth },
          1: { halign: 'left', cellWidth: colPreguntaWidth },
        };

        headerOptions.forEach((_, idx) => {
          columnStylesConfig[2 + idx] = { 
            halign: 'center', 
            cellWidth: optionColWidth, 
            fontStyle: 'bold', 
            textColor: [21, 128, 61] 
          };
        });

        autoTable(doc, {
          startY: currentY,
          theme: 'grid',
          head: [tableHeaders],
          body: tableBody,
          tableWidth: contentWidth, // Forzar ancho exacto de la página
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
            textColor: [30, 41, 59],
            lineColor: [203, 213, 225],
            lineWidth: 0.2,
            valign: 'middle',
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [51, 65, 85],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'center'
          },
          columnStyles: columnStylesConfig,
          margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 6;
      });
    });

    const safeName = nombreCompleto.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Nom035_Integral_${safeName}.pdf`);

  } catch (err: any) {
    console.error("Error al generar PDF NOM-035:", err);
    if (onError) onError("Ocurrió un error al generar el PDF de la NOM-035.");
  }
};

export default generarPDFHojaRespuestasNom035;