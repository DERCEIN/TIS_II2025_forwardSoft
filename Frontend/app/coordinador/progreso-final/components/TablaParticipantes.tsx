"use client";
import React from "react";
import { Participante } from "../types"; // Importa el tipo compartido

type TablaParticipantesProps = {
  participantes: Participante[];
  onOpenChecklist: (p: Participante) => void;
};

export default function TablaParticipantes({ participantes, onOpenChecklist }: TablaParticipantesProps) {
  return (
    <div>
      <h2 className="text-xl font-heading text-[var(--color-primary)] mb-3">Lista de Participantes</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-[var(--border)] rounded-lg text-sm">
          <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Documento</th>
              <th className="p-2 text-left">Institución</th>
              <th className="p-2 text-left">Nivel</th>
              <th className="p-2 text-left">Evaluador</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Nota</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((p) => (
              <tr key={p.id} className="border-t hover:bg-[var(--card)] transition">
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.documento ?? "-"}</td>
                <td className="p-2">{p.institucion ?? "-"}</td>
                <td className="p-2">{p.nivel}</td>
                <td className="p-2">{p.evaluador ?? "-"}</td>
                <td className={`p-2 font-semibold ${
                    p.estado === "Clasificado" ? "text-[var(--color-chart-4)]" :
                    p.estado === "Descalificado" ? "text-[var(--destructive)]" :
                    "text-[var(--chart-2)]"
                  }`}>
                  {p.estado}
                </td>
                <td className="p-2">{p.nota ?? "-"}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => onOpenChecklist(p)}
                    className="text-[var(--secondary)] underline"
                  >
                    Ver checklist
                  </button>
                </td>
              </tr>
            ))}

            {participantes.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-[var(--muted-foreground)]">
                  No se encontraron registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}