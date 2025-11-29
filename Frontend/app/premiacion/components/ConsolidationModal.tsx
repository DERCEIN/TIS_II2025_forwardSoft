"use client";

import React, { useState } from "react";

type AreaShort = {
  id: string;
  nombre: string;
};

export default function ConsolidationModal({
  open,
  areas,
  order,
  onClose,
  onConsolidate,
}: {
  open: boolean;
  areas: { id: string; nombre: string }[];
  order: string[];
  onClose: () => void;
  onConsolidate: (finalOrder: string[]) => void;
}) {
  const [method, setMethod] = useState<"aleatorio" | "manual">("aleatorio");
  const [localOrder, setLocalOrder] = useState<string[]>(order || areas.map(a => a.id));

  React.useEffect(() => {
    setLocalOrder(order && order.length ? order : areas.map(a => a.id));
  }, [open, order, areas]);

  function shuffle() {
    const arr = [...localOrder];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setLocalOrder(arr);
  }

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const arr = [...localOrder];
    [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    setLocalOrder(arr);
  }
  function moveDown(idx: number) {
    if (idx >= localOrder.length - 1) return;
    const arr = [...localOrder];
    [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
    setLocalOrder(arr);
  }

  return (
    <div style={{ display: open ? "block" : "none" }} className="fixed inset-0 bg-black/30 z-50">
      <div className="max-w-2xl mx-auto bg-white p-4 rounded mt-20 border">
        <h3 className="font-bold mb-2">Consolidar Listas — Elegir orden</h3>

        <div className="mb-3">
          <label className="mr-3">
            <input type="radio" checked={method==="aleatorio"} onChange={() => setMethod("aleatorio")} /> Aleatorio
          </label>
          <label className="ml-4">
            <input type="radio" checked={method==="manual"} onChange={() => setMethod("manual")} /> Manual
          </label>
        </div>

        {method === "aleatorio" && (
          <div className="mb-3">
            <button className="px-3 py-1 border rounded mr-2" onClick={() => shuffle()}>Generar orden aleatorio</button>
            <div className="text-sm text-gray-600 mt-2">Cada vez que presione aleatorio, se barajará el orden de las áreas.</div>
          </div>
        )}

        <div className="mb-3">
          <div className="font-medium mb-1">Orden de áreas (arriba = prioridad)</div>
          <div className="space-y-1">
            {localOrder.map((areaId, idx) => {
              const area = areas.find(a=>a.id===areaId)!;
              return (
                <div key={areaId} className="flex items-center justify-between border rounded p-2">
                  <div>{area?.nombre || areaId}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveUp(idx)} className="px-2 py-1 border rounded">↑</button>
                    <button onClick={() => moveDown(idx)} className="px-2 py-1 border rounded">↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
          <button onClick={() => onConsolidate(localOrder)} className="px-3 py-1 bg-green-600 text-white rounded">Consolidar</button>
        </div>
      </div>
    </div>
  );
}