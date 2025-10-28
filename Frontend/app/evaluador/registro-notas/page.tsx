"use client"

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNotifications } from "@/components/NotificationProvider";
import {
  Search, Save, Edit, CheckCircle, Clock, User, BookOpen, RefreshCw, AlertCircle
} from "lucide-react";
import { EvaluacionService, AuthService, EvaluadorService } from "@/lib/api";

type ParticipanteServer = any;

type Participante = {
  id: number;
  nombre: string;
  documento: string;
  unidad_educativa: string;
  area: string;
  nivel: string;
  nota_actual?: number | null;
  observaciones?: string | null;
  desclasificado?: boolean;
  justificacion_desclasificacion?: string | null;
  estado?: "pendiente" | "evaluado" | "revisado";
  fecha_evaluacion?: string | null;
};

export default function RegistroNotas() {
  const { success, error } = useNotifications();
  const router = useRouter();

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("todos");
  const [filterNivel, setFilterNivel] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [selectedDesclasificadoId, setSelectedDesclasificadoId] = useState<number | null>(null);
  const [globalJustificacion, setGlobalJustificacion] = useState("");
  const saveTimeouts = useRef<Record<number, number>>({});
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Map server row -> participante local (extendido con campos que necesitamos)
  const mapRow = (row: ParticipanteServer): Participante => {
    const id = Number(row.inscripcion_area_id || row.id || row.olimpista_id || row.participante_id);
    return {
      id,
      nombre: row.competidor || row.olimpista_nombre || row.nombre || `${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim(),
      documento: row.documento || row.olimpista_documento || row.documento_identidad || row.doc || "-",
      unidad_educativa: row.institucion || row.unidad_educativa_nombre || row.institucion_nombre || "-",
      area: row.area || row.area_nombre || "-",
      nivel: row.nivel || row.nivel_nombre || "-",
      nota_actual: row.nota_actual ?? row.puntaje ?? row.puntuacion ?? row.nota ?? row.puntuacion_final ?? null,
      observaciones: row.observaciones ?? row.descripcion_conceptual ?? "",
      desclasificado: !!row.desclasificado,
      justificacion_desclasificacion: row.justificacion_desclasificacion ?? "",
      estado: (row.estado || row.inscripcion_estado || "pendiente") as any,
      fecha_evaluacion: row.fecha_asignacion || row.fecha_evaluacion || row.updated_at || row.created_at || null
    };
  };

  const fetchParticipantes = async () => {
    setLoading(true);
    try {
      const res = await EvaluadorService.getEvaluaciones();
      const data = (res && (res as any).data) ? (res as any).data : [];
      const mapped = (Array.isArray(data) ? data : []).map(mapRow);
      setParticipantes(mapped);
    } catch (err) {
      console.error("Error cargando evaluaciones:", err);
      error("Error", "No se pudieron cargar las evaluaciones");
      setParticipantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParticipantes(); }, []);

  // Filtrado
  const participantesFiltrados = participantes.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.documento.includes(searchTerm) ||
      p.unidad_educativa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === "todos" || p.area === filterArea;
    const matchesNivel = filterNivel === "todos" || p.nivel === filterNivel;
    const matchesEstado = filterEstado === "todos" || p.estado === filterEstado;
    return matchesSearch && matchesArea && matchesNivel && matchesEstado;
  });

  // debounce autosave per participante
  const autosaveParticipante = (id: number, payload: Partial<Participante>) => {
    if (saveTimeouts.current[id]) {
      clearTimeout(saveTimeouts.current[id]);
    }
    saveTimeouts.current[id] = window.setTimeout(async () => {
      try {
        setSaving(true);

        // Validaciones antes de enviar
        const nota = payload.nota_actual ?? participantes.find(p => p.id === id)?.nota_actual;
        const observaciones = payload.observaciones ?? participantes.find(p => p.id === id)?.observaciones ?? "";
        const desclasificado = payload.desclasificado ?? participantes.find(p => p.id === id)?.desclasificado ?? false;
        const justificacion = payload.justificacion_desclasificacion ?? participantes.find(p => p.id === id)?.justificacion_desclasificacion ?? "";

        if (nota === null || nota === undefined || isNaN(Number(nota))) {
          throw new Error("La nota es obligatoria y debe ser un número.");
        }
        // nota entre 0 y 100 (ajusta a escala si tu nota es 0-10)
        if (Number(nota) < 0 || Number(nota) > 100) {
          throw new Error("La nota debe estar entre 0 y 100");
        }
        if (!observaciones || !String(observaciones).trim()) {
          throw new Error("La descripción conceptual es obligatoria");
        }
        if (desclasificado && (!justificacion || !String(justificacion).trim())) {
          throw new Error("Debe justificar la desclasificación");
        }

        // Payload para backend (ajustalo a lo que tu backend espera)
        const body = {
          inscripcion_area_id: id,
          puntuacion: Number(nota),
          observaciones: String(observaciones),
          desclasificado: desclasificado ? 1 : 0,
          justificacion_desclasificacion: desclasificado ? String(justificacion) : null,
          is_final: false
        };

        // Llamada al servicio (usa EvaluacionService si ya lo tienes; si no existe hace fetch directo)
        if (typeof EvaluacionService !== "undefined" && EvaluacionService.evaluarClasificacion) {
          await EvaluacionService.evaluarClasificacion(body);
        } else {
          const token = localStorage.getItem("token");
          const res = await fetch(`${apiBase}/api/evaluaciones/clasificacion`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
          });
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Error ${res.status}`);
          }
        }

        // actualizar UI local si no viene aún actualizado
        setParticipantes(prev => prev.map(p => p.id === id ? {
          ...p,
          nota_actual: Number(nota),
          observaciones,
          desclasificado,
          justificacion_desclasificacion: justificacion,
          estado: "evaluado",
          fecha_evaluacion: new Date().toISOString().split("T")[0]
        } : p));

        success("Guardado", "Cambios guardados automáticamente");
      } catch (err: any) {
        console.error("Auto-save error", err);
        error("Error", err?.message || "No se pudo guardar automáticamente");
      } finally {
        setSaving(false);
        if (saveTimeouts.current[id]) {
          clearTimeout(saveTimeouts.current[id]);
          delete saveTimeouts.current[id];
        }
      }
    }, 700);
  };

  // Handler genérico de cambios en fila
  const handleChangeField = (id: number, field: keyof Participante, value: any) => {
    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    // Si marcó desclasificado, seleccionar para justificar
    if (field === "desclasificado") {
      if (value === true) {
        setSelectedDesclasificadoId(id);
        const p = participantes.find(x => x.id === id);
        setGlobalJustificacion(p?.justificacion_desclasificacion ?? "");
      } else {
        // si desmarca: limpiar justificación asociada
        setSelectedDesclasificadoId(null);
      }
    }
    // programar autosave (salvo si es checkbox y quedó marcado sin justificación; autosave esperará justificación)
    const pAfter = { ...(participantes.find(x => x.id === id) ?? {}), [field]: value } as Participante;

    // If desclasificado true but no justification yet, do not autosave
    if (pAfter.desclasificado && (!pAfter.justificacion_desclasificacion || !pAfter.justificacion_desclasificacion.trim())) {
      // don't autosave until justification provided
      return;
    }

    // also ensure description exists before auto-saving
    if ((pAfter.nota_actual === null || pAfter.nota_actual === undefined || isNaN(Number(pAfter.nota_actual))) ||
        !pAfter.observaciones || !String(pAfter.observaciones).trim()) {
      // don't autosave until required fields present
      return;
    }

    autosaveParticipante(id, pAfter);
  };

  // cuando editas la global justification textarea, la guardamos en la fila correspondiente y autosave
  const handleSaveGlobalJustificacion = (value: string) => {
    if (!selectedDesclasificadoId) return;
    setGlobalJustificacion(value);
    // set en participante y autosave
    handleChangeField(selectedDesclasificadoId, "justificacion_desclasificacion", value);
    // Force autosave call (since we updated field and handleChangeField will have scheduled it if valid)
  };

  const handleManualEdit = (p: Participante) => {
    setSelectedDesclasificadoId(p.desclasificado ? p.id : null);
    setGlobalJustificacion(p.justificacion_desclasificacion ?? "");
    // Scroll to justificación maybe
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleFinalizarRegistro = async () => {
    try {
      setSaving(true);
      // Llamar a cerrar calificación (usa EvaluacionService.confirmarCierreCalificacion si existe)
      const areaId = 1; // si quieres obtener real, agrega lógica para detectar
      const nivelId = 1;
      if (EvaluacionService && EvaluacionService.confirmarCierreCalificacion) {
        const resp = await EvaluacionService.confirmarCierreCalificacion({ area_id: areaId, nivel_id: nivelId, fase: "clasificacion" });
        if (resp?.success) {
          success("Éxito", "Cierre de calificación confirmado.");
          await fetchParticipantes();
        } else {
          error("Error", resp?.message || "No se pudo cerrar la calificación");
        }
      } else {
        // si no existe servicio en lib, hacemos POST manual (ruta ya existe en router de backend)
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBase}/api/evaluador/confirmar-cierre-calificacion`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ area_id: 1, nivel_id: 1, fase: "clasificacion" })
        });
        const j = await res.json();
        if (res.ok) {
          success("Éxito", "Cierre de calificación confirmado.");
          await fetchParticipantes();
        } else {
          throw new Error(j?.message || "Error al confirmar cierre");
        }
      }
    } catch (err: any) {
      console.error("Error finalizando:", err);
      error("Error", err?.message || "No se pudo finalizar el registro");
    } finally {
      setSaving(false);
    }
  };

  const areasUnicas = [...new Set(participantes.map(p => p.area))];
  const nivelesUnicos = [...new Set(participantes.map(p => p.nivel))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
            <span>🏅</span> Evaluación Fase Clasificatoria
          </h1>
          <p className="text-sm text-gray-600">Gestiona las evaluaciones - los cambios se guardan automáticamente.</p>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2"><BookOpen className="h-5 w-5" /> Participantes Asignados</CardTitle>
                <CardDescription className="text-sm">{participantesFiltrados.length} participantes encontrados</CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                {saving ? "Guardando..." : "Guardado automático habilitado"}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando participantes...</span>
              </div>
            ) : participantesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay participantes</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nombre del Olimpista</TableHead>
                      <TableHead>Unidad Educativa</TableHead>
                      <TableHead className="w-24">Nota</TableHead>
                      <TableHead>Descripción Conceptual</TableHead>
                      <TableHead>Desclasificar</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantesFiltrados.map((p, idx) => (
                      <TableRow key={p.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="text-sm text-gray-600">{String(idx + 1).padStart(2, "0")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{p.nombre}</div>
                              <div className="text-xs text-gray-500">{p.documento}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{p.unidad_educativa}</div>
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            value={p.nota_actual ?? ""}
                            onChange={(e) => handleChangeField(p.id, "nota_actual", e.target.value === "" ? "" : Number(e.target.value))}
                            className="border p-1 w-20 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={p.observaciones ?? ""}
                            onChange={(e) => handleChangeField(p.id, "observaciones", e.target.value)}
                            className="border p-1 w-full text-sm"
                            placeholder="Descripción conceptual (obligatoria)"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={!!p.desclasificado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleChangeField(p.id, "desclasificado", checked);
                              if (checked) {
                                // focus / select this participant to justify
                                setSelectedDesclasificadoId(p.id);
                                setGlobalJustificacion(p.justificacion_desclasificacion ?? "");
                                // scroll to bottom where justification textarea will appear
                                setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 200);
                              } else {
                                // uncheck: remove selection
                                setSelectedDesclasificadoId(null);
                                setGlobalJustificacion("");
                                // immediately autosave removal of desclasificado
                                autosaveParticipante(p.id, { ...p, desclasificado: false, justificacion_desclasificacion: "" });
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleManualEdit(p)} className="h-8 px-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" onClick={() => autosaveParticipante(p.id, p)} className="h-8 px-2">
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Justificación global (aparece si hay al menos 1 desclasificado OR selected) */}
        { (selectedDesclasificadoId !== null || participantes.some(p => p.desclasificado)) && (
          <div className="mt-4">
            <Label className="text-sm font-medium">Justificación de desclasificación:</Label>
            <Textarea
              placeholder="Describa el motivo si el olimpista fue desclasificado..."
              value={globalJustificacion}
              onChange={(e) => setGlobalJustificacion(e.target.value)}
              onBlur={() => handleSaveGlobalJustificacion(globalJustificacion)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Los cambios se guardan automáticamente.</p>
          </div>
        )}

        {/* Footer acciones */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            <span>📝 Los cambios se guardan automáticamente.</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>Volver</Button>
            <Button onClick={handleFinalizarRegistro} className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
              {saving ? "Procesando..." : "Finalizar Registro"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
