"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Plus, Search } from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  paginateItems,
} from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchAllOrdens } from "@/lib/ordens";
import { filterOrdens } from "@/lib/ordensFilters";
import { fetchActiveTecnicos } from "@/lib/tecnicos";
import { formatDate, formatMoney } from "@/lib/format";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS, ORDEM_STATUS_LABELS } from "@/types/ordem";
import type { Tecnico } from "@/types/tecnico";

function initialStatus(value: string | null): OrdemStatus | "" {
  if (value && (ORDEM_STATUS as readonly string[]).includes(value)) {
    return value as OrdemStatus;
  }
  return "";
}

export default function OrdensListClient() {
  const searchParams = useSearchParams();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<OrdemStatus | "">(
    () => initialStatus(searchParams.get("status")),
  );
  const [tecnicoId, setTecnicoId] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = `${debouncedSearch}|${status}|${tecnicoId}|${de}|${ate}`;
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;

  function goToPage(next: number) {
    setPageState({ key: filtersKey, page: next });
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordensData, tecnicosData] = await Promise.all([
          fetchAllOrdens(),
          fetchActiveTecnicos(),
        ]);
        if (!active) return;
        setOrdens(ordensData);
        setTecnicos(tecnicosData);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar ordens",
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

  const filtered = useMemo(
    () =>
      filterOrdens(ordens, {
        search: debouncedSearch,
        status,
        tecnicoId,
        de,
        ate,
      }),
    [ordens, debouncedSearch, status, tecnicoId, de, ate],
  );

  const pageItems = useMemo(
    () => paginateItems(filtered, page, DEFAULT_PAGE_SIZE),
    [filtered, page],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Ordens
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? "Carregando…"
              : `${filtered.length} de ${ordens.length} OS`}
          </p>
        </div>
        <Link href="/ordens/nova" className="btn-primary h-10">
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          Nova OS
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field h-11 pl-10"
            placeholder="Buscar nº, cliente, chamado…"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrdemStatus | "")}
          className="input-field h-11"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {ORDEM_STATUS.map((s) => (
            <option key={s} value={s}>
              {ORDEM_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
          className="input-field h-11"
          aria-label="Filtrar por técnico"
        >
          <option value="">Todos os técnicos</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1 lg:grid-cols-1 lg:gap-3 xl:grid-cols-2">
          <input
            type="date"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className="input-field h-11"
            aria-label="Data inicial"
          />
          <input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            className="input-field h-11"
            aria-label="Data final"
          />
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="card-surface flex max-h-[calc(100dvh-16rem)] flex-col overflow-hidden lg:max-h-[calc(100dvh-13rem)]">
        {loading ? (
          <div className="min-h-0 flex-1 space-y-0 divide-y divide-border overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
            <div>
              <ClipboardList
                size={22}
                className="mx-auto text-muted"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-foreground">
                {debouncedSearch || status || tecnicoId || de || ate
                  ? "Nenhuma OS encontrada"
                  : "Nenhuma OS cadastrada"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {debouncedSearch || status || tecnicoId || de || ate
                  ? "Ajuste os filtros e tente de novo."
                  : "Abra a primeira ordem de serviço."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden shrink-0 grid-cols-[4.5rem_1.2fr_1.4fr_7.5rem_1fr_5.5rem_5.5rem] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase lg:grid">
              <span>Nº</span>
              <span>Cliente</span>
              <span>Chamado</span>
              <span>Status</span>
              <span>Técnico</span>
              <span>Data</span>
              <span className="text-right">Preço</span>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {pageItems.map((ordem) => (
                <li key={ordem.id}>
                  <Link
                    href={`/ordens/${ordem.id}`}
                    className="grid gap-1.5 px-4 py-3 transition hover:bg-surface-elevated/50 lg:grid-cols-[4.5rem_1.2fr_1.4fr_7.5rem_1fr_5.5rem_5.5rem] lg:items-center lg:gap-3"
                  >
                    <span className="text-sm font-medium text-primary-light">
                      #{ordem.numero}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {ordem.clienteNome || "—"}
                    </span>
                    <span className="truncate text-sm text-secondary">
                      {ordem.chamado || "—"}
                    </span>
                    <span>
                      <StatusBadge status={ordem.status} />
                    </span>
                    <span className="truncate text-sm text-muted">
                      {ordem.tecnicoNome || "—"}
                    </span>
                    <span className="text-sm text-muted">
                      {formatDate(ordem.dataEmissao)}
                    </span>
                    <span className="text-sm text-secondary lg:text-right">
                      {formatMoney(ordem.preco)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              total={filtered.length}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
