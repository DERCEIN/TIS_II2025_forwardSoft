export default function EvaluadoresActivos() {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-2">Evaluadores Activos</h2>
      <p>12 Activos / 3 Inactivos</p>
      <div className="w-full bg-gray-200 h-3 rounded mt-1">
        <div className="h-3 rounded bg-gray-800" style={{ width: "80%" }}></div>
      </div>
    </section>
  );
}