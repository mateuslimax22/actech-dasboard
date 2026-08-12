"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  PackageCheck,
  RefreshCw,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { fetchAllOrdens } from "@/lib/ordens";
import type { Ordem } from "@/types/ordem";
import {
  computeDashboardMetrics,
  formatMonthLabel,
  getDefaultMonthRef,
  inputValueToMonthRef,
  monthRefToInputValue,
  shiftMonth,
  type DashboardMetrics,
  type MonthRef,
} from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";

function KpiSkeleton() {
  return (
    <div className="card-surface animate-pulse p-4">
      <div className="h-3 w-24 rounded bg-border" />
      <div className="mt-4 h-7 w-20 rounded bg-border" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}) {
  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-secondary uppercase">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-primary-light">
          <Icon size={15} strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function RevenueBars({
  days,
  emptyLabel,
}: {
  days: DashboardMetrics["receitaPorDia"];
  emptyLabel: string;
}) {
  const max = Math.max(...days.map((d) => d.receita), 0);

  if (max <= 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex h-40 items-end gap-0.5 sm:gap-1">
      {days.map((day) => {
        const height = Math.max(
          (day.receita / max) * 100,
          day.receita > 0 ? 6 : 2,
        );
        return (
          <div
            key={day.dateKey}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
            title={`${day.label}: ${formatMoney(day.receita)}`}
          >
            <div
              className="w-full rounded-sm bg-primary/80 transition group-hover:bg-primary"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function MonthFilter({
  value,
  onChange,
  disabled,
}: {
  value: MonthRef;
  onChange: (next: MonthRef) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(shiftMonth(value, -1))}
        className="btn-secondary h-10 w-10 px-0"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
      </button>

      <label className="relative min-w-[10.5rem] flex-1 sm:flex-none">
        <span className="sr-only">Filtrar por mês</span>
        <input
          type="month"
          disabled={disabled}
          value={monthRefToInputValue(value)}
          onChange={(e) => {
            const next = inputValueToMonthRef(e.target.value);
            if (next) onChange(next);
          }}
          className="input-field h-10 cursor-pointer pr-2 text-sm font-medium"
        />
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(shiftMonth(value, 1))}
        className="btn-secondary h-10 w-10 px-0"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function DashboardClient() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [month, setMonth] = useState<MonthRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOrdens();
      setOrdens(data);
      setMonth((current) => current ?? getDefaultMonthRef(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    if (!month) return null;
    return computeDashboardMetrics(ordens, month);
  }, [ordens, month]);

  const funilMax = useMemo(() => {
    if (!metrics) return 1;
    return Math.max(...metrics.funil.map((f) => f.count), 1);
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {month ? formatMonthLabel(month) : "Carregando…"}
            {metrics ? ` · ${metrics.totalOrdens} OS no sistema` : null}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {month ? (
            <MonthFilter value={month} onChange={setMonth} disabled={loading} />
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="btn-secondary h-10 px-3"
              aria-label="Atualizar"
            >
              <RefreshCw
                size={15}
                strokeWidth={1.75}
                className={loading ? "animate-spin" : undefined}
              />
            </button>
            <Link href="/ordens/nova" className="btn-primary h-10">
              <ClipboardPlus size={15} strokeWidth={1.75} aria-hidden />
              Nova OS
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 text-sm font-medium underline-offset-2 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading || !metrics ? (
          Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="OS abertas"
              value={String(metrics.osAbertas)}
              hint="Fila atual (não filtra por mês)"
              icon={Wrench}
            />
            <KpiCard
              label="Prontas p/ retirada"
              value={String(metrics.prontasRetirada)}
              hint="Fila atual"
              icon={PackageCheck}
            />
            <KpiCard
              label="Receita do mês"
              value={formatMoney(metrics.receitaMes)}
              hint={`${metrics.osPagasMes} OS faturadas`}
              icon={Wallet}
            />
            <KpiCard
              label="Lucro do mês"
              value={formatMoney(metrics.lucroMes)}
              hint="Receita − custo"
              icon={TrendingUp}
            />
            <KpiCard
              label="Ticket médio"
              value={formatMoney(metrics.ticketMedio)}
              hint="Receita ÷ OS pagas no mês"
              icon={Wallet}
            />
            <KpiCard
              label={metrics.isMesAtual ? "OS do dia" : "OS no mês"}
              value={String(
                metrics.isMesAtual ? metrics.osHoje : metrics.osEmitidasMes,
              )}
              hint={
                metrics.isMesAtual
                  ? `Emitidas hoje · ${metrics.osEmitidasMes} no mês`
                  : "Emitidas no mês selecionado"
              }
              icon={CalendarDays}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Receita por dia
              {month ? ` · ${formatMonthLabel(month)}` : null}
            </h2>
            {!loading && metrics ? (
              <span className="text-xs text-muted">
                {formatMoney(
                  metrics.receitaPorDia.reduce((acc, d) => acc + d.receita, 0),
                )}
              </span>
            ) : null}
          </div>
          {loading || !metrics ? (
            <div className="h-40 animate-pulse rounded-lg bg-border/60" />
          ) : (
            <RevenueBars
              days={metrics.receitaPorDia}
              emptyLabel="Sem receita neste mês"
            />
          )}
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Funil de status
            <span className="ml-2 font-normal text-muted">(mês)</span>
          </h2>
          {loading || !metrics ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-border/60" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {metrics.funil
                .filter((item) => item.count > 0)
                .map((item) => (
                  <li key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-secondary">{item.label}</span>
                      <span className="font-medium text-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${(item.count / funilMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              {metrics.funil.every((f) => f.count === 0) && (
                <p className="text-sm text-muted">
                  Nenhuma OS neste mês.
                </p>
              )}
            </ul>
          )}
        </div>
      </section>

      <section className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Prontas para retirada
            <span className="ml-2 font-normal text-muted">(fila atual)</span>
          </h2>
          <Link
            href="/ordens"
            className="text-xs font-medium text-primary-light hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {loading || !metrics ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-border/60" />
            ))}
          </div>
        ) : metrics.prontas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <PackageCheck
              size={22}
              strokeWidth={1.5}
              className="mx-auto text-muted"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              Nenhuma OS pronta
            </p>
            <p className="mt-1 text-xs text-muted">
              Quando uma ordem ficar com status Pronta, ela aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {metrics.prontas.map((ordem) => (
              <li key={ordem.id}>
                <Link
                  href={`/ordens/${ordem.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:bg-surface-elevated/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      #{ordem.numero} · {ordem.clienteNome}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {ordem.chamado || "Sem chamado"} ·{" "}
                      {formatDate(ordem.dataConclusao ?? ordem.dataEmissao)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-secondary">
                    {formatMoney(ordem.preco)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
