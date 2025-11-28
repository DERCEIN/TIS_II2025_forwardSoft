"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extender tipo de jsPDF para lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export default function PreviewModal({
  open,
  data,
  type,
  onClose,
  onGeneratePdf,
  onToggleApproved,
}: {
  open: boolean;
  data: any;
  type?: "area" | "general";
  onClose: () => void;
  onGeneratePdf: (payload: any) => void;
  onToggleApproved?: (id: string, approved: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (type === "area" && data?.area) {
      setChecked(data.area.approved);
    }
  }, [data, type]);

  const handleToggleSign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setChecked(newValue);
    if (type === "area" && data?.area && onToggleApproved) {
      onToggleApproved(data.area.id, newValue);
    }
  };

  const handlePreviewPdf = () => {
    onGeneratePdf(data);
  };

  const handleExportPdf = () => {
    const pdf = new jsPDF({ unit: "in", format: "letter" }); 
    const margin = 1.18;
    let y = margin;

    // Logo
    const logoUrl = "/logo.png";
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      const imgWidth = 1.5;
      const imgHeight = (img.height / img.width) * imgWidth;

      pdf.addImage(img, "PNG", margin, y, imgWidth, imgHeight);
      y += imgHeight + 0.2;

      // Título
      pdf.setFontSize(18);
      pdf.text(
        type === "area" && data?.area
          ? `LISTA DE PREMIADOS — ${data.area.nombre}`
          : "LISTA GENERAL DE PREMIADOS",
        pdf.internal.pageSize.getWidth() / 2,
        y,
        { align: "center" }
      );
      y += 0.3;

      // TABLA PARA UN ÁREA — CORREGIDA
      if (type === "area" && data?.area) {
        autoTable(pdf, {
          startY: y,
          head: [["Nombre", "Unidad", "Nivel", "Puntaje", "Puesto", "Estado"]],
          body: data.list.map((c: any) => [
            c.nombre,
            c.unidad,
            c.nivel,
            c.puntaje,
            c.puesto,
            c.estado,
          ]),
          theme: "grid",
          headStyles: { fillColor: [244, 244, 244], textColor: 0 },
          margin: { left: margin, right: margin },
          styles: { fontSize: 12 },
        });
      }

      // TABLA GENERAL (la dejamos como está)
      if (type === "general" && data?.list) {
        const categorias = ["aprobado", "mencion", "bronce", "plata", "oro"];
        const nombresCategorias = [
          "Competidores aprobados",
          "Mención de honor",
          "Medalla de bronce",
          "Medalla de plata",
          "Medalla de oro",
        ];

        categorias.forEach((cat, i) => {
          const rows = data.list
            .filter((c: any) => c.estado === cat)
            .map((c: any) => [c.area, c.nombre, c.puntaje, c.estado]);

          if (rows.length > 0) {
            y = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 0.2 : y;

            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text(nombresCategorias[i], pdf.internal.pageSize.getWidth() / 2, y, {
              align: "center",
            });
            y += 0.2;

            autoTable(pdf, {
              startY: y,
              head: [["Área", "Competidor", "Puntaje", "Estado"]],
              body: rows,
              theme: "grid",
              headStyles: { fillColor: [244, 244, 244], textColor: 0 },
              margin: { left: margin, right: margin },
              styles: { fontSize: 12 },
            });
          }
        });
      }

      pdf.save(
        type === "area" && data?.area
          ? `${data.area.nombre}_lista.pdf`
          : "lista_general.pdf"
      );
    };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-auto">
      <div
        className="w-full max-w-5xl mx-auto bg-white p-6 rounded-xl mt-10 border shadow-lg"
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            Previsualizar {type === "area" ? "Lista de Área" : "Lista General"}
          </h3>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-2 py-1 border rounded hover:bg-gray-100"
            >
              Cerrar
            </button>

            <button
              onClick={handlePreviewPdf}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Previsualizar PDF
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {type === "area" && data?.area && (
            <>
              <div className="font-semibold mb-3 text-lg">
                {data.area.nombre}
              </div>

              {/* TABLA CORREGIDA */}
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Nombre</th>
                    <th className="border px-2 py-1">Unidad</th>
                    <th className="border px-2 py-1">Nivel</th>
                    <th className="border px-2 py-1">Puntaje</th>
                    <th className="border px-2 py-1">Puesto</th>
                    <th className="border px-2 py-1">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {data.list.map((c: any) => (
                    <tr key={c.id}>
                      <td className="border px-2 py-1">{c.nombre}</td>
                      <td className="border px-2 py-1">{c.unidad}</td>
                      <td className="border px-2 py-1">{c.nivel}</td>
                      <td className="border px-2 py-1">{c.puntaje}</td>
                      <td className="border px-2 py-1">{c.puesto}</td>
                      <td className="border px-2 py-1">{c.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleToggleSign}
                  />
                  Marcar firma del Coordinador (aprobado)
                </label>
              </div>
            </>
          )}

          {type === "general" && data?.list && (
            <>
              <div className="text-sm text-gray-700 mb-2">
                Lista consolidada — vista previa
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Área</th>
                    <th className="border px-2 py-1">Nombre</th>
                    <th className="border px-2 py-1">Puntaje</th>
                    <th className="border px-2 py-1">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {data.list.map((c: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{c.area}</td>
                      <td className="border px-2 py-1">{c.nombre}</td>
                      <td className="border px-2 py-1">{c.puntaje}</td>
                      <td className="border px-2 py-1">{c.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}