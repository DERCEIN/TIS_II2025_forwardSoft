"use client";

import React, { useEffect, useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PreviewModal from "./components/PreviewModal";
import GeneralListView from "./components/GeneralListView";
import { CertificadosService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Extender tipo de jsPDF para lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

/** Tipos */
type Competitor = {
  id: number;
  nombre: string;
  unidad: string;
  area: string;
  nivel: string;
  puntaje: number;
  estado: string | null;
  puesto?: number | null;
};

type Area = {
  id: string;
  nombre: string;
  approved: boolean;
  finalClosed?: boolean;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [showPreview, setShowPreview] = useState<{ type: "general"; payload?: any } | null>(null);
  const [consolidatedList, setConsolidatedList] = useState<Competitor[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
       
        const response = await CertificadosService.getAreasAprobadas();
        if (response.success && response.data) {
          const rawAreas: Area[] = await Promise.all(
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

          const readyAreas = rawAreas.filter(a => a.approved && a.finalClosed);
          if (readyAreas.length === 0) {
            toast({
              title: "Sin áreas habilitadas",
              description: "Aún no hay áreas aprobadas y con fase final cerrada para generar la lista de premiados.",
            });
            setAreas([]);
            setConsolidatedList([]);
          } else {
            setAreas(readyAreas);
          
            const premiados: Competitor[] = [];
            const ordenMedallas = ["oro", "plata", "bronce"];
            
            readyAreas.forEach(area => {
              const filtered = area.competitors.filter(c => {
                if (!c.estado) return false;
                const estadoStr = String(c.estado).toLowerCase().trim();
                return ordenMedallas.includes(estadoStr);
              });
              
              const sorted = filtered.sort((a, b) => {
                const estadoA = String(a.estado || "").toLowerCase().trim();
                const estadoB = String(b.estado || "").toLowerCase().trim();
                const indexA = ordenMedallas.indexOf(estadoA);
                const indexB = ordenMedallas.indexOf(estadoB);
                if (indexA !== indexB) return indexA - indexB;
                return (Number(b.puntaje) || 0) - (Number(a.puntaje) || 0);
              });
              
              premiados.push(...sorted);
            });
            
            setConsolidatedList(premiados);
          }
        } else {
          toast({
            title: "Error",
            description: response.message || "No se pudieron cargar las áreas",
            variant: "destructive"
          });
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
  }, [toast]);


  function handleGeneratePdfFromPreview(payload: any) {
    try {
      // Validar que el payload tenga la estructura esperada
      if (!payload) {
        throw new Error("Payload inválido: no se proporcionó payload");
      }

      if (!payload.payload) {
        throw new Error("Payload inválido: falta la propiedad 'payload'");
      }

      console.log("Generando PDF con payload:", payload);

      const pdf = new jsPDF({ unit: "in", format: "letter" });
      const margin = 1.18;
      let y = margin + 0.5; // Espacio superior para el título

     
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      const title = "LISTA GENERAL DE PREMIADOS";
      
      pdf.text(
        title,
        pdf.internal.pageSize.getWidth() / 2,
        y,
        { align: "center" }
      );
      y += 0.4;

      
      if (payload.type === "general" && payload?.payload?.list) {
        const list = payload.payload.list || [];
        
      
        const premiados = list.filter((c: Competitor) => {
          if (!c.estado) return false;
          const estadoStr = String(c.estado).toLowerCase().trim();
          return ["oro", "plata", "bronce"].includes(estadoStr);
        });

        if (premiados.length === 0) {
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "normal");
          pdf.text("No hay premiados para mostrar", pdf.internal.pageSize.getWidth() / 2, y, {
            align: "center",
          });
        } else {
          
          const ordenMedallas = ["oro", "plata", "bronce"];
          const premiadosOrdenados = premiados.sort((a: Competitor, b: Competitor) => {
            const estadoA = String(a.estado || "").toLowerCase().trim();
            const estadoB = String(b.estado || "").toLowerCase().trim();
            const indexA = ordenMedallas.indexOf(estadoA);
            const indexB = ordenMedallas.indexOf(estadoB);
            if (indexA !== indexB) return indexA - indexB;
            return (Number(b.puntaje) || 0) - (Number(a.puntaje) || 0);
          });

          // Agrupar por tipo de medalla
          const categorias = ["oro", "plata", "bronce"];
          const nombresCategorias = [
            "Medalla de Oro",
            "Medalla de Plata",
            "Medalla de Bronce",
          ];

          categorias.forEach((cat, i) => {
            const rows = premiadosOrdenados
              .filter((c: Competitor) => {
                const estadoStr = String(c.estado || "").toLowerCase().trim();
                return estadoStr === cat;
              })
              .map((c: Competitor) => [
                String(c.area || "-"),
                String(c.nombre || "-"),
                String(c.unidad || "-"),
                (Number(c.puntaje) || 0).toFixed(2),
              ]);

            if (rows.length > 0) {
             
              y = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 0.3 : y;

              
              pdf.setFontSize(16);
              pdf.setFont("helvetica", "bold");
              pdf.text(nombresCategorias[i], pdf.internal.pageSize.getWidth() / 2, y, {
                align: "center",
              });
              y += 0.25;

            
              autoTable(pdf, {
                startY: y,
                head: [["Área", "Competidor", "Unidad Educativa", "Puntaje"]],
                body: rows,
                theme: "grid",
                headStyles: { fillColor: [244, 244, 244], textColor: 0 },
                margin: { left: margin, right: margin },
                styles: { fontSize: 11 },
                columnStyles: {
                  3: { halign: "right" },
                },
              });
            }
          });
        }
      }

      const fileName = "lista_general_premiados.pdf";
      
      pdf.save(fileName);
    } catch (error: any) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo generar el PDF. Inténtalo nuevamente.",
        variant: "destructive",
      });
    }
  }


  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">

      <div className="max-w-6xl mx-auto">
        {/* Lista general */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-3xl font-bold mb-2">Lista General de Premiados</h1>
          <p className="text-sm text-gray-600 mb-6">
            Lista consolidada de todos los premiados por área, ordenados por tipo de medalla.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Cargando datos...</p>
            </div>
          ) : !consolidatedList || consolidatedList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">
                No hay premiados disponibles.
              </p>
              <p className="text-xs text-gray-400">
                Asegúrate de que las áreas estén aprobadas y con fase final cerrada.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      <PreviewModal
        open={!!showPreview}
        data={showPreview?.payload}
        type={showPreview?.type || "general"}
        onClose={() => setShowPreview(null)}
        onGeneratePdf={payload =>
          handleGeneratePdfFromPreview({
            type: "general",
            payload,
          })
        }
      />
    </div>
  );
}