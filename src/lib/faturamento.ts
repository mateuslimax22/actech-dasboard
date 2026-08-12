import { calcularLucro, toDate } from "@/lib/format";
import type { Ordem } from "@/types/ordem";

export type PeriodPreset = "dia" | "semana" | "mes" | "ano" | "custom";

export type DateRange = {
  start: Date;
  end: Date;
};

export type FaturamentoMetrics = {
  receita: number;
  custo: number;
  lucro: number;
  ticketMedio: number;
  qtdOs: number;
  /** variação % da receita vs período anterior equivalente (null se base = 0) */
  variacaoReceitaPct: number | null;
  receitaAnterior: number;
  lucroAnterior: number;
  /** OS do período consideradas no faturamento */
  ordens: Ordem[];
  /** OS no período sem preço ou sem custo (alerta) */
  alertas: Ordem[];
};

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  dia: "Hoje",
  semana: "Semana",
  mes: "Mês",
  ano: "Ano",
  custom: "Personalizado",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

/** Segunda-feira da semana da data */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseYmd(value: string, end = false): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
    end ? 999 : 0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolvePeriodRange(
  preset: PeriodPreset,
  options: {
    now?: Date;
    /** yyyy-mm para preset mes */
    monthValue?: string;
    /** yyyy para preset ano */
    yearValue?: string;
    customDe?: string;
    customAte?: string;
  } = {},
): DateRange {
  const now = options.now ?? new Date();

  if (preset === "dia") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }

  if (preset === "semana") {
    const start = startOfWeek(now);
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    return { start, end };
  }

  if (preset === "mes") {
    const match = (options.monthValue ?? "").match(/^(\d{4})-(\d{2})$/);
    const year = match ? Number(match[1]) : now.getFullYear();
    const month = match ? Number(match[2]) - 1 : now.getMonth();
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: endOfDay(new Date(year, month + 1, 0)),
    };
  }

  if (preset === "ano") {
    const year = Number(options.yearValue) || now.getFullYear();
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: endOfDay(new Date(year, 11, 31)),
    };
  }

  // custom
  const de =
    parseYmd(options.customDe ?? "", false) ??
    startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const ate =
    parseYmd(options.customAte ?? "", true) ?? endOfDay(now);
  if (de > ate) {
    return { start: startOfDay(ate), end: endOfDay(de) };
  }
  return { start: de, end: ate };
}

/** Período imediatamente anterior, mesma duração */
export function previousEquivalentRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

/** Data de referência financeira: conclusão, senão emissão */
export function dataFinanceira(ordem: Ordem): Date | null {
  return toDate(ordem.dataConclusao) ?? toDate(ordem.dataEmissao);
}

function inRange(date: Date | null, range: DateRange): boolean {
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

/** OS elegível para faturamento (entregue/resolvida, não cancelada) */
export function isOrdemFaturavel(ordem: Ordem): boolean {
  if (ordem.status === "CANCELADA") return false;
  return ordem.status === "ENTREGUE" || ordem.resolvido === true;
}

function sumPeriod(ordens: Ordem[], range: DateRange) {
  let receita = 0;
  let custo = 0;
  let qtdOs = 0;
  const list: Ordem[] = [];
  const alertas: Ordem[] = [];

  for (const ordem of ordens) {
    const data = dataFinanceira(ordem);
    if (!inRange(data, range)) continue;
    if (ordem.status === "CANCELADA") continue;

    // alerta: no período e (entregue/pronta/resolvida) sem preço ou sem custo
    if (
      (isOrdemFaturavel(ordem) || ordem.status === "PRONTA") &&
      (!ordem.preco || ordem.preco <= 0 || ordem.custo <= 0)
    ) {
      alertas.push(ordem);
    }

    if (!isOrdemFaturavel(ordem)) continue;
    if (!ordem.preco || ordem.preco <= 0) continue;

    receita += ordem.preco;
    custo += ordem.custo || 0;
    qtdOs += 1;
    list.push(ordem);
  }

  list.sort((a, b) => {
    const da = dataFinanceira(a)?.getTime() ?? 0;
    const db = dataFinanceira(b)?.getTime() ?? 0;
    return db - da;
  });

  alertas.sort((a, b) => (b.numero || 0) - (a.numero || 0));

  return { receita, custo, qtdOs, list, alertas };
}

export function computeFaturamento(
  ordens: Ordem[],
  range: DateRange,
): FaturamentoMetrics {
  const atual = sumPeriod(ordens, range);
  const prevRange = previousEquivalentRange(range);
  const anterior = sumPeriod(ordens, prevRange);

  const lucro = calcularLucro(atual.receita, atual.custo);
  const lucroAnterior = calcularLucro(anterior.receita, anterior.custo);

  let variacaoReceitaPct: number | null = null;
  if (anterior.receita > 0) {
    variacaoReceitaPct =
      ((atual.receita - anterior.receita) / anterior.receita) * 100;
  } else if (atual.receita > 0) {
    variacaoReceitaPct = 100;
  }

  return {
    receita: atual.receita,
    custo: atual.custo,
    lucro,
    ticketMedio: atual.qtdOs > 0 ? atual.receita / atual.qtdOs : 0,
    qtdOs: atual.qtdOs,
    variacaoReceitaPct,
    receitaAnterior: anterior.receita,
    lucroAnterior,
    ordens: atual.list,
    alertas: atual.alertas,
  };
}

export function formatPeriodLabel(range: DateRange): string {
  const sameDay =
    range.start.getFullYear() === range.end.getFullYear() &&
    range.start.getMonth() === range.end.getMonth() &&
    range.start.getDate() === range.end.getDate();

  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (sameDay) return fmt.format(range.start);
  return `${fmt.format(range.start)} – ${fmt.format(range.end)}`;
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
