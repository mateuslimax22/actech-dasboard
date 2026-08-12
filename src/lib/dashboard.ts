import { calcularLucro, toDate } from "@/lib/format";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import {
  ORDEM_STATUS,
  ORDEM_STATUS_ABERTOS,
  ORDEM_STATUS_LABELS,
} from "@/types/ordem";

export type MonthRef = {
  year: number;
  month: number; // 0-11
};

export type RevenueDay = {
  dateKey: string;
  label: string;
  receita: number;
};

export type DashboardMetrics = {
  osAbertas: number;
  prontasRetirada: number;
  receitaMes: number;
  lucroMes: number;
  ticketMedio: number;
  osEmitidasMes: number;
  osHoje: number;
  osPagasMes: number;
  funil: Array<{ status: OrdemStatus; label: string; count: number }>;
  prontas: Ordem[];
  ultimasOs: Ordem[];
  receitaPorDia: RevenueDay[];
  totalOrdens: number;
  isMesAtual: boolean;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonthRef(date: Date, ref: MonthRef): boolean {
  return date.getFullYear() === ref.year && date.getMonth() === ref.month;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shortDayLabel(date: Date): string {
  return String(date.getDate()).padStart(2, "0");
}

export function monthRefToInputValue(ref: MonthRef): string {
  return `${ref.year}-${String(ref.month + 1).padStart(2, "0")}`;
}

export function inputValueToMonthRef(value: string): MonthRef | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return null;
  return { year, month };
}

export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const date = new Date(ref.year, ref.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function formatMonthLabel(ref: MonthRef): string {
  const date = new Date(ref.year, ref.month, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function currentMonthRef(now = new Date()): MonthRef {
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Melhor mês inicial: último mês com dados; senão mês atual */
export function getDefaultMonthRef(ordens: Ordem[], now = new Date()): MonthRef {
  let latest: Date | null = null;

  for (const ordem of ordens) {
    const d = toDate(ordem.dataConclusao) ?? toDate(ordem.dataEmissao);
    if (d && (!latest || d > latest)) {
      latest = d;
    }
  }

  if (latest) {
    return { year: latest.getFullYear(), month: latest.getMonth() };
  }

  return currentMonthRef(now);
}

function isFaturadaNoMes(ordem: Ordem, ref: MonthRef): boolean {
  if (!ordem.preco || ordem.preco <= 0) return false;
  if (ordem.status === "CANCELADA") return false;

  const conclusao = toDate(ordem.dataConclusao);
  if (conclusao && isSameMonthRef(conclusao, ref)) {
    return ordem.status === "ENTREGUE" || ordem.resolvido;
  }

  const emissao = toDate(ordem.dataEmissao);
  if (
    emissao &&
    isSameMonthRef(emissao, ref) &&
    (ordem.status === "ENTREGUE" || ordem.resolvido)
  ) {
    return true;
  }

  return false;
}

function belongsToMonth(ordem: Ordem, ref: MonthRef): boolean {
  const emissao = toDate(ordem.dataEmissao);
  if (emissao && isSameMonthRef(emissao, ref)) return true;
  const conclusao = toDate(ordem.dataConclusao);
  if (conclusao && isSameMonthRef(conclusao, ref)) return true;
  return false;
}

export function computeDashboardMetrics(
  ordens: Ordem[],
  monthRef: MonthRef,
  now = new Date(),
): DashboardMetrics {
  const today = startOfDay(now);
  const isMesAtual =
    monthRef.year === now.getFullYear() && monthRef.month === now.getMonth();
  const abertos = new Set<string>(ORDEM_STATUS_ABERTOS);

  let osAbertas = 0;
  let prontasRetirada = 0;
  let receitaMes = 0;
  let lucroMes = 0;
  let osPagasMes = 0;
  let osEmitidasMes = 0;
  let osHoje = 0;

  const funilCounts = Object.fromEntries(
    ORDEM_STATUS.map((s) => [s, 0]),
  ) as Record<OrdemStatus, number>;

  const prontas: Ordem[] = [];

  const daysInMonth = new Date(monthRef.year, monthRef.month + 1, 0).getDate();
  const receitaByDay = new Map<string, number>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(monthRef.year, monthRef.month, day);
    receitaByDay.set(dateKey(d), 0);
  }

  for (const ordem of ordens) {
    const emissao = toDate(ordem.dataEmissao);
    const noMes = Boolean(emissao && isSameMonthRef(emissao, monthRef));

    // KPIs de fila respeitam o mês (emissão no mês selecionado)
    if (noMes && abertos.has(ordem.status)) {
      osAbertas += 1;
    }
    if (noMes && ordem.status === "PRONTA") {
      prontasRetirada += 1;
      prontas.push(ordem);
    }

    if (noMes) {
      osEmitidasMes += 1;
      if (isMesAtual && emissao && isSameDay(emissao, today)) {
        osHoje += 1;
      }
    }

    if (!belongsToMonth(ordem, monthRef)) {
      continue;
    }

    funilCounts[ordem.status] = (funilCounts[ordem.status] ?? 0) + 1;

    if (isFaturadaNoMes(ordem, monthRef)) {
      receitaMes += ordem.preco;
      lucroMes += calcularLucro(ordem.preco, ordem.custo);
      osPagasMes += 1;

      const diaRef = toDate(ordem.dataConclusao) ?? emissao;
      if (diaRef && isSameMonthRef(diaRef, monthRef)) {
        const key = dateKey(startOfDay(diaRef));
        if (receitaByDay.has(key)) {
          receitaByDay.set(key, (receitaByDay.get(key) ?? 0) + ordem.preco);
        }
      }
    }
  }

  const ultimasOs = [...ordens]
    .sort((a, b) => {
      const da = toDate(a.dataEmissao)?.getTime() ?? 0;
      const db = toDate(b.dataEmissao)?.getTime() ?? 0;
      if (db !== da) return db - da;
      return (b.numero || 0) - (a.numero || 0);
    })
    .slice(0, 5);

  prontas.sort((a, b) => {
    const da =
      toDate(a.dataConclusao)?.getTime() ?? toDate(a.updatedAt)?.getTime() ?? 0;
    const db =
      toDate(b.dataConclusao)?.getTime() ?? toDate(b.updatedAt)?.getTime() ?? 0;
    return db - da;
  });

  const funil = ORDEM_STATUS.map((status) => ({
    status,
    label: ORDEM_STATUS_LABELS[status],
    count: funilCounts[status] ?? 0,
  }));

  const receitaPorDia: RevenueDay[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(monthRef.year, monthRef.month, day);
    const key = dateKey(d);
    receitaPorDia.push({
      dateKey: key,
      label: shortDayLabel(d),
      receita: receitaByDay.get(key) ?? 0,
    });
  }

  return {
    osAbertas,
    prontasRetirada,
    receitaMes,
    lucroMes,
    ticketMedio: osPagasMes > 0 ? receitaMes / osPagasMes : 0,
    osEmitidasMes,
    osHoje,
    osPagasMes,
    funil,
    prontas: prontas.slice(0, 8),
    ultimasOs,
    receitaPorDia,
    totalOrdens: ordens.length,
    isMesAtual,
  };
}
