"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OlimpistaService, AuthService, ReporteService, AdminService } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  Trophy,
  Users,
  Settings,
  Calendar,
  UserCheck,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  LogOut,
  Target,
  Award,
  Download,
  Eye,
} from "lucide-react"
import Link from "next/link"

function CompetidoresPorAreaNivel() {
  const [departamentoId, setDepartamentoId] = useState<string | undefined>(undefined)
  const [nivelId, setNivelId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [competidores, setCompetidores] = useState<any[]>([])
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("nombre")
  const [estado, setEstado] = useState<string | undefined>(undefined)
  const [openView, setOpenView] = useState<boolean>(false)
  const [selected, setSelected] = useState<any | null>(null)

  // Datos de ejemplo para simulación (sin backend)
  const demoCompetidores: any[] = [
    {
      id: 2001,
      nombre_completo: "Ana Martínez Condori",
      documento_identidad: "44332211",
      unidad_educativa_nombre: "Colegio Nacional",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Superior",
      puntuacion: 95.5,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2002,
      nombre_completo: "Carlos López Vargas",
      documento_identidad: "11223344",
      unidad_educativa_nombre: "Colegio Técnico",
      departamento_nombre: "La Paz",
      area_nombre: "Física",
      nivel_nombre: "Primario",
      puntuacion: 65.0,
      inscripcion_estado: "no_clasificado",
    },
    {
      id: 2003,
      nombre_completo: "Juan Pérez Mamani",
      documento_identidad: "12345678",
      unidad_educativa_nombre: "Colegio San Simón",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Primario",
      puntuacion: 85.5,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2004,
      nombre_completo: "María González Quispe",
      documento_identidad: "87654321",
      unidad_educativa_nombre: "Colegio Bolivar",
      departamento_nombre: "Santa Cruz",
      area_nombre: "Matemáticas",
      nivel_nombre: "Secundario",
      puntuacion: 78.0,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2005,
      nombre_completo: "Roberto Fernández Torres",
      documento_identidad: "11223344",
      unidad_educativa_nombre: "Colegio Central",
      departamento_nombre: "La Paz",
      area_nombre: "Matemáticas",
      nivel_nombre: "Superior",
      puntuacion: 92.0,
      inscripcion_estado: "clasificado",
    },
  ]

  const SIMULATE = true

  const getDepartamentoName = (id?: string) => {
    if (!id) return ''
    const map: Record<string, string> = { 
      '1': 'Cochabamba', 
      '2': 'La Paz', 
      '3': 'Santa Cruz',
      '4': 'Oruro',
      '5': 'Potosí',
      '6': 'Chuquisaca',
      '7': 'Tarija',
      '8': 'Beni',
      '9': 'Pando'
    }
    return map[id] || ''
  }

  const getNivelName = (id?: string) => {
    if (!id || id === 'all') return ''
    const map: Record<string, string> = { '1': 'Primario', '2': 'Secundario', '3': 'Superior' }
    return map[id] || ''
  }

  const handleExportPDF = () => {
    // Generar un documento imprimible SOLO con la lista filtrada (departamento/nivel)
    const data = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
    const html = generatePrintableHTML(data, getDepartamentoName(departamentoId), getNivelName(nivelId))
    const w = window.open('', '_blank')
    if (!w) {
      alert('Por favor habilita las ventanas emergentes para permitir la exportación a PDF.')
      return
    }
    try {
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
    } catch (e) {
      console.error('Print error', e)
    }
  }

  const generatePrintableHTML = (rows: any[], departamentoLabel?: string, nivelLabel?: string) => {
    const today = new Date().toLocaleDateString()
    const head = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        p { margin: 0 0 12px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        @page { size: A4 portrait; margin: 16mm; }
        @media print { button { display: none; } }
      </style>
    `
    const header = `
      <h1>Lista de Competidores por Departamento y Nivel</h1>
      <p>Fecha: ${today}${departamentoLabel ? ' • Departamento: ' + departamentoLabel : ''}${nivelLabel ? ' • Nivel: ' + nivelLabel : ''}</p>
    `
    const tableRows = rows.map((c: any) => `
      <tr>
        <td>${escapeHtml(c.nombre_completo || c.olimpista_nombre || '')}</td>
        <td>${escapeHtml(c.departamento_nombre || '')}</td>
        <td>${escapeHtml(c.area_nombre || '')}</td>
        <td>${escapeHtml(c.nivel_nombre || '')}</td>
        <td>${escapeHtml(String(c.puntuacion ?? c.puntuacion_final ?? ''))}</td>
        <td>${escapeHtml(c.inscripcion_estado || c.estado || '')}</td>
      </tr>
    `).join('')
    const table = `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Departamento</th>
            <th>Área</th>
            <th>Nivel</th>
            <th>Puntuación</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `
    return `<!DOCTYPE html><html><head><meta charset="utf-8" />${head}</head><body>${header}${table}</body></html>`
  }

  const escapeHtml = (value: string) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const exportRowsToCSV = (data: any[], prefix: string) => {
    const headers = ["Nombre", "Departamento", "Área", "Nivel", "Puntaje", "Estado"]
    const rows: string[] = [headers.join(',')]
    ;(data as any[] || []).forEach((c: any) => {
      const row = [
        c.nombre_completo || c.olimpista_nombre || '',
        c.departamento_nombre || '-',
        c.area_nombre || '-',
        c.nivel_nombre || '-',
        String(c.puntuacion ?? c.puntuacion_final ?? ''),
        c.inscripcion_estado || c.estado || '-',
      ].map((v: string) => '"' + String(v).replace(/\"/g, '"') + '"')
      rows.push(row.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix}_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportClasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    try {
      // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'clasificacion' })
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'clasificado')
      if (rows.length === 0) {
        alert('No hay clasificados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'clasificados')
    } catch (e) {
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'clasificado')
      if (rows.length === 0) {
        alert('No hay clasificados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'clasificados')
    }
  }

  const handleExportPremiados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    try {
      // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'premiacion' })
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'premiado')
      if (rows.length === 0) {
        alert('No hay premiados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'premiados')
    } catch (e) {
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'premiado')
      if (rows.length === 0) {
        alert('No hay premiados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'premiados')
    }
  }

  const handleExportNoClasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'no_clasificado' })
    const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
      .filter((c: any) => (c.inscripcion_estado || c.estado) === 'no_clasificado')
    if (rows.length === 0) {
      alert('No hay no clasificados para exportar.')
      return
    }
    exportRowsToCSV(rows, 'no_clasificados')
  }

  const handleExportDesclasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'desclasificado' })
    const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
      .filter((c: any) => (c.inscripcion_estado || c.estado) === 'desclasificado')
    if (rows.length === 0) {
      alert('No hay desclasificados para exportar.')
      return
    }
    exportRowsToCSV(rows, 'desclasificados')
  }

  const fetchData = async () => {
    if (!departamentoId) return
    setLoading(true)
    setError("")
    try {
      const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
      // const res = await OlimpistaService.getByDepartamento(parseInt(departamentoId, 10), nivelParam)
      // const data = (res && (res as any).data) ? (res as any).data : []
      // setCompetidores(Array.isArray(data) ? data : [])
      
      // Por ahora usar datos de simulación filtrados por departamento
      const filteredData = demoCompetidores.filter(c => {
        const departamentoLabel = getDepartamentoName(departamentoId)
        return c.departamento_nombre === departamentoLabel
      })
      setCompetidores(filteredData)
    } catch (e: any) {
      setError(e?.message || "Error al cargar competidores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Cargar departamento por defecto; en simulación llena datos demo
    if (SIMULATE) {
      setDepartamentoId('1') // Cochabamba por defecto
      setCompetidores(demoCompetidores)
      return
    }
    const init = async () => {
      try {
        const me = await AuthService.getProfile()
        const dId = (me as any)?.data?.departamento_id
        if (dId) {
          setDepartamentoId(String(dId))
        }
      } catch {}
    }
    init()
  }, [])

  useEffect(() => {
    if (SIMULATE) return
    if (departamentoId) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamentoId, nivelId, sortBy, estado])

  return (
    <div className="space-y-4">
      {/* Toolbar superior */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="font-semibold text-foreground">Competidores</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCSV(applyClientFilters(competidores, { search, sortBy }))} disabled={loading || competidores.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            Exportar PDF
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleExportClasificados}>Lista Clasificados</Button>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleExportPremiados}>Lista Premiados</Button>
        </div>
      </div>

      {/* Caja informativa */}
      <div className="p-4 rounded-md border bg-muted/40">
        <div className="font-medium mb-1">Sistema de Evaluación</div>
        <div className="text-sm text-muted-foreground">Los competidores son evaluados por múltiples evaluadores para garantizar objetividad. La puntuación mostrada es el promedio.</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <Input placeholder="Buscar por nombre, doc, institución..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="min-w-[220px]">
          <Select value={departamentoId} onValueChange={(v) => { setDepartamentoId(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Cochabamba</SelectItem>
              <SelectItem value="2">La Paz</SelectItem>
              <SelectItem value="3">Santa Cruz</SelectItem>
              <SelectItem value="4">Oruro</SelectItem>
              <SelectItem value="5">Potosí</SelectItem>
              <SelectItem value="6">Chuquisaca</SelectItem>
              <SelectItem value="7">Tarija</SelectItem>
              <SelectItem value="8">Beni</SelectItem>
              <SelectItem value="9">Pando</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <Select value={nivelId} onValueChange={(v) => { setNivelId(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un nivel (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Primario</SelectItem>
              <SelectItem value="2">Secundario</SelectItem>
              <SelectItem value="3">Superior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <Select value={estado ?? 'all'} onValueChange={(v) => { setEstado(v === 'all' ? undefined : v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="clasificado">Clasificado</SelectItem>
              <SelectItem value="no_clasificado">No clasificado</SelectItem>
              <SelectItem value="desclasificado">Desclasificado</SelectItem>
              <SelectItem value="premiado">Premiado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Button variant={sortBy === 'nombre' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('nombre')}>Nombre</Button>
          <Button variant={sortBy === 'puntaje' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('puntaje')}>Puntuación</Button>
          <Button variant={sortBy === 'departamento' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('departamento')}>Departamento</Button>
          <Button variant={sortBy === 'area' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('area')}>Área</Button>
          <Button variant={sortBy === 'nivel' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('nivel')}>Nivel</Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={fetchData} disabled={!departamentoId || loading}>
            {loading ? "Cargando..." : "Buscar"}
          </Button>
          <Button variant="outline" onClick={() => exportCSV(applyClientFilters(competidores, { search, sortBy, estado }))} disabled={loading || competidores.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => { setSearch(""); setDepartamentoId(undefined); setNivelId(undefined); setEstado(undefined); setSortBy('nombre') }}>Limpiar</Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-3 mt-2">
        {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId }).length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6 border rounded-md">Sin datos</div>
        ) : (
          applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId }).map((c) => (
            <div key={c.id || c.inscripcion_id} className="p-4 border rounded-md bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-semibold text-foreground truncate">{c.nombre_completo || c.olimpista_nombre}</div>
                    <Badge className="bg-emerald-100 text-emerald-700">{(c.inscripcion_estado || c.estado || 'Desconocido').toString()}</Badge>
                    {renderRendimientoBadge(c.puntuacion ?? c.puntuacion_final)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div><span className="font-medium text-foreground">Documento:</span> {c.documento_identidad || '—'}</div>
                    <div><span className="font-medium text-foreground">Institución:</span> {c.unidad_educativa_nombre || '—'}</div>
                    <div className="flex gap-6">
                      <span><span className="font-medium text-foreground">Departamento:</span> {c.departamento_nombre || '—'}</span>
                      <span><span className="font-medium text-foreground">Área:</span> {c.area_nombre || '—'}</span>
                      <span><span className="font-medium text-foreground">Nivel:</span> {c.nivel_nombre || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-sm">
                    <span className="flex items-center gap-1"><span className="font-medium text-foreground">Puntuación:</span> {Number(c.puntuacion ?? c.puntuacion_final ?? 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelected(c); setOpenView(true) }}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm">⋯</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.nombre_completo || selected?.olimpista_nombre || 'Competidor'}</DialogTitle>
            <DialogDescription>Información relacionada del competidor seleccionado</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Documento:</span> {selected?.documento_identidad || selected?.olimpista_documento || '—'}</div>
            <div><span className="font-medium">Institución:</span> {selected?.unidad_educativa_nombre || '—'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Departamento:</span> {selected?.departamento_nombre || '—'}</div>
              <div><span className="font-medium">Área:</span> {selected?.area_nombre || '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Nivel:</span> {selected?.nivel_nombre || '—'}</div>
              <div><span className="font-medium">Puntuación:</span> {selected?.puntuacion ?? selected?.puntuacion_final ?? '—'}</div>
            </div>
            <div><span className="font-medium">Estado:</span> {selected?.inscripcion_estado || selected?.estado || '—'}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function applyClientFilters(
  data: any[],
  opts: { search: string; sortBy: string; estado?: string; departamentoId?: string; nivelId?: string }
) {
  const text = opts.search.trim().toLowerCase()
  let rows = data
  if (text) {
    rows = rows.filter((c) => {
      const haystack = [
        c.nombre_completo || c.olimpista_nombre || "",
        c.documento_identidad || c.doc || "",
        c.unidad_educativa_nombre || c.institucion || "",
      ].join(" ").toLowerCase()
      return haystack.includes(text)
    })
  }
  // Filtro por estado si se seleccionó (clasificado, no_clasificado, desclasificado, premiado)
  if (opts.estado) {
    const estadoSel = opts.estado
    rows = rows.filter((c) => String(c.inscripcion_estado || c.estado || '').toLowerCase() === estadoSel)
  }
  // Filtro por departamento si está seleccionado (usa id si existe, si no, compara por nombre)
  if (opts.departamentoId) {
    rows = rows.filter((c) => {
      const departamentoId = String(opts.departamentoId)
      const byId = c.departamento_id || c.departamentoId
      if (byId !== undefined && byId !== null && byId !== '') {
        return String(byId) === departamentoId
      }
      // Fallback por nombre (modo simulación)
      const departamentoLabel = (departamentoId === '1' ? 'Cochabamba' : departamentoId === '2' ? 'La Paz' : departamentoId === '3' ? 'Santa Cruz' : departamentoId === '4' ? 'Oruro' : departamentoId === '5' ? 'Potosí' : departamentoId === '6' ? 'Chuquisaca' : departamentoId === '7' ? 'Tarija' : departamentoId === '8' ? 'Beni' : departamentoId === '9' ? 'Pando' : '')
      return String(c.departamento_nombre || '').toLowerCase() === String(departamentoLabel).toLowerCase()
    })
  }
  // Filtro por nivel si está seleccionado (y distinto de 'all'); usa id si existe, o nombre como fallback
  if (opts.nivelId && opts.nivelId !== 'all') {
    rows = rows.filter((c) => {
      const nivelId = String(opts.nivelId)
      const byId = c.nivel_id || c.nivel_competencia_id || c.nivelNombreId
      if (byId !== undefined && byId !== null && byId !== '') {
        return String(byId) === nivelId
      }
      const nivelLabel = (nivelId === '1' ? 'Primario' : nivelId === '2' ? 'Secundario' : nivelId === '3' ? 'Superior' : '')
      return String(c.nivel_nombre || '').toLowerCase() === String(nivelLabel).toLowerCase()
    })
  }
  switch (opts.sortBy) {
    case "puntaje":
      rows = [...rows].sort((a, b) => (Number(b.puntuacion ?? b.puntuacion_final ?? 0) - Number(a.puntuacion ?? a.puntuacion_final ?? 0)))
      break
    case "departamento":
      rows = [...rows].sort((a, b) => String(a.departamento_nombre || "").localeCompare(String(b.departamento_nombre || "")))
      break
    case "area":
      rows = [...rows].sort((a, b) => String(a.area_nombre || "").localeCompare(String(b.area_nombre || "")))
      break
    case "nivel":
      rows = [...rows].sort((a, b) => String(a.nivel_nombre || "").localeCompare(String(b.nivel_nombre || "")))
      break
    default:
      rows = [...rows].sort((a, b) => String(a.nombre_completo || a.olimpista_nombre || "").localeCompare(String(b.nombre_completo || b.olimpista_nombre || "")))
  }
  return rows
}

function exportCSV(data: any[]) {
  const headers = ["Nombre", "Departamento", "Área", "Nivel", "Puntaje", "Estado"]
  const rows: string[] = [headers.join(',')]
  ;(data as any[] || []).forEach((c: any) => {
    const row = [
      c.nombre_completo || c.olimpista_nombre || '',
      c.departamento_nombre || '-',
      c.area_nombre || '-',
      c.nivel_nombre || '-',
      String(c.puntuacion ?? c.puntuacion_final ?? ''),
      c.inscripcion_estado || c.estado || '-',
    ].map((v: string) => '"' + String(v).replace(/\"/g, '"') + '"')
    rows.push(row.join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `competidores_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function renderRendimientoBadge(p: any) {
  const score = Number(p ?? 0)
  if (!isFinite(score) || score <= 0) return null
  if (score >= 90) return <Badge className="bg-lime-100 text-lime-800">Sobresaliente</Badge>
  if (score >= 75) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
  if (score >= 60) return <Badge className="bg-amber-100 text-amber-800">Regular</Badge>
  return <Badge className="bg-rose-100 text-rose-800">Bajo</Badge>
}
export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [areaName, setAreaName] = useState<string>("Matemáticas")
  const [realEvaluators, setRealEvaluators] = useState<any[]>([])
  const [loadingEvaluators, setLoadingEvaluators] = useState<boolean>(false)
  const [myArea, setMyArea] = useState<any>(null)
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [availableEvaluators, setAvailableEvaluators] = useState<any[]>([])
  const [loadingAvailableEvaluators, setLoadingAvailableEvaluators] = useState<boolean>(false)
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("")
  const [assigning, setAssigning] = useState<boolean>(false)

  // Coordinator is responsible for "Matemáticas" area
  const defaultArea = {
    name: areaName,
    participants: 245,
    capacity: 300,
    evaluators: 8,
    pendingEvaluations: 23,
    completedEvaluations: 167,
  }

  const stats = [
    {
      title: "Participantes en mi Área",
      value: String(myArea?.participants || 0),
      change: "+0",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Evaluaciones Pendientes",
      value: String(myArea?.pendingEvaluations || 0),
      change: "-0",
      trend: "down",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Evaluadores Asignados",
      value: String(realEvaluators.length),
      change: "+0",
      trend: "up",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Evaluaciones Completadas",
      value: String(myArea?.completedEvaluations || 0),
      change: "+0",
      trend: "up",
      icon: CheckCircle,
      color: "text-purple-600",
    },
  ]

  const recentParticipants = [
    {
      id: 1,
      name: "Juan Pérez Mamani",
      institution: "Colegio San Simón",
      registrationDate: "2025-03-15",
      status: "approved",
      score: null,
    },
    {
      id: 2,
      name: "María González Quispe",
      institution: "U.E. Bolivar",
      registrationDate: "2025-03-14",
      status: "evaluated",
      score: 85,
    },
    {
      id: 3,
      name: "Carlos López Vargas",
      institution: "Colegio Técnico",
      registrationDate: "2025-03-13",
      status: "pending",
      score: null,
    },
    {
      id: 4,
      name: "Ana Martínez Condori",
      institution: "Colegio Nacional",
      registrationDate: "2025-03-12",
      status: "evaluated",
      score: 92,
    },
  ]

  const evaluators = [
    {
      id: 1,
      name: "Dr. Roberto Fernández",
      email: "r.fernandez@umss.edu.bo",
      assignedParticipants: 31,
      completedEvaluations: 28,
      status: "active",
    },
    {
      id: 2,
      name: "Lic. Carmen Rojas",
      email: "c.rojas@umss.edu.bo",
      assignedParticipants: 29,
      completedEvaluations: 25,
      status: "active",
    },
    {
      id: 3,
      name: "Ing. Miguel Torres",
      email: "m.torres@umss.edu.bo",
      assignedParticipants: 32,
      completedEvaluations: 30,
      status: "active",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "evaluated":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado"
      case "evaluated":
        return "Evaluado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return "Desconocido"
    }
  }

  
  const fetchEvaluators = async () => {
    setLoadingEvaluators(true)
    try {
      console.log('Obteniendo evaluadores reales...')
      const response = await AdminService.getUsers()
      console.log('Respuesta de usuarios:', response)
      
      if (response.success && response.data) {
       
        const evaluators = response.data.filter((user: any) => 
          (user.role === 'evaluador' || user.rol === 'evaluador')
        )
        console.log('Evaluadores encontrados:', evaluators)
        setRealEvaluators(evaluators)
      } else {
        console.error('Error al obtener usuarios:', response.message)
        setRealEvaluators([])
      }
    } catch (error: any) {
      console.error('Error al obtener evaluadores:', error)
      setRealEvaluators([])
    } finally {
      setLoadingEvaluators(false)
    }
  }

  
  const fetchMyArea = async () => {
    try {
      const profile = await AuthService.getProfile()
      console.log('Perfil del coordinador:', profile)
      
      if (profile && profile.data) {
        const userData = profile.data
        const areaName = userData.area_nombre || userData.area || 'Matemáticas'
        setAreaName(areaName)
        
        
        const areaData = {
          name: areaName,
          participants: 0, 
          capacity: 300,
          evaluators: realEvaluators.length,
          pendingEvaluations: 0,
          completedEvaluations: 0,
        }
        setMyArea(areaData)
      }
    } catch (error: any) {
      console.error('Error al obtener perfil:', error)
      setMyArea(defaultArea)
    }
  }

  
  useEffect(() => {
    fetchEvaluators()
    fetchMyArea()
  }, [])

  
  useEffect(() => {
    if (realEvaluators.length > 0 && myArea) {
      setMyArea((prev: any) => ({
        ...prev,
        evaluators: realEvaluators.length
      }))
    }
  }, [realEvaluators])

  
  const fetchAvailableEvaluators = async () => {
    setLoadingAvailableEvaluators(true)
    try {
      console.log('Obteniendo evaluadores disponibles...')
      console.log('Evaluadores actualmente asignados:', realEvaluators)
      
      const response = await AdminService.getUsers()
      console.log('Respuesta de usuarios:', response)
      
      if (response.success && response.data) {
        
        const allEvaluators = response.data.filter((user: any) => 
          (user.role === 'evaluador' || user.rol === 'evaluador')
        )
        
        console.log('Todos los evaluadores:', allEvaluators)
        
        
        let available = allEvaluators
        
        
        if (realEvaluators.length > 0) {
          available = allEvaluators.filter((evaluator: any) => {
            const isAlreadyAssigned = realEvaluators.some(assigned => 
              String(assigned.id) === String(evaluator.id)
            )
            console.log(`Evaluador ${evaluator.name} (ID: ${evaluator.id}) - Ya asignado: ${isAlreadyAssigned}`)
            return !isAlreadyAssigned
          })
        } else {
          console.log('No hay evaluadores asignados, mostrando todos los evaluadores')
        }
        
        console.log('Evaluadores disponibles:', available)
        setAvailableEvaluators(available)
      } else {
        console.error('Error al obtener usuarios:', response.message)
        setAvailableEvaluators([])
      }
    } catch (error: any) {
      console.error('Error al obtener evaluadores disponibles:', error)
      setAvailableEvaluators([])
    } finally {
      setLoadingAvailableEvaluators(false)
    }
  }

 
  const handleOpenAssignModal = async () => {
    console.log('Abriendo modal de asignación...')
    console.log('Evaluadores asignados actualmente:', realEvaluators.length)
    setShowAssignModal(true)
    await fetchAvailableEvaluators()
  }

 
  const handleAssignEvaluator = async () => {
    if (!selectedEvaluator) {
      alert('Por favor selecciona un evaluador')
      return
    }

    setAssigning(true)
    try {
      console.log('Asignando evaluador:', selectedEvaluator)
      
     
      const evaluatorToAssign = availableEvaluators.find(e => e.id.toString() === selectedEvaluator)
      
      if (evaluatorToAssign) {
        
        setRealEvaluators(prev => [...prev, evaluatorToAssign])
        
        
        setAvailableEvaluators(prev => prev.filter(e => e.id.toString() !== selectedEvaluator))
        
       
        setShowAssignModal(false)
        setSelectedEvaluator("")
        
        alert(`Evaluador ${evaluatorToAssign.name || evaluatorToAssign.nombre} asignado exitosamente`)
      }
    } catch (error: any) {
      console.error('Error al asignar evaluador:', error)
      alert('Error al asignar evaluador. Inténtalo de nuevo.')
    } finally {
      setAssigning(false)
    }
  }

  
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedEvaluator("")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs">
                Coordinador - {myArea?.name || areaName}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  await AuthService.logout()
                } catch {}
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token')
                  window.location.href = '/login'
                }
              }}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Competidores de {myArea?.name || areaName}</h1>
              <p className="text-muted-foreground">Lista completa de competidores registrados en el área de {myArea?.name || areaName}, clasificados por nivel y estado de evaluación</p>
            </div>
            <div className="flex gap-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Evaluador
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Programar Evaluación
              </Button>
            </div>
          </div>
        </div>

        {/* Area Overview Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{myArea?.name || areaName}</h2>
                <p className="text-muted-foreground mb-4">Tu área de coordinación</p>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {myArea?.participants || 0} participantes
                  </span>
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {myArea?.evaluators || realEvaluators.length} evaluadores
                  </span>
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Capacidad: {myArea?.capacity || 300}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round(((myArea?.participants || 0) / (myArea?.capacity || 300)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground mb-3">Capacidad utilizada</p>
                <Progress value={((myArea?.participants || 0) / (myArea?.capacity || 300)) * 100} className="w-32" />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-0 h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="overview" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Participantes
            </TabsTrigger>
            <TabsTrigger 
              value="evaluators" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Evaluadores
            </TabsTrigger>
            <TabsTrigger 
              value="evaluations" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none"
            >
              Evaluaciones
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes Recientes
                  </CardTitle>
                  <CardDescription>Últimas inscripciones en {myArea?.name || areaName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">{participant.institution}</p>
                          <p className="text-xs text-muted-foreground">{participant.registrationDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.score && (
                            <Badge variant="outline" className="text-xs">
                              {participant.score} pts
                            </Badge>
                          )}
                          <Badge className={getStatusColor(participant.status)}>
                            {getStatusText(participant.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Ver todos los participantes
                  </Button>
                </CardContent>
              </Card>

              {/* Evaluation Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Progreso de Evaluaciones
                  </CardTitle>
                  <CardDescription>Estado actual de las evaluaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Evaluaciones Completadas</span>
                        <span className="text-sm text-muted-foreground">
                          {myArea?.completedEvaluations || 0} de {myArea?.participants || 0}
                        </span>
                      </div>
                      <Progress value={((myArea?.completedEvaluations || 0) / (myArea?.participants || 1)) * 100} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{myArea?.completedEvaluations || 0}</div>
                        <div className="text-sm text-green-600">Completadas</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-700">{myArea?.pendingEvaluations || 0}</div>
                        <div className="text-sm text-orange-600">Pendientes</div>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Programar Evaluaciones
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
          
          {/* Competidores por Área y Nivel */}
          <Card>
            <CardHeader className="sr-only">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Competidores de {myArea?.name || areaName}</CardTitle>
                  <CardDescription>Lista completa de competidores registrados en el área de {myArea?.name || areaName}, clasificados por nivel y estado de evaluación</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CompetidoresPorAreaNivel />
            </CardContent>
          </Card>
          </TabsContent>

          {/* Evaluators Tab */}
          <TabsContent value="evaluators" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evaluadores Asignados</CardTitle>
                    <CardDescription>Gestiona los evaluadores de {myArea?.name || areaName}</CardDescription>
                  </div>
                  <Button onClick={handleOpenAssignModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar Evaluador
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEvaluators ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando evaluadores...</p>
                  </div>
                ) : realEvaluators.length > 0 ? (
                  <div className="space-y-4">
                    {realEvaluators.map((evaluator) => (
                      <div key={evaluator.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{evaluator.name || evaluator.nombre}</h3>
                            <Badge variant="outline" className="text-green-600">
                              {evaluator.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {evaluator.area && (
                              <Badge variant="outline" className="text-blue-600">
                                {evaluator.area}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>{evaluator.email}</span>
                            <span>Área: {evaluator.area || 'Sin asignar'}</span>
                            <span>Registrado: {new Date(evaluator.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              Estado: {evaluator.is_active ? 'Activo' : 'Inactivo'}
                            </div>
                            <Progress
                              value={evaluator.is_active ? 100 : 0}
                              className="h-2"
                            />
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay evaluadores asignados a tu área</p>
                    <Button className="mt-4" onClick={handleOpenAssignModal}>
                      <Plus className="h-4 w-4 mr-2" />
                      Asignar Primer Evaluador
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-sm text-muted-foreground mt-2">Sistema de gestión de evaluaciones con calificación automática, seguimiento de progreso y generación de reportes de resultados</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Asignación de Evaluador */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Evaluador</DialogTitle>
            <DialogDescription>
              Selecciona un evaluador para asignar a tu área: {myArea?.name || areaName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingAvailableEvaluators ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Cargando evaluadores disponibles...</p>
              </div>
            ) : availableEvaluators.length > 0 ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Evaluadores Disponibles:</label>
                <Select value={selectedEvaluator} onValueChange={setSelectedEvaluator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evaluador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvaluators.map((evaluator) => (
                      <SelectItem key={evaluator.id} value={evaluator.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{evaluator.name || evaluator.nombre}</span>
                          <span className="text-xs text-muted-foreground">{evaluator.email}</span>
                          {evaluator.area && (
                            <span className="text-xs text-blue-600">Área: {evaluator.area}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay evaluadores disponibles para asignar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los evaluadores ya están asignados a áreas
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseAssignModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignEvaluator}
              disabled={!selectedEvaluator || assigning || availableEvaluators.length === 0}
            >
              {assigning ? "Asignando..." : "Asignar Evaluador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

