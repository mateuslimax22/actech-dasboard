"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Pencil,
  Plus,
  Search,
  UserCog,
  X,
} from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  paginateItems,
} from "@/components/Pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  createTecnico,
  fetchAllTecnicos,
  filterTecnicos,
  setTecnicoAtivo,
  updateTecnico,
} from "@/lib/tecnicos";
import type { Tecnico, TecnicoRole } from "@/types/tecnico";
import { TECNICO_ROLE_LABELS, TECNICO_ROLES } from "@/types/tecnico";

type FormState = {
  nome: string;
  role: TecnicoRole;
  ativo: boolean;
};

const emptyForm: FormState = {
  nome: "",
  role: "tecnico",
  ativo: true,
};

export default function TecnicosClient() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Tecnico | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const filtersKey = debouncedSearch;
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
        const data = await fetchAllTecnicos();
        if (!active) return;
        setTecnicos(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar técnicos",
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
    () => filterTecnicos(tecnicos, debouncedSearch),
    [tecnicos, debouncedSearch],
  );

  const pageItems = useMemo(
    () => paginateItems(filtered, page, DEFAULT_PAGE_SIZE),
    [filtered, page],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setEditorOpen(true);
  }

  function openEdit(tecnico: Tecnico) {
    setEditing(tecnico);
    setForm({
      nome: tecnico.nome,
      role: tecnico.role,
      ativo: tecnico.ativo,
    });
    setFormError(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateTecnico(editing.id, form);
        const refreshed = await fetchAllTecnicos();
        setTecnicos(refreshed);
        setFeedback("Técnico atualizado.");
      } else {
        await createTecnico(form);
        const refreshed = await fetchAllTecnicos();
        setTecnicos(refreshed);
        setFeedback("Técnico cadastrado.");
      }
      closeEditor();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(tecnico: Tecnico) {
    const next = !tecnico.ativo;
    setTogglingId(tecnico.id);
    setError(null);
    try {
      await setTecnicoAtivo(tecnico.id, next);
      setTecnicos((prev) =>
        prev.map((t) => (t.id === tecnico.id ? { ...t, ativo: next } : t)),
      );
      setFeedback(
        next
          ? `${tecnico.nome} reativado.`
          : `${tecnico.nome} desativado.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao atualizar status",
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Técnicos
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? "Carregando…"
              : `${filtered.length} de ${tecnicos.length} · só ativos aparecem nas OS`}
          </p>
        </div>
        <button type="button" className="btn-primary h-10" onClick={openCreate}>
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          Novo técnico
        </button>
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
          placeholder="Buscar por nome ou função…"
        />
      </div>

      {feedback && (
        <p className="alert-success">
          {feedback}
          <button
            type="button"
            className="ml-2 text-xs underline-offset-2 hover:underline"
            onClick={() => setFeedback(null)}
          >
            Fechar
          </button>
        </p>
      )}

      {error && <p className="alert-error">{error}</p>}

      {editorOpen ? (
        <form
          onSubmit={handleSubmit}
          className="card-surface space-y-4 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {editing ? "Editar técnico" : "Novo técnico"}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Aparece nos selects de OS quando ativo.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost h-8 w-8 p-0"
              onClick={closeEditor}
              aria-label="Fechar"
            >
              <X size={15} strokeWidth={1.75} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Nome <span className="text-error">*</span>
              </span>
              <input
                required
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                className="input-field"
                placeholder="Nome completo"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Função</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as TecnicoRole,
                  }))
                }
                className="input-field"
              >
                {TECNICO_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {TECNICO_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 self-end pb-2.5">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ativo: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">Ativo</span>
            </label>
          </div>

          {formError && (
            <p className="alert-error" role="alert">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={closeEditor}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando…" : editing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="card-surface flex max-h-[calc(100dvh-13.5rem)] flex-col overflow-hidden lg:max-h-[calc(100dvh-11.5rem)]">
        {loading ? (
          <div className="min-h-0 flex-1 space-y-0 divide-y divide-border overflow-y-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">
            <div>
              <UserCog size={22} className="mx-auto text-muted" aria-hidden />
              <p className="mt-3 text-sm font-medium text-foreground">
                {debouncedSearch
                  ? "Nenhum técnico encontrado"
                  : "Nenhum técnico cadastrado"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {debouncedSearch
                  ? "Tente outro termo de busca."
                  : "Cadastre a equipe para usar nas OS."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden shrink-0 grid-cols-[1.4fr_7rem_5.5rem_10rem] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-medium tracking-wide text-muted uppercase sm:grid">
              <span>Nome</span>
              <span>Função</span>
              <span>Status</span>
              <span className="text-right">Ações</span>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {pageItems.map((tecnico) => (
                <li
                  key={tecnico.id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1.4fr_7rem_5.5rem_10rem] sm:items-center sm:gap-3"
                >
                  <span className="truncate text-sm font-medium text-foreground">
                    {tecnico.nome}
                  </span>
                  <span className="text-sm text-secondary">
                    {TECNICO_ROLE_LABELS[tecnico.role]}
                  </span>
                  <span>
                    <span
                      className={`badge ${
                        tecnico.ativo ? "badge-success" : "badge-muted"
                      }`}
                    >
                      {tecnico.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      className="btn-secondary h-9 px-3"
                      onClick={() => openEdit(tecnico)}
                    >
                      <Pencil size={14} strokeWidth={1.75} aria-hidden />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-secondary h-9 px-3"
                      disabled={togglingId === tecnico.id}
                      onClick={() => void handleToggleAtivo(tecnico)}
                    >
                      {togglingId === tecnico.id
                        ? "…"
                        : tecnico.ativo
                          ? "Desativar"
                          : "Ativar"}
                    </button>
                  </div>
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
