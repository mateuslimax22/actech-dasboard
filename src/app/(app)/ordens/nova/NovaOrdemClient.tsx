"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Search, UserPlus, X } from "lucide-react";
import {
  createCliente,
  fetchAllClientes,
  fetchClienteById,
  filterClientes,
} from "@/lib/clientes";
import { createOrdem } from "@/lib/ordens";
import { fetchActiveTecnicos } from "@/lib/tecnicos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Cliente } from "@/types/cliente";
import type { Tecnico } from "@/types/tecnico";

export default function NovaOrdemClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClienteId = searchParams.get("clienteId");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clienteSearch, setClienteSearch] = useState("");
  const debouncedClienteSearch = useDebouncedValue(clienteSearch, 250);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickNome, setQuickNome] = useState("");
  const [quickTelefone, setQuickTelefone] = useState("");
  const [creatingCliente, setCreatingCliente] = useState(false);

  const [chamado, setChamado] = useState("");
  const [listaEntrada, setListaEntrada] = useState("");
  const [descricaoChamado, setDescricaoChamado] = useState("");
  const [atendenteId, setAtendenteId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [clientesData, tecnicosData] = await Promise.all([
          fetchAllClientes(),
          fetchActiveTecnicos(),
        ]);
        if (!active) return;
        setClientes(clientesData);
        setTecnicos(tecnicosData);

        if (preselectedClienteId) {
          const found = clientesData.find((c) => c.id === preselectedClienteId);
          if (found) setSelectedCliente(found);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar dados",
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
  }, [preselectedClienteId]);

  const clienteResults = useMemo(() => {
    if (selectedCliente) return [];
    return filterClientes(clientes, debouncedClienteSearch).slice(0, 8);
  }, [clientes, debouncedClienteSearch, selectedCliente]);

  async function handleQuickCreate() {
    if (!quickNome.trim() || !quickTelefone.trim()) {
      setError("Nome e telefone são obrigatórios para criar o cliente.");
      return;
    }
    setCreatingCliente(true);
    setError(null);
    try {
      const id = await createCliente({
        nome: quickNome,
        telefone: quickTelefone,
        email: null,
        nascimento: null,
        endereco: null,
        cidade: null,
        estado: null,
        legacyId: null,
      });
      const novo = await fetchClienteById(id);
      if (!novo) throw new Error("Cliente criado, mas não foi possível carregar.");
      setClientes((prev) =>
        [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      );
      setSelectedCliente(novo);
      setShowQuickCreate(false);
      setQuickNome("");
      setQuickTelefone("");
      setClienteSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar cliente");
    } finally {
      setCreatingCliente(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedCliente) {
      setError("Selecione um cliente.");
      return;
    }
    if (!chamado.trim()) {
      setError("Informe o chamado / problema.");
      return;
    }

    const atendente = tecnicos.find((t) => t.id === atendenteId);
    const tecnico = tecnicos.find((t) => t.id === tecnicoId);

    setSubmitting(true);
    try {
      const id = await createOrdem({
        clienteId: selectedCliente.id,
        clienteNome: selectedCliente.nome,
        chamado,
        listaEntrada,
        descricaoChamado,
        atendenteId: atendente?.id ?? null,
        atendenteNome: atendente?.nome ?? null,
        tecnicoId: tecnico?.id ?? null,
        tecnicoNome: tecnico?.nome ?? null,
        previsao: previsao ? new Date(`${previsao}T12:00:00`) : null,
        obs,
      });
      router.push(`/ordens/${id}?created=1`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível abrir a OS.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
        <div className="card-surface h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/ordens"
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          Ordens
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Nova OS
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Abre com status Aberta e número sequencial automático.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card-surface space-y-5 p-5 sm:p-6"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              Cliente <span className="text-error">*</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-light hover:underline"
              onClick={() => setShowQuickCreate((v) => !v)}
            >
              <UserPlus size={13} strokeWidth={1.75} aria-hidden />
              Criar rápido
            </button>
          </div>

          {selectedCliente ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedCliente.nome}
                </p>
                <p className="truncate text-xs text-muted">
                  {selectedCliente.telefone || "Sem telefone"}
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => setSelectedCliente(null)}
                aria-label="Trocar cliente"
              >
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="input-field h-11 pl-10"
                placeholder="Buscar cliente por nome ou telefone…"
              />
              {debouncedClienteSearch.trim() && clienteResults.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface-elevated shadow-lg">
                  {clienteResults.map((cliente) => (
                    <li key={cliente.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-surface"
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setClienteSearch("");
                        }}
                      >
                        <span className="text-sm text-foreground">
                          {cliente.nome}
                        </span>
                        <span className="text-xs text-muted">
                          {cliente.telefone || "—"}
                          {cliente.cidade ? ` · ${cliente.cidade}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {debouncedClienteSearch.trim() && clienteResults.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Nenhum cliente encontrado. Use “Criar rápido”.
                </p>
              ) : null}
            </div>
          )}

          {showQuickCreate ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-secondary">
                  Cadastro rápido
                </p>
                <button
                  type="button"
                  className="btn-ghost h-7 w-7 p-0"
                  aria-label="Fechar cadastro rápido"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setQuickNome("");
                    setQuickTelefone("");
                  }}
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={quickNome}
                  onChange={(e) => setQuickNome(e.target.value)}
                  className="input-field"
                  placeholder="Nome *"
                />
                <input
                  value={quickTelefone}
                  onChange={(e) => setQuickTelefone(e.target.value)}
                  className="input-field"
                  placeholder="Telefone *"
                />
              </div>
              <button
                type="button"
                className="btn-secondary h-9"
                disabled={creatingCliente}
                onClick={() => void handleQuickCreate()}
              >
                <Plus size={14} strokeWidth={1.75} aria-hidden />
                {creatingCliente ? "Criando…" : "Salvar cliente"}
              </button>
            </div>
          ) : null}
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Chamado / problema <span className="text-error">*</span>
          </span>
          <textarea
            required
            rows={3}
            value={chamado}
            onChange={(e) => setChamado(e.target.value)}
            className="input-field resize-y"
            placeholder="Ex.: notebook não liga, troca de tela…"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Lista de entrada (equipamento)
          </span>
          <textarea
            rows={2}
            value={listaEntrada}
            onChange={(e) => setListaEntrada(e.target.value)}
            className="input-field resize-y"
            placeholder="Marca, modelo, acessórios, senha…"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Descrição complementar
          </span>
          <textarea
            rows={2}
            value={descricaoChamado}
            onChange={(e) => setDescricaoChamado(e.target.value)}
            className="input-field resize-y"
            placeholder="Detalhes extras do cliente"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Atendente
            </span>
            <select
              value={atendenteId}
              onChange={(e) => setAtendenteId(e.target.value)}
              className="input-field"
            >
              <option value="">—</option>
              {tecnicos.map((t) => (
                <option key={`at-${t.id}`} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Técnico</span>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="input-field"
            >
              <option value="">—</option>
              {tecnicos.map((t) => (
                <option key={`tec-${t.id}`} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Previsão</span>
            <input
              type="date"
              value={previsao}
              onChange={(e) => setPrevisao(e.target.value)}
              className="input-field"
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Observações
            </span>
            <textarea
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="input-field resize-y"
            />
          </label>
        </div>

        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            disabled={submitting}
            onClick={() => router.push("/ordens")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Abrindo…" : "Abrir OS"}
          </button>
        </div>
      </form>
    </div>
  );
}
