"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ChevronRight, BookOpen, LogIn, CalendarDays, AlertCircle } from "lucide-react";
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

export default function LandingPage() {
  const [activeNews, setActiveNews] = useState(0);
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

  const newsItems = [
    {
      date: "2025.03.15",
      title: "Nuevas áreas de competencia: Robótica e Inteligencia Artificial se suman a la olimpiada",
      category: "Novedades",
    },
    {
      date: "2025.03.10",
      title: "Resultados 2024: 847 estudiantes participaron en la olimpiada más grande de Bolivia",
      category: "Resultados",
    },
  ];


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
              <a href="#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
              </a>
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
              <a
                href="#noticias"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Noticias
              </a>
              <a
                href="#contacto"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </a>
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

      {/* Hero Section */}
      <section id="inicio" className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="relative h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
          <div className="relative container mx-auto px-6 h-full flex items-center">
            <div className="max-w-2xl text-white">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance">Olimpiada Oh! SanSi</h1>
              <p className="text-xl md:text-2xl mb-8 text-pretty opacity-90">
                Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary bg-transparent"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Conocer Más
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">1,247</div>
              <div className="text-sm text-muted-foreground">Estudiantes Inscritos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">6</div>
              <div className="text-sm text-muted-foreground">Áreas de Competencia</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">89</div>
              <div className="text-sm text-muted-foreground">Instituciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">15</div>
              <div className="text-sm text-muted-foreground">Años de Historia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cronograma Section */}
      <section id="cronograma" className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <CalendarDays className="h-4 w-4" />
              Cronograma de Evaluaciones
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Fechas oficiales por área de competencia
            </h2>
            <p className="text-lg text-muted-foreground">
              Consulta cuándo se realizarán las evaluaciones para cada área. Mantente atento para prepararte con tiempo.
            </p>
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
              <div className="max-w-2xl mx-auto mb-6">
                <Tabs value={faseSeleccionada} onValueChange={(value) => setFaseSeleccionada(value as 'clasificatoria' | 'final')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clasificatoria">Fase Clasificatoria</TabsTrigger>
                    <TabsTrigger value="final">Fase Final</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Tabs value={faseSeleccionada} onValueChange={(value) => setFaseSeleccionada(value as 'clasificatoria' | 'final')}>
                <TabsContent value="clasificatoria" className="mt-0">
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-primary/10 bg-white">
                    <div className="px-6 py-4 bg-primary text-primary-foreground flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] font-semibold opacity-80">1ra. Etapa</p>
                        <p className="text-xl font-heading font-bold">Fase clasificatoria · Unidades Educativas</p>
                      </div>
                      <p className="text-sm text-primary-foreground/80">Horarios oficiales aprobados por el comité central</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-primary/5">
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
                </TabsContent>

                <TabsContent value="final" className="mt-0">
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-purple-200 bg-white">
                    <div className="px-6 py-4 bg-purple-600 text-white flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] font-semibold opacity-80">2da. Etapa</p>
                        <p className="text-xl font-heading font-bold">Fase final · Competencia Nacional</p>
                      </div>
                      <p className="text-sm text-white/80">Horarios oficiales aprobados por el comité central</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-purple-50">
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
                </TabsContent>
              </Tabs>

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

      {/* News Section */}
      <section id="noticias" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Noticias y Anuncios</h2>
              <div className="w-12 h-1 bg-secondary rounded-full" />
            </div>
            <Button variant="outline" className="hidden md:flex bg-transparent">
              Ver todas las noticias
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {newsItems.map((item, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeNews === index ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setActiveNews(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs text-secondary">
                        {item.category}
                      </Badge>
                      <span className="text-sm font-mono text-secondary font-semibold">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground leading-tight">{item.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:pl-8">
              <Card className="h-full">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <Badge variant="outline" className="text-xs text-secondary mb-4">
                      {newsItems[activeNews].category}
                    </Badge>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-4 leading-tight">
                      {newsItems[activeNews].title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      La Olimpiada Oh! SanSi continúa creciendo y evolucionando para ofrecer la mejor experiencia
                      educativa a los estudiantes de Bolivia. Este año incorporamos nuevas tecnologías y metodologías
                      para hacer la competencia más accesible y emocionante.
                    </p>
                  </div>
                  <Button className="w-full">
                    Leer más
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón, promoviendo la excelencia
                académica en Bolivia desde 2010.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Enlaces</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Cronograma
                  </a>
                </li>
                <li>
                  <Link href="/resultados" className="hover:text-primary transition-colors">
                    Resultados
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Universidad Mayor de San Simón</li>
                <li>Cochabamba, Bolivia</li>
                <li>info@olimpiadaohsansi.edu.bo</li>
                <li>+591 4 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Olimpiada Oh! SanSi - Universidad Mayor de San Simón. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}