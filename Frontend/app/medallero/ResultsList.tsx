import type { Olimpista } from "@/lib/types"

interface ResultsListProps {
  medallistas: Olimpista[]
  mencion: Olimpista[]
}

export default function ResultsList({ medallistas, mencion }: ResultsListProps) {
  const getMedalColor = (medal: string) => {
    switch (medal) {
      case "Oro":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Plata":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "Bronce":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return ""
    }
  }

  const getMedalIcon = (medal: string) => {
    switch (medal) {
      case "Oro":
        return "🥇"
      case "Plata":
        return "🥈"
      case "Bronce":
        return "🥉"
      default:
        return ""
    }
  }

  return (
  <div className="space-y-12 max-w-6xl mx-auto px-4">
    {/* Medallistas */}
    {medallistas.length > 0 && (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-primary text-center md:text-left">
          🏆 Medallistas
        </h2>
        <div className="bg-card rounded-xl shadow-lg overflow-x-auto border border-border">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-semibold">Posición</th>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Área</th>
                <th className="px-4 py-3 text-left font-semibold">Nivel</th>
                <th className="px-4 py-3 text-left font-semibold">Calificación</th>
                <th className="px-4 py-3 text-left font-semibold">Medalla</th>
              </tr>
            </thead>
            <tbody>
              {medallistas.map((olimpista, idx) => (
                <tr
                  key={olimpista.id}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted"}
                >
                  <td className="px-4 py-3 font-semibold text-primary">
                    #{olimpista.posicion}
                  </td>
                  <td className="px-4 py-3">{olimpista.nombre}</td>
                  <td className="px-4 py-3">{olimpista.area}</td>
                  <td className="px-4 py-3">{olimpista.nivel}</td>
                  <td className="px-4 py-3 font-semibold">{olimpista.calificacion}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getMedalColor(
                        olimpista.medalla || ""
                      )}`}
                    >
                      {getMedalIcon(olimpista.medalla || "")} {olimpista.medalla}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Mención de Honor */}
    {mencion.length > 0 && (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-accent text-center md:text-left">
          🎖️ Mención de Honor
        </h2>
        <div className="bg-card rounded-xl shadow-lg overflow-x-auto border border-border">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-accent text-accent-foreground">
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Área</th>
                <th className="px-4 py-3 text-left font-semibold">Nivel</th>
                <th className="px-4 py-3 text-left font-semibold">Calificación</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {mencion.map((olimpista, idx) => (
                <tr
                  key={olimpista.id}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted"}
                >
                  <td className="px-4 py-3">{olimpista.nombre}</td>
                  <td className="px-4 py-3">{olimpista.area}</td>
                  <td className="px-4 py-3">{olimpista.nivel}</td>
                  <td className="px-4 py-3 font-semibold">{olimpista.calificacion}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-300">
                      ✓ Mención de Honor
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Mensaje si no hay resultados */}
    {medallistas.length === 0 && mencion.length === 0 && (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No se encontraron resultados con los filtros seleccionados.</p>
      </div>
    )}
  </div>
)

}
