import type { Timestamp } from "firebase/firestore";

export const TECNICO_ROLES = ["tecnico", "atendente", "admin"] as const;

export type TecnicoRole = (typeof TECNICO_ROLES)[number];

export const TECNICO_ROLE_LABELS: Record<TecnicoRole, string> = {
  tecnico: "Técnico",
  atendente: "Atendente",
  admin: "Admin",
};

export type Tecnico = {
  id: string;
  nome: string;
  ativo: boolean;
  role: TecnicoRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TecnicoInput = Omit<Tecnico, "id" | "createdAt" | "updatedAt">;
