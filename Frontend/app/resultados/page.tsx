"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, Trophy } from "lucide-react";
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
    observaciones: "" 
  });

  
  useEffect(() => {
    const cargarTodosResultados = async () => {
      setLoading(true);
      try {
        
        const areasResponse = await PublicacionResultadosService.getAreasPublicadas();
        if (areasResponse.success && areasResponse.data) {
          const areasData = areasResponse.data;
          const todosResultados: Resultado[] = [];

          
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
        }
      } catch (error) {
        console.error("Error al cargar resultados:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarTodosResultados();
  }, []);

 
  const filteredResults = useMemo(() => {
    return resultados.filter((item) => {
     
      if (searchName && !item.nombre_completo.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      
      
      if (selectedArea && item.area !== selectedArea) {
        return false;
      }
      
      
      if (selectedLevel && item.nivel !== selectedLevel) {
        return false;
      }
      
     
      if (filtros.observaciones && item.observaciones !== filtros.observaciones) return false;
      
      return true;
    });
  }, [resultados, searchName, selectedArea, selectedLevel, filtros]);

 
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-8 sm:h-10 w-auto" />
              <span className="text-lg sm:text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
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

      {/* Banner Section con estilo de página principal */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-blue-900 mb-3 sm:mb-4">
            📊 Resultados - Fase Clasificatoria 📊
          </h1>
          <p className="text-lg sm:text-xl text-blue-800 font-medium px-4">
            Consulta los resultados de la fase clasificatoria
          </p>
        </div>
      </section>

      {/* Panel de filtros con estilo limpio */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Fila principal: Selectores centrados y búsqueda al lado */}
              <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
                {/* Selectores centrados */}
                <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full lg:w-auto">
                  {/* Área */}
                  <div className="w-full sm:w-48">
                    <div className="relative">
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea((e.target.value as Area) || "")}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                      >
                        <option value="">Todas las áreas</option>
                        {areas.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Nivel */}
                  <div className="w-full sm:w-48">
                    <div className="relative">
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel((e.target.value as Level) || "")}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                      >
                        <option value="">Todos los niveles</option>
                        {niveles.map((nivel) => (
                          <option key={nivel} value={nivel}>
                            {nivel}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="w-full sm:w-48">
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors" 
                        value={filtros.observaciones} 
                        onChange={(e) => setFiltros({ ...filtros, observaciones: e.target.value })}
                      >
                        <option value="">Todos los estados</option>
                        <option value="Clasificado">Clasificado</option>
                        <option value="No Clasificado">No Clasificado</option>
                        <option value="Desclasificado">Desclasificado</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campo de búsqueda al lado */}
                <div className="w-full lg:w-64">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Contador y botón exportar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <div className="text-base font-semibold text-blue-600">
                  {filteredResults.length} RESULTADOS
                </div>
                <button 
                  onClick={handleExportPDF} 
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  disabled={filteredResults.length === 0}
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="w-full py-20 flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {filteredResults.length === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <p className="text-lg">No se encontraron resultados con los filtros seleccionados.</p>
                </div>
              ) : (
                <div id="pdf-area" className="max-w-6xl mx-auto space-y-12">
                  {/* Resultados Primaria */}
                  {resultadosPrimaria.length > 0 && (
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-900 text-center md:text-left">
                        📚 Nivel Primaria
                      </h2>
                      <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-200">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="bg-blue-600 text-white">
                              <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Nombre Completo</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Área</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Departamento</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Unidad Educativa</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Curso</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Puntaje</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadosPrimaria.map((r, i) => (
                              <tr
                                key={i}
                                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                              >
                                <td className="px-4 py-3 font-semibold text-blue-600 text-sm">#{r.numero}</td>
                                <td className="px-4 py-3 text-gray-900 text-sm">{r.nombre_completo}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.area}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.departamento || "-"}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.unidad_educativa || "-"}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.curso || "-"}</td>
                                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{r.puntaje.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-900 text-center md:text-left">
                        🎓 Nivel Secundaria
                      </h2>
                      <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-200">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="bg-blue-600 text-white">
                              <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Nombre Completo</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Área</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Departamento</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Unidad Educativa</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Curso</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Puntaje</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadosSecundaria.map((r, i) => (
                              <tr
                                key={i}
                                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                              >
                                <td className="px-4 py-3 font-semibold text-blue-600 text-sm">#{r.numero}</td>
                                <td className="px-4 py-3 text-gray-900 text-sm">{r.nombre_completo}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.area}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.departamento || "-"}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.unidad_educativa || "-"}</td>
                                <td className="px-4 py-3 text-gray-700 text-sm">{r.curso || "-"}</td>
                                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{r.puntaje.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-slate-50 border-t mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-heading font-bold text-slate-800">Olimpiada Oh! SanSi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 max-w-md">
                Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón, promoviendo la excelencia
                académica en Bolivia desde 2010.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Enlaces</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>
                  <a href="/#inicio" className="hover:text-blue-600 transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <Link href="/cronograma" className="hover:text-blue-600 transition-colors">
                    Cronograma
                  </Link>
                </li>
                <li>
                  <Link href="/resultados" className="hover:text-blue-600 transition-colors">
                    Resultados
                  </Link>
                </li>
                <li>
                  <Link href="/medallero" className="hover:text-blue-600 transition-colors">
                    Medallero
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Contacto</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>Universidad Mayor de San Simón</li>
                <li>Cochabamba, Bolivia</li>
                <li className="break-all">info@olimpiadaohsansi.edu.bo</li>
                <li>+591 4 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-600">
            <p>&copy; 2025 Olimpiada Oh! SanSi - Universidad Mayor de San Simón. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
