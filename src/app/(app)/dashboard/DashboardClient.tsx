"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Cake,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { getAniversariantesDoDia } from "@/lib/aniversariantes";
import { fetchAllClientes } from "@/lib/clientes";
import { fetchAllOrdens } from "@/lib/ordens";
import type { Cliente } from "@/types/cliente";
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
      <div className="mt-4 h-7 w-16 rounded bg-border" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}) {
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card-surface block p-4 transition hover:border-primary/40 sm:p-5"
      >
        {content}
      </Link>
    );
  }

  return <div className="card-surface p-4 sm:p-5">{content}</div>;
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
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex h-44 items-end gap-0.5 sm:gap-1">
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

function PanelHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-xs font-medium text-primary-light hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default function DashboardClient() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [month, setMonth] = useState<MonthRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordensData, clientesData] = await Promise.all([
          fetchAllOrdens(),
          fetchAllClientes(),
        ]);
        if (!active) return;
        setOrdens(ordensData);
        setClientes(clientesData);
        setMonth((current) => current ?? getDefaultMonthRef(ordensData));
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar dashboard",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [ordensData, clientesData] = await Promise.all([
        fetchAllOrdens(),
        fetchAllClientes(),
      ]);
      setOrdens(ordensData);
      setClientes(clientesData);
      setMonth((current) => current ?? getDefaultMonthRef(ordensData));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => {
    if (!month) return null;
    return computeDashboardMetrics(ordens, month);
  }, [ordens, month]);

  const aniversariantes = useMemo(
    () => getAniversariantesDoDia(clientes),
    [clientes],
  );

  const funilMax = useMemo(() => {
    if (!metrics) return 1;
    return Math.max(...metrics.funil.map((f) => f.count), 1);
  }, [metrics]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {month ? formatMonthLabel(month) : "Carregando…"}
            {metrics ? ` · ${metrics.osEmitidasMes} OS emitidas no mês` : null}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {month ? (
            <MonthFilter value={month} onChange={setMonth} disabled={loading} />
          ) : null}
          <button
            type="button"
            onClick={() => void reload()}
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
        </div>
      </div>

      {error && (
        <div className="alert-error flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-2 text-sm font-medium underline-offset-2 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !metrics ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="OS abertas"
              value={String(metrics.osAbertas)}
              hint="Emitidas no mês, ainda na fila"
              href="/ordens"
              icon={Wrench}
            />
            <KpiCard
              label="Prontas"
              value={String(metrics.prontasRetirada)}
              hint="Do mês, aguardando retirada"
              href="/ordens?status=PRONTA"
              icon={PackageCheck}
            />
            <KpiCard
              label="Receita do mês"
              value={formatMoney(metrics.receitaMes)}
              hint={`${metrics.osPagasMes} OS faturadas`}
              href="/faturamento"
              icon={Wallet}
            />
            <KpiCard
              label={metrics.isMesAtual ? "OS do dia" : "Emitidas no mês"}
              value={String(
                metrics.isMesAtual ? metrics.osHoje : metrics.osEmitidasMes,
              )}
              hint={
                metrics.isMesAtual
                  ? `${metrics.osEmitidasMes} no mês todo`
                  : formatMonthLabel(month!)
              }
              href="/ordens"
              icon={CalendarDays}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Últimas OS */}
        <div className="card-surface flex flex-col overflow-hidden">
          <PanelHeader title="Últimas OS" href="/ordens" linkLabel="Ver todas" />
          {loading || !metrics ? (
            <div className="space-y-0 divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse bg-border/40" />
              ))}
            </div>
          ) : metrics.ultimasOs.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
              <div>
                <ClipboardList
                  size={20}
                  className="mx-auto text-muted"
                  aria-hidden
                />
                <p className="mt-2 text-sm text-muted">Nenhuma OS ainda</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {metrics.ultimasOs.map((ordem) => (
                <li key={ordem.id}>
                  <Link
                    href={`/ordens/${ordem.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-elevated/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        #{ordem.numero} · {ordem.clienteNome}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {formatDate(ordem.dataEmissao)}
                      </p>
                    </div>
                    <StatusBadge status={ordem.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="card-surface flex flex-col overflow-hidden">
          <PanelHeader
            title="Aniversariantes de hoje"
            href="/clientes"
            linkLabel="Clientes"
          />
          {loading ? (
            <div className="space-y-0 divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse bg-border/40" />
              ))}
            </div>
          ) : aniversariantes.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
              <div>
                <Cake size={20} className="mx-auto text-muted" aria-hidden />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Nenhum aniversariante hoje
                </p>
                <p className="mt-1 text-xs text-muted">
                  Cadastre a data de nascimento nos clientes.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {aniversariantes.slice(0, 8).map((cliente) => (
                <li key={cliente.id}>
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-elevated/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {cliente.nome}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {cliente.telefone || "Sem telefone"}
                      </p>
                    </div>
                    <Cake
                      size={14}
                      className="shrink-0 text-primary-light"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dinheiro */}
        <div className="card-surface flex flex-col overflow-hidden">
          <PanelHeader
            title="Financeiro do mês"
            href="/faturamento"
            linkLabel="Detalhes"
          />
          {loading || !metrics ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-border/40" />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="rounded-lg border border-border bg-background px-3 py-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Wallet size={13} aria-hidden />
                  Receita
                </div>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatMoney(metrics.receitaMes)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <TrendingUp size={13} aria-hidden />
                  Lucro
                </div>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    metrics.lucroMes >= 0 ? "text-foreground" : "text-error"
                  }`}
                >
                  {formatMoney(metrics.lucroMes)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-3">
                <p className="text-xs text-muted">Ticket médio</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatMoney(metrics.ticketMedio)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {metrics.osPagasMes} OS faturadas no mês
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Gráficos</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">
                Receita por dia
              </h3>
              {!loading && metrics ? (
                <span className="text-xs text-muted">
                  {formatMoney(
                    metrics.receitaPorDia.reduce((acc, d) => acc + d.receita, 0),
                  )}
                </span>
              ) : null}
            </div>
            {loading || !metrics ? (
              <div className="h-44 animate-pulse rounded-lg bg-border/60" />
            ) : (
              <RevenueBars
                days={metrics.receitaPorDia}
                emptyLabel="Sem receita neste mês"
              />
            )}
          </div>

          <div className="card-surface p-5">
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Funil de status
              <span className="ml-2 font-normal text-muted">(mês)</span>
            </h3>
            {loading || !metrics ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 animate-pulse rounded bg-border/60"
                  />
                ))}
              </div>
            ) : metrics.funil.every((f) => f.count === 0) ? (
              <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
                Nenhuma OS neste mês
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
                          style={{
                            width: `${(item.count / funilMax) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
