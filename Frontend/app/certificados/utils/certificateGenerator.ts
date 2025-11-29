export type Competitor = {
  id: number;
  nombre: string;
  unidad: string;
  area: string;
  nivel: string;
  puntaje: number;
  estado: string;
  puesto?: number | null;
};

export type Area = {
  id: string;
  nombre: string;
  approved: boolean;
  finalClosed?: boolean;
  competitors: Competitor[];
};

