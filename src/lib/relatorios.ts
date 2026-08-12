import { toDate } from "@/lib/format";
import type { DateRange } from "@/lib/faturamento";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS, ORDEM_STATUS_LABELS } from "@/types/ordem";

export type RelatorioTipo =
  | "status"
  | "tecnico"
  | "produtividade"
  | "resolucao"
  | "clientes_ativos";

export const RELATORIO_TIPOS: RelatorioTipo[] = [
  "status",
  "tecnico",
  "produtividade",
  "resolucao",
  "clientes_ativos",
];

export const RELATORIO_LABELS: Record<RelatorioTipo, string> = {
  status: "Por status",
  tecnico: "Por técnico",
  produtividade: "Produtividade",
  resolucao: "Taxa de resolução",
  clientes_ativos: "Clientes ativos",
};

export const RELATORIO_HINTS: Record<RelatorioTipo, string> = {
  status: "Contagem de OS emitidas no período, por status",
  tecnico: "Quantidade de OS e receita por técnico no período",
  produtividade: "Tempo médio entre emissão e conclusão",
  resolucao: "% de OS com resolvido = sim no período",
  clientes_ativos: "Clientes com OS nos últimos 90 dias",
};

function inRange(date: Date | null, range: DateRange): boolean {
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

/** OS emitidas no período */
export function ordensNoPeriodo(ordens: Ordem[], range: DateRange): Ordem[] {
  return ordens.filter((o) => inRange(toDate(o.dataEmissao), range));
}

export type StatusRow = {
  status: OrdemStatus;
  label: string;
  count: number;
  pct: number;
};

export function reportPorStatus(ordens: Ordem[], range: DateRange): StatusRow[] {
  const list = ordensNoPeriodo(ordens, range);
  const total = list.length;
  const counts = Object.fromEntries(ORDEM_STATUS.map((s) => [s, 0])) as Record<
    OrdemStatus,
    number
  >;

  for (const o of list) {
    counts[o.status] += 1;
  }

  return ORDEM_STATUS.map((status) => ({
    status,
    label: ORDEM_STATUS_LABELS[status],
    count: counts[status],
    pct: total > 0 ? (counts[status] / total) * 100 : 0,
  }));
}

export type TecnicoRow = {
  key: string;
  nome: string;
  qtdOs: number;
  receita: number;
};

export function reportPorTecnico(
  ordens: Ordem[],
  range: DateRange,
): TecnicoRow[] {
  const list = ordensNoPeriodo(ordens, range);
  const map = new Map<string, TecnicoRow>();

  for (const o of list) {
    const key = o.tecnicoId || o.tecnicoNome || "__sem__";
    const nome = o.tecnicoNome?.trim() || "Sem técnico";
    const current = map.get(key) ?? { key, nome, qtdOs: 0, receita: 0 };
    current.qtdOs += 1;
    if (o.status !== "CANCELADA" && o.preco > 0) {
      current.receita += o.preco;
    }
    map.set(key, current);
  }

  return [...map.values()].sort(
    (a, b) => b.qtdOs - a.qtdOs || b.receita - a.receita,
  );
}

export type ProdutividadeMetrics = {
  qtdComDatas: number;
  mediaDias: number | null;
  medianaDias: number | null;
  minDias: number | null;
  maxDias: number | null;
};

function diasEntre(inicio: Date, fim: Date): number {
  const ms = fim.getTime() - inicio.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

export function reportProdutividade(
  ordens: Ordem[],
  range: DateRange,
): ProdutividadeMetrics {
  const dias: number[] = [];

  for (const o of ordensNoPeriodo(ordens, range)) {
    const emissao = toDate(o.dataEmissao);
    const conclusao = toDate(o.dataConclusao);
    if (!emissao || !conclusao || conclusao < emissao) continue;
    dias.push(diasEntre(emissao, conclusao));
  }

  if (dias.length === 0) {
    return {
      qtdComDatas: 0,
      mediaDias: null,
      medianaDias: null,
      minDias: null,
      maxDias: null,
    };
  }

  const sorted = [...dias].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const mid = Math.floor(sorted.length / 2);
  const mediana =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return {
    qtdComDatas: sorted.length,
    mediaDias: sum / sorted.length,
    medianaDias: mediana,
    minDias: sorted[0],
    maxDias: sorted[sorted.length - 1],
  };
}

export type ResolucaoMetrics = {
  total: number;
  resolvidas: number;
  naoResolvidas: number;
  taxaPct: number | null;
};

export function reportResolucao(
  ordens: Ordem[],
  range: DateRange,
): ResolucaoMetrics {
  const list = ordensNoPeriodo(ordens, range).filter(
    (o) => o.status !== "CANCELADA",
  );
  const resolvidas = list.filter((o) => o.resolvido).length;
  const total = list.length;

  return {
    total,
    resolvidas,
    naoResolvidas: total - resolvidas,
    taxaPct: total > 0 ? (resolvidas / total) * 100 : null,
  };
}

export type ClienteAtivoRow = {
  clienteId: string;
  clienteNome: string;
  qtdOs: number;
  ultimaOs: Date | null;
};

export function reportClientesAtivos(
  ordens: Ordem[],
  now = new Date(),
): ClienteAtivoRow[] {
  const start = new Date(now);
  start.setDate(start.getDate() - 90);
  start.setHours(0, 0, 0, 0);

  const range: DateRange = { start, end: now };
  const list = ordensNoPeriodo(ordens, range);
  const map = new Map<string, ClienteAtivoRow>();

  for (const o of list) {
    const id = o.clienteId || o.clienteNome || "__sem__";
    const nome = o.clienteNome?.trim() || "Sem cliente";
    const emissao = toDate(o.dataEmissao);
    const current = map.get(id) ?? {
      clienteId: id,
      clienteNome: nome,
      qtdOs: 0,
      ultimaOs: null,
    };
    current.qtdOs += 1;
    if (emissao && (!current.ultimaOs || emissao > current.ultimaOs)) {
      current.ultimaOs = emissao;
    }
    map.set(id, current);
  }

  return [...map.values()].sort(
    (a, b) =>
      b.qtdOs - a.qtdOs ||
      (b.ultimaOs?.getTime() ?? 0) - (a.ultimaOs?.getTime() ?? 0),
  );
}

export function formatDias(value: number | null): string {
  if (value === null) return "—";
  if (value < 1) return `${Math.round(value * 24)}h`;
  return `${value.toFixed(1)} dias`;
}
