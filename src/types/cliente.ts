import type { Timestamp } from "firebase/firestore";

export type Cliente = {
  id: string;
  nome: string;
  nascimento?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  telefone?: string | null;
  email?: string | null;
  estado?: string | null;
  /** ID original do CSV, se importado */
  legacyId?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Payload para criar/atualizar (sem id e timestamps gerenciados pelo app) */
export type ClienteInput = Omit<Cliente, "id" | "createdAt" | "updatedAt">;
