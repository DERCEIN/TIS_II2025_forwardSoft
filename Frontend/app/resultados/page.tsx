"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PublicacionResultadosService } from "@/lib/api";
import type { Area, Level } from "@/lib/types";
import { areas, niveles } from "@/lib/data";

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

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [selectedArea, setSelectedArea] = useState<Area | "">("");
  const [selectedLevel, setSelectedLevel] = useState<Level | "">("");
  const [filtros, setFiltros] = useState({ 
    departamento: "", 
    unidad: "", 
    observaciones: "" 
  });
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);

  // Cargar todos los resultados desde el inicio
  useEffect(() => {
    const cargarTodosResultados = async () => {
      setLoading(true);
      try {
        // Obtener todas las áreas publicadas
        const areasResponse = await PublicacionResultadosService.getAreasPublicadas();
        if (areasResponse.success && areasResponse.data) {
          const areasData = areasResponse.data;
          const todosResultados: Resultado[] = [];

          // Cargar resultados de cada área
          for (const area of areasData) {
            try {
              const response = await PublicacionResultadosService.getResultadosPublicados({
                area_id: area.area_competencia_id
              });
              
              if (response.success && response.data) {
                const resultadosData = response.data.resultados || [];
                todosResultados.push(...resultadosData);
              }
            } catch (error) {
              console.error(`Error al cargar resultados del área ${area.area_nombre}:`, error);
            }
          }

          setResultados(todosResultados);
          
          // Extraer departamentos y unidades únicos
          const depts = [...new Set(todosResultados.map((r: Resultado) => r.departamento).filter(Boolean))] as string[];
          const unids = [...new Set(todosResultados.map((r: Resultado) => r.unidad_educativa).filter(Boolean))] as string[];
          setDepartamentos(depts.sort());
          setUnidades(unids.sort());
        }
      } catch (error) {
        console.error("Error al cargar resultados:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarTodosResultados();
  }, []);

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    return resultados.filter((item) => {
      // Filtro por nombre
      if (searchName && !item.nombre_completo.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      
      // Filtro por área
      if (selectedArea && item.area !== selectedArea) {
        return false;
      }
      
      // Filtro por nivel
      if (selectedLevel && item.nivel !== selectedLevel) {
        return false;
      }
      
      // Filtros adicionales
      if (filtros.departamento && item.departamento !== filtros.departamento) return false;
      if (filtros.unidad && item.unidad_educativa !== filtros.unidad) return false;
      if (filtros.observaciones && item.observaciones !== filtros.observaciones) return false;
      
      return true;
    });
  }, [resultados, searchName, selectedArea, selectedLevel, filtros]);

  // Separar por nivel
  const resultadosPrimaria = useMemo(() => 
    filteredResults.filter(r => r.nivel === "Primaria"), 
    [filteredResults]
  );
  
  const resultadosSecundaria = useMemo(() => 
    filteredResults.filter(r => r.nivel === "Secundaria"), 
    [filteredResults]
  );

  function handleExportPDF() {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25.4;

    doc.setFontSize(12);
    doc.text("Olimpiada Oh! SanSi", margin, margin);
    doc.setFontSize(16);
    doc.text("Resultados - Fase Clasificatoria", margin, margin + 7);
    
    if (selectedArea) {
      doc.setFontSize(12);
      doc.text(`Área: ${selectedArea}`, margin, margin + 14);
    }

    const columns = ["#", "Nombre Completo", "Área", "Departamento", "Unidad Educativa", "Curso", "Puntaje", "Estado"];
    const rows = filteredResults.map((r) => [
      r.numero.toString(),
      r.nombre_completo,
      r.area,
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

    const filename = `Resultados_${selectedArea ? selectedArea.replace(/\s+/g, "_") : "Todos"}.pdf`;
    doc.save(filename);
  }

  return (
    <div className="space-y-8">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-10 w-auto" />
              <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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
                href="/medallero"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Medallero
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

      {/* Banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-gray-300 to-orange-600 text-white text-center py-8 px-4 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold drop-shadow-md">📊 Resultados - Fase Clasificatoria 📊</h1>
        <p className="mt-2 text-lg font-medium drop-shadow-sm">Consulta los resultados de la fase clasificatoria</p>
      </div>

      {/* Panel de filtros similar al medallero */}
      <div className="bg-card rounded-lg p-6 shadow-md border border-border max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Búsqueda por nombre */}
          <div>
            <label className="block text-sm font-semibold mb-2">Buscar Participante</label>
            <input
              type="text"
              placeholder="Nombre..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filtro por área */}
          <div>
            <label className="block text-sm font-semibold mb-2">Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea((e.target.value as Area) || "")}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por nivel */}
          <div>
            <label className="block text-sm font-semibold mb-2">Nivel</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel((e.target.value as Level) || "")}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los niveles</option>
              {niveles.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Departamento</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
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
            <label className="block text-sm font-semibold mb-2">Unidad Educativa</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
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
            <label className="block text-sm font-semibold mb-2">Estado</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
              value={filtros.observaciones} 
              onChange={(e) => setFiltros({ ...filtros, observaciones: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="Clasificado">Clasificado</option>
              <option value="No Clasificado">No Clasificado</option>
              <option value="Desclasificado">Desclasificado</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Resultados encontrados: <strong className="text-foreground">{filteredResults.length}</strong>
          </div>
          <button 
            onClick={handleExportPDF} 
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            disabled={filteredResults.length === 0}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="w-full py-20 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {filteredResults.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No se encontraron resultados con los filtros seleccionados.</p>
            </div>
          ) : (
            <div id="pdf-area" className="max-w-6xl mx-auto px-4 space-y-12">
              {/* Resultados Primaria */}
              {resultadosPrimaria.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-primary text-center md:text-left">
                    📚 Nivel Primaria
                  </h2>
                  <div className="bg-card rounded-xl shadow-lg overflow-x-auto border border-border">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="px-4 py-3 text-left font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold">Nombre Completo</th>
                          <th className="px-4 py-3 text-left font-semibold">Área</th>
                          <th className="px-4 py-3 text-left font-semibold">Departamento</th>
                          <th className="px-4 py-3 text-left font-semibold">Unidad Educativa</th>
                          <th className="px-4 py-3 text-left font-semibold">Curso</th>
                          <th className="px-4 py-3 text-left font-semibold">Puntaje</th>
                          <th className="px-4 py-3 text-left font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosPrimaria.map((r, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? "bg-background" : "bg-muted"}
                          >
                            <td className="px-4 py-3 font-semibold text-primary">#{r.numero}</td>
                            <td className="px-4 py-3">{r.nombre_completo}</td>
                            <td className="px-4 py-3">{r.area}</td>
                            <td className="px-4 py-3">{r.departamento || "-"}</td>
                            <td className="px-4 py-3">{r.unidad_educativa || "-"}</td>
                            <td className="px-4 py-3">{r.curso || "-"}</td>
                            <td className="px-4 py-3 font-semibold">{r.puntaje.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${
                                r.observaciones === "Clasificado" ? "bg-green-100 text-green-800 border-green-300" :
                                r.observaciones === "No Clasificado" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                                r.observaciones === "Desclasificado" ? "bg-red-100 text-red-800 border-red-300" :
                                "bg-gray-100 text-gray-800 border-gray-300"
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
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-primary text-center md:text-left">
                    🎓 Nivel Secundaria
                  </h2>
                  <div className="bg-card rounded-xl shadow-lg overflow-x-auto border border-border">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="px-4 py-3 text-left font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold">Nombre Completo</th>
                          <th className="px-4 py-3 text-left font-semibold">Área</th>
                          <th className="px-4 py-3 text-left font-semibold">Departamento</th>
                          <th className="px-4 py-3 text-left font-semibold">Unidad Educativa</th>
                          <th className="px-4 py-3 text-left font-semibold">Curso</th>
                          <th className="px-4 py-3 text-left font-semibold">Puntaje</th>
                          <th className="px-4 py-3 text-left font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosSecundaria.map((r, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? "bg-background" : "bg-muted"}
                          >
                            <td className="px-4 py-3 font-semibold text-primary">#{r.numero}</td>
                            <td className="px-4 py-3">{r.nombre_completo}</td>
                            <td className="px-4 py-3">{r.area}</td>
                            <td className="px-4 py-3">{r.departamento || "-"}</td>
                            <td className="px-4 py-3">{r.unidad_educativa || "-"}</td>
                            <td className="px-4 py-3">{r.curso || "-"}</td>
                            <td className="px-4 py-3 font-semibold">{r.puntaje.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${
                                r.observaciones === "Clasificado" ? "bg-green-100 text-green-800 border-green-300" :
                                r.observaciones === "No Clasificado" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                                r.observaciones === "Desclasificado" ? "bg-red-100 text-red-800 border-red-300" :
                                "bg-gray-100 text-gray-800 border-gray-300"
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
