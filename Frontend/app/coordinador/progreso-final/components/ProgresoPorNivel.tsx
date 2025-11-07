"use client";
import React from "react";
import { Participante } from "../types";

type ProgresoPorNivelProps = {
  participantes: Participante[];
  setNivelFilter: React.Dispatch<React.SetStateAction<"" | "Primario" | "Secundario" | "Superior">>;
};

export default function ProgresoPorNivel({ participantes, setNivelFilter }: ProgresoPorNivelProps) {
  // Array de niveles como tipo literal para evitar casts
  const nivelesLiteral: ("Primario" | "Secundario" | "Superior")[] = ["Primario", "Secundario", "Superior"];

  // Calcula estadísticas de cada nivel
  const niveles = nivelesLiteral.map((nivel) => {
    const participantesNivel = participantes.filter(p => p.nivel === nivel);
    const evaluados = participantesNivel.filter(p => p.estado !== "Pendiente").length;
    const total = participantesNivel.length;
    const completado = total > 0 ? Math.round((evaluados / total) * 100) : 0;
    return { nombre: nivel, completado, evaluados, total };
  });

  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-2">Progreso por Nivel</h2>
      {niveles.map((nivel, i) => (
        <div key={i} className="mb-3">
          <p>
            <button
              className="underline text-blue-600"
              onClick={() => setNivelFilter(nivel.nombre)}
            >
              {nivel.nombre}
            </button>: {nivel.completado}% ({nivel.evaluados}/{nivel.total})
          </p>
          <div className="w-full bg-gray-200 h-3 rounded">
            <div
              className="h-3 rounded bg-gray-800"
              style={{ width: `${nivel.completado}%` }}
            ></div>
          </div>
        </div>
      ))}
    </section>
  );
}