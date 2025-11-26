"use client";

import React from "react";

export default function GeneralListView({ consolidated, onPreview, onGeneratePdf }: { consolidated: any[] | null; onPreview: () => void; onGeneratePdf: () => void; }) {
  if (!consolidated) return <div className="text-sm text-gray-600">No consolidado</div>;

  return (
    <div>
      <div className="mb-3">
        <button onClick={onPreview} className="px-3 py-1 border rounded mr-2">Previsualizar Lista General</button>
        <button onClick={onGeneratePdf} className="px-3 py-1 bg-blue-600 text-white rounded">Generar PDF</button>
      </div>
      <div className="overflow-auto border rounded bg-white">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-2 border">Área</th><th className="p-2 border">Nombre</th><th className="p-2 border">Puntaje</th><th className="p-2 border">Estado</th></tr>
          </thead>
          <tbody>
            {consolidated.map((c, idx) => (
              <tr key={idx}><td className="p-2 border">{c.area}</td><td className="p-2 border">{c.nombre}</td><td className="p-2 border">{c.puntaje}</td><td className="p-2 border">{c.estado}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}