"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PublicacionResultadosService } from "@/lib/api";
import { CatalogoService } from "@/lib/api";

interface Resultado {
  numero: number;
  nombre_completo: string;
  departamento: string;
  unidad_educativa: string;
  area: string;
  nivel: string;
  curso: string;
  puntaje: number;
  observaciones: string;
}

interface Area {
  id: number;
  nombre: string;
}

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ 
    nivel: "", 
    departamento: "", 
    unidad: "", 
    observaciones: "" 
  });
  const [search, setSearch] = useState("");
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);

  
  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const response = await PublicacionResultadosService.getAreasPublicadas();
        if (response.success && response.data) {
          setAreas(response.data.map((a: any) => ({
            id: a.area_competencia_id,
            nombre: a.area_nombre
          })));
        }
      } catch (error) {
        console.error("Error al cargar áreas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarAreas();
  }, []);

  
  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam) {
      const areaEncontrada = areas.find(a => 
        a.nombre.toLowerCase() === areaParam.toLowerCase()
      );
      if (areaEncontrada) {
        setAreaSeleccionada(areaEncontrada.id);
      }
    }
  }, [searchParams, areas]);

  
  useEffect(() => {
    if (areaSeleccionada) {
      cargarResultados();
    } else {
      setResultados([]);
    }
  }, [areaSeleccionada]);

  const cargarResultados = async () => {
    if (!areaSeleccionada) return;
    
    setLoading(true);
    try {
      const response = await PublicacionResultadosService.getResultadosPublicados({
        area_id: areaSeleccionada
      });
      
      if (response.success && response.data) {
        const resultadosData = response.data.resultados || [];
        setResultados(resultadosData);
        
        
        const depts = [...new Set(resultadosData.map((r: Resultado) => r.departamento).filter(Boolean))] as string[];
        const unids = [...new Set(resultadosData.map((r: Resultado) => r.unidad_educativa).filter(Boolean))] as string[];
        setDepartamentos(depts.sort());
        setUnidades(unids.sort());
      }
    } catch (error) {
      console.error("Error al cargar resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataFiltrada = useMemo(() => {
    return resultados.filter((item) => {
      if (filtros.nivel && item.nivel !== filtros.nivel) return false;
      if (filtros.departamento && item.departamento !== filtros.departamento) return false;
      if (filtros.unidad && item.unidad_educativa !== filtros.unidad) return false;
      if (filtros.observaciones && item.observaciones !== filtros.observaciones) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.nombre_completo.toLowerCase().includes(q) ||
          item.unidad_educativa.toLowerCase().includes(q) ||
          (item.departamento && item.departamento.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resultados, filtros, search]);

  
  const resultadosPrimaria = useMemo(() => 
    dataFiltrada.filter(r => r.nivel === "Primaria"), 
    [dataFiltrada]
  );
  
  const resultadosSecundaria = useMemo(() => 
    dataFiltrada.filter(r => r.nivel === "Secundaria"), 
    [dataFiltrada]
  );

  function handleExportPDF() {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25.4;

    doc.setFontSize(12);
    doc.text("Olimpiada Oh! SanSi", margin, margin);
    doc.setFontSize(16);
    doc.text("Resultados - Fase Clasificatoria", margin, margin + 7);
    
    const areaNombre = areas.find(a => a.id === areaSeleccionada)?.nombre || "";
    if (areaNombre) {
        doc.setFontSize(12);
      doc.text(`Área: ${areaNombre}`, margin, margin + 14);
    }

    const columns = ["#", "Nombre Completo", "Departamento", "Unidad Educativa", "Curso", "Puntaje", "Observaciones"];
    const rows = dataFiltrada.map((r) => [
      r.numero.toString(),
      r.nombre_completo,
      r.departamento || "-",
      r.unidad_educativa || "-",
      r.curso || "-",
      r.puntaje.toFixed(2),
      r.observaciones,
    ]);

    autoTable(doc, {
        head: [columns],
        body: rows,
      startY: margin + 20,
        margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        theme: "grid",
        tableWidth: pageWidth - margin * 2,
    });

    const filename = `Resultados_${areaNombre.replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
  }

  const areaNombre = areas.find(a => a.id === areaSeleccionada)?.nombre || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-10 w-auto" />
              <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/#inicio" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Inicio
              </Link>
              <Link
                href="/#areas"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Áreas de Competencia
              </Link>
              <Link
                href="/resultados"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Resultados
              </Link>
              <Link
                href="/#noticias"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Noticias
              </Link>
              <Link
                href="/#contacto"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </Link>
            </nav>

            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="h-4 w-4 mr-2" />
                Acceso
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Resultados - Fase Clasificatoria
            </h1>
            <div className="text-sm text-muted-foreground mt-1">
              {areaNombre ? `Área: ${areaNombre}` : "Selecciona un área para ver los resultados"}
            </div>
          </div>

          {areaSeleccionada && (
            <div className="flex gap-3 items-center">
              <input
                placeholder="Buscar por nombre / unidad / departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-md w-64"
              />
              <button 
                onClick={handleExportPDF} 
                className="px-4 py-2 rounded bg-[var(--secondary)] text-white font-semibold hover:opacity-95"
                disabled={dataFiltrada.length === 0}
              >
                Exportar PDF
              </button>
            </div>
          )}
        </div>

      {/* AREAS */}
      <div className="bg-[var(--card)] rounded-xl p-4 shadow mb-6">
        <div className="text-sm text-[var(--muted-foreground)] mb-2">Selecciona un área</div>
        {loading && areas.length === 0 ? (
          <div className="text-center py-4">Cargando áreas...</div>
        ) : areas.length === 0 ? (
          <div className="text-center py-4 text-[var(--muted-foreground)]">
            No hay áreas con resultados publicados
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {areas.map((area) => (
            <button
                key={area.id}
                onClick={() => setAreaSeleccionada(area.id === areaSeleccionada ? null : area.id)}
              className={`px-3 py-2 rounded-lg font-medium border transition ${
                  area.id === areaSeleccionada
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
                {area.nombre}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* CONTENIDO DE TABLA */}
      {areaSeleccionada && (
      <div id="pdf-area">
        {/* FILTROS */}
        <div className="bg-[var(--card)] rounded-xl p-4 shadow mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Nivel</label>
              <select 
                className="px-3 py-2 border rounded-md" 
                value={filtros.nivel} 
                onChange={(e) => setFiltros({ ...filtros, nivel: e.target.value })}
              >
              <option value="">Todos</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Departamento</label>
              <select 
                className="px-3 py-2 border rounded-md" 
                value={filtros.departamento} 
                onChange={(e) => setFiltros({ ...filtros, departamento: e.target.value })}
              >
              <option value="">Todos</option>
                {departamentos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">Unidad Educativa</label>
              <select 
                className="px-3 py-2 border rounded-md" 
                value={filtros.unidad} 
                onChange={(e) => setFiltros({ ...filtros, unidad: e.target.value })}
              >
              <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
            </select>
          </div>

          <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1">Estado</label>
              <select 
                className="px-3 py-2 border rounded-md" 
                value={filtros.observaciones} 
                onChange={(e) => setFiltros({ ...filtros, observaciones: e.target.value })}
              >
              <option value="">Todos</option>
                <option value="Clasificado">Clasificado</option>
                <option value="No Clasificado">No Clasificado</option>
                <option value="Desclasificado">Desclasificado</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-[var(--muted-foreground)]">
            Resultados: <strong>{dataFiltrada.length}</strong>
          </div>
        </div>

        {/* TABLA */}
          {loading ? (
            <div className="text-center py-8">Cargando resultados...</div>
          ) : (
            <>
              {/* Resultados Primaria */}
              {resultadosPrimaria.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 text-[var(--color-primary)]">Nivel Primaria</h2>
                  <div className="bg-white rounded-xl p-3 shadow overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                          <th className="p-2 text-left border-b">#</th>
                          <th className="p-2 text-left border-b">Nombre Completo</th>
                <th className="p-2 text-left border-b">Departamento</th>
                <th className="p-2 text-left border-b">Unidad Educativa</th>
                          <th className="p-2 text-left border-b">Curso</th>
                          <th className="p-2 text-left border-b">Puntaje</th>
                          <th className="p-2 text-left border-b">Observaciones</th>
              </tr>
            </thead>
            <tbody>
                        {resultadosPrimaria.map((r, i) => (
                <tr key={i} className="even:bg-gray-50">
                            <td className="p-2 border-b">{r.numero}</td>
                            <td className="p-2 border-b">{r.nombre_completo}</td>
                            <td className="p-2 border-b">{r.departamento || "-"}</td>
                            <td className="p-2 border-b">{r.unidad_educativa || "-"}</td>
                            <td className="p-2 border-b">{r.curso || "-"}</td>
                            <td className="p-2 border-b">{r.puntaje.toFixed(2)}</td>
                            <td className="p-2 border-b">
                              <span className={`px-2 py-1 rounded text-xs ${
                                r.observaciones === "Clasificado" ? "bg-green-100 text-green-800" :
                                r.observaciones === "No Clasificado" ? "bg-yellow-100 text-yellow-800" :
                                r.observaciones === "Desclasificado" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {r.observaciones}
                              </span>
                            </td>
                </tr>
              ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resultados Secundaria */}
              {resultadosSecundaria.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 text-[var(--color-primary)]">Nivel Secundaria</h2>
                  <div className="bg-white rounded-xl p-3 shadow overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left border-b">#</th>
                          <th className="p-2 text-left border-b">Nombre Completo</th>
                          <th className="p-2 text-left border-b">Departamento</th>
                          <th className="p-2 text-left border-b">Unidad Educativa</th>
                          <th className="p-2 text-left border-b">Curso</th>
                          <th className="p-2 text-left border-b">Puntaje</th>
                          <th className="p-2 text-left border-b">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosSecundaria.map((r, i) => (
                          <tr key={i} className="even:bg-gray-50">
                            <td className="p-2 border-b">{r.numero}</td>
                            <td className="p-2 border-b">{r.nombre_completo}</td>
                            <td className="p-2 border-b">{r.departamento || "-"}</td>
                            <td className="p-2 border-b">{r.unidad_educativa || "-"}</td>
                            <td className="p-2 border-b">{r.curso || "-"}</td>
                            <td className="p-2 border-b">{r.puntaje.toFixed(2)}</td>
                            <td className="p-2 border-b">
                              <span className={`px-2 py-1 rounded text-xs ${
                                r.observaciones === "Clasificado" ? "bg-green-100 text-green-800" :
                                r.observaciones === "No Clasificado" ? "bg-yellow-100 text-yellow-800" :
                                r.observaciones === "Desclasificado" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {r.observaciones}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {dataFiltrada.length === 0 && !loading && (
                <div className="bg-white rounded-xl p-8 shadow text-center">
                  <p className="text-[var(--muted-foreground)]">
                    No existen resultados para los filtros seleccionados.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
