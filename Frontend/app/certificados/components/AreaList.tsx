"use client";

import React from "react";
import { Area } from "../utils/certificateGenerator";

export default function AreaList({
  areas,
  selectedAreaId,
  onSelect,
  onOpenPreview,
  onToggleApproved,
  canToggleApproval = true,
}: {
  areas: Area[];
  selectedAreaId: string | null;
  onSelect: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onToggleApproved: (id: string, approved: boolean) => void;
  canToggleApproval?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {areas.map((a) => {
        const isSelected = selectedAreaId === a.id;
        const isApproved = a.approved;
        const finalClosed = a.finalClosed ?? true;

        let bg = "bg-white text-gray-800 border-gray-300";
        if (isApproved && finalClosed) bg = "bg-purple-600 text-white border-purple-700";
        else if (isSelected) bg = "bg-blue-600 text-white border-blue-700";

        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`w-full p-4 rounded-xl border font-semibold shadow-sm transition-all hover:scale-[1.02] ${bg}`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-lg">{a.nombre}</span>

              <span className="text-xs opacity-80 mt-1">
                {a.competitors.length} competidores
              </span>

              {!finalClosed && (
                <span className="text-[11px] mt-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                  Fase final pendiente
                </span>
              )}

              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview(a.id);
                  }}
                  className="px-2 py-1 text-xs rounded bg-white/20 border border-white/30 hover:bg-white/30"
                >
                  👁️ Preview
                </button>

                {canToggleApproval ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleApproved(a.id, !a.approved);
                    }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      a.approved 
                        ? "bg-green-500/30 border-green-400/50 text-white font-semibold" 
                        : "bg-white/20 border-white/30 hover:bg-white/30"
                    }`}
                    title={
                      a.approved
                        ? "✓ Área aprobada - El administrador puede generar certificados"
                        : "Aprobar lista de participantes para que el administrador genere certificados"
                    }
                  >
                    {a.approved ? "✓ Aprobado" : "✓ Aprobar"}
                  </button>
                ) : (
                  <div className="flex flex-col text-[11px] gap-1">
                    <span
                      className={`px-2 py-0.5 rounded border font-semibold ${
                        a.approved
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700"
                      }`}
                    >
                      {a.approved ? "Aprobada" : "Pendiente"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border font-semibold ${
                        finalClosed
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-orange-50 border-orange-300 text-orange-700"
                      }`}
                    >
                      {finalClosed ? "Fase cerrada" : "Fase no cerrada"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
