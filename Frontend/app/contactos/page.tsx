"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Mail, Phone, MessageCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConfiguracionService } from "@/lib/api";

interface Coordinador {
  id: number;
  nombre: string;
  email: string;
}

interface ContactoArea {
  area_competencia_id: number;
  area_nombre: string;
  area_descripcion?: string | null;
  coordinadores: Coordinador[];
}

export default function ContactosPage() {
  const [contactos, setContactos] = useState<ContactoArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarContactos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ConfiguracionService.getContactosPublico();

        const contactosData =
          response?.success && Array.isArray(response.data) ? response.data : [];

        setContactos(contactosData);
      } catch (error) {
        console.error("Error al cargar contactos:", error);
        setContactos([]);
        setError("No se pudieron cargar los contactos en este momento.");
      } finally {
        setLoading(false);
      }
    };

    cargarContactos();
  }, []);

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
              <a
                href="#"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
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

      {/* Contactos Section */}
      <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-blue-900 mb-2">
              CONTACTO - COORDINADORES DE ÁREA
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando contactos...</div>
          ) : error ? (
            <div className="max-w-2xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-center gap-3 py-6">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div className="text-sm text-red-700">{error}</div>
                </CardContent>
              </Card>
            </div>
          ) : contactos.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <Card className="border-dashed">
                <CardContent className="text-center py-8 space-y-2">
                  <p className="text-base font-medium text-foreground">Aún no hay contactos disponibles.</p>
                  <p className="text-sm text-muted-foreground">
                    Los coordinadores de área se mostrarán aquí cuando estén disponibles.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contactos.map((area) => (
                <Card key={area.area_competencia_id} className="border border-blue-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {area.area_nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                          {area.area_nombre}
                        </h3>
                        {area.area_descripcion && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {area.area_descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {area.coordinadores.length > 0 ? (
                      <div className="space-y-3">
                        {area.coordinadores.map((coordinador) => (
                          <div key={coordinador.id} className="border-t border-slate-200 pt-3">
                            <a
                              href={`mailto:${coordinador.email}`}
                              className="text-blue-600 hover:text-blue-800 underline font-medium text-sm block mb-2"
                            >
                              {coordinador.nombre}
                            </a>
                            <div className="space-y-1.5">
                              <a
                                href={`mailto:${coordinador.email}`}
                                className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                <span>{coordinador.email}</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 italic">
                          Coordinador no asignado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <span className="text-white font-bold">O</span>
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

