"use client";

import React, { useState, useEffect } from "react";

type Competidor = {
  id: number;
  nombre: string;
  unidad: string;
  area: string;
  nivel: string;
  estado: string;
};

const data: Competidor[] = [
  { id: 1, nombre: "Juan Pérez", unidad: "Colegio X", area: "Fisica", nivel: "5to", estado: "clasificado" },
  { id: 2, nombre: "María Gómez", unidad: "Colegio Y", area: "Quimica", nivel: "4to", estado: "no-clasificado" },
  { id: 3, nombre: "Pedro Díaz", unidad: "Colegio Z", area: "Matematica", nivel: "6to", estado: "desclasificado" },
  { id: 4, nombre: "Ana Torres", unidad: "Unidad A", area: "Fisica", nivel: "5to", estado: "clasificado" },
  { id: 5, nombre: "Luis Rojas", unidad: "Colegio B", area: "Quimica", nivel: "4to", estado: "clasificado" },
  { id: 6, nombre: "Carla Méndez", unidad: "Colegio C", area: "Matematica", nivel: "6to", estado: "no-clasificado" },
  { id: 7, nombre: "Diego Flores", unidad: "Unidad D", area: "Fisica", nivel: "5to", estado: "clasificado" },
  { id: 8, nombre: "Sofía Cruz", unidad: "Colegio E", area: "Quimica", nivel: "4to", estado: "desclasificado" },
  { id: 9, nombre: "Iván Marín", unidad: "Colegio F", area: "Matematica", nivel: "6to", estado: "clasificado" },
  { id: 10, nombre: "Carolina Paz", unidad: "Unidad G", area: "Fisica", nivel: "4to", estado: "no-clasificado" },
];

export default function CompetidoresPage() {
  const [competidores, setCompetidores] = useState<Competidor[]>(data);
  const [filtroArea, setFiltroArea] = useState("all");
  const [filtroNivel, setFiltroNivel] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const pageSize = 5;

  useEffect(() => {
    let filtrados = data.filter((r) => {
      if (filtroArea !== "all" && r.area !== filtroArea) return false;
      if (filtroNivel !== "all" && r.nivel !== filtroNivel) return false;
      if (filtroEstado !== "all" && r.estado !== filtroEstado) return false;

      if (busqueda) {
        const hay = (r.nombre + " " + r.unidad + " " + r.area).toLowerCase();
        return hay.includes(busqueda.toLowerCase());
      }
      return true;
    });
    setCompetidores(filtrados);
    setPagina(1);
  }, [filtroArea, filtroNivel, filtroEstado, busqueda]);

  const totalPages = Math.ceil(competidores.length / pageSize);
  const startIndex = (pagina - 1) * pageSize;
  const pageItems = competidores.slice(startIndex, startIndex + pageSize);

  const badgeFor = (estado: string) => {
    if (estado === "clasificado")
      return <span className="badge success">Clasificado</span>;
    if (estado === "no-clasificado")
      return <span className="badge danger">No clasificado</span>;
    return <span className="badge neutral">Desclasificado</span>;
  };

  return (
    <div style={{ padding: "32px" }}>
      <h1>Competidores</h1>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="select">
            <option value="all">Todas las áreas</option>
            <option value="Fisica">Física</option>
            <option value="Quimica">Química</option>
            <option value="Matematica">Matemática</option>
          </select>

          <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} className="select">
            <option value="all">Todos los niveles</option>
            <option value="4to">4to</option>
            <option value="5to">5to</option>
            <option value="6to">6to</option>
          </select>

          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="select">
            <option value="all">Todos los estados</option>
            <option value="clasificado">Clasificado</option>
            <option value="no-clasificado">No clasificado</option>
            <option value="desclasificado">Desclasificado</option>
          </select>

          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search"
          />
        </div>

        {/* Tabla */}
        <div style={{ overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Unidad Educativa</th>
                <th>Área</th>
                <th>Nivel</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td style={{ fontWeight: "600" }}>{c.nombre}</td>
                  <td>{c.unidad}</td>
                  <td>{c.area}</td>
                  <td>{c.nivel}</td>
                  <td>{badgeFor(c.estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination">
          {pagina > 1 && (
            <button onClick={() => setPagina(pagina - 1)} className="page-item">
              Anterior
            </button>
          )}
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPagina(i + 1)}
              className={`page-item ${pagina === i + 1 ? "current" : ""}`}
            >
              {i + 1}
            </button>
          ))}
          {pagina < totalPages && (
            <button onClick={() => setPagina(pagina + 1)} className="page-item">
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
