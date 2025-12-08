"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ChevronRight, LogIn, ChevronLeft, Download, Microscope, Atom, Globe, Calculator, FlaskConical, FileText, Menu, X } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import { ConfiguracionService, CatalogoService } from "@/lib/api";
interface Coordinador {
  id: number;
  nombre: string;
  email: string;
}

interface AreaConvocatoria {
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
  coordinadores?: Coordinador[];
}

const areaIcons: Record<string, { icon: any; color: string }> = {
  'Biología': { icon: Microscope, color: 'bg-green-500' },
  'Biologia': { icon: Microscope, color: 'bg-green-500' },
  'Física': { icon: Atom, color: 'bg-blue-500' },
  'Fisica': { icon: Atom, color: 'bg-blue-500' },
  'Geografía': { icon: Globe, color: 'bg-purple-500' },
  'Geografia': { icon: Globe, color: 'bg-purple-500' },
  'Matemáticas': { icon: Calculator, color: 'bg-teal-500' },
  'Matematicas': { icon: Calculator, color: 'bg-teal-500' },
  'Química': { icon: FlaskConical, color: 'bg-purple-500' },
  'Quimica': { icon: FlaskConical, color: 'bg-purple-500' },
  'Informática': { icon: FileText, color: 'bg-indigo-500' },
  'Informatica': { icon: FileText, color: 'bg-indigo-500' },
};

export default function LandingPage() {
  const [areas, setAreas] = useState<AreaConvocatoria[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [contactos, setContactos] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingAreas(true);
      try {
        // Cargar cronograma y contactos en paralelo
        const [cronogramaResponse, contactosResponse] = await Promise.all([
          ConfiguracionService.getCronogramaPublico(),
          ConfiguracionService.getContactosPublico(),
        ]);

        const areasData = cronogramaResponse?.success && Array.isArray(cronogramaResponse.data) ? cronogramaResponse.data : [];
        const contactosData = contactosResponse?.success && Array.isArray(contactosResponse.data) ? contactosResponse.data : [];
        
        setContactos(contactosData);

        // Mapear áreas y agregar coordinadores
        const mappedAreas: AreaConvocatoria[] = areasData.map((item: any) => {
          const contactoArea = contactosData.find((c: any) => c.area_competencia_id === item.area_competencia_id);
          return {
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
            coordinadores: contactoArea?.coordinadores || [],
          };
        });
        setAreas(mappedAreas);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    };
    cargarDatos();
  }, []);

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "Por confirmar";
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return "Por confirmar";
    return parsed.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatearRango = (inicio: string | null, fin: string | null) => {
    if (!inicio || !fin) return "Por confirmar";
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) return "Por confirmar";
    const opciones: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long" };
    const inicioStr = fechaInicio.toLocaleDateString("es-BO", opciones);
    const finStr = fechaFin.toLocaleDateString("es-BO", opciones);
    return `Del ${inicioStr} al ${finStr}`;
  };

  const getMaterialesPorArea = (nombreArea: string): string[] => {
    const materiales: Record<string, string[]> = {
      'Matemáticas': [
        'Calculadora científica (si está permitida)',
        'Lápiz, borrador y regla',
        'Compás y transportador',
        'Papel cuadriculado',
      ],
      'Física': [
        'Calculadora científica',
        'Formulario de física (si está permitido)',
        'Lápiz, borrador y regla',
        'Papel milimetrado para gráficos',
      ],
      'Química': [
        'Tabla periódica (si está permitida)',
        'Calculadora científica',
        'Lápiz, borrador y regla',
        'Formulario de química (si está permitido)',
      ],
      'Biología': [
        'Lápiz, borrador y regla',
        'Lupa (opcional)',
        'Formulario de biología (si está permitido)',
        'Tabla de clasificación taxonómica (si está permitida)',
      ],
      'Geografía': [
        'Atlas geográfico (si está permitido)',
        'Lápiz, borrador y regla',
        'Calculadora básica',
        'Mapas de referencia (si están permitidos)',
      ],
      'Astronomía': [
        'Calculadora científica',
        'Tablas astronómicas (si están permitidas)',
        'Lápiz, borrador y regla',
        'Formulario de astronomía (si está permitido)',
      ],
    };
    return materiales[nombreArea] || [
      'Material de escritura (lápiz, borrador, regla)',
      'Calculadora (si está permitida)',
      'Material específico según instrucciones del coordinador',
    ];
  };

  const getRequisitosPorArea = (nombreArea: string): string[] => {
    const requisitos: Record<string, string[]> = {
      'Matemáticas': [
        'Estudiantes de Primaria (1ro a 6to) o Secundaria (1ro a 6to)',
        'Conocimientos sólidos en aritmética, álgebra y geometría',
        'Habilidad para resolver problemas matemáticos complejos',
        'Capacidad de razonamiento lógico y abstracto',
      ],
      'Física': [
        'Estudiantes de Secundaria (preferentemente 4to a 6to)',
        'Conocimientos básicos de matemáticas y física',
        'Comprensión de conceptos de mecánica, termodinámica y electromagnetismo',
        'Habilidad para aplicar fórmulas y resolver problemas prácticos',
      ],
      'Química': [
        'Estudiantes de Secundaria (preferentemente 3ro a 6to)',
        'Conocimientos de química general e inorgánica',
        'Familiaridad con la tabla periódica',
        'Capacidad para balancear ecuaciones y resolver problemas estequiométricos',
      ],
      'Biología': [
        'Estudiantes de Primaria y Secundaria',
        'Conocimientos de biología general',
        'Comprensión de conceptos de botánica, zoología y ecología',
        'Habilidad para identificar y clasificar organismos',
      ],
      'Geografía': [
        'Estudiantes de Primaria y Secundaria',
        'Conocimientos de geografía física y humana',
        'Familiaridad con mapas y coordenadas geográficas',
        'Comprensión de fenómenos naturales y sociales',
      ],
    };
    return requisitos[nombreArea] || [
      'Estudiantes de Primaria o Secundaria',
      'Interés y conocimientos básicos en el área',
      'Compromiso con el proceso de evaluación',
    ];
  };

  const generarPDFConvocatoria = (area: AreaConvocatoria) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Logo y encabezado
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Olimpiada Oh! SanSi", pageWidth / 2, y, { align: "center" });
    y += 8;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text("Olimpiada en Ciencias y Tecnología", pageWidth / 2, y, { align: "center" });
    y += 6;
    pdf.text("Universidad Mayor de San Simón", pageWidth / 2, y, { align: "center" });
    y += 6;
    pdf.text("Cochabamba, Bolivia", pageWidth / 2, y, { align: "center" });
    y += 10;

    // Título de la convocatoria
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONVOCATORIA ESPECÍFICA", pageWidth / 2, y, { align: "center" });
    y += 8;

    // Línea decorativa
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Área
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`ÁREA: ${area.nombre.toUpperCase()}`, margin, y);
    y += 10;

    // Descripción
    if (area.descripcion) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("DESCRIPCIÓN DEL ÁREA:", margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      const descLines = pdf.splitTextToSize(area.descripcion, pageWidth - 2 * margin);
      pdf.text(descLines, margin, y);
      y += descLines.length * 5 + 8;
    }

    // Requisitos de Participación
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("REQUISITOS DE PARTICIPACIÓN", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const requisitos = getRequisitosPorArea(area.nombre);
    requisitos.forEach((req, index) => {
      pdf.text(`${index + 1}. ${req}`, margin + 5, y);
      y += 5;
    });
    y += 5;

    // Materiales Necesarios
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("MATERIALES Y RECURSOS NECESARIOS", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const materiales = getMaterialesPorArea(area.nombre);
    materiales.forEach((mat, index) => {
      pdf.text(`• ${mat}`, margin + 5, y);
      y += 5;
    });
    y += 5;

    // Fase Clasificatoria
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    if (area.evalInicio && area.evalFin) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, y - 5, pageWidth - 2 * margin, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.text("FASE CLASIFICATORIA", margin + 2, y + 2);
      pdf.setTextColor(0, 0, 0);
      y += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Período de Evaluación:", margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.text(`  ${formatearRango(area.evalInicio, area.evalFin)}`, margin, y);
      y += 6;
      pdf.text(`  Fecha de Inicio: ${formatearFecha(area.evalInicio)}`, margin + 5, y);
      y += 5;
      pdf.text(`  Fecha de Cierre: ${formatearFecha(area.evalFin)}`, margin + 5, y);
      y += 8;

      if (area.pubInicio && area.pubFin) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Publicación de Resultados:", margin, y);
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.text(`  ${formatearRango(area.pubInicio, area.pubFin)}`, margin, y);
        y += 6;
        pdf.text(`  Fecha de Inicio: ${formatearFecha(area.pubInicio)}`, margin + 5, y);
        y += 5;
        pdf.text(`  Fecha de Cierre: ${formatearFecha(area.pubFin)}`, margin + 5, y);
        y += 8;
      }
    }

    // Fase Final
    if (area.evalFinalInicio && area.evalFinalFin) {
      if (y > 240) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(249, 115, 22);
      pdf.rect(margin, y - 5, pageWidth - 2 * margin, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.text("FASE FINAL", margin + 2, y + 2);
      pdf.setTextColor(0, 0, 0);
      y += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Período de Evaluación:", margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.text(`  ${formatearRango(area.evalFinalInicio, area.evalFinalFin)}`, margin, y);
      y += 6;
      pdf.text(`  Fecha de Inicio: ${formatearFecha(area.evalFinalInicio)}`, margin + 5, y);
      y += 5;
      pdf.text(`  Fecha de Cierre: ${formatearFecha(area.evalFinalFin)}`, margin + 5, y);
      y += 8;

      if (area.pubFinalInicio && area.pubFinalFin) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Publicación de Resultados:", margin, y);
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.text(`  ${formatearRango(area.pubFinalInicio, area.pubFinalFin)}`, margin, y);
        y += 6;
        pdf.text(`  Fecha de Inicio: ${formatearFecha(area.pubFinalInicio)}`, margin + 5, y);
        y += 5;
        pdf.text(`  Fecha de Cierre: ${formatearFecha(area.pubFinalFin)}`, margin + 5, y);
        y += 8;
      }
    }

    // Información de Contacto
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    if (area.coordinadores && area.coordinadores.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("INFORMACIÓN DE CONTACTO", margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("Coordinador(es) del Área:", margin, y);
      y += 6;
      area.coordinadores.forEach((coord) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(`  ${coord.nombre}`, margin + 5, y);
        y += 5;
        pdf.setFont("helvetica", "normal");
        pdf.text(`  Email: ${coord.email}`, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Premios y Reconocimientos
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("PREMIOS Y RECONOCIMIENTOS", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const premios = [
      "Medallas de Oro, Plata y Bronce para los primeros lugares",
      "Menciones de Honor para participantes destacados",
      "Certificados de participación para todos los competidores",
      "Reconocimiento público en la ceremonia de premiación",
      "Oportunidad de representar a Bolivia en competencias internacionales (según corresponda)",
    ];
    premios.forEach((premio, index) => {
      pdf.text(`${index + 1}. ${premio}`, margin + 5, y);
      y += 5;
    });
    y += 5;

    // Proceso de Evaluación
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROCESO DE EVALUACIÓN", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const proceso = [
      "La evaluación se realizará mediante pruebas escritas y/o prácticas según el área",
      "Los participantes serán evaluados por un jurado calificado de la Universidad Mayor de San Simón",
      "Los criterios de evaluación incluyen: precisión, razonamiento, creatividad y aplicación de conocimientos",
      "Los resultados serán publicados en el sitio web oficial de la olimpiada",
      "Los participantes clasificados a la fase final serán notificados por correo electrónico",
      "Las decisiones del jurado son inapelables y se basan en criterios objetivos y transparentes",
    ];
    proceso.forEach((item, index) => {
      pdf.text(`${index + 1}. ${item}`, margin + 5, y);
      y += 5;
    });
    y += 5;

    // Notas importantes
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(239, 68, 68);
    pdf.rect(margin, y - 5, pageWidth - 2 * margin, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text("NOTAS IMPORTANTES", margin + 2, y + 2);
    pdf.setTextColor(0, 0, 0);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const notas = [
      "Las fechas publicadas son únicas e inamovibles. No se programarán ampliaciones ni segundas fechas.",
      "Presentarse con 30 minutos de anticipación al lugar de evaluación y portar documento de identidad original.",
      "Cualquier actualización extraordinaria será notificada por correo electrónico y redes sociales oficiales.",
      "El uso de dispositivos electrónicos no autorizados durante la evaluación resultará en descalificación inmediata.",
      "Los participantes deben respetar las normas de conducta establecidas por la organización.",
      "La inscripción debe realizarse a través del portal oficial de la olimpiada antes de la fecha límite.",
      "Para consultas específicas sobre el área, contactar directamente al coordinador correspondiente.",
      "Los resultados de la fase clasificatoria determinarán el acceso a la fase final.",
    ];
    notas.forEach((nota, index) => {
      const notaLines = pdf.splitTextToSize(`${index + 1}. ${nota}`, pageWidth - 2 * margin - 10);
      pdf.text(notaLines, margin + 5, y);
      y += notaLines.length * 4.5 + 3;
    });
    y += 5;

    // Lugar de Evaluación
    if (y > 240) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("LUGAR DE EVALUACIÓN", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lugar = [
      "Universidad Mayor de San Simón",
      "Campus Central - Cochabamba, Bolivia",
      "El lugar específico será comunicado con anticipación a los participantes inscritos",
      "Se recomienda llegar con anticipación para familiarizarse con las instalaciones",
    ];
    lugar.forEach((item, index) => {
      pdf.text(`${index + 1}. ${item}`, margin + 5, y);
      y += 5;
    });

    // Pie de página
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Universidad Mayor de San Simón - Cochabamba, Bolivia`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    pdf.save(`Convocatoria-${area.nombre.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      const currentScroll = carouselRef.current.scrollLeft;
      const newScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      carouselRef.current.scrollTo({ left: newScroll, behavior: "smooth" });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-8 sm:h-10 w-auto" />
              <span className="text-lg sm:text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
              </a>
              <Link
                href="/cronograma"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Etapas
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
              <Link
                href="/contactos"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </Link>
            </nav>

            {/* Desktop Login Button */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn className="h-4 w-4 mr-2" />
                  Acceso
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4 space-y-3 animate-in slide-in-from-top">
              <a 
                href="#inicio" 
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </a>
              <Link
                href="/cronograma"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Etapas
              </Link>
              <Link
                href="/resultados"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resultados
              </Link>
              <Link
                href="/medallero"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Medallero
              </Link>
              <Link
                href="/contactos"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Banner Section */}
      <section id="inicio" className="relative py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-blue-900 mb-3 sm:mb-4">
            Olimpiada Oh! SanSi
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-800 font-medium px-4">
            Olimpiada en Ciencias y Tecnología
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1 sm:mb-2">1,247</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Estudiantes Inscritos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1 sm:mb-2">6</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Áreas de Competencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1 sm:mb-2">89</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Instituciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1 sm:mb-2">15</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Años de Historia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Convocatorias Específicas Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-blue-900 mb-2">
              CONVOCATORIAS ESPECÍFICAS
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          {loadingAreas ? (
            <div className="text-center py-12 text-muted-foreground">Cargando convocatorias...</div>
          ) : areas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aún no hay convocatorias disponibles.
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => scrollCarousel("left")}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </button>

              <div
                ref={carouselRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth px-2 sm:px-12 hide-scrollbar snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {areas.map((area) => {
                  const areaNameKey = area.nombre.replace(/[áéíóúÁÉÍÓÚ]/g, (char) => {
                    const map: Record<string, string> = { á: "a", é: "e", í: "i", ó: "o", ú: "u", Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U" };
                    return map[char] || char;
                  });
                  const iconConfig = areaIcons[area.nombre] || areaIcons[areaNameKey] || { icon: FileText, color: "bg-blue-500" };
                  const IconComponent = iconConfig.icon;

                  return (
                    <div key={area.id} className="flex-shrink-0 w-[calc(100vw-2rem)] sm:w-[280px] md:w-64 snap-center snap-always">
                      <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg h-full">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 sm:mb-4">
                            <div className={`w-full h-full rounded-full ${iconConfig.color} flex items-center justify-center shadow-lg border-4 border-white`}>
                              <IconComponent className="h-10 w-10 sm:h-14 sm:w-14 text-white" />
                            </div>
                            <div className={`absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-full px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${iconConfig.color} border-2 border-white shadow-md`}>
                              <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">{area.nombre.toUpperCase()}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => generarPDFConvocatoria(area)}
                            variant="outline"
                            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 mt-4 sm:mt-8 text-xs sm:text-sm"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="truncate">{area.nombre}</span>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => scrollCarousel("right")}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-slate-50 border-t">
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
                  <a href="#inicio" className="hover:text-blue-600 transition-colors">
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