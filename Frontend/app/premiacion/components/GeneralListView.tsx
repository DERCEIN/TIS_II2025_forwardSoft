"use client";

import React from "react";

const getMedalBadge = (estado: string) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    oro: { bg: "bg-yellow-100", text: "text-yellow-800", label: "🥇 Oro" },
    plata: { bg: "bg-gray-100", text: "text-gray-800", label: "🥈 Plata" },
    bronce: { bg: "bg-orange-100", text: "text-orange-800", label: "🥉 Bronce" },
    mencion: { bg: "bg-blue-100", text: "text-blue-800", label: "🏅 Mención" },
    aprobado: { bg: "bg-green-100", text: "text-green-800", label: "✓ Aprobado" },
  };
  const badge = badges[estado] || { bg: "bg-gray-100", text: "text-gray-800", label: estado };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
};

export default function GeneralListView({ consolidated, onPreview, onGeneratePdf }: { consolidated: any[] | null; onPreview: () => void; onGeneratePdf: () => void; }) {
  if (!consolidated) return <div className="text-sm text-gray-600">No consolidado</div>;

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <button 
          onClick={onPreview} 
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium transition-colors"
        >
          👁️ Previsualizar Lista General
        </button>
        <button 
          onClick={onGeneratePdf} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
        >
          📄 Generar PDF para Ceremonia
        </button>
      </div>
      <div className="overflow-auto border rounded-lg bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left font-semibold text-sm">Área</th>
              <th className="p-3 border text-left font-semibold text-sm">Nombre</th>
              <th className="p-3 border text-left font-semibold text-sm">Unidad Educativa</th>
              <th className="p-3 border text-center font-semibold text-sm">Puntaje</th>
              <th className="p-3 border text-center font-semibold text-sm">Medalla</th>
            </tr>
          </thead>
          <tbody>
            {consolidated.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 border text-sm font-medium">{c.area || "-"}</td>
                <td className="p-3 border text-sm">{c.nombre}</td>
                <td className="p-3 border text-sm text-gray-600">{c.unidad || "-"}</td>
                <td className="p-3 border text-center text-sm font-semibold">{(Number(c.puntaje) || 0).toFixed(2)}</td>
                <td className="p-3 border text-center">{getMedalBadge(c.estado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}