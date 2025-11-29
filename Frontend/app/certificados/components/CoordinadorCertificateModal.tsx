"use client";

import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { X, CheckCircle2, Eye, FileText, Award, Users, ListChecks } from "lucide-react";
import { Area, Competitor } from "../utils/certificateGenerator";

interface CoordinadorCertificateModalProps {
  open: boolean;
  onClose: () => void;
  area: Area | null;
  onToggleApproved: (areaId: string, approved: boolean) => void;
}

export default function CoordinadorCertificateModal({
  open,
  onClose,
  area,
  onToggleApproved,
}: CoordinadorCertificateModalProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!open || !area) return null;

  
  const esHonor = (c: Competitor) => {
    const estado = c.estado ? String(c.estado).toLowerCase().trim() : '';
    
    return ['oro', 'plata', 'bronce'].includes(estado) || [1, 2, 3].includes(c.puesto || -1);
  };

  
  const honorCount = area.competitors.filter(esHonor).length;
  
  const participationCount = area.competitors.filter(c => !esHonor(c)).length;

  const generarListaPremiadosPdf = () => {
    const premiados = area.competitors.filter(esHonor);
    if (premiados.length === 0) {
      alert("No hay premiados (Oro, Plata, Bronce) en esta área para generar la lista.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 15;
    let y = 20;

    pdf.setFont("times", "bold");
    pdf.setFontSize(16);
    pdf.text("Lista de Premiados", pageWidth / 2, y, { align: "center" });
    y += 8;

    pdf.setFontSize(13);
    pdf.text(`Área: ${area.nombre}`, pageWidth / 2, y, { align: "center" });
    y += 6;

    pdf.setFont("times", "italic");
    pdf.setFontSize(11);
    pdf.text("Incluye únicamente participantes con medalla (Oro, Plata, Bronce).", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;

    // Encabezado de tabla
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    const headers = ["Nº", "Nombre", "Unidad", "Nivel", "Puntaje", "Puesto", "Medalla"];
    const colWidths = [8, 58, 50, 25, 18, 14, 20];
    let x = marginX;

    headers.forEach((h, idx) => {
      pdf.text(h, x + 1, y);
      x += colWidths[idx];
    });
    y += 4;

    pdf.setDrawColor(180);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 3;

    // Filas
    pdf.setFont("helvetica", "normal");
    let index = 1;
    premiados.forEach((c) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }

      const estado = c.estado ? String(c.estado).toLowerCase().trim() : "";
      let medalla = "-";
      if (estado === "oro") medalla = "Oro";
      else if (estado === "plata") medalla = "Plata";
      else if (estado === "bronce") medalla = "Bronce";

      x = marginX;
      const row = [
        String(index),
        c.nombre,
        c.unidad,
        c.nivel,
        c.puntaje != null ? String(c.puntaje) : "-",
        c.puesto != null ? String(c.puesto) : "-",
        medalla,
      ];

      row.forEach((val, idx) => {
        const align = idx === 0 || idx >= 4 ? "center" : "left";
        pdf.text(String(val), align === "center" ? x + colWidths[idx] / 2 : x + 1, y, {
          align: align as any,
        });
        x += colWidths[idx];
      });

      y += 6;
      index += 1;
    });

    pdf.save(`lista_premiados_${area.nombre.replace(/\s+/g, "_")}.pdf`);
  };

  const handleApprove = () => {
    onToggleApproved(area.id, !area.approved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Aprobación de Certificados</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Área: <strong>{area.nombre}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Información del rol */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Rol: Coordinador de Área
                </p>
                <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                  <li>Verifica los resultados finales de tu área</li>
                  <li>Valida que la asignación de medallas sea correcta</li>
                  <li><strong>Aproba la lista de participantes</strong> que deben recibir certificado</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-800">{honorCount}</p>
                  <p className="text-xs text-yellow-700 font-medium">Certificados de Honor</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{participationCount}</p>
                  <p className="text-xs text-blue-700 font-medium">Certificados de Participación</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{area.competitors.length}</p>
                  <p className="text-xs text-gray-700 font-medium">Total Participantes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de participantes */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Lista de Participantes
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Ocultar" : "Ver"} Detalles
              </button>
            </div>

            {showPreview && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unidad</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Nivel</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Puntaje</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Puesto</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Tipo Certificado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {area.competitors.map((c) => {
                        const isHonor = esHonor(c);
                        const tipoCertificado = isHonor ? 'Honor' : 'Participación';
                        
                        return (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.nombre}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{c.unidad}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">{c.nivel}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">{c.puntaje || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">{c.puesto || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isHonor 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {tipoCertificado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Estado de aprobación */}
          <div className={`border-2 rounded-xl p-6 transition-all ${
            area.approved 
              ? 'bg-green-50 border-green-300' 
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  area.approved 
                    ? 'bg-green-100' 
                    : 'bg-gray-200'
                }`}>
                  <CheckCircle2 className={`h-6 w-6 ${
                    area.approved 
                      ? 'text-green-600' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className={`text-lg font-semibold ${
                    area.approved 
                      ? 'text-green-800' 
                      : 'text-gray-800'
                  }`}>
                    {area.approved ? 'Área Aprobada' : 'Área Pendiente de Aprobación'}
                  </p>
                  <p className={`text-sm ${
                    area.approved 
                      ? 'text-green-700' 
                      : 'text-gray-600'
                  }`}>
                    {area.approved 
                      ? 'El administrador puede generar los certificados de esta área.'
                      : 'Aproba esta área para que el administrador pueda generar los certificados.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleApprove}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                    area.approved
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {area.approved ? '✓ Aprobada' : 'Aprobar área'}
                </button>
                {area.approved && (
                  <button
                    onClick={generarListaPremiadosPdf}
                    className="px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <ListChecks className="h-4 w-4" />
                    Lista PDF de premiados
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Una vez aprobada, el administrador podrá generar los certificados en lote.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

