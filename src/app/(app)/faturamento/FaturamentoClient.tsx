"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  paginateItems,
} from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchAllOrdens } from "@/lib/ordens";
import {
  PERIOD_PRESET_LABELS,
  computeFaturamento,
  formatPct,
  formatPeriodLabel,
  resolvePeriodRange,
  toInputDate,
  type PeriodPreset,
} from "@/lib/faturamento";
import { calcularLucro, formatDate, formatMoney } from "@/lib/format";
import type { Ordem } from "@/types/ordem";

function KpiSkeleton() {
  return (
    <div className="card-surface animate-pulse p-4">
      <div className="h-3 w-24 rounded bg-border" />
      <div className="mt-4 h-7 w-28 rounded bg-border" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-error"
        : "text-foreground";

  return (
    <div className="card-surface p-4 sm:p-5">
      <p className="text-xs font-medium tracking-wide text-secondary uppercase">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function FaturamentoClient() {
  const now = useMemo(() => new Date(), []);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>("mes");
  const [monthValue, setMonthValue] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [yearValue, setYearValue] = useState(String(now.getFullYear()));
  const [customDe, setCustomDe] = useState(
    toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
  );
  const [customAte, setCustomAte] = useState(toInputDate(now));

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOrdens(await fetchAllOrdens());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar faturamento",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllOrdens();
        if (!active) return;
        setOrdens(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Falha ao carregar faturamento",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();
    return () => {
      active = false;
    };
  }, []);

  const range = useMemo(
    () =>
      resolvePeriodRange(preset, {
        now,
        monthValue,
        yearValue,
        customDe,
        customAte,
      }),
    [preset, now, monthValue, yearValue, customDe, customAte],
  );

  const filtersKey = `${preset}|${monthValue}|${yearValue}|${customDe}|${customAte}`;
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const safePage = pageState.key === filtersKey ? pageState.page : 1;

  function goToPage(next: number) {
    setPageState({ key: filtersKey, page: next });
  }

  const metrics = useMemo(
    () => computeFaturamento(ordens, range),
    [ordens, range],
  );

  const pageItems = useMemo(
    () => paginateItems(metrics.ordens, safePage, DEFAULT_PAGE_SIZE),
    [metrics.ordens, safePage],
  );

  const variacaoTone =
    metrics.variacaoReceitaPct === null
      ? "default"
      : metrics.variacaoReceitaPct >= 0
        ? "success"
        : "danger";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Faturamento
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? "Carregando…"
              : `${formatPeriodLabel(range)} · ${metrics.qtdOs} OS faturadas`}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary h-10"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={15} strokeWidth={1.75} aria-hidden />
          Atualizar
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_PRESET_LABELS) as PeriodPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`h-9 rounded-lg border px-3 text-sm font-medium transition ${
                preset === key
                  ? "border-primary/40 bg-primary/15 text-primary-light"
                  : "border-border bg-surface text-secondary hover:border-border hover:text-foreground"
              }`}
            >
              {PERIOD_PRESET_LABELS[key]}
            </button>
          ))}
        </div>

        {preset === "mes" ? (
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            className="input-field h-10 max-w-xs"
            aria-label="Mês"
          />
        ) : null}

        {preset === "ano" ? (
          <input
            type="number"
            min={2000}
            max={2100}
            value={yearValue}
            onChange={(e) => setYearValue(e.target.value)}
            className="input-field h-10 max-w-[8rem]"
            aria-label="Ano"
          />
        ) : null}

        {preset === "custom" ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={customDe}
              onChange={(e) => setCustomDe(e.target.value)}
              className="input-field h-10"
              aria-label="De"
            />
            <input
              type="date"
              value={customAte}
              onChange={(e) => setCustomAte(e.target.value)}
              className="input-field h-10"
              aria-label="Até"
            />
          </div>
        ) : null}
      </div>

      {error && <p className="alert-error">{error}</p>}

      {!loading && metrics.alertas.length > 0 ? (
        <div className="alert-warning flex items-start gap-3">
          <AlertTriangle
            size={16}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium">
              {metrics.alertas.length} OS sem preço ou sem custo no período
            </p>
            <p className="mt-1 text-xs opacity-90">
              {metrics.alertas
                .slice(0, 5)
                .map((o) => `#${o.numero}`)
                .join(", ")}
              {metrics.alertas.length > 5
                ? ` e mais ${metrics.alertas.length - 5}`
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Receita"
              value={formatMoney(metrics.receita)}
              hint={`${metrics.qtdOs} OS`}
            />
            <KpiCard label="Custo" value={formatMoney(metrics.custo)} />
            <KpiCard
              label="Lucro"
              value={formatMoney(metrics.lucro)}
              tone={metrics.lucro >= 0 ? "success" : "danger"}
            />
            <KpiCard
              label="Ticket médio"
              value={formatMoney(metrics.ticketMedio)}
            />
            <KpiCard
              label="Vs período anterior"
              value={formatPct(metrics.variacaoReceitaPct)}
              hint={`Anterior: ${formatMoney(metrics.receitaAnterior)}`}
              tone={variacaoTone}
            />
          </>
        )}
      </div>

      {!loading && metrics.variacaoReceitaPct !== null ? (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          {metrics.variacaoReceitaPct >= 0 ? (
            <TrendingUp size={13} className="text-success" aria-hidden />
          ) : (
            <TrendingDown size={13} className="text-error" aria-hidden />
          )}
          Receita {formatPct(metrics.variacaoReceitaPct)} em relação ao período
          anterior equivalente · lucro anterior{" "}
          {formatMoney(metrics.lucroAnterior)}
        </p>
      ) : null}

      <section className="card-surface flex max-h-[calc(100dvh-18rem)] flex-col overflow-hidden lg:max-h-[calc(100dvh-16rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-primary-light" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">
              OS do período
            </h2>
          </div>
          {!loading ? (
            <p className="text-xs text-muted">
              Total {formatMoney(metrics.receita)} · lucro{" "}
              {formatMoney(metrics.lucro)}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="min-h-0 flex-1 space-y-0 divide-y divide-border overflow-y-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : metrics.ordens.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
            <div>
              <ClipboardList
                size={22}
                className="mx-auto text-muted"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-foreground">
                Nenhuma OS faturada neste período
              </p>
              <p className="mt-1 text-xs text-muted">
                Considere OS entregues/resolvidas com preço &gt; 0.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden shrink-0 grid-cols-[4.5rem_1.3fr_6.5rem_7rem_5.5rem_5.5rem_5.5rem] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase lg:grid">
              <span>Nº</span>
              <span>Cliente</span>
              <span>Data</span>
              <span>Status</span>
              <span className="text-right">Custo</span>
              <span className="text-right">Preço</span>
              <span className="text-right">Lucro</span>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {pageItems.map((ordem) => {
                const lucro = calcularLucro(ordem.preco, ordem.custo);
                return (
                  <li key={ordem.id}>
                    <Link
                      href={`/ordens/${ordem.id}`}
                      className="grid gap-1.5 px-4 py-3 transition hover:bg-surface-elevated/50 lg:grid-cols-[4.5rem_1.3fr_6.5rem_7rem_5.5rem_5.5rem_5.5rem] lg:items-center lg:gap-3"
                    >
                      <span className="text-sm font-medium text-primary-light">
                        #{ordem.numero}
                      </span>
                      <span className="truncate text-sm text-foreground">
                        {ordem.clienteNome || "—"}
                      </span>
                      <span className="text-sm text-muted">
                        {formatDate(
                          ordem.dataConclusao ?? ordem.dataEmissao,
                        )}
                      </span>
                      <span>
                        <StatusBadge status={ordem.status} />
                      </span>
                      <span className="text-sm text-secondary lg:text-right">
                        {formatMoney(ordem.custo)}
                      </span>
                      <span className="text-sm text-secondary lg:text-right">
                        {formatMoney(ordem.preco)}
                      </span>
                      <span
                        className={`text-sm font-medium lg:text-right ${
                          lucro >= 0 ? "text-foreground" : "text-error"
                        }`}
                      >
                        {formatMoney(lucro)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={safePage}
              total={metrics.ordens.length}
              onPageChange={goToPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
