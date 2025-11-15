"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // <-- Para leer query params
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AREAS = [
  "Informática",
  "Robótica",
  "Matemáticas",
  "Física",
  "Química",
  "Biología",
];

const DEPARTAMENTOS = [
  "Cochabamba",
  "La Paz",
  "Santa Cruz",
  "Chuquisaca",
  "Tarija",
  "Oruro",
  "Potosí",
  "Beni",
  "Pando",
];

const DATA = [
  { nombre: "Juan Pérez", nivel: "Primaria", departamento: "Cochabamba", unidad: "Simón Bolívar", calificacion: 89, puesto: 1, area: "Informática" },
  { nombre: "Lucía Méndez", nivel: "Secundaria", departamento: "La Paz", unidad: "San Agustín", calificacion: 85, puesto: 2, area: "Informática" },
  { nombre: "Carlos Ríos", nivel: "Primaria", departamento: "Santa Cruz", unidad: "Don Bosco", calificacion: 92, puesto: 1, area: "Robótica" },
  { nombre: "Ana Torres", nivel: "Secundaria", departamento: "Cochabamba", unidad: "Tupac Katari", calificacion: 78, puesto: 4, area: "Matemáticas" },
  { nombre: "Diego Gómez", nivel: "Primaria", departamento: "La Paz", unidad: "Santa María", calificacion: 74, puesto: 5, area: "Física" },
];

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ nivel: "", departamento: "", unidad: "", puesto: "" });
  const [search, setSearch] = useState("");
  const [publishedAreas, setPublishedAreas] = useState<Record<string, boolean>>({});

  // Selección automática de área según query param
  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam && AREAS.includes(areaParam)) {
      setAreaSeleccionada(areaParam);
    }
  }, [searchParams]);

  const dataFiltrada = useMemo(() => {
    return DATA.filter((item) => {
      if (areaSeleccionada && item.area !== areaSeleccionada) return false;
      if (filtros.nivel && item.nivel !== filtros.nivel) return false;
      if (filtros.departamento && item.departamento !== filtros.departamento) return false;
      if (filtros.unidad && filtros.unidad !== "" && item.unidad !== filtros.unidad) return false;
      if (filtros.puesto && filtros.puesto !== "" && item.puesto.toString() !== filtros.puesto) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.nombre.toLowerCase().includes(q) ||
          item.unidad.toLowerCase().includes(q) ||
          (item.departamento && item.departamento.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [areaSeleccionada, filtros, search]);

  // -----------------------
  // EXPORTAR PDF
  // -----------------------
  function handleExportPDF() {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25.4; // 1 pulgada

    // Título alineado a la izquierda
    doc.setFontSize(12);
    doc.text("Olimpiada Oh! SanSi", margin, margin);
    doc.setFontSize(16);
    doc.text("Resultados - Fase Clasificatoria", margin, margin + 7);
    if (areaSeleccionada) {
        doc.setFontSize(12);
        doc.text(`Área: ${areaSeleccionada}`, margin, margin + 14);
    }

    // Preparar la tabla
    const columns = ["Nombre", "Nivel", "Departamento", "Unidad Educativa", "Calificación", "Puesto"];
    const rows = dataFiltrada.map((r) => [
        r.nombre,
        r.nivel,
        r.departamento,
        r.unidad,
        r.calificacion,
        r.puesto,
    ]);

    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: margin + 20, // debajo del título
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        theme: "grid",
        tableWidth: pageWidth - margin * 2,
    });

    const filename = `Resultados_${(areaSeleccionada ?? "Todas").replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-sm text-[var(--muted-foreground)]">Olimpiada Oh! SanSi</div>
          <h1 className="text-3xl font-heading font-bold text-[var(--color-primary)]">Resultados - Fase Clasificatoria</h1>
          <div className="text-sm text-[var(--muted-foreground)] mt-1">
            {areaSeleccionada ? `Área: ${areaSeleccionada}` : "Área: Todas"}
            {" "}
            {areaSeleccionada && publishedAreas[areaSeleccionada] && (
              <span className="ml-3 inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Publicado</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <input
            placeholder="Buscar por nombre / unidad / departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md w-64"
          />

          <button onClick={handleExportPDF} className="px-4 py-2 rounded bg-[var(--secondary)] text-white font-semibold hover:opacity-95">
            Exportar PDF
          </button>
        </div>
      </div>

      {/* AREAS */}
      <div className="bg-[var(--card)] rounded-xl p-4 shadow mb-6">
        <div className="text-sm text-[var(--muted-foreground)] mb-2">Selecciona un área</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setAreaSeleccionada(a === areaSeleccionada ? null : a)}
              className={`px-3 py-2 rounded-lg font-medium border transition ${
                a === areaSeleccionada
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE TABLA */}
      <div id="pdf-area">
        {/* FILTROS */}
        <div className="bg-[var(--card)] rounded-xl p-4 shadow mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Nivel</label>
            <select className="px-3 py-2 border rounded-md" value={filtros.nivel} onChange={(e) => setFiltros({ ...filtros, nivel: e.target.value })}>
              <option value="">Todos</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Departamento</label>
            <select className="px-3 py-2 border rounded-md" value={filtros.departamento} onChange={(e) => setFiltros({ ...filtros, departamento: e.target.value })}>
              <option value="">Todos</option>
              {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Unidad Educativa</label>
            <select className="px-3 py-2 border rounded-md" value={filtros.unidad} onChange={(e) => setFiltros({ ...filtros, unidad: e.target.value })}>
              <option value="">Todas</option>
              {[...new Set(DATA.map(d => d.unidad))].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Puesto</label>
            <select className="px-3 py-2 border rounded-md w-28" value={filtros.puesto} onChange={(e) => setFiltros({ ...filtros, puesto: e.target.value })}>
              <option value="">Todos</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-[var(--muted-foreground)]">
            Resultados: <strong>{dataFiltrada.length}</strong>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl p-3 shadow">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left border-b">Nombre</th>
                <th className="p-2 text-left border-b">Nivel</th>
                <th className="p-2 text-left border-b">Departamento</th>
                <th className="p-2 text-left border-b">Unidad Educativa</th>
                <th className="p-2 text-left border-b">Calificación</th>
                <th className="p-2 text-left border-b">Puesto</th>
              </tr>
            </thead>
            <tbody>
              {dataFiltrada.map((r, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="p-2 border-b">{r.nombre}</td>
                  <td className="p-2 border-b">{r.nivel}</td>
                  <td className="p-2 border-b">{r.departamento}</td>
                  <td className="p-2 border-b">{r.unidad}</td>
                  <td className="p-2 border-b">{r.calificacion}</td>
                  <td className="p-2 border-b">{r.puesto}</td>
                </tr>
              ))}
              {dataFiltrada.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[var(--muted-foreground)]">
                    No existen resultados para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}