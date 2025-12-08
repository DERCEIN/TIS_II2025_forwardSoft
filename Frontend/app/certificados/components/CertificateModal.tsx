"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Area, Competitor } from "../utils/certificateGenerator";
import { AlignCenter } from "lucide-react";
import { CertificadosService } from "@/lib/api";



export default function CertificateModal({
  open,
  onClose,
  areas,
  gestion,
}: {
  open: boolean;
  onClose: () => void;
  areas: Area[];
  gestion: string;
}) {
  
  const approvedAreas = useMemo(() => areas.filter(a => a.approved), [areas]);
  
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});

 
  const [showHonor, setShowHonor] = useState(true);
  const [showParticipation, setShowParticipation] = useState(true);
  const [certConfig, setCertConfig] = useState<any>(null);

  
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    
    approvedAreas.forEach(area => {
      const honorIds = computeHonorIds(area);
      const participationIds = computeParticipationIds(area, honorIds);
      [...honorIds, ...participationIds].forEach(id => {
        initial[id] = true;
      });
    });
    setSelectedMap(initial);
  }, [approvedAreas, open]);

  // Cargar configuración de certificados
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const response = await CertificadosService.getConfiguracion();
        if (response.success) {
          setCertConfig(response.data);
        }
      } catch (error) {
        console.warn('Error cargando configuración de certificados, usando valores por defecto:', error);
        // Usar valores por defecto si no se puede cargar la configuración
        setCertConfig(null);
      }
    };
    if (open) {
      cargarConfig();
    }
  }, [open]); 

  
  function computeHonorIds(area: Area) {
    
    const byPuesto = area.competitors.filter(c => [1,2,3].includes(c.puesto || -1));
    if (byPuesto.length > 0) {
      return Array.from(new Set(byPuesto.map(c => c.id)));
    }
    
    
    const top = [...area.competitors].sort((a,b)=> (b.puntaje || 0) - (a.puntaje || 0)).slice(0,3);
    return Array.from(new Set(top.map(c => c.id)));
  }

  function computeParticipationIds(area: Area, honorIds: number[]) {
  
    return area.competitors
      .filter(c => {
        
        if (honorIds.includes(c.id)) {
          return false;
        }
        
        const estado = c.estado;
        
       
        return !estado || estado === null || estado === '' || estado === 'null' || estado === 'undefined';
      })
      .map(c => c.id);
  }

  
  const candidatesByArea = useMemo(() => {
    return areas.map(area => {
      const honorIds = computeHonorIds(area);
      const participationIds = computeParticipationIds(area, honorIds);

      const honor = area.competitors.filter(c => honorIds.includes(c.id))
        .map(c => ({ ...c }));

      const participation = area.competitors.filter(c => participationIds.includes(c.id))
        .map(c => ({ ...c }));

      return {
        ...area,
        honor,
        participation,
      };
    });
  }, [areas]);

  
  const honorToPrint = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      if (!a.approved) return;
      a.honor.forEach((c: Competitor) => {
        if (selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    return list;
  }, [candidatesByArea, selectedMap]);

  const participationToPrint = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      if (!a.approved) return;
      a.participation.forEach((c: Competitor) => {
        if (selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    return list;
  }, [candidatesByArea, selectedMap]);

  
  const visibleHonorToPrint = useMemo(() => (showHonor ? honorToPrint : []), [honorToPrint, showHonor]);
  const visibleParticipationToPrint = useMemo(() => (showParticipation ? participationToPrint : []), [participationToPrint, showParticipation]);

  const totalToPrint = visibleHonorToPrint.length + visibleParticipationToPrint.length;

  
  const excluded = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      if (!a.approved) return;
      [...a.honor, ...a.participation].forEach((c: Competitor) => {
        if (!selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    
    const uniq: Record<number, boolean> = {};
    return list.filter(item => {
      if (uniq[item.id]) return false;
      uniq[item.id] = true;
      return true;
    });
  }, [candidatesByArea, selectedMap]);

  
  function toggleCompetitor(id: number) {
    setSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
  }

  
  function selectAllInAreaType(areaId: string, type: "honor" | "participation", val: boolean) {
    const area = candidatesByArea.find(a => a.id === areaId);
    if (!area || !area.approved) return;
    const next = { ...selectedMap };
    const list = type === "honor" ? area.honor : area.participation;
    list.forEach((c: Competitor) => (next[c.id] = val));
    setSelectedMap(next);
  }

  
  // Función auxiliar para convertir color hex a RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  // Función para reemplazar variables en texto
  const replaceTextVariables = (
    text: string,
    puesto: string | null,
    medalla: string | null,
    area: string,
    gestion: string
  ): string => {
    return text
      .replace(/{puesto}/g, puesto ? `el ${puesto} puesto` : "un destacado desempeño")
      .replace(/{medalla}/g, medalla ? ` y la medalla de ${medalla}` : "")
      .replace(/{area}/g, area || "-")
      .replace(/{gestion}/g, gestion);
  };

  async function generatePdf() {
    if (totalToPrint === 0) {
      alert("No hay certificados seleccionados/visibles para imprimir.");
      return;
    }

    // Usar configuración guardada o valores por defecto
    const config = certConfig || {
      fondo_color: '#FDFDFF',
      borde_color: '#173A78',
      borde_secundario_color: '#C8D2EB',
      texto_principal_color: '#2F3F76',
      texto_secundario_color: '#282828',
      titulo_fuente: 'times',
      titulo_estilo: 'bold',
      titulo_tamano: 36,
      nombre_fuente: 'times',
      nombre_estilo: 'bold',
      nombre_tamano: 54,
      cuerpo_fuente: 'times',
      cuerpo_estilo: 'normal',
      cuerpo_tamano: 14,
      logo_url: '/sansi-logo.png',
      logo_tamano: 130,
      logo_posicion_x: 45,
      logo_posicion_y: 'center',
      texto_honor: 'Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}.',
      texto_participacion: 'Por su valiosa participación en el área de {area} durante la gestión {gestion}, demostrando compromiso con la ciencia y la tecnología.',
      texto_firma_izquierda: 'Coordinador de Área',
      texto_firma_derecha: 'Director / Autoridad',
      texto_pie_pagina: 'SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial',
      margen: 15,
      radio_borde: 6,
    };

    // Construir URL completa del logo
    let logoSrc = config.logo_url || "/sansi-logo.png";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo';
    
    if (logoSrc.startsWith('/uploads/certificados/logos/')) {
      // Si es un logo subido, usar la ruta de API
      const filename = logoSrc.split('/').pop();
      logoSrc = `${apiUrl}/api/certificados/logo/${filename}`;
    } else if (logoSrc.startsWith('/uploads/')) {
      // Si es otra ruta de uploads, construir URL completa
      logoSrc = `${apiUrl}${logoSrc}`;
    } else if (logoSrc.startsWith('/') && !logoSrc.startsWith('//')) {
      // Si es una ruta relativa que no es uploads, usar la URL base
      logoSrc = `${apiUrl}${logoSrc}`;
    }
    
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error('Error cargando logo:', src, err);
          reject(new Error("Error cargando imagen"));
        };
        img.src = src;
      });

    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await loadImage(logoSrc);
    } catch (e) {
      console.warn(`No se pudo cargar logo en ${logoSrc}. El PDF seguirá sin logo.`);
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = config.margen || 15;

    const yearLabel = gestion || new Date().getFullYear().toString();

    const formatPuesto = (puesto?: number | null) => {
      if (!puesto) return null;
      const ordMap: Record<number, string> = { 1: "1.º", 2: "2.º", 3: "3.º" };
      return ordMap[puesto] || `${puesto}.º`;
    };

    const formatMedal = (estado?: string | null) => {
      if (!estado) return null;
      const map: Record<string, string> = {
        oro: "Oro",
        plata: "Plata",
        bronce: "Bronce",
        mencion_honor: "Mención de Honor",
        mencion: "Mención de Honor"
      };
      return map[String(estado).toLowerCase()] || null;
    };

    
    function renderCertificate(c: Competitor & { area?: string; estado?: string | null }, typeTitle: string) {
      const isHonor = typeTitle === "CERTIFICADO DE HONOR";
      const puestoText = formatPuesto(c.puesto);
      const medalText = formatMedal((c as any).estado);
      
      // Usar textos personalizados de la configuración
      const honorTextTemplate = config.texto_honor || 'Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}.';
      const participationTextTemplate = config.texto_participacion || 'Por su valiosa participación en el área de {area} durante la gestión {gestion}, demostrando compromiso con la ciencia y la tecnología.';
      
      const honorText = replaceTextVariables(honorTextTemplate, puestoText, medalText, c.area ?? "-", yearLabel);
      const participationText = replaceTextVariables(participationTextTemplate, puestoText, medalText, c.area ?? "-", yearLabel);
      const bodyText = isHonor ? honorText : participationText;
      const code = `SS-${String(c.id ?? 0).padStart(5, "0")}`;

      const innerWidth = pageWidth - margin * 2;
      const innerHeight = pageHeight - margin * 2;

      // Colores de fondo
      const fondoRgb = hexToRgb(config.fondo_color);
      pdf.setFillColor(fondoRgb[0], fondoRgb[1], fondoRgb[2]);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      
      const fondoInternoRgb = hexToRgb('#F5F8FF'); // Color interno fijo
      pdf.setFillColor(fondoInternoRgb[0], fondoInternoRgb[1], fondoInternoRgb[2]);
      const radioBorde = config.radio_borde || 6;
      pdf.roundedRect(margin, margin, innerWidth, innerHeight, radioBorde, radioBorde, "F");
      
      // Borde principal
      const bordeRgb = hexToRgb(config.borde_color);
      pdf.setDrawColor(bordeRgb[0], bordeRgb[1], bordeRgb[2]);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(margin, margin, innerWidth, innerHeight, radioBorde, radioBorde);
      
      // Borde secundario
      const bordeSecRgb = hexToRgb(config.borde_secundario_color);
      pdf.setDrawColor(bordeSecRgb[0], bordeSecRgb[1], bordeSecRgb[2]);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin + 5, margin + 5, innerWidth - 10, innerHeight - 10, 4, 4);

      // Patrón binario lateral
      pdf.setFont("courier", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(212, 218, 236);
      for (let y = margin + 12; y < pageHeight - margin; y += 9) {
        pdf.text("0101010101", margin - 3, y, undefined, 90);
      }

      
      const logoPosX = margin + (config.logo_posicion_x || 45);
      let logoPosY = pageHeight / 2;
      if (config.logo_posicion_y === 'top') {
        logoPosY = margin + 50;
      } else if (config.logo_posicion_y === 'bottom') {
        logoPosY = pageHeight - margin - 50;
      }

      if (logoImg) {
        const logoSize = config.logo_tamano || 130;
        pdf.addImage(logoImg, "PNG", logoPosX - logoSize / 2, logoPosY - logoSize / 2, logoSize, logoSize);
      }

     
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      const textoPrincipalRgb = hexToRgb(config.texto_principal_color);
      pdf.setTextColor(textoPrincipalRgb[0], textoPrincipalRgb[1], textoPrincipalRgb[2]);
      pdf.text(["Olimpiada de", "Ciencia y Tecnología"], pageWidth - margin - 18, margin + 15, { align: "right" });
      pdf.setFontSize(24);
      pdf.text(yearLabel, pageWidth - margin - 18, margin + 33, { align: "right" });

      
      const contentX = pageWidth / 2 + 35;
      pdf.setTextColor(textoPrincipalRgb[0], textoPrincipalRgb[1], textoPrincipalRgb[2]);
      pdf.setFont(config.titulo_fuente || "times", config.titulo_estilo || "bold");
      pdf.setFontSize(config.titulo_tamano || 36);
      pdf.text("CERTIFICADO", contentX, margin + 42, { align: "center" });
      pdf.setFont("times", "italic");
      pdf.setFontSize(16);
      pdf.text("ENTREGADO A", contentX, margin + 57, { align: "center" });

      // nombre
      pdf.setFont(config.nombre_fuente || "times", config.nombre_estilo || "bold");
      pdf.setFontSize(config.nombre_tamano || 54);
      const textoSecundarioRgb = hexToRgb(config.texto_secundario_color);
      pdf.setTextColor(textoSecundarioRgb[0], textoSecundarioRgb[1], textoSecundarioRgb[2]);
      pdf.text(String(c.nombre || ""), contentX, margin + 78, { align: "center" });

      // unidad y cuerpo
      pdf.setFont("times", "italic");
      pdf.setFontSize(15);
      pdf.setTextColor(textoSecundarioRgb[0], textoSecundarioRgb[1], textoSecundarioRgb[2]);
      pdf.text(`De la Unidad Educativa ${c.unidad ?? "-"}`, contentX, margin + 94, { align: "center" });

      pdf.setFont(config.cuerpo_fuente || "times", config.cuerpo_estilo || "normal");
      pdf.setFontSize(config.cuerpo_tamano || 14);
      pdf.text(bodyText, contentX, margin + 100, {
        align: "center",
        maxWidth: innerWidth - 120
      });

      // bloque de datos
      const dataBoxY = margin + 119;
      pdf.setDrawColor(194, 202, 230);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(contentX - 90, dataBoxY, 180, 32, 3, 3, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(26, 55, 112);
      pdf.text(`Área:`, contentX - 80, dataBoxY + 11);
      pdf.text(`Nivel:`, contentX - 80, dataBoxY + 21);
      pdf.text(`Puesto/Medalla:`, contentX + 5, dataBoxY + 11);
      pdf.text(`Código:`, contentX + 5, dataBoxY + 21);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      pdf.text(`${c.area ?? "-"}`, contentX - 45, dataBoxY + 11);
      pdf.text(`${c.nivel ?? "-"}`, contentX - 45, dataBoxY + 21);
      const puestoMedalla = medalText
        ? `${puestoText ?? "Reconocimiento"} · ${medalText}`
        : puestoText ?? "Participación";
      pdf.text(puestoMedalla, contentX + 55, dataBoxY + 11, { align: "center" });
      pdf.text(code, contentX + 55, dataBoxY + 21, { align: "center" });

      // leyenda lateral
      pdf.setFont("times", "italic");
      pdf.setFontSize(12);
      pdf.setTextColor(24, 74, 131);
      pdf.text("Olimpiada de", logoPosX, logoPosY + 50, { align: "center" });
      pdf.text("Ciencia y Tecnología", logoPosX, logoPosY + 60, { align: "center" });

      // zona de firmas
      const signatureY = pageHeight - 35;
      const leftSigX = logoPosX + 60;
      const rightSigX = pageWidth - margin - 60;
      pdf.setDrawColor(60, 60, 60);
      pdf.setLineWidth(0.5);
      pdf.line(leftSigX - 40, signatureY, leftSigX + 40, signatureY);
      pdf.line(rightSigX - 40, signatureY, rightSigX + 40, signatureY);
      pdf.setFont("times", "italic");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(config.texto_firma_izquierda || "Coordinador de Área", leftSigX, signatureY + 10, { align: "center" });
      pdf.text(config.texto_firma_derecha || "Director / Autoridad", rightSigX, signatureY + 10, { align: "center" });

      // pie de página
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(115, 120, 140);
      pdf.text(config.texto_pie_pagina || "SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial", pageWidth / 2, pageHeight - 6, { align: "center" });
    }

    
    const orderToPrint: (Competitor & { area?: string; type: "HONOR" | "PARTICIPATION" })[] = [];

    if (showHonor) {
      honorToPrint.forEach(h => orderToPrint.push({ ...h, type: "HONOR" }));
    }
    if (showParticipation) {
      participationToPrint.forEach(p => orderToPrint.push({ ...p, type: "PARTICIPATION" }));
    }

   
    const filtered = orderToPrint.filter(x => selectedMap[x.id]);

    filtered.forEach((c, idx) => {
      if (idx > 0) pdf.addPage();
      renderCertificate(c, c.type === "HONOR" ? "CERTIFICADO DE HONOR" : "CERTIFICADO DE PARTICIPACIÓN");
    });

    pdf.save(`certificados_${gestion}.pdf`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto pointer-events-none">
      <div className="w-[95%] max-w-6xl mx-auto bg-white p-4 rounded-xl mt-8 border shadow-lg pointer-events-auto" style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Generar Certificados</h2>
            <div className="text-sm text-gray-600 mb-1">
              Selecciona a los participantes que deben recibir certificado.
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              <strong>Certificados de Honor:</strong> Para participantes con medalla (Oro, Plata, Bronce)<br/>
              <strong>Certificados de Participación:</strong> Para participantes sin medalla asignada (mención de honor)
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-2 py-1 border rounded hover:bg-gray-100">Cerrar</button>
            <button
              onClick={generatePdf}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${totalToPrint ? "bg-green-600 hover:bg-green-700 shadow-md" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={totalToPrint === 0}
            >
              📄 EXPORTAR PDF ({totalToPrint})
            </button>
            {totalToPrint > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {visibleHonorToPrint.length} Honor · {visibleParticipationToPrint.length} Participación
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Candidatos por área */}
          <div className="border rounded-lg p-4 bg-gray-50 max-h-[55vh] overflow-auto shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Candidatos por área</h3>
            {candidatesByArea.map(a => (
              <div key={a.id} className="mb-4">
                <div className="flex items-center justify-between mb-3 p-2 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${a.approved ? "bg-purple-600" : "bg-gray-300"}`} />
                    <div>
                      <div className="font-semibold text-base">{a.nombre}</div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-yellow-700">Honor: {a.honor.length}</span> · 
                        <span className="font-medium text-blue-700"> Participación: {a.participation.length}</span>
                      </div>
                      {!a.approved && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          Pendiente de aprobación del coordinador
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button 
                      onClick={() => selectAllInAreaType(a.id, "honor", true)} 
                      disabled={!a.approved}
                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                        a.approved 
                          ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100" 
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ✓ Honor
                    </button>
                    <button 
                      onClick={() => selectAllInAreaType(a.id, "honor", false)} 
                      disabled={!a.approved}
                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                        a.approved 
                          ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ✗ Honor
                    </button>
                    <button 
                      onClick={() => selectAllInAreaType(a.id, "participation", true)} 
                      disabled={!a.approved}
                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                        a.approved 
                          ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" 
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ✓ Participación
                    </button>
                    <button 
                      onClick={() => selectAllInAreaType(a.id, "participation", false)} 
                      disabled={!a.approved}
                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                        a.approved 
                          ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ✗ Participación
                    </button>
                  </div>
                </div>

                {/* Honor list */}
                {a.honor.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold mb-2 text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                      🏅 Certificados de Honor ({a.honor.length})
                    </div>
                    <ul className="space-y-2">
                      {a.honor.map((c: Competitor) => (
                        <li key={c.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input 
                              type="checkbox" 
                              checked={!!selectedMap[c.id]} 
                              onChange={() => toggleCompetitor(c.id)} 
                              disabled={!a.approved}
                              className={`w-4 h-4 border rounded focus:ring-yellow-500 ${
                                a.approved ? "text-yellow-600 border-yellow-300" : "text-gray-300 border-gray-200 cursor-not-allowed"
                              }`} 
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{c.nombre}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{c.unidad}</span>
                                <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">{c.nivel}</span>
                                <span>Puntaje: {c.puntaje}</span>
                                {c.puesto && <span className="bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-700">Puesto: {c.puesto}</span>}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Participation list */}
                {a.participation.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      📜 Certificados de Participación ({a.participation.length})
                    </div>
                    <ul className="space-y-2">
                      {a.participation.map((c: Competitor) => (
                        <li key={c.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input 
                              type="checkbox" 
                              checked={!!selectedMap[c.id]} 
                              onChange={() => toggleCompetitor(c.id)} 
                              disabled={!a.approved}
                              className={`w-4 h-4 border rounded focus:ring-blue-500 ${
                                a.approved ? "text-blue-600 border-blue-300" : "text-gray-300 border-gray-200 cursor-not-allowed"
                              }`} 
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{c.nombre}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{c.unidad}</span>
                                <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">{c.nivel}</span>
                                <span>Puntaje: {c.puntaje}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {candidatesByArea.length === 0 && (
              <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded">
                No hay áreas disponibles.
              </div>
            )}
            {candidatesByArea.length > 0 && approvedAreas.length === 0 && (
              <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded mt-2">
                Aún no hay áreas aprobadas. Puedes revisar la información, pero no podrás seleccionar participantes hasta que cada coordinador apruebe su lista.
              </div>
            )}
          </div>

          {/* Right: Consolidado */}
          <div className="border rounded-lg p-4 bg-white max-h-[55vh] overflow-auto shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Consolidado</h3>

            {/* Visibility toggles */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showHonor} 
                  onChange={(e) => setShowHonor(e.target.checked)} 
                  className="w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-yellow-700">
                  Mostrar Certificados de Honor ({honorToPrint.length})
                </span>
              </label>
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showParticipation} 
                  onChange={(e) => setShowParticipation(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-700">
                  Mostrar Certificados de Participación ({participationToPrint.length})
                </span>
              </label>
            </div>

            <div className="mb-3">
              <div className="text-sm font-semibold mb-2 text-gray-700">📄 A imprimir ({totalToPrint})</div>

              {/* Honor subsection */}
              {showHonor && (
                <div className="mt-2 mb-3">
                  <div className="text-sm font-semibold mb-2 text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    🏅 Honor ({visibleHonorToPrint.length})
                  </div>
                  <div className="space-y-2">
                    {visibleHonorToPrint.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-yellow-200 bg-yellow-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{t.nombre}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="bg-white px-1.5 py-0.5 rounded mr-1">{t.unidad}</span>
                            <span className="bg-white px-1.5 py-0.5 rounded">{t.area}</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-yellow-700">
                          {t.puesto ? `Puesto ${t.puesto}` : "Honor"}
                        </div>
                      </div>
                    ))}
                    {visibleHonorToPrint.length === 0 && (
                      <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">No hay certificados de Honor visibles.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Participation subsection */}
              {showParticipation && (
                <div className="mt-3 mb-3">
                  <div className="text-sm font-semibold mb-2 text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    📜 Participación ({visibleParticipationToPrint.length})
                  </div>
                  <div className="space-y-2">
                    {visibleParticipationToPrint.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-blue-200 bg-blue-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{t.nombre}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="bg-white px-1.5 py-0.5 rounded mr-1">{t.unidad}</span>
                            <span className="bg-white px-1.5 py-0.5 rounded">{t.area}</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-blue-700">
                          Puntaje: {t.puntaje ?? "-"}
                        </div>
                      </div>
                    ))}
                    {visibleParticipationToPrint.length === 0 && (
                      <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">No hay certificados de Participación visibles.</div>
                    )}
                  </div>
                </div>
              )}

              {/* excluded */}
              <div className="mt-4">
                <div className="text-sm font-medium">Excluidos ({excluded.length})</div>
                <div className="mt-2 space-y-1">
                  {excluded.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="font-medium">{e.nombre}</div>
                        <div className="text-xs text-gray-500">{e.unidad} — {e.area}</div>
                      </div>
                      <div className="text-sm">{e.puesto ?? "-"} </div>
                    </div>
                  ))}
                  {excluded.length === 0 && <div className="text-sm text-gray-500">Nadie excluido.</div>}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs font-medium text-green-800 mb-1">
                ✅ Resumen de exportación:
              </div>
              <div className="text-xs text-green-700">
                Se generarán <strong>{visibleHonorToPrint.length} certificados de Honor</strong> y <strong>{visibleParticipationToPrint.length} certificados de Participación</strong>.
              </div>
              <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-green-200">
                Se imprimirán únicamente los certificados visibles y seleccionados en las listas anteriores.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-right">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cerrar</button>
        </div>
      </div>
    </div>
  );
}