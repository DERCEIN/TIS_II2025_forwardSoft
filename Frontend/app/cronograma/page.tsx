"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, LogIn, Trophy } from "lucide-react";
import Link from "next/link";
import { ConfiguracionService } from "@/lib/api";

interface CronogramaArea {
  id: number;
  nombre: string;
  descripcion?: string | null;
  evalInicio: string | null;
  evalFin: string | null;
  pubInicio: string | null;
  pubFin: string | null;
  evalFinalInicio: string | null;
  evalFinalFin: string | null;
  pubFinalInicio: string | null;
  pubFinalFin: string | null;
}

export default function CronogramaPage() {
  const [cronogramaAreas, setCronogramaAreas] = useState<CronogramaArea[]>([]);
  const [loadingCronograma, setLoadingCronograma] = useState(true);
  const [cronogramaError, setCronogramaError] = useState<string | null>(null);
  const [faseSeleccionada, setFaseSeleccionada] = useState<'clasificatoria' | 'final'>('clasificatoria');

  useEffect(() => {
    const cargarCronograma = async () => {
      setLoadingCronograma(true);
      setCronogramaError(null);
      try {
        const response = await ConfiguracionService.getCronogramaPublico();

        const cronogramaData =
          response?.success && Array.isArray(response.data) ? response.data : [];

        const merged: CronogramaArea[] = cronogramaData
          .map((item: any) => ({
            id: item.area_competencia_id,
            nombre: item.area_nombre,
            descripcion: item.area_descripcion || null,
            evalInicio: item.periodo_evaluacion_inicio || null,
            evalFin: item.periodo_evaluacion_fin || null,
            pubInicio: item.periodo_publicacion_inicio || null,
            pubFin: item.periodo_publicacion_fin || null,
            evalFinalInicio: item.periodo_evaluacion_final_inicio || null,
            evalFinalFin: item.periodo_evaluacion_final_fin || null,
            pubFinalInicio: item.periodo_publicacion_final_inicio || null,
            pubFinalFin: item.periodo_publicacion_final_fin || null,
          }))
          .filter((area: CronogramaArea) => {
            
            return (area.evalInicio && area.evalFin) || (area.evalFinalInicio && area.evalFinalFin);
          })
          .sort((a: CronogramaArea, b: CronogramaArea) => {
            
            const fechaA = new Date((a.evalInicio || a.evalFinalInicio) as string).getTime();
            const fechaB = new Date((b.evalInicio || b.evalFinalInicio) as string).getTime();
            return fechaA - fechaB;
          });

        setCronogramaAreas(merged);
      } catch (error) {
        console.error("Error al cargar cronograma:", error);
        setCronogramaAreas([]);
        setCronogramaError("No se pudo cargar el cronograma en este momento.");
      } finally {
        setLoadingCronograma(false);
      }
    };

    cargarCronograma();
  }, []);

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "Sin definir";
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return "Sin definir";
    return parsed.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const obtenerEstadoPeriodo = (inicio: string | null, fin: string | null) => {
    if (!inicio || !fin) return "sin-fecha";
    const ahora = new Date();
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) return "sin-fecha";
    if (ahora < fechaInicio) return "proximo";
    if (ahora > fechaFin) return "concluido";
    return "en-curso";
  };

  const estadoLabels: Record<string, string> = {
    "en-curso": "En curso",
    proximo: "Próximo",
    concluido: "Concluido",
    "sin-fecha": "Sin fecha",
  };

  const estadoClasses: Record<string, string> = {
    "en-curso": "bg-green-100 text-green-800 border-green-200",
    proximo: "bg-amber-50 text-amber-800 border-amber-200",
    concluido: "bg-slate-100 text-slate-700 border-slate-200",
    "sin-fecha": "bg-gray-100 text-gray-600 border-gray-200",
  };

  const formatearRango = (inicio: string | null, fin: string | null) => {
    if (!inicio || !fin) return "Por confirmar";

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) return "Por confirmar";

    const opciones: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long" };
    const inicioStr = fechaInicio.toLocaleDateString("es-BO", opciones);
    const finStr = fechaFin.toLocaleDateString("es-BO", opciones);
    const incluyeAño = fechaInicio.getFullYear() !== fechaFin.getFullYear();
    const año = fechaFin.getFullYear();

    return `Del ${inicioStr} al ${finStr}${incluyeAño ? ` de ${año}` : ""}`;
  };

  const notasCronograma = [
    "Las fechas publicadas para la fase clasificatoria son únicas e inamovibles. No se programarán ampliaciones ni segundas fechas para estudiantes rezagados.",
    "Si un área publica un anuncio adicional (por ejemplo, cupos especiales o cambios de sede), se comunicará por los canales oficiales del comité organizador.",
    "Presentarse con 30 minutos de anticipación y portar documento de identidad. Cualquier actualización extraordinaria será notificada por correo y redes oficiales.",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-10 w-auto" />
              <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Inicio
              </Link>
              <Link
                href="/contactos"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </Link>
              <Link
                href="/resultados"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Resultados
              </Link>
              <Link
                href="/medallero"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Medallero
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

      {/* Banner Section */}
      <section className="relative py-16 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-blue-900 mb-4">
            Olimpiada Oh! SanSi
          </h1>
          <p className="text-xl md:text-2xl text-blue-800 font-medium">
            Olimpiada en Ciencias y Tecnología
          </p>
        </div>
      </section>

      {/* Etapas Section */}
      <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-blue-900 mb-2">
              ETAPAS
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          </div>

          {/* Etapas Navigation */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-lg shadow-md p-1 border border-blue-200">
              <button
                onClick={() => setFaseSeleccionada('clasificatoria')}
                className={`px-6 py-3 rounded-md font-semibold text-sm transition-all ${
                  faseSeleccionada === 'clasificatoria'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Fase Clasificatoria
              </button>
              <button
                onClick={() => setFaseSeleccionada('final')}
                className={`px-6 py-3 rounded-md font-semibold text-sm transition-all ${
                  faseSeleccionada === 'final'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Fase Final
              </button>
            </div>
          </div>

          {/* Current Stage Badge */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-white rounded-full px-4 py-2 shadow-md border border-blue-200">
              <span className="text-blue-700 font-semibold text-sm">
                {faseSeleccionada === 'clasificatoria' ? '1ra. Etapa' : '2da. Etapa'}
              </span>
            </div>
            <span className="text-blue-700 font-medium">Cochabamba 2025</span>
          </div>

          {loadingCronograma ? (
            <div className="text-center py-12 text-muted-foreground">Cargando cronograma...</div>
          ) : cronogramaError ? (
            <div className="max-w-2xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-center gap-3 py-6">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div className="text-sm text-red-700">{cronogramaError}</div>
                </CardContent>
              </Card>
            </div>
          ) : cronogramaAreas.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <Card className="border-dashed">
                <CardContent className="text-center py-8 space-y-2">
                  <p className="text-base font-medium text-foreground">Aún no hay fechas publicadas.</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando la organización confirme los periodos de evaluación, podrás verlos aquí.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {faseSeleccionada === 'clasificatoria' ? (
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-200 bg-white">
                    <div className="px-6 py-4 bg-blue-600 text-white flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] font-semibold opacity-90">1ra. Etapa</p>
                        <p className="text-xl font-heading font-bold">Fase clasificatoria · Unidades Educativas</p>
                      </div>
                      <p className="text-sm text-white/90">Horarios oficiales aprobados por el comité central</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-blue-50">
                          <tr className="text-left">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[28%]">
                              Área
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Periodo de evaluación
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Publicación de resultados
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[15%]">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cronogramaAreas
                            .filter((area) => area.evalInicio && area.evalFin)
                            .map((area) => {
                              const estado = obtenerEstadoPeriodo(area.evalInicio, area.evalFin);
                              return (
                                <tr key={area.id} className="hover:bg-muted/40 transition-colors">
                                  <td className="px-6 py-5 align-top">
                                    <p className="text-base font-semibold text-foreground">{area.nombre}</p>
                                    {area.descripcion && (
                                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{area.descripcion}</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    <p className="text-sm font-medium text-foreground">{formatearRango(area.evalInicio, area.evalFin)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Inicio: {formatearFecha(area.evalInicio)} <span className="mx-1">•</span> Fin:{" "}
                                      {formatearFecha(area.evalFin)}
                                    </p>
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    {area.pubInicio && area.pubFin ? (
                                      <>
                                        <p className="text-sm font-medium text-foreground">
                                          {formatearRango(area.pubInicio, area.pubFin)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Inicio: {formatearFecha(area.pubInicio)} <span className="mx-1">•</span> Fin:{" "}
                                          {formatearFecha(area.pubFin)}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-sm font-medium text-muted-foreground">Por confirmar</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    <Badge className={`border ${estadoClasses[estado] || estadoClasses["sin-fecha"]}`}>
                                      {estadoLabels[estado]}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
              ) : (
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-orange-200 bg-white">
                    <div className="px-6 py-4 bg-orange-500 text-white flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] font-semibold opacity-90">2da. Etapa</p>
                        <p className="text-xl font-heading font-bold">Fase final · Competencia Nacional</p>
                      </div>
                      <p className="text-sm text-white/90">Horarios oficiales aprobados por el comité central</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-orange-50">
                          <tr className="text-left">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[28%]">
                              Área
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Periodo de evaluación
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Publicación de resultados
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[15%]">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cronogramaAreas
                            .filter((area) => area.evalFinalInicio && area.evalFinalFin)
                            .map((area) => {
                              const estado = obtenerEstadoPeriodo(area.evalFinalInicio, area.evalFinalFin);
                              return (
                                <tr key={area.id} className="hover:bg-muted/40 transition-colors">
                                  <td className="px-6 py-5 align-top">
                                    <p className="text-base font-semibold text-foreground">{area.nombre}</p>
                                    {area.descripcion && (
                                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{area.descripcion}</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    <p className="text-sm font-medium text-foreground">{formatearRango(area.evalFinalInicio, area.evalFinalFin)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Inicio: {formatearFecha(area.evalFinalInicio)} <span className="mx-1">•</span> Fin:{" "}
                                      {formatearFecha(area.evalFinalFin)}
                                    </p>
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    {area.pubFinalInicio && area.pubFinalFin ? (
                                      <>
                                        <p className="text-sm font-medium text-foreground">
                                          {formatearRango(area.pubFinalInicio, area.pubFinalFin)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Inicio: {formatearFecha(area.pubFinalInicio)} <span className="mx-1">•</span> Fin:{" "}
                                          {formatearFecha(area.pubFinalFin)}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-sm font-medium text-muted-foreground">Por confirmar</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                    <Badge className={`border ${estadoClasses[estado] || estadoClasses["sin-fecha"]}`}>
                                      {estadoLabels[estado]}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
              )}

              <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Notas importantes</h3>
                <ul className="space-y-3 text-sm text-amber-900">
                  {notasCronograma.map((nota, index) => (
                    <li key={index} className="leading-relaxed">
                      <span className="font-semibold mr-1">NOTA {index + 1}:</span>
                      {nota}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-heading font-bold text-slate-800">Olimpiada Oh! SanSi</span>
              </div>
              <p className="text-sm text-slate-700 max-w-md">
                Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón, promoviendo la excelencia
                académica en Bolivia desde 2010.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Enlaces</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>
                  <Link href="/" className="hover:text-blue-600 transition-colors">
                    Inicio
                  </Link>
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
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Universidad Mayor de San Simón</li>
                <li>Cochabamba, Bolivia</li>
                <li>info@olimpiadaohsansi.edu.bo</li>
                <li>+591 4 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2025 Olimpiada Oh! SanSi - Universidad Mayor de San Simón. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

