import type { Olimpista, Area, Level } from "./types"

const areas: Area[] = ["Matemáticas", "Informática", "Química", "Física", "Biología"]
const niveles: Level[] = ["Primaria", "Secundaria"]

export const generateMockOlimpistas = (): Olimpista[] => {
  const nombres = [
    "Ana García",
    "Carlos López",
    "Diana Martínez",
    "Javier Rodríguez",
    "Sofía Pérez",
    "Miguel Santos",
    "Laura Gómez",
    "Andrés Ruiz",
    "Elena Hernández",
    "Pablo Flores",
    "María Núñez",
    "Diego Vargas",
    "Isabella Reyes",
    "Fernando Acosta",
    "Valentina Silva",
    "Roberto Díaz",
  ]

  const olimpistas: Olimpista[] = []
  let id = 0

  for (const area of areas) {
    for (const nivel of niveles) {
      // Generar entre 6-12 olimpistas por área/nivel
      const cantidad = Math.floor(Math.random() * 7) + 6

      for (let i = 0; i < cantidad; i++) {
        const calificacion = Math.floor(Math.random() * 40) + 50 // 50-90

        let medalla: "Oro" | "Plata" | "Bronce" | undefined
        if (calificacion >= 85) medalla = "Oro"
        else if (calificacion >= 75) medalla = "Plata"
        else if (calificacion >= 70) medalla = "Bronce"

        olimpistas.push({
          id: `olimpista-${id++}`,
          nombre: nombres[Math.floor(Math.random() * nombres.length)] + ` ${id}`,
          area,
          nivel,
          calificacion,
          medalla,
          tieneHonor: !medalla && calificacion >= 65,
        })
      }
    }
  }

  // Ordenar por calificación dentro de cada área/nivel
  olimpistas.sort((a, b) => {
    if (a.area !== b.area) return a.area.localeCompare(b.area)
    if (a.nivel !== b.nivel) return a.nivel.localeCompare(b.nivel)
    return b.calificacion - a.calificacion
  })

  // Asignar posiciones dentro de cada área/nivel
  for (let i = 1; i < olimpistas.length; i++) {
    const prev = olimpistas[i - 1]
    const curr = olimpistas[i]
    if (prev.area === curr.area && prev.nivel === curr.nivel) {
      curr.posicion = i + 1
    } else {
      curr.posicion = 1
    }
  }
  olimpistas[0].posicion = 1

  return olimpistas
}

export { areas, niveles }
