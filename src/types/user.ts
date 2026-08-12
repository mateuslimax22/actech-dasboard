import type { Timestamp } from "firebase/firestore";
import type { TecnicoRole } from "./tecnico";

/** Documento `users/{uid}` — perfil do usuário autenticado */
export type AppUser = {
  id: string;
  nome: string;
  email: string;
  role: TecnicoRole;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type AppUserInput = Omit<AppUser, "id" | "createdAt" | "updatedAt">;
