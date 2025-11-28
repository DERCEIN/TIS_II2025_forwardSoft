"use client";

import React from "react";
import { Area } from "../utils/certificateGenerator";

export default function AreaList({
  areas,
  selectedAreaId,
  onSelect,
  onOpenPreview,
  onToggleApproved,
}: {
  areas: Area[];
  selectedAreaId: string | null;
  onSelect: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onToggleApproved: (id: string, approved: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {areas.map((a) => {
        // estilo según estado
        const isSelected = selectedAreaId === a.id;
        const isApproved = a.approved;

        let bg = "bg-white text-gray-800 border-gray-300"; // default
        if (isApproved) bg = "bg-purple-600 text-white border-purple-700";
        else if (isSelected) bg = "bg-blue-600 text-white border-blue-700";

        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`w-full p-4 rounded-xl border font-semibold shadow-sm transition-all hover:scale-[1.02] ${bg}`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg">{a.nombre}</span>

              <span className="text-xs opacity-80 mt-1">
                {a.competitors.length} competidores
              </span>

              {/* Botón de aprobar / preview */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview(a.id);
                  }}
                  className="px-2 py-1 text-xs rounded bg-white/20 border border-white/30 hover:bg-white/30"
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleApproved(a.id, !a.approved);
                  }}
                  className="px-2 py-1 text-xs rounded bg-white/20 border border-white/30 hover:bg-white/30"
                >
                  {a.approved ? "Aprobado" : "Aprobar"}
                </button>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}