"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import {
  fetchAllClientes,
  filterClientes,
} from "@/lib/clientes";
import type { Cliente } from "@/types/cliente";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  paginateItems,
} from "@/components/Pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function ClientesListClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllClientes();
        if (active) setClientes(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar clientes",
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
    () => filterClientes(clientes, debouncedSearch),
    [clientes, debouncedSearch],
  );

  const pageItems = useMemo(
    () => paginateItems(filtered, page, DEFAULT_PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? "Carregando…"
              : `${filtered.length} de ${clientes.length} clientes`}
          </p>
        </div>
        <Link href="/clientes/novo" className="btn-primary h-10">
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          Novo cliente
        </Link>
      </div>

      <div className="relative">
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
          placeholder="Buscar por nome, telefone ou cidade…"
        />
      </div>

      {error && <p className="alert-error">{error}</p>}

      {/* Lista limitada à viewport: paginação fica sempre visível */}
      <div className="card-surface flex max-h-[calc(100dvh-13.5rem)] flex-col overflow-hidden lg:max-h-[calc(100dvh-11.5rem)]">
        {loading ? (
          <div className="min-h-0 flex-1 space-y-0 divide-y divide-border overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
            <div>
              <Users size={22} className="mx-auto text-muted" aria-hidden />
              <p className="mt-3 text-sm font-medium text-foreground">
                {debouncedSearch
                  ? "Nenhum cliente encontrado"
                  : "Nenhum cliente cadastrado"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {debouncedSearch
                  ? "Tente outro termo de busca."
                  : "Cadastre o primeiro cliente para começar."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden shrink-0 grid-cols-[1.4fr_1fr_0.8fr] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase sm:grid">
              <span>Nome</span>
              <span>Telefone</span>
              <span>Cidade</span>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {pageItems.map((cliente) => (
                <li key={cliente.id}>
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="grid gap-1 px-4 py-3 transition hover:bg-surface-elevated/50 sm:grid-cols-[1.4fr_1fr_0.8fr] sm:items-center sm:gap-3"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {cliente.nome}
                    </span>
                    <span className="truncate text-sm text-secondary">
                      {cliente.telefone || "—"}
                    </span>
                    <span className="truncate text-sm text-muted">
                      {cliente.cidade || "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
