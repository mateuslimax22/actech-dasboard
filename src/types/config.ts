import type { Timestamp } from "firebase/firestore";

/** Documento `config/loja` */
export type ConfigLoja = {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  garantiaPadraoDias?: number | null;
  updatedAt?: Timestamp;
};

/** Documento `config/counters` — sequência de OS */
export type ConfigCounters = {
  proximoNumeroOrdem: number;
  updatedAt?: Timestamp;
};
