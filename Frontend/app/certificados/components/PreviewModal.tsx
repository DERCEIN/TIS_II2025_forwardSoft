"use client";

import React, { useEffect, useState } from "react";
import { Area } from "../utils/certificateGenerator";

export default function PreviewModal({
  open,
  data,
  type,
  onClose,
  onToggleApproved,
}: {
  open: boolean;
  data: any;
  type?: "area" | "general";
  onClose: () => void;
  onToggleApproved?: (id: string, approved: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (type === "area" && data?.area) {
      setChecked(Boolean(data.area.approved));
    }
  }, [data, type]);

  const handleToggleSign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setChecked(newValue);
    if (type === "area" && data?.area && onToggleApproved) {
      onToggleApproved(data.area.id, newValue);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto pointer-events-none">
      <div
        className="w-full max-w-5xl mx-auto bg-white p-6 rounded-xl mt-10 border shadow-lg pointer-events-auto"
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
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {/* ===================== ÁREA ===================== */}
          {type === "area" && data?.area && (
            <>
              <div className="font-semibold mb-3 text-lg">
                {data.area.nombre}
              </div>

              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Nombre</th>
                    <th className="border px-2 py-1">Unidad</th>
                    <th className="border px-2 py-1">Nivel</th>
                    <th className="border px-2 py-1">Puntaje</th>
                    <th className="border px-2 py-1">Puesto</th>
                    <th className="border px-2 py-1">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {data.list.map((c: any) => {
                    const estado =
                      c.aprobado
                        ? "Aprobado"
                        : c.puesto === 1
                        ? "Medalla de Oro"
                        : c.puesto === 2
                        ? "Medalla de Plata"
                        : c.puesto === 3
                        ? "Medalla de Bronce"
                        : "-";

                    return (
                      <tr key={c.id}>
                        <td className="border px-2 py-1">{c.nombre}</td>
                        <td className="border px-2 py-1">{c.unidad}</td>
                        <td className="border px-2 py-1">{c.nivel}</td>
                        <td className="border px-2 py-1">{c.puntaje ?? "-"}</td>
                        <td className="border px-2 py-1">{c.puesto ?? "-"}</td>
                        <td className="border px-2 py-1">{estado}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Aprobación */}
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleToggleSign}
                    className="w-4 h-4"
                  />
                  Marcar firma del Coordinador (aprobado)
                </label>
              </div>
            </>
          )}

          {/* ===================== GENERAL ===================== */}
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
                    <th className="border px-2 py-1">Unidad</th>
                    <th className="border px-2 py-1">Nivel</th>
                    <th className="border px-2 py-1">Puntaje</th>
                    <th className="border px-2 py-1">Puesto</th>
                    <th className="border px-2 py-1">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {data.list.map((c: any, idx: number) => {
                    const estado =
                      c.aprobado
                        ? "Aprobado"
                        : c.puesto === 1
                        ? "Medalla de Oro"
                        : c.puesto === 2
                        ? "Medalla de Plata"
                        : c.puesto === 3
                        ? "Medalla de Bronce"
                        : "-";

                    return (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{c.area}</td>
                        <td className="border px-2 py-1">{c.nombre}</td>
                        <td className="border px-2 py-1">{c.unidad}</td>
                        <td className="border px-2 py-1">{c.nivel}</td>
                        <td className="border px-2 py-1">{c.puntaje ?? "-"}</td>
                        <td className="border px-2 py-1">{c.puesto ?? "-"}</td>
                        <td className="border px-2 py-1">{estado}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}