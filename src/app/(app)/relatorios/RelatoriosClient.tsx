"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  paginateItems,
} from "@/components/Pagination";
import { fetchAllOrdens } from "@/lib/ordens";
import {
  PERIOD_PRESET_LABELS,
  formatPeriodLabel,
  resolvePeriodRange,
  toInputDate,
  type PeriodPreset,
} from "@/lib/faturamento";
import {
  RELATORIO_HINTS,
  RELATORIO_LABELS,
  RELATORIO_TIPOS,
  formatDias,
  reportClientesAtivos,
  reportPorStatus,
  reportPorTecnico,
  reportProdutividade,
  reportResolucao,
  type RelatorioTipo,
} from "@/lib/relatorios";
import { formatDate, formatMoney } from "@/lib/format";
import type { Ordem } from "@/types/ordem";

function BarRow({
  label,
  value,
  max,
  right,
}: {
  label: string;
  value: number;
  max: number;
  right?: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;

  return (
    <div className="space-y-1.5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm text-foreground">{label}</span>
        <span className="shrink-0 text-sm text-secondary">
          {right ?? value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function RelatoriosClient() {
  const now = useMemo(() => new Date(), []);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<RelatorioTipo>("status");
  const [preset, setPreset] = useState<PeriodPreset>("mes");
  const [monthValue, setMonthValue] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [yearValue, setYearValue] = useState(String(now.getFullYear()));
  const [customDe, setCustomDe] = useState(
    toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
  );
  const [customAte, setCustomAte] = useState(toInputDate(now));

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllOrdens();
        if (!active) return;
        setOrdens(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar relatórios",
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

  const periodoLabel =
    tipo === "clientes_ativos"
      ? "Últimos 90 dias"
      : formatPeriodLabel(range);

  const statusRows = useMemo(
    () => reportPorStatus(ordens, range),
    [ordens, range],
  );
  const tecnicoRows = useMemo(
    () => reportPorTecnico(ordens, range),
    [ordens, range],
  );
  const produtividade = useMemo(
    () => reportProdutividade(ordens, range),
    [ordens, range],
  );
  const resolucao = useMemo(
    () => reportResolucao(ordens, range),
    [ordens, range],
  );
  const clientesAtivos = useMemo(
    () => reportClientesAtivos(ordens, now),
    [ordens, now],
  );

  const filtersKey = `${tipo}|${preset}|${monthValue}|${yearValue}|${customDe}|${customAte}`;
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;

  function goToPage(next: number) {
    setPageState({ key: filtersKey, page: next });
  }

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setOrdens(await fetchAllOrdens());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar relatórios",
      );
    } finally {
      setLoading(false);
    }
  }

  const statusMax = Math.max(...statusRows.map((r) => r.count), 0);
  const tecnicoMax = Math.max(...tecnicoRows.map((r) => r.qtdOs), 0);

  const clientesPage = paginateItems(
    clientesAtivos,
    page,
    DEFAULT_PAGE_SIZE,
  );
  const tecnicoPage = paginateItems(tecnicoRows, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Relatórios
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading ? "Carregando…" : `${RELATORIO_LABELS[tipo]} · ${periodoLabel}`}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary h-10"
          disabled={loading}
          onClick={() => void reload()}
        >
          <RefreshCw size={15} strokeWidth={1.75} aria-hidden />
          Atualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {RELATORIO_TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`h-9 rounded-lg border px-3 text-sm font-medium transition ${
              tipo === t
                ? "border-primary/40 bg-primary/15 text-primary-light"
                : "border-border bg-surface text-secondary hover:text-foreground"
            }`}
          >
            {RELATORIO_LABELS[t]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted">{RELATORIO_HINTS[tipo]}</p>

      {tipo !== "clientes_ativos" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_PRESET_LABELS) as PeriodPreset[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={`h-9 rounded-lg border px-3 text-sm font-medium transition ${
                    preset === key
                      ? "border-primary/40 bg-primary/15 text-primary-light"
                      : "border-border bg-surface text-secondary hover:text-foreground"
                  }`}
                >
                  {PERIOD_PRESET_LABELS[key]}
                </button>
              ),
            )}
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
      ) : null}

      {error && <p className="alert-error">{error}</p>}

      {loading ? (
        <div className="card-surface h-64 animate-pulse" />
      ) : tipo === "status" ? (
        <section className="card-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Contagem por status
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {statusRows.reduce((a, r) => a + r.count, 0)} OS no período
            </p>
          </div>
          {statusRows.every((r) => r.count === 0) ? (
            <EmptyReport />
          ) : (
            <div className="divide-y divide-border">
              {statusRows.map((row) => (
                <BarRow
                  key={row.status}
                  label={row.label}
                  value={row.count}
                  max={statusMax}
                  right={`${row.count} · ${row.pct.toFixed(0)}%`}
                />
              ))}
            </div>
          )}
        </section>
      ) : tipo === "tecnico" ? (
        <section className="card-surface flex max-h-[calc(100dvh-18rem)] flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Por técnico
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {tecnicoRows.length} técnico(s) · {tecnicoRows.reduce((a, r) => a + r.qtdOs, 0)} OS
            </p>
          </div>
          {tecnicoRows.length === 0 ? (
            <EmptyReport />
          ) : (
            <>
              <div className="hidden shrink-0 grid-cols-[1.4fr_5rem_1fr_1fr] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase sm:grid">
                <span>Técnico</span>
                <span className="text-right">OS</span>
                <span className="text-right">Receita</span>
                <span>Distribuição</span>
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {tecnicoPage.map((row) => (
                  <li
                    key={row.key}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[1.4fr_5rem_1fr_1fr] sm:items-center sm:gap-3"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {row.nome}
                    </span>
                    <span className="text-sm text-secondary sm:text-right">
                      {row.qtdOs}
                    </span>
                    <span className="text-sm text-secondary sm:text-right">
                      {formatMoney(row.receita)}
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{
                          width: `${
                            tecnicoMax > 0
                              ? Math.max((row.qtdOs / tecnicoMax) * 100, 4)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                total={tecnicoRows.length}
                onPageChange={goToPage}
              />
            </>
          )}
        </section>
      ) : tipo === "produtividade" ? (
        <section className="space-y-4">
          {produtividade.qtdComDatas === 0 ? (
            <div className="card-surface">
              <EmptyReport message="Nenhuma OS com emissão e conclusão no período." />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Tempo médio"
                value={formatDias(produtividade.mediaDias)}
              />
              <MetricCard
                label="Mediana"
                value={formatDias(produtividade.medianaDias)}
              />
              <MetricCard
                label="Mais rápida"
                value={formatDias(produtividade.minDias)}
              />
              <MetricCard
                label="Mais longa"
                value={formatDias(produtividade.maxDias)}
                hint={`${produtividade.qtdComDatas} OS com datas`}
              />
            </div>
          )}
        </section>
      ) : tipo === "resolucao" ? (
        <section className="space-y-4">
          {resolucao.total === 0 ? (
            <div className="card-surface">
              <EmptyReport />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Taxa de resolução"
                  value={
                    resolucao.taxaPct === null
                      ? "—"
                      : `${resolucao.taxaPct.toFixed(1)}%`
                  }
                />
                <MetricCard
                  label="Resolvidas"
                  value={String(resolucao.resolvidas)}
                />
                <MetricCard
                  label="Não resolvidas"
                  value={String(resolucao.naoResolvidas)}
                  hint={`${resolucao.total} OS no período`}
                />
              </div>
              <div className="card-surface p-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="bg-success"
                    style={{
                      width: `${resolucao.taxaPct ?? 0}%`,
                    }}
                  />
                  <div
                    className="bg-error/70"
                    style={{
                      width: `${100 - (resolucao.taxaPct ?? 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted">
                  Verde = resolvido · vermelho = não resolvido
                </p>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="card-surface flex max-h-[calc(100dvh-16rem)] flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-primary-light" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">
                Clientes ativos
              </h2>
            </div>
            <p className="text-xs text-muted">
              {clientesAtivos.length} cliente(s)
            </p>
          </div>
          {clientesAtivos.length === 0 ? (
            <EmptyReport message="Nenhum cliente com OS nos últimos 90 dias." />
          ) : (
            <>
              <div className="hidden shrink-0 grid-cols-[1.5fr_5rem_7rem] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase sm:grid">
                <span>Cliente</span>
                <span className="text-right">OS</span>
                <span className="text-right">Última OS</span>
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {clientesPage.map((row) => (
                  <li key={row.clienteId}>
                    <Link
                      href={
                        row.clienteId.startsWith("__")
                          ? "/clientes"
                          : `/clientes/${row.clienteId}`
                      }
                      className="grid gap-1 px-4 py-3 transition hover:bg-surface-elevated/50 sm:grid-cols-[1.5fr_5rem_7rem] sm:items-center sm:gap-3"
                    >
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.clienteNome}
                      </span>
                      <span className="text-sm text-secondary sm:text-right">
                        {row.qtdOs}
                      </span>
                      <span className="text-sm text-muted sm:text-right">
                        {formatDate(row.ultimaOs)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                total={clientesAtivos.length}
                onPageChange={goToPage}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-surface p-4 sm:p-5">
      <p className="text-xs font-medium tracking-wide text-secondary uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function EmptyReport({
  message = "Nenhum dado para este período.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <ClipboardList size={22} className="text-muted" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">{message}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <BarChart3 size={12} aria-hidden />
        Ajuste o período ou o tipo de relatório.
      </p>
    </div>
  );
}
