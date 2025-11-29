export type Area = "Matemáticas" | "Informática" | "Química" | "Física" | "Biología"
export type Level = "Primaria" | "Secundaria"
export type MedalType = "Oro" | "Plata" | "Bronce"

export interface Olimpista {
  id: string
  nombre: string
  area: Area
  nivel: Level
  calificacion: number
  posicion?: number
  medalla?: MedalType
  tieneHonor?: boolean
}
export interface AreaPublication {
  area_nombre: string
  publicacion_inicio: string
  publicacion_fin: string
}
export interface PublishedResult {
  id: string
  tipo: "todo" | "area" | "nivel" | "area-nivel"
  area?: Area
  nivel?: Level
  olimpistas: Olimpista[]
  configPublicacion?: AreaPublication[]  
  fechaPublicacion: Date
}
