"use client";

import React, { useEffect, useState } from "react";
import AreaList from "./components/AreaList";
import PreviewModal from "./components/PreviewModal";
import CertificateModal from "./components/CertificateModal";
import CoordinadorCertificateModal from "./components/CoordinadorCertificateModal";
import { Competitor, Area } from "./utils/certificateGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { CertificadosService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const isCoordinador = user?.role === 'coordinador';
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<{ type: "area" | "general"; payload?: any } | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showCoordinadorModal, setShowCoordinadorModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gestion] = useState("2025");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isCoordinador) {
          // Cargar datos del coordinador desde la API
          const response = await CertificadosService.getParticipantesPremiados();
          if (response.success && response.data) {
            const data = response.data;
            const area: Area = {
              id: data.area.id.toString(),
              nombre: data.area.nombre,
              approved: data.aprobado || false,
              competitors: data.participantes.map((p: any) => ({
                id: p.olimpista_id,
                nombre: p.nombre,
                unidad: p.unidad,
                area: data.area.nombre,
                nivel: p.nivel,
                puntaje: p.puntaje || 0,
                // Si no tiene medalla_asignada (NULL en BD), lo tratamos como
                // participante de mención de honor para certificados de participación.
                // Dejamos estado en null para que el modal lo clasifique como participación.
                estado: p.medalla_asignada || null,
                puesto: p.puesto
              }))
            };
            setAreas([area]);
            setSelectedAreaId(area.id);
            setShowCoordinadorModal(true);
          } else {
            toast({
              title: "Error",
              description: response.message || "No se pudieron cargar los datos",
              variant: "destructive"
            });
          }
        } else if (isAdmin) {
          // Cargar todas las áreas desde la API
          const response = await CertificadosService.getAreasAprobadas();
          if (response.success && response.data) {
            const allAreas: Area[] = await Promise.all(
              response.data.map(async (areaData: any) => {
                const finalClosed = Boolean(areaData.fase_final_cerrada);
                let participantes: Competitor[] = [];

                if (finalClosed) {
                  const participantesResponse = await CertificadosService.getParticipantesPremiadosPorArea(areaData.id);
                  participantes = participantesResponse.success && participantesResponse.data?.participantes
                    ? participantesResponse.data.participantes.flatMap((nivel: any) => 
                        nivel.participantes.map((p: any) => ({
                          id: p.olimpista_id,
                          nombre: p.nombre,
                          unidad: p.unidad,
                          area: areaData.nombre,
                          nivel: p.nivel,
                          puntaje: p.puntaje || 0,
                          // Sin medalla_asignada (NULL) => null aquí; CertificateModal los trata como participación
                          estado: p.medalla_asignada || null,
                          puesto: p.puesto
                        }))
                      )
                    : [];
                }
                
                return {
                  id: areaData.id.toString(),
                  nombre: areaData.nombre,
                  approved: areaData.aprobado || false,
                  finalClosed,
                  competitors: participantes
                };
              })
            );

            // Solo mostrar al administrador las áreas ya habilitadas (aprobadas + fase final cerrada)
            const enabledAreas = allAreas.filter(a => a.approved && a.finalClosed);
            const notApproved = allAreas.filter(a => !a.approved);
            const pendingFinalClose = allAreas.filter(a => a.approved && !a.finalClosed);

            if (notApproved.length > 0 || pendingFinalClose.length > 0) {
              const mensajes: string[] = [];
              if (notApproved.length > 0) {
                mensajes.push("Áreas sin aprobación de coordinador: " + notApproved.map(a => a.nombre).join(", "));
              }
              if (pendingFinalClose.length > 0) {
                mensajes.push("Áreas con fase final pendiente: " + pendingFinalClose.map(a => a.nombre).join(", "));
              }
              toast({
                title: "Áreas aún no habilitadas",
                description: mensajes.join(" · "),
              });
            }

            setAreas(enabledAreas);
            setSelectedAreaId(enabledAreas[0]?.id || null);
          } else {
            toast({
              title: "Error",
              description: response.message || "No se pudieron cargar las áreas",
              variant: "destructive"
            });
          }
        }
      } catch (error: any) {
        console.error('Error cargando datos:', error);
        toast({
          title: "Error",
          description: error.message || "Error al cargar los datos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isCoordinador, isAdmin, toast]);

  async function updateAreaApproved(areaId: string, approved: boolean) {
    if (isCoordinador) {
      try {
        const response = await CertificadosService.aprobarCertificados(approved);
        if (response.success) {
          setAreas(prev => prev.map(a => (a.id === areaId ? { ...a, approved } : a)));
          toast({
            title: approved ? "Área aprobada" : "Aprobación cancelada",
            description: approved 
              ? "El administrador ahora puede generar los certificados de esta área."
              : "La aprobación ha sido cancelada.",
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "No se pudo guardar la aprobación",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Error aprobando certificados:', error);
        toast({
          title: "Error",
          description: error.message || "Error al guardar la aprobación",
          variant: "destructive"
        });
      }
    } else {
      // Para admin, solo actualizar el estado local (la aprobación ya fue hecha por el coordinador)
    setAreas(prev => prev.map(a => (a.id === areaId ? { ...a, approved } : a)));
    }
  }

  function openAreaPreview(areaId: string) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    const listForPreview = [...area.competitors].sort((x, y) => x.nombre.localeCompare(y.nombre));
    setShowPreview({ type: "area", payload: { area, list: listForPreview } });
  }

  function consolidateCertificates() {
    // Si es coordinador, no puede consolidar - solo aprobar
    if (isCoordinador) {
      alert("Como coordinador, solo puedes aprobar participantes de tu área. El administrador generará los certificados una vez aprobados.");
      return;
    }
    
    // Si es admin, solo puede consolidar si hay áreas habilitadas (ya filtradas al cargarlas)
    if (areas.length === 0) {
      alert("No hay áreas habilitadas. Asegúrate de que las áreas estén aprobadas por sus coordinadores y con la fase final cerrada.");
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
  }

  // Si es coordinador, mostrar solo el modal
  if (isCoordinador) {
    const coordinadorArea = areas.find(a => a.id === selectedAreaId) || areas[0];
    
    return (
      <>
        <CoordinadorCertificateModal
          open={showCoordinadorModal}
          onClose={() => setShowCoordinadorModal(false)}
          area={coordinadorArea}
          onToggleApproved={updateAreaApproved}
        />
      </>
    );
  }

  // Si es admin, mostrar la página completa
  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold mb-4 text-center">
          Generación de Certificados
        </h1>
        <div className="max-w-4xl mx-auto mb-6">
          {isAdmin && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-800 font-medium mb-2">
                👑 <strong>Rol: Administrador</strong>
              </p>
              <ul className="text-sm text-purple-700 space-y-1 ml-6 list-disc">
                <li>Genera certificados en lote para toda la olimpiada</li>
                <li>Solo puedes generar certificados de áreas <strong>ya aprobadas por coordinadores</strong></li>
                <li>Asegura coherencia entre reportes oficiales, listas de premiación y certificados</li>
              </ul>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              📜 <strong>Tipos de Certificados:</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-6 list-disc">
              <li><strong>Certificados de Honor:</strong> Para competidores con medalla (Oro, Plata, Bronce, Mención de Honor).</li>
              <li><strong>Certificados de Participación:</strong> Para competidores evaluados sin medalla.</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Selecciona un área</h2>

          <div className="mb-4">
            <AreaList
              areas={areas}
              selectedAreaId={selectedAreaId}
              onSelect={setSelectedAreaId}
              onOpenPreview={openAreaPreview}
              onToggleApproved={updateAreaApproved}
              canToggleApproval={false}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => selectedAreaId && openAreaPreview(selectedAreaId)}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 font-medium transition-colors"
            >
              👁️ Previsualizar área
            </button>

            <button
              onClick={consolidateCertificates}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors shadow-md"
            >
              📋 Generar Certificados (Solo Áreas Aprobadas)
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