"use client";
import React, { useEffect, useState } from "react";

type Props = {
  participante: {
    id: string;
    nombre: string;
    motivos?: string[];
    comentario?: string;
  };
  onClose: () => void;
  onSave: (id: string, motivos: string[], comentario: string) => void;
};

const ALL_MOTIVOS = [
  "No se presentó",
  "Documentación incompleta",
  "Copia o fraude detectado",
  "No cumple con criterios mínimos",
  "Otros"
];

export default function ChecklistDescalificacion({ participante, onClose, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>(participante.motivos ?? []);
  const [comentario, setComentario] = useState<string>(participante.comentario ?? "");

  useEffect(()=>{ setSelected(participante.motivos ?? []); setComentario(participante.comentario ?? ""); }, [participante]);

  function toggle(m: string) {
    setSelected((s) => (s.includes(m) ? s.filter(x => x !== m) : [...s, m]));
  }

  function handleSave() {
    onSave(participante.id, selected, comentario);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--card)] text-[var(--card-foreground)] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-heading font-semibold text-[var(--secondary)]">{participante.nombre}</h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)]">✕</button>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] mt-2 mb-4">Motivos de Descalificación (seleccionados por evaluador)</p>

        <div className="space-y-2">
          {ALL_MOTIVOS.map((m) => (
            <label key={m} className="flex items-center gap-3">
              <input type="checkbox" checked={selected.includes(m)} onChange={() => toggle(m)} className="accent-[var(--primary)]" />
              <span>{m}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm mb-1">Comentario</label>
          <textarea value={comentario} onChange={(e)=>setComentario(e.target.value)} className="w-full p-2 border rounded border-[var(--border)]" rows={4} />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn">Cancelar</button>
          <button onClick={handleSave} className="btn boton-primario">Guardar</button>
        </div>
      </div>
    </div>
  );
}