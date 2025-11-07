"use client";
import React, { useEffect, useMemo, useState } from "react";
import "./style.css";
import ProgresoPorNivel from "./components/ProgresoPorNivel";
import EvaluadoresActivos from "./components/EvaluadoresActivos";
import TablaParticipantes from "./components/TablaParticipantes";
import ChecklistDescalificacion from "./components/ChecklistDescalificacion";
import FiltrosPanel from "./components/FiltrosPanel";
import { Participante } from "./types";

/*type Participante = {
  id: string;
  nombre: string;
  documento?: string;
  institucion?: string;
  area?: string;
  nivel: string;
  nota?: number | null;
  estado: "Clasificado" | "No clasificado" | "Descalificado" | "Pendiente" | "Evaluado";
  motivos?: string[];
  comentario?: string;
  evaluador?: string;
  fechaRegistro?: string;
};*/

const seedParticipantes: Participante[] = [
  { id: "p1", nombre: "Juan Pérez", documento: "12345678", institucion: "Colegio San José", area: "Matemáticas", nivel: "Primario", nota: 10, estado: "Clasificado", evaluador: "E1", fechaRegistro: "2025-10-20" },
  { id: "p2", nombre: "Pablo García", documento: "87654321", institucion: "Colegio Nacional", area: "Matemáticas", nivel: "Primario", nota: 8, estado: "No clasificado", evaluador: "E2", fechaRegistro: "2025-10-21" },
  { id: "p3", nombre: "Laura Fernández", documento: "22223333", institucion: "Liceo Central", area: "Química", nivel: "Secundario", nota: 6, estado: "Descalificado", motivos: ["Plagio detectado"], comentario: "Plagio confirmado", evaluador: "E3", fechaRegistro: "2025-10-19" },
  { id: "p4", nombre: "Ana López", documento: "44445555", institucion: "Colegio Norte", area: "Física", nivel: "Superior", nota: 7, estado: "Evaluado", evaluador: "E4", fechaRegistro: "2025-10-22" },
];

export default function Page() {
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>("");
  const [participantes, setParticipantes] = useState<Participante[]>(seedParticipantes);
  const [search, setSearch] = useState("");
  const [nivelFilter, setNivelFilter] = useState<"" | "Primario" | "Secundario" | "Superior">("");
  const [estadoFilter, setEstadoFilter] = useState<"" | string>("");
  const [selected, setSelected] = useState<Participante | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const update = () => setUltimaActualizacion(new Date().toLocaleString());
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return participantes.filter((p) => {
      if (nivelFilter && p.nivel !== nivelFilter) return false;
      if (estadoFilter && p.estado !== estadoFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.documento && p.documento.toLowerCase().includes(q)) ||
        (p.institucion && p.institucion.toLowerCase().includes(q))
      );
    });
  }, [participantes, search, nivelFilter, estadoFilter]);

  function handleOpenChecklist(p: Participante) {
    setSelected(p);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setSelected(null);
  }

  function handleSaveChecklist(id: string, motivos: string[], comentario: string) {
    setParticipantes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, motivos, comentario, estado: motivos.length ? "Descalificado" : p.estado } : p))
    );
    handleClose();
  }

  function handleExport() {
    alert("Exportar reporte: aquí se implementará la lógica para generar el reporte (CSV/XLSX).");
  }

  function handleNotify() {
    alert("Notificar: se implementará el envío de notificaciones a los responsables.");
  }

  function handleActualizar() {
    setSearch("");
    setNivelFilter("");
    setEstadoFilter("");
    setUltimaActualizacion(new Date().toLocaleString());
    alert("Filtros reiniciados y hora actualizada.");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6 space-y-6">
      {/* Encabezado */}
      <div className="border-b border-[var(--border)] pb-3">
        <div className="text-sm text-[var(--muted-foreground)]">
          Olimpiada Oh! SanSi &gt; Evaluaciones &gt; Fase Final &gt; Progreso de Evaluación
        </div>
        <h1 className="text-3xl font-heading font-bold text-[var(--color-primary)] mt-2">
          Progreso de Evaluación Final
        </h1>
        <div className="text-sm text-[var(--muted-foreground)] mt-1">
          {ultimaActualizacion
            ? `Última actualización: ${ultimaActualizacion}`
            : "Cargando hora..."}
        </div>
      </div>

      {/* Progreso + Evaluadores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-[var(--card)] rounded-xl p-4 shadow">
          <ProgresoPorNivel participantes={participantes} setNivelFilter={setNivelFilter} />
        </div>
        <div className="bg-[var(--card)] rounded-xl p-4 shadow">
          <EvaluadoresActivos />
        </div>
      </div>

      {/* Buscador principal */}
      <div className="bg-[var(--card)] rounded-xl p-4 shadow flex flex-col md:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, documento o institución..."
          className="w-full md:w-1/2 px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn boton-secundario" onClick={handleActualizar}>
          Actualizar
        </button>
      </div>

      {/* Tabla con filtros debajo */}
      <div className="bg-[var(--card)] rounded-xl p-4 shadow space-y-4">
        <TablaParticipantes participantes={filtered} onOpenChecklist={handleOpenChecklist} />

        {/* Filtros por nivel y estado */}
        <FiltrosPanel
          nivelFilter={nivelFilter}
          setNivelFilter={setNivelFilter}
          estadoFilter={estadoFilter}
          setEstadoFilter={setEstadoFilter}
        />
      </div>

      {/* Botones finales */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button className="btn boton-primario" onClick={handleExport}>
          Exportar Reporte
        </button>
        <button className="btn boton-primario" onClick={handleNotify}>
          Notificar Responsables
        </button>
      </div>

      {/* Modal checklist */}
      {showModal && selected && (
        <ChecklistDescalificacion
          participante={selected}
          onClose={handleClose}
          onSave={handleSaveChecklist}
        />
      )}
    </main>
  );
}