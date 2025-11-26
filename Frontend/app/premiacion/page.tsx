"use client";

import React, { useEffect, useState } from "react";
import AreaList from "./components/AreaList";
import ConsolidationModal from "./components/ConsolidationModal";
import PreviewModal from "./components/PreviewModal";
import GeneralListView from "./components/GeneralListView";

/** Tipos */
type Competitor = {
  id: number;
  nombre: string;
  unidad: string;
  area: string;
  nivel: string;
  puntaje: number;
  estado: "aprobado" | "mencion" | "bronce" | "plata" | "oro" | "otro";
  puesto?: number | null;
};

type Area = {
  id: string;
  nombre: string;
  approved: boolean;
  competitors: Competitor[];
};

/** Áreas demo con competidores */
const demoAreas: Area[] = [
  {
    id: "matematica",
    nombre: "Matemática",
    approved: false,
    competitors: [
      { id: 1, nombre: "Ana Morales", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 62, estado: "aprobado" },
      { id: 2, nombre: "Pedro Gomez", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 68, estado: "bronce", puesto: 3  },
      { id: 3, nombre: "Rosa Huanca", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 90, estado: "oro", puesto: 1 },
      { id: 4, nombre: "Luis Faro", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 80, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "fisica",
    nombre: "Física",
    approved: false,
    competitors: [
      { id: 5, nombre: "Hugo Salazar", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 55, estado: "aprobado" },
      { id: 6, nombre: "Cecilia Rojas", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 66, estado: "bronce", puesto: 3  },
      { id: 7, nombre: "Diego Marin", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 88, estado: "plata", puesto: 2 },
      { id: 8, nombre: "Sara P.", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 95, estado: "oro", puesto: 1 },
    ],
  },
  {
    id: "quimica",
    nombre: "Química",
    approved: false,
    competitors: [
      { id: 9, nombre: "Laura Peña", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 70, estado: "aprobado" },
      { id: 10, nombre: "Mario Torres", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 65, estado: "aprobado" },
      { id: 11, nombre: "Paola Rivas", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 92, estado: "oro", puesto: 1 },
      { id: 12, nombre: "Jorge Díaz", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 82, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "biologia",
    nombre: "Biología",
    approved: false,
    competitors: [
      { id: 13, nombre: "Elena Soto", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 60, estado: "aprobado" },
      { id: 14, nombre: "Ricardo Núñez", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 72, estado: "aprobado" },
      { id: 15, nombre: "Valeria Cruz", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 91, estado: "oro", puesto: 1 },
      { id: 16, nombre: "Andrés Vega", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 78, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "informatica",
    nombre: "Informática",
    approved: false,
    competitors: [
      { id: 17, nombre: "Andrés Díaz", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 60, estado: "aprobado" },
      { id: 18, nombre: "Lucía Pérez", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 70, estado: "aprobado" },
      { id: 19, nombre: "Juan López", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 98, estado: "oro", puesto: 1 },
      { id: 20, nombre: "María Sol", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 85, estado: "plata", puesto: 2 },
      { id: 21, nombre: "Carlos Ruiz", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 72, estado: "bronce", puesto: 3 },
    ],
  },
  {
    id: "robotica",
    nombre: "Robótica",
    approved: false,
    competitors: [
      { id: 22, nombre: "Diego Paredes", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 63, estado: "aprobado" },
      { id: 23, nombre: "Sofía Blanco", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 67, estado: "aprobado" },
      { id: 24, nombre: "Bruno Ramos", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 89, estado: "oro", puesto: 1 },
      { id: 25, nombre: "Camila Soto", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 77, estado: "plata", puesto: 2 },
    ],
  },
];

export default function PremiacionPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [showConsolidation, setShowConsolidation] = useState(false);
  const [showPreview, setShowPreview] = useState<{ type: "area" | "general"; payload?: any } | null>(null);
  const [consolidatedList, setConsolidatedList] = useState<Competitor[] | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  useEffect(() => {
    setAreas(demoAreas);
    setSelectedAreaId(demoAreas[0].id);
  }, []);

  // Actualiza aprobación de un área
  function updateAreaApproved(areaId: string, approved: boolean) {
    setAreas(prev => prev.map(a => (a.id === areaId ? { ...a, approved } : a)));
  }

  // Abrir previsualización de un área
  function openAreaPreview(areaId: string) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    const listForPreview = [...area.competitors].sort((x, y) => x.nombre.localeCompare(y.nombre));

    setShowPreview({
      type: "area",
      payload: { area, list: listForPreview },
    });
  }

  // Consolidar listas
  function openConsolidationModal() {
    const notApproved = areas.filter(a => !a.approved);
    if (notApproved.length > 0) {
      alert("Faltan aprobar las siguientes áreas: " + notApproved.map(a => a.nombre).join(", "));
      return;
    }
    setOrder(areas.map(a => a.id));
    setShowConsolidation(true);
  }

  function consolidate(finalOrder: string[]) {
    const sections: Competitor[] = [];
    const getArea = (id: string) => areas.find(a => a.id === id)!;

    const estados: Competitor["estado"][] = ["aprobado", "bronce", "plata", "oro"];
    estados.forEach(estado => {
      for (const areaId of finalOrder) {
        const area = getArea(areaId);
        const filtered = area.competitors
          .filter(c => c.estado === estado)
          .sort((a, b) =>
            ["bronce", "plata", "oro"].includes(estado)
              ? b.puntaje - a.puntaje
              : a.nombre.localeCompare(b.nombre)
          );
        sections.push(...filtered);
      }
    });

    setConsolidatedList(sections);
    setOrder(finalOrder);
    setShowConsolidation(false);

    setShowPreview({
      type: "general",
      payload: { list: sections, order: finalOrder },
    });
  }

  function handleGeneratePdfFromPreview(payload: any) {
    const html = buildPrintableHtml(payload);
    const w = window.open("", "_blank");
    if (!w) {
      alert("Habilita ventanas emergentes.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  function buildPrintableHtml(preview: any) {
    const logoUrl = "/logo.png";
    const styles = `
      <style>
        body{ font-family: Arial; color:#000; padding:20px; }
        header{ display:flex; align-items:center; gap:12px; border-bottom:1px solid #ddd; padding-bottom:10px; margin-bottom:14px; }
        header img{ height:56px; }
        h1{ font-size:20px; margin:0; text-align:center; }
        table{ width:100%; border-collapse:collapse; margin-top:12px; }
        th, td{ border:1px solid #ddd; padding:8px; font-size:13px; }
        th{ background:#f4f4f4; }
        .section-title{ font-weight:700; margin-top:18px; }
      </style>
    `;

    if (preview.type === "area") {
      const area = preview.payload.area as Area;
      const rows = preview.payload.list.map((c: Competitor) => `<tr>
        <td>${c.nombre}</td>
        <td>${c.unidad}</td>
        <td>${c.nivel}</td>
        <td>${c.puntaje}</td>
        <td>${c.puesto ?? "-"}</td>
        <td>${c.estado}</td>
      </tr>`).join("");

      return `<html><head><meta charset="utf-8">${styles}</head><body>
        <header><img src="${logoUrl}" /><div style="flex:1"><h1>LISTA DE PREMIADOS — ${area.nombre}</h1></div></header>
        <table><thead><tr><th>Nombre</th><th>Nivel</th><th>Puntaje</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    }

    if (preview.type === "general") {
      const list: Competitor[] = preview.payload.list || [];
      const section = (title: string, arr: Competitor[]) =>
        arr.length
          ? `<div class="section-title">${title}</div><table>
              <thead><tr><th>Área</th><th>Competidor</th><th>Puntaje</th><th>Estado</th></tr></thead>
              <tbody>${arr.map(c => `<tr><td>${c.area}</td><td>${c.nombre}</td><td>${c.puntaje}</td><td>${c.estado}</td></tr>`).join("")}</tbody>
            </table>` : "";

      const categorias: Competitor["estado"][] = ["aprobado", "bronce", "plata", "oro"];
      const nombresCategorias = ["Competidores aprobados", "Medalla de bronce", "Medalla de plata", "Medalla de oro"];
      const sectionsHtml = categorias.map((cat, i) => section(nombresCategorias[i], list.filter(c => c.estado === cat))).join("");

      return `<html><head><meta charset="utf-8">${styles}</head><body>
        <header><img src="${logoUrl}" /><div style="flex:1"><h1>LISTA GENERAL DE PREMIADOS</h1></div></header>
        ${sectionsHtml}
      </body></html>`;
    }

    return "<html><body>Error</body></html>";
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">

      {/* Título de la historia de usuario */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        Gestión de Premiación de Competidores
      </h1>
      <p className="text-center text-sm text-gray-600 mb-4">
          Generar listas de competidores premiados para la ceremonia de premiación.
      </p>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Áreas */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Selecciona un área</h2>
{/*
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={`px-4 py-2 rounded-xl border font-medium transition
                  ${area.approved
                    ? "bg-purple-600 text-white border-purple-600"
                    : selectedAreaId === area.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {area.nombre}
              </button>
            ))}
          </div>
*/}
          <div className="mb-4">
            <AreaList
              areas={areas}
              selectedAreaId={selectedAreaId}
              onSelect={(id) => setSelectedAreaId(id)}
              onOpenPreview={(id) => openAreaPreview(id)}
              onToggleApproved={(id, approved) => updateAreaApproved(id, approved)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => selectedAreaId && openAreaPreview(selectedAreaId)}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 font-medium"
            >
              Previsualizar área
            </button>

            <button
              onClick={openConsolidationModal}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              Consolidar Listas
            </button>
          </div>
        </div>

        {/* Lista general */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Lista General</h2>

          <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px]">
            {!consolidatedList && (
              <p className="text-sm text-gray-500">
                Aún no hay lista consolidada.
              </p>
            )}

            <GeneralListView
              consolidated={consolidatedList}
              onPreview={() => {
                if (!consolidatedList) {
                  alert("No hay lista consolidada.");
                  return;
                }
                setShowPreview({ type: "general", payload: { list: consolidatedList } });
              }}
              onGeneratePdf={() => {
                if (!consolidatedList) {
                  alert("No hay lista consolidada.");
                  return;
                }
                handleGeneratePdfFromPreview({ type: "general", payload: { list: consolidatedList } });
              }}
            />
          </div>
        </div>

      </div>

      <ConsolidationModal
        open={showConsolidation}
        areas={areas}
        order={order || []}
        onClose={() => setShowConsolidation(false)}
        onConsolidate={finalOrder => consolidate(finalOrder)}
      />

      <PreviewModal
        open={!!showPreview}
        data={showPreview?.payload}
        type={showPreview?.type}
        onClose={() => setShowPreview(null)}
        onGeneratePdf={payload =>
          handleGeneratePdfFromPreview({
            type: showPreview?.type,
            payload,
          })
        }
        onToggleApproved={updateAreaApproved} // <--- clave para que guarde aprobación
      />
    </div>
  );
}