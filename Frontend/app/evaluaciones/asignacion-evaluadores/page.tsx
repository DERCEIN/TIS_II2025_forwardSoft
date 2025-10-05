"use client";

import { useState } from "react";

export default function AsignacionEvaluadores() {
  const [area, setArea] = useState("");
  const [ronda, setRonda] = useState("");
  const [numEval, setNumEval] = useState<number | "">("");
  const [metodo, setMetodo] = useState("");
  const [restricciones, setRestricciones] = useState({
    mismaInstitucion: false,
    mismaArea: false,
  });
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [error, setError] = useState("");

  const areas = ["Matemática", "Física", "Robótica", "Química"];
  const rondas = ["Primera", "Segunda", "Final"];

  const generarAsignacion = () => {
    if (!area || !ronda || !numEval || !metodo) {
      setError("Por favor completa todos los campos obligatorios antes de continuar.");
      return;
    }
    setError("");
    // Simulación de asignación aleatoria
    setAsignaciones([
      {
        competidor: "Juan Pérez",
        area: "Matemática",
        evaluadores: "Lic. Morales, Lic. Tomás",
        observaciones: "Sin observación",
      },
      {
        competidor: "Jhosimar Torrico",
        area: "Robótica",
        evaluadores: "Ing. Boris Calancha",
        observaciones: "Sin observación",
      },
    ]);
  };

  const exportarExcel = () => {
    alert("Exportando a Excel (simulado)");
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0B2440] px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 border border-[#E6EDF5]">
        <h1 className="text-3xl font-bold mb-6 text-[#0B2440]">
          Asignación Aleatoria de Evaluadores
        </h1>

        {/* DATOS GENERALES */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Datos Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Área del conocimiento</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">Seleccione un área</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Ronda / Fase</label>
              <select
                value={ronda}
                onChange={(e) => setRonda(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">Seleccione la ronda</option>
                {rondas.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* PARÁMETROS */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Parámetros de Asignación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">
                Número de evaluadores por competidor
              </label>
              <input
                type="number"
                value={numEval}
                onChange={(e) => setNumEval(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Método de asignación</label>
              <div className="flex flex-col gap-2">
                <label>
                  <input
                    type="radio"
                    name="metodo"
                    value="aleatorio"
                    checked={metodo === "aleatorio"}
                    onChange={(e) => setMetodo(e.target.value)}
                    className="mr-2"
                  />
                  Aleatorio simple
                </label>
                <label>
                  <input
                    type="radio"
                    name="metodo"
                    value="balanceado"
                    checked={metodo === "balanceado"}
                    onChange={(e) => setMetodo(e.target.value)}
                    className="mr-2"
                  />
                  Balanceado por área
                </label>
              </div>
            </div>
          </div>

          {/* Restricciones */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Restricciones</h3>
            <label className="block">
              <input
                type="checkbox"
                checked={restricciones.mismaInstitucion}
                onChange={(e) =>
                  setRestricciones({
                    ...restricciones,
                    mismaInstitucion: e.target.checked,
                  })
                }
                className="mr-2"
              />
              Evitar evaluador de la misma institución
            </label>
            <label className="block mt-1">
              <input
                type="checkbox"
                checked={restricciones.mismaArea}
                onChange={(e) =>
                  setRestricciones({
                    ...restricciones,
                    mismaArea: e.target.checked,
                  })
                }
                className="mr-2"
              />
              Evitar evaluador de la misma área
            </label>
          </div>
        </section>

        {error && <p className="text-[#E63946] font-medium mb-4">{error}</p>}

        {/* Botones */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={generarAsignacion}
            className="bg-[#E63946] hover:bg-[#B92A33] text-white font-semibold px-5 py-2 rounded-lg"
          >
            Generar asignación
          </button>
          <button className="border border-[#E63946] text-[#E63946] font-semibold px-5 py-2 rounded-lg hover:bg-[#F1F6F9]">
            Previsualizar resultados
          </button>
          <button
            onClick={exportarExcel}
            className="border border-[#A8DADC] text-[#0B2440] font-semibold px-5 py-2 rounded-lg hover:bg-[#F1F6F9]"
          >
            Exportar asignación (Excel)
          </button>
        </div>

        {/* RESULTADOS */}
        {asignaciones.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg text-sm">
              <thead className="bg-[#F1F6F9]">
                <tr>
                  <th className="p-3 text-left">Competidor</th>
                  <th className="p-3 text-left">Área</th>
                  <th className="p-3 text-left">Evaluador(es)</th>
                  <th className="p-3 text-left">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{a.competidor}</td>
                    <td className="p-3">{a.area}</td>
                    <td className="p-3">{a.evaluadores}</td>
                    <td className="p-3">{a.observaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
