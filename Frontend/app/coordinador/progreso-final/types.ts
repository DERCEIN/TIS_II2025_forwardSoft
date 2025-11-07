export type Participante = {
  id: string;
  nombre: string;
  documento?: string;
  institucion?: string;
  area?: string;
  nivel: "Primario" | "Secundario" | "Superior";
  nota?: number | null;
  estado: "Clasificado" | "No clasificado" | "Descalificado" | "Pendiente" | "Evaluado";
  motivos?: string[];
  comentario?: string;
  evaluador?: string;
  fechaRegistro?: string;
};