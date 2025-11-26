"use client";

import React, { useEffect, useState } from "react";
import AreaList from "./components/AreaList";
import PreviewModal from "./components/PreviewModal";
import CertificateModal from "./components/CertificateModal";
import { Competitor, Area } from "./utils/certificateGenerator";

/** Demo data (usa tus datos reales en producción) */
const demoAreas: Area[] = [
  {
    id: "matematica",
    nombre: "Matemática",
    approved: false,
    competitors: [
      { id: 1, nombre: "Ana Morales", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 62, estado: "aprobado", puesto: undefined },
      { id: 2, nombre: "Pedro Gomez", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 68, estado: "mencion", puesto: undefined },
      { id: 3, nombre: "Rosa Huanca", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 90, estado: "oro", puesto: 1 },
      { id: 4, nombre: "Luis Faro", unidad: "Colegio B", area: "Matemática", nivel: "Superior", puntaje: 80, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "fisica",
    nombre: "Física",
    approved: false,
    competitors: [
      { id: 5, nombre: "Hugo Salazar", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 55, estado: "aprobado", puesto: undefined },
      { id: 6, nombre: "Cecilia Rojas", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 66, estado: "mencion", puesto: undefined },
      { id: 7, nombre: "Diego Marin", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 88, estado: "plata", puesto: 2 },
      { id: 8, nombre: "Sara P.", unidad: "Colegio C", area: "Física", nivel: "Superior", puntaje: 95, estado: "oro", puesto: 1 },
    ],
  },
  {
    id: "quimica",
    nombre: "Química",
    approved: false,
    competitors: [
      { id: 9, nombre: "Laura Peña", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 70, estado: "aprobado", puesto: undefined },
      { id: 10, nombre: "Mario Torres", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 65, estado: "mencion", puesto: undefined },
      { id: 11, nombre: "Paola Rivas", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 92, estado: "oro", puesto: 1 },
      { id: 12, nombre: "Jorge Díaz", unidad: "Colegio D", area: "Química", nivel: "Superior", puntaje: 82, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "biologia",
    nombre: "Biología",
    approved: false,
    competitors: [
      { id: 13, nombre: "Elena Soto", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 60, estado: "aprobado", puesto: undefined },
      { id: 14, nombre: "Ricardo Núñez", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 72, estado: "mencion", puesto: undefined },
      { id: 15, nombre: "Valeria Cruz", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 91, estado: "oro", puesto: 1 },
      { id: 16, nombre: "Andrés Vega", unidad: "Colegio E", area: "Biología", nivel: "Superior", puntaje: 78, estado: "plata", puesto: 2 },
    ],
  },
  {
    id: "informatica",
    nombre: "Informática",
    approved: false,
    competitors: [
      { id: 17, nombre: "Andrés Díaz", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 60, estado: "aprobado", puesto: undefined },
      { id: 18, nombre: "Lucía Pérez", unidad: "Colegio A", area: "Informática", nivel: "Superior", puntaje: 70, estado: "mencion", puesto: undefined },
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
      { id: 22, nombre: "Diego Paredes", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 63, estado: "aprobado", puesto: undefined },
      { id: 23, nombre: "Sofía Blanco", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 67, estado: "mencion", puesto: undefined },
      { id: 24, nombre: "Bruno Ramos", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 89, estado: "oro", puesto: 1 },
      { id: 25, nombre: "Camila Soto", unidad: "Colegio F", area: "Robótica", nivel: "Superior", puntaje: 77, estado: "plata", puesto: 2 },
    ],
  },
];

export default function PremiacionPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<{ type: "area" | "general"; payload?: any } | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [gestion] = useState("2025");

  useEffect(() => {
    setAreas(demoAreas);
    setSelectedAreaId(demoAreas[0].id);
  }, []);

  function updateAreaApproved(areaId: string, approved: boolean) {
    setAreas(prev => prev.map(a => (a.id === areaId ? { ...a, approved } : a)));
  }

  function openAreaPreview(areaId: string) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    const listForPreview = [...area.competitors].sort((x, y) => x.nombre.localeCompare(y.nombre));
    setShowPreview({ type: "area", payload: { area, list: listForPreview } });
  }

  function consolidateCertificates() {
    const notApproved = areas.filter(a => !a.approved);
    if (notApproved.length > 0) {
      alert("Faltan aprobar las siguientes áreas: " + notApproved.map(a => a.nombre).join(", "));
      return;
    }
    // Prepara lista consolidada (solo puestos 1,2,3)
    const consolidated: Competitor[] = [];
    areas.forEach(a => {
      a.competitors
        .filter(c => [1,2,3].includes(c.puesto || -1))
        .forEach(c => consolidated.push({ ...c, area: a.nombre }));
    });
    setShowCertificateModal(true);
    // pasamos la lista al modal via estado (lo hace el modal recibiendo areas)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Generación de Certificados
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          Genera certificados para los competidores que obtuvieron los tres primeros puestos en cada área.
        </p>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Selecciona un área</h2>

          <div className="mb-4">
            <AreaList
              areas={areas}
              selectedAreaId={selectedAreaId}
              onSelect={setSelectedAreaId}
              onOpenPreview={openAreaPreview}
              onToggleApproved={updateAreaApproved}
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
              onClick={consolidateCertificates}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              Consolidar Certificados
            </button>
          </div>
        </div>
      </div>

      <PreviewModal
        open={!!showPreview}
        data={showPreview?.payload}
        type={showPreview?.type}
        onClose={() => setShowPreview(null)}
        onToggleApproved={updateAreaApproved}
      />

      <CertificateModal
        open={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        areas={areas}
        gestion={gestion}
      />
    </div>
  );
}