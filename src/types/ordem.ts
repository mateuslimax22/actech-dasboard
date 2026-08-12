import type { Timestamp } from "firebase/firestore";

export const ORDEM_STATUS = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_PECA",
  "AGUARDANDO_APROVACAO",
  "EM_SERVICO",
  "PRONTA",
  "ENTREGUE",
  "CANCELADA",
  "SEM_RESOLUCAO",
] as const;

export type OrdemStatus = (typeof ORDEM_STATUS)[number];

export const ORDEM_STATUS_LABELS: Record<OrdemStatus, string> = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  AGUARDANDO_PECA: "Aguardando peça",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  EM_SERVICO: "Em serviço",
  PRONTA: "Pronta",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
  SEM_RESOLUCAO: "Sem resolução",
};

/** Status que ainda estão na fila operacional da oficina */
export const ORDEM_STATUS_ABERTOS: OrdemStatus[] = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_PECA",
  "AGUARDANDO_APROVACAO",
  "EM_SERVICO",
  "PRONTA",
];

export type Ordem = {
  id: string;
  /** Número amigável sequencial exibido na UI / impressão */
  numero: number;
  chamado: string;
  atendenteId?: string | null;
  atendenteNome?: string | null;
  clienteId: string;
  clienteNome: string;
  servico?: string | null;
  tecnicoId?: string | null;
  tecnicoNome?: string | null;
  dataEmissao: Timestamp;
  dataExecucao?: Timestamp | null;
  previsao?: Timestamp | null;
  /** Sempre number (nunca string "R$155,00") */
  custo: number;
  preco: number;
  resolvido: boolean;
  dataConclusao?: Timestamp | null;
  status: OrdemStatus;
  obs?: string | null;
  /** Equipamento recebido */
  listaEntrada?: string | null;
  descricaoChamado?: string | null;
  resolucao?: string | null;
  diagnosticoTecnico?: string | null;
  /** ID original do CSV, se importado */
  legacyId?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type OrdemInput = Omit<Ordem, "id" | "createdAt" | "updatedAt">;
