"use client";
import React from "react";
import { Participante } from "../types"; // opcional, si quieres usar Participante para tipos

type FiltrosPanelProps = {
  nivelFilter: "" | "Primario" | "Secundario" | "Superior";
  setNivelFilter: React.Dispatch<React.SetStateAction<"" | "Primario" | "Secundario" | "Superior">>;
  estadoFilter: "" | string;
  setEstadoFilter: React.Dispatch<React.SetStateAction<"" | string>>;
};

export default function FiltrosPanel({
  nivelFilter,
  setNivelFilter,
  estadoFilter,
  setEstadoFilter,
}: FiltrosPanelProps) {
  return (
    <div className="flex flex-wrap gap-4 border-t border-[var(--border)] pt-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nivel:</label>
        <select
          value={nivelFilter}
          onChange={(e) => setNivelFilter(e.target.value as "Primario" | "Secundario" | "Superior" | "")}
          className="px-3 py-2 border rounded-md bg-[var(--background)]"
        >
          <option value="">Todos los niveles</option>
          <option value="Primario">Primario</option>
          <option value="Secundario">Secundario</option>
          <option value="Superior">Superior</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Estado:</label>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-[var(--background)]"
        >
          <option value="">Todos los estados</option>
          <option value="Clasificado">Clasificado</option>
          <option value="No clasificado">No clasificado</option>
          <option value="Descalificado">Descalificado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Evaluado">Evaluado</option>
        </select>
      </div>
    </div>
  );
}