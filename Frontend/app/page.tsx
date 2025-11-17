"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [activeNews, setActiveNews] = useState(0);

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

  const competitionAreas = [
    { name: "Matemáticas", participants: 245, icon: "📐" },
    { name: "Física", participants: 198, icon: "⚛️" },
    { name: "Química", participants: 167, icon: "🧪" },
    { name: "Biología", participants: 134, icon: "🧬" },
    { name: "Informática", participants: 103, icon: "💻" },
    { name: "Robótica", participants: 89, icon: "🤖" },
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
              <a
                href="#areas"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Áreas de Competencia
              </a>
              <Link
                href="/resultados"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Resultados
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

      {/* Competition Areas */}
      <section id="areas" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Áreas de Competencia</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Participa en las diferentes disciplinas científicas y tecnológicas de nuestra olimpiada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitionAreas.map((area, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{area.icon}</div>
                    <Badge variant="secondary" className="text-xs">
                      {area.participants} inscritos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">{area.name}</CardTitle>
                  <CardDescription className="text-sm">
                    Demuestra tus conocimientos en {area.name.toLowerCase()} y compite con los mejores estudiantes del
                    país
                  </CardDescription>
                  <div className="flex items-center mt-4 text-sm text-primary">
                    <Link href={`/resultados?area=${encodeURIComponent(area.name)}`}>
                      <span className="flex items-center cursor-pointer">
                        Ver resultados
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    Áreas de Competencia
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