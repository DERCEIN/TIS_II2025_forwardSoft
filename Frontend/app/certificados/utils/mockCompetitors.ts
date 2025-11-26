export interface Competitor {
  id: number;
  name: string;
  area: string;
  grade: number;
  status: "Aprobado" | "Reprobado" | "Pendiente";
}

export const mockCompetitors: Competitor[] = [
  // ---------------- MATEMÁTICA ----------------
  { id: 1, name: "Juan Pérez", area: "Matemática", grade: 92, status: "Aprobado" },
  { id: 2, name: "María López", area: "Matemática", grade: 88, status: "Aprobado" },
  { id: 3, name: "Carlos Gómez", area: "Matemática", grade: 55, status: "Reprobado" },

  // ---------------- FÍSICA ----------------
  { id: 4, name: "Ana Martínez", area: "Física", grade: 90, status: "Aprobado" },
  { id: 5, name: "Luis Flores", area: "Física", grade: 75, status: "Aprobado" },
  { id: 6, name: "Pedro Rojas", area: "Física", grade: 40, status: "Reprobado" },

  // ---------------- QUÍMICA ----------------
  { id: 7, name: "Lucía Torres", area: "Química", grade: 95, status: "Aprobado" },
  { id: 8, name: "Jorge Vargas", area: "Química", grade: 82, status: "Aprobado" },
  { id: 9, name: "Fernanda Ríos", area: "Química", grade: 60, status: "Pendiente" },

  // ---------------- BIOLOGÍA ----------------
  { id: 10, name: "Samuel Aguilar", area: "Biología", grade: 89, status: "Aprobado" },
  { id: 11, name: "Gabriela Patiño", area: "Biología", grade: 73, status: "Aprobado" },
  { id: 12, name: "David Castillo", area: "Biología", grade: 45, status: "Reprobado" },

  // ---------------- INFORMÁTICA ----------------
  { id: 13, name: "Rodrigo Silva", area: "Informática", grade: 98, status: "Aprobado" },
  { id: 14, name: "Valeria Tejada", area: "Informática", grade: 81, status: "Aprobado" },
  { id: 15, name: "Cristian Soria", area: "Informática", grade: 58, status: "Pendiente" },

  // ---------------- ROBÓTICA ----------------
  { id: 16, name: "Diego Hincha", area: "Robótica", grade: 94, status: "Aprobado" },
  { id: 17, name: "Nicole Rada", area: "Robótica", grade: 78, status: "Aprobado" },
  { id: 18, name: "Ignacio Poma", area: "Robótica", grade: 51, status: "Reprobado" },
];