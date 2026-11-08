// app/dashboard/resultados/pdf/generarPDFRaven.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GenerarPDFRavenProps {
  candidato: any;
  prueba: any;
  fechaAplicacion?: string | null;
  onError?: (mensaje: string) => void;
}

export function esTestRaven(prueba: any) {
  const nombre = (prueba?.tests?.name || prueba?.test_name || '').toLowerCase();
  return nombre.includes('raven') || nombre.includes('matrices');
}

export function generarPDFHojaRespuestasRaven({
  candidato,
  prueba,
  fechaAplicacion,
  onError,
}: GenerarPDFRavenProps) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 15;

    // --- TÍTULO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 49, 63); // #0d313f
    doc.text('TEST RAVEN - HOJA DE RESPUESTA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // --- DATOS DEL CANDIDATO (Misma fila, etiquetas y valores en negrita) ---
    const nombreCompleto = [
      candidato?.full_name,
      candidato?.paternal_surname,
      candidato?.maternal_surname,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Sin nombre';

    const formatFechaStr = (fechaStr: string | null | undefined) => {
      if (!fechaStr) return 'No registrada';
      const partes = String(fechaStr).split('T')[0].split('-');
      if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
      return fechaStr;
    };

    const fechaNacFormatted = formatFechaStr(candidato?.Fecha_Nacimiento);
    const fechaAppFormatted = formatFechaStr(fechaAplicacion || prueba?.started_at || prueba?.completed_at);
    const sexoStr = candidato?.sex || 'No especificado';
    const edadStr = candidato?.age != null ? `${candidato.age} años` : 'N/A';

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [
        [
          { content: `NOMBRE COMPLETO: ${nombreCompleto}`, colSpan: 4, styles: { fontStyle: 'bold' } },
          { content: `FECHA: ${fechaAppFormatted}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        ],
        [
          { content: `SEXO: ${sexoStr}`, colSpan: 2, styles: { fontStyle: 'bold' } },
          { content: `F. NACIMIENTO: ${fechaNacFormatted}`, colSpan: 2, styles: { fontStyle: 'bold' } },
          { content: `EDAD: ${edadStr}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        ],
      ],
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [40, 40, 40],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 26 },
        5: { cellWidth: 28 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // --- RESPUESTAS DE LAS 3 SERIES (A, AB, B) ---
    const respuestas = prueba?.answers_json || [];
    const respuestasSerieA = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'A');
    const respuestasSerieAB = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'AB');
    const respuestasSerieB = respuestas.filter((r: any) => String(r?.serie || '').trim().toUpperCase() === 'B');

    // Preparar filas mostrando solo el número del reactivo y la opción
    const prepararRows = (items: any[]) => {
      if (items.length === 0) return [['Sin registros', '-']];
      return items.map((r: any, idx: number) => [
        String(r.order_index ?? (idx + 1)),
        String(r.respuesta_seleccionada ?? 'N/D'),
      ]);
    };

    const tableWidth = (pageWidth - margin * 2 - 8) / 3;

    const startX1 = margin;
    const startX2 = margin + tableWidth + 4;
    const startX3 = margin + (tableWidth + 4) * 2;

    const commonTableConfig = {
      startY: currentY,
      theme: 'grid' as const,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' as const },
      headStyles: { 
        fillColor: [18, 52, 64] as [number, number, number], 
        textColor: [255, 255, 255] as [number, number, number], 
        fontStyle: 'bold' as const,
        halign: 'center' as const 
      },
      columnStyles: { 
        0: { halign: 'center' as const, cellWidth: tableWidth * 0.5 }, 
        1: { 
          halign: 'center' as const, 
          cellWidth: tableWidth * 0.5, 
          fontStyle: 'bold' as const, 
          textColor: [18, 52, 64] as [number, number, number] 
        } 
      },
    };

    // Tabla Serie A (Cabecera unificada con colSpan: 2)
    autoTable(doc, {
      ...commonTableConfig,
      margin: { left: startX1, right: pageWidth - startX1 - tableWidth },
      head: [[{ content: 'SERIE A', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }]],
      body: prepararRows(respuestasSerieA),
    });
    const finalY1 = (doc as any).lastAutoTable.finalY;

    // Tabla Serie AB
    autoTable(doc, {
      ...commonTableConfig,
      startY: currentY,
      margin: { left: startX2, right: pageWidth - startX2 - tableWidth },
      head: [[{ content: 'SERIE AB', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }]],
      body: prepararRows(respuestasSerieAB),
    });
    const finalY2 = (doc as any).lastAutoTable.finalY;

    // Tabla Serie B
    autoTable(doc, {
      ...commonTableConfig,
      startY: currentY,
      margin: { left: startX3, right: pageWidth - startX3 - tableWidth },
      head: [[{ content: 'SERIE B', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }]],
      body: prepararRows(respuestasSerieB),
    });
    const finalY3 = (doc as any).lastAutoTable.finalY;

    currentY = Math.max(finalY1, finalY2, finalY3) + 12;

    // --- LOGOTIPO INSTITUCIONAL ---
    const imgPath = '/images/FDHZ_2025-Color_Vertical.png';
    const imgWidth = 36;
    const imgHeight = 33;

    if (currentY + imgHeight > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      currentY = 20;
    }

    try {
      doc.addImage(
        imgPath,
        'PNG',
        pageWidth - margin - imgWidth,
        currentY,
        imgWidth,
        imgHeight
      );
    } catch (e) {
      console.warn('No se pudo incrustar el logotipo institucional en el PDF:', e);
    }

    // --- GUARDAR ARCHIVO ---
    const nombreLimpio = nombreCompleto.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Hoja_Respuesta_Raven_${nombreLimpio}.pdf`);
  } catch (error) {
    console.error('Error al generar el PDF de Raven:', error);
    if (onError) onError('Ocurrió un error al generar el PDF de Raven.');
  }
}