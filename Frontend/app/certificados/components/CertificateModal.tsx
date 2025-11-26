"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Area, Competitor } from "../utils/certificateGenerator";
import { AlignCenter } from "lucide-react";

/**
 * CertificateModal (completo)
 *
 * - Calcula por área:
 *    Honor: puestos 1-3 (si existen puestos) — si no hay puestos, intenta top 3 por puntaje.
 *    Participación: puntaje > 51 (excluye los de Honor).
 * - Por defecto todos los candidatos (Honor + Participación) están seleccionados.
 * - En Consolidado hay dos checkboxes (mostrar Honor / mostrar Participación).
 * - Se subdivide "A imprimir" en Honor y Participación.
 * - generatePdf: imprime primero todos Honor visibles/tick, luego Participación visibles/tick.
 *
 * Nota: usa /Logo.png (ajusta si tu path es distinto).
 */

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
  // Estado de selección por id
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});

  // Mostrar u ocultar bloques en Consolidado
  const [showHonor, setShowHonor] = useState(true);
  const [showParticipation, setShowParticipation] = useState(true);

  // Inicializar seleccionados por defecto (todos candidatos de honor + participacion)
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    // compute per area
    areas.forEach(area => {
      const honorIds = computeHonorIds(area);
      const participationIds = computeParticipationIds(area, honorIds);
      [...honorIds, ...participationIds].forEach(id => {
        initial[id] = true;
      });
    });
    setSelectedMap(initial);
  }, [areas, open]); // re-initialize when areas change or modal opens

  // Helpers: compute honor ids for area
  function computeHonorIds(area: Area) {
    // prefer puesto field (1..3)
    const byPuesto = area.competitors.filter(c => [1,2,3].includes(c.puesto || -1));
    if (byPuesto.length > 0) {
      return Array.from(new Set(byPuesto.map(c => c.id)));
    }
    // else fallback: top 3 by puntaje
    const top = [...area.competitors].sort((a,b)=> (b.puntaje || 0) - (a.puntaje || 0)).slice(0,3);
    return Array.from(new Set(top.map(c => c.id)));
  }

  function computeParticipationIds(area: Area, honorIds: number[]) {
    return area.competitors
      .filter(c => (c.puntaje ?? 0) > 51 && !honorIds.includes(c.id))
      .map(c => c.id);
  }

  // candidatesByArea: produce honor and participation lists (with full objects)
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

  // Derived lists for consolidated view (filtered by selectedMap and showHonor/showParticipation)
  const honorToPrint = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      a.honor.forEach((c: Competitor) => {
        if (selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    return list;
  }, [candidatesByArea, selectedMap]);

  const participationToPrint = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      a.participation.forEach((c: Competitor) => {
        if (selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    return list;
  }, [candidatesByArea, selectedMap]);

  // Those visible in "A imprimir" considering the visibility toggles
  const visibleHonorToPrint = useMemo(() => (showHonor ? honorToPrint : []), [honorToPrint, showHonor]);
  const visibleParticipationToPrint = useMemo(() => (showParticipation ? participationToPrint : []), [participationToPrint, showParticipation]);

  const totalToPrint = visibleHonorToPrint.length + visibleParticipationToPrint.length;

  // Excluded: candidates that are not selected (both honor and participation)
  const excluded = useMemo(() => {
    const list: (Competitor & { area: string })[] = [];
    candidatesByArea.forEach(a => {
      [...a.honor, ...a.participation].forEach((c: Competitor) => {
        if (!selectedMap[c.id]) list.push({ ...c, area: a.nombre });
      });
    });
    // unique by id
    const uniq: Record<number, boolean> = {};
    return list.filter(item => {
      if (uniq[item.id]) return false;
      uniq[item.id] = true;
      return true;
    });
  }, [candidatesByArea, selectedMap]);

  // toggle single competitor
  function toggleCompetitor(id: number) {
    setSelectedMap(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // select/clear all in area for honor/participation
  function selectAllInAreaType(areaId: string, type: "honor" | "participation", val: boolean) {
    const area = candidatesByArea.find(a => a.id === areaId);
    if (!area) return;
    const next = { ...selectedMap };
    const list = type === "honor" ? area.honor : area.participation;
    list.forEach((c: Competitor) => (next[c.id] = val));
    setSelectedMap(next);
  }

  // generate PDF: prints only visible + selected items.
  async function generatePdf() {
    if (totalToPrint === 0) {
      alert("No hay certificados seleccionados/visibles para imprimir.");
      return;
    }

    // Load logo
    const logoSrc = "/Logo.png";
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Error cargando imagen"));
        img.src = src;
      });

    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await loadImage(logoSrc);
    } catch (e) {
      console.warn("No se pudo cargar logo en /Logo.png. El PDF seguirá sin logo.");
    }

    const pdf = new jsPDF({ unit: "mm", format: "letter" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;

    // Helper to render one certificate (typeTitle = "CERTIFICADO DE HONOR" | "CERTIFICADO DE PARTICIPACIÓN")
    function renderCertificate(c: Competitor & { area?: string }, typeTitle: string) {
      // New page handled by caller
      // border
      pdf.setDrawColor(160);
      //pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // logo top-left
      if (logoImg) {
        const margin = 15;
        const desiredW = 68;
        const aspect = logoImg.height / logoImg.width;
        const desiredH = desiredW * aspect;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const xPos = (pageWidth / 2) - (desiredW / 2);
        pdf.addImage(logoImg, "PNG", xPos, 16, desiredW, desiredH);
      }

      // Title
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      pdf.text(typeTitle, pageWidth / 2, 106, { align: "center" });

      // Subtitulo evento
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text("Olimpiadas de Ciencia y Tecnología", pageWidth / 2, 120, { align: "center" });

      // "Entregado a" + name
      pdf.setFontSize(12);
      pdf.text("TENEMOS EL HONOR DE OTORGAR EL PRESENTE CERTIFICADO A:", pageWidth / 2, 145, { align: "center" });

      //pdf.setFontSize(42);
      //pdf.setFont("helvetica", "bold");
     // pdf.text(String(c.nombre), pageWidth / 2, 142, { align: "center" });

      pdf.setFont("times", "blond");  
      pdf.setFontSize(52);  
      pdf.setTextColor(50, 50, 50);
      pdf.text(String(c.nombre), pageWidth / 2, 168, { align: "center", charSpace: 0.5 });  

      // Unidad, área, nivel, puntaje, puesto
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      const yBase = 180;
      pdf.text(`POR CONCLUIR SATISFACTORIAMENTE LAS OLIMPIADAS  ${""}`, pageWidth / 2, yBase, { align: "center" });
      pdf.text(`EN REPRESENTACION DE LA UNIDAD EDUCATIVA: ${c.unidad ?? "-"}`, pageWidth / 2, yBase + 8, { align: "center" });
      pdf.text(`EN EL AREA DE : ${c.area ?? "-"} CON LA CATEGORIA: ${c.nivel ?? "-"}`, pageWidth / 2, yBase + 16, { align: "center" });
      pdf.text(`OBTENIENDO UN PUNTAJE DE : ${c.puntaje ?? "-"} • OPTENIENDO EL PUESTO: ${c.puesto ?? "-"}`, pageWidth / 2, yBase + 24, { align: "center" });

      // Firma lines bottom
      const sigY = pageHeight - 36;
      const leftX = pageWidth / 2 - 70;
      const rightX = pageWidth / 2 + 20;
      pdf.setFontSize(10);
      pdf.text("__________________________", leftX, sigY);
      pdf.text("__________________________", rightX, sigY);
      pdf.text("Coordinador de Área", leftX, sigY + 6);
      pdf.text("Director / Autoridad", rightX, sigY + 6);

      // footer small
      pdf.setFontSize(8);
      pdf.text("Olimpiadas de Ciencia y Tecnología 2025", pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    // Build array of certificates to print (first honors if visible, then participation if visible)
    const orderToPrint: (Competitor & { area?: string; type: "HONOR" | "PARTICIPATION" })[] = [];

    if (showHonor) {
      honorToPrint.forEach(h => orderToPrint.push({ ...h, type: "HONOR" }));
    }
    if (showParticipation) {
      participationToPrint.forEach(p => orderToPrint.push({ ...p, type: "PARTICIPATION" }));
    }

    // Filter only selected (already honorToPrint/participationToPrint include selection)
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
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">Generar Certificados</h2>
            <div className="text-sm text-gray-600">
              Selecciona a los participantes que deben recibir certificado. 
            </div>
            <div className="text-sm text-gray-600">
              Se generan automaticamente:
              <strong> Certificados de Honor</strong>  y <strong>Certificados de Participación</strong>.
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-2 py-1 border rounded hover:bg-gray-100">Cerrar</button>
            <button
              onClick={generatePdf}
              className={`px-3 py-1 rounded text-white ${totalToPrint ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={totalToPrint === 0}
            >
              EXPORTAR PDF ({totalToPrint})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Candidatos por área */}
          <div className="border rounded p-3 bg-gray-50 max-h-[55vh] overflow-auto">
            <h3 className="font-semibold mb-2">Candidatos por área</h3>
            {candidatesByArea.map(a => (
              <div key={a.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: a.approved ? "#6b21a8" : "#ccc" }} />
                    <div>
                      <div className="font-medium">{a.nombre}</div>
                      <div className="text-xs text-gray-500">Honor: {a.honor.length} · Participación: {a.participation.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => selectAllInAreaType(a.id, "honor", true)} className="text-xs px-2 py-1 border rounded">Sellecionar Honor</button>
                    <button onClick={() => selectAllInAreaType(a.id, "honor", false)} className="text-xs px-2 py-1 border rounded">Limpiar Honor</button>
                    <button onClick={() => selectAllInAreaType(a.id, "participation", true)} className="text-xs px-2 py-1 border rounded">Selelecionar Participante</button>
                    <button onClick={() => selectAllInAreaType(a.id, "participation", false)} className="text-xs px-2 py-1 border rounded">Limpiar Participante</button>
                  </div>
                </div>

                {/* Honor list */}
                {a.honor.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium mb-1">Honor</div>
                    <ul className="space-y-1">
                      {a.honor.map((c: Competitor) => (
                        <li key={c.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3 min-w-0">
                            <input type="checkbox" checked={!!selectedMap[c.id]} onChange={() => toggleCompetitor(c.id)} className="w-4 h-4" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{c.nombre}</div>
                              <div className="text-xs text-gray-500">{c.unidad} • Puntaje: {c.puntaje}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">Honor</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Participation list */}
                {a.participation.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-1">Participación</div>
                    <ul className="space-y-1">
                      {a.participation.map((c: Competitor) => (
                        <li key={c.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3 min-w-0">
                            <input type="checkbox" checked={!!selectedMap[c.id]} onChange={() => toggleCompetitor(c.id)} className="w-4 h-4" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{c.nombre}</div>
                              <div className="text-xs text-gray-500">{c.unidad} • Puntaje: {c.puntaje}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">Participación</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {candidatesByArea.length === 0 && <div className="text-sm text-gray-500">No hay candidatos (revisa las áreas).</div>}
          </div>

          {/* Right: Consolidado */}
          <div className="border rounded p-3 bg-white max-h-[55vh] overflow-auto">
            <h3 className="font-semibold mb-2">Consolidado</h3>

            {/* Visibility toggles */}
            <div className="mb-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={showHonor} onChange={(e) => setShowHonor(e.target.checked)} />
                <span className="text-sm">Mostrar Certificados de Honor ({honorToPrint.length})</span>
              </label>
              <label className="flex items-center gap-3 mt-1">
                <input type="checkbox" checked={showParticipation} onChange={(e) => setShowParticipation(e.target.checked)} />
                <span className="text-sm">Mostrar Certificados de Participación ({participationToPrint.length})</span>
              </label>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium">A imprimir ({totalToPrint})</div>

              {/* Honor subsection */}
              {showHonor && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Honor ({visibleHonorToPrint.length})</div>
                  <div className="space-y-1">
                    {visibleHonorToPrint.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <div className="font-medium">{t.nombre}</div>
                          <div className="text-xs text-gray-500">{t.unidad} — {t.area}</div>
                        </div>
                        <div className="text-sm">Puesto: {t.puesto ?? "-"} • Honor</div>
                      </div>
                    ))}
                    {visibleHonorToPrint.length === 0 && <div className="text-sm text-gray-500">No hay certificados de Honor visibles.</div>}
                  </div>
                </div>
              )}

              {/* Participation subsection */}
              {showParticipation && (
                <div className="mt-3">
                  <div className="text-xs font-medium mb-1">Participación ({visibleParticipationToPrint.length})</div>
                  <div className="space-y-1">
                    {visibleParticipationToPrint.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <div className="font-medium">{t.nombre}</div>
                          <div className="text-xs text-gray-500">{t.unidad} — {t.area}</div>
                        </div>
                        <div className="text-sm">Puntaje: {t.puntaje ?? "-"}</div>
                      </div>
                    ))}
                    {visibleParticipationToPrint.length === 0 && <div className="text-sm text-gray-500">No hay certificados de Participación visibles.</div>}
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

            <div className="text-right">
              <div className="text-xs text-gray-500 mb-2">Se imprimirán únicamente los certificados visibles y tildados en las listas anteriores.</div>
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