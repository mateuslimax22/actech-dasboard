"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  PackageCheck,
  Printer,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteOrdem, fetchOrdemById, updateOrdem } from "@/lib/ordens";
import {
  inputDateToDate,
  timestampToInputDate,
} from "@/lib/ordensFilters";
import { fetchActiveTecnicos } from "@/lib/tecnicos";
import {
  calcularLucro,
  formatDate,
  formatMoney,
  parseMoney,
} from "@/lib/format";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS, ORDEM_STATUS_LABELS } from "@/types/ordem";
import type { Tecnico } from "@/types/tecnico";

type FormState = {
  chamado: string;
  listaEntrada: string;
  descricaoChamado: string;
  diagnosticoTecnico: string;
  servico: string;
  resolucao: string;
  obs: string;
  atendenteId: string;
  tecnicoId: string;
  previsao: string;
  dataExecucao: string;
  custo: string;
  preco: string;
  status: OrdemStatus;
  resolvido: boolean;
};

function ordemToForm(ordem: Ordem): FormState {
  return {
    chamado: ordem.chamado ?? "",
    listaEntrada: ordem.listaEntrada ?? "",
    descricaoChamado: ordem.descricaoChamado ?? "",
    diagnosticoTecnico: ordem.diagnosticoTecnico ?? "",
    servico: ordem.servico ?? "",
    resolucao: ordem.resolucao ?? "",
    obs: ordem.obs ?? "",
    atendenteId: ordem.atendenteId ?? "",
    tecnicoId: ordem.tecnicoId ?? "",
    previsao: timestampToInputDate(ordem.previsao),
    dataExecucao: timestampToInputDate(ordem.dataExecucao),
    custo: String(ordem.custo ?? 0),
    preco: String(ordem.preco ?? 0),
    status: ordem.status,
    resolvido: ordem.resolvido,
  };
}

export default function OrdemDetalheClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;

  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(
    searchParams.get("created") === "1"
      ? "OS aberta com sucesso."
      : searchParams.get("updated") === "1"
        ? "OS atualizada com sucesso."
        : null,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordemData, tecnicosData] = await Promise.all([
          fetchOrdemById(id),
          fetchActiveTecnicos(),
        ]);
        if (!active) return;
        if (!ordemData) {
          setError("Ordem não encontrada.");
          setOrdem(null);
          setForm(null);
        } else {
          setOrdem(ordemData);
          setForm(ordemToForm(ordemData));
          setTecnicos(tecnicosData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar a OS",
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
  }, [id]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function resolvePerson(
    selectedId: string,
    fallbackId?: string | null,
    fallbackNome?: string | null,
  ) {
    if (!selectedId) return { id: null as string | null, nome: null as string | null };
    const found = tecnicos.find((t) => t.id === selectedId);
    if (found) return { id: found.id, nome: found.nome };
    if (selectedId === fallbackId) {
      return { id: fallbackId ?? null, nome: fallbackNome ?? null };
    }
    return { id: selectedId, nome: null as string | null };
  }

  function buildUpdatePayload(
    next: FormState,
    overrides?: Partial<{
      status: OrdemStatus;
      resolvido: boolean;
      dataConclusao: Date | null;
    }>,
  ) {
    const atendente = resolvePerson(
      next.atendenteId,
      ordem?.atendenteId,
      ordem?.atendenteNome,
    );
    const tecnico = resolvePerson(
      next.tecnicoId,
      ordem?.tecnicoId,
      ordem?.tecnicoNome,
    );
    const status = overrides?.status ?? next.status;

    let dataConclusao: Date | null = null;
    if (overrides && "dataConclusao" in overrides) {
      dataConclusao = overrides.dataConclusao ?? null;
    } else if (ordem?.dataConclusao) {
      dataConclusao = ordem.dataConclusao.toDate();
    }

    return {
      chamado: next.chamado,
      listaEntrada: next.listaEntrada,
      descricaoChamado: next.descricaoChamado,
      diagnosticoTecnico: next.diagnosticoTecnico,
      servico: next.servico,
      resolucao: next.resolucao,
      obs: next.obs,
      atendenteId: atendente.id,
      atendenteNome: atendente.nome,
      tecnicoId: tecnico.id,
      tecnicoNome: tecnico.nome,
      previsao: inputDateToDate(next.previsao),
      dataExecucao: inputDateToDate(next.dataExecucao),
      custo: parseMoney(next.custo),
      preco: parseMoney(next.preco),
      status,
      resolvido: overrides?.resolvido ?? next.resolvido,
      dataConclusao,
    };
  }

  async function persist(
    next: FormState,
    overrides?: Parameters<typeof buildUpdatePayload>[1],
    successMessage = "OS salva com sucesso.",
  ) {
    if (!ordem) return;
    setSaving(true);
    setError(null);
    try {
      await updateOrdem(ordem.id, buildUpdatePayload(next, overrides));
      const refreshed = await fetchOrdemById(ordem.id);
      if (refreshed) {
        setOrdem(refreshed);
        setForm(ordemToForm(refreshed));
      }
      setFeedback(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    await persist(form);
  }

  async function handleMarcarPronta() {
    if (!form) return;
    await persist(
      form,
      { status: "PRONTA" },
      "OS marcada como pronta para retirada.",
    );
  }

  async function handleEntregar() {
    if (!form || !ordem) return;
    const ok = window.confirm(
      `Confirmar entrega da OS #${ordem.numero}?`,
    );
    if (!ok) return;
    await persist(
      form,
      {
        status: "ENTREGUE",
        resolvido: true,
        dataConclusao: new Date(),
      },
      "OS marcada como entregue.",
    );
  }

  async function handleCancelar() {
    if (!form || !ordem) return;
    const ok = window.confirm(
      `Cancelar a OS #${ordem.numero}? Ela sai da fila operacional.`,
    );
    if (!ok) return;
    await persist(
      { ...form, status: "CANCELADA" },
      { status: "CANCELADA" },
      "OS cancelada.",
    );
  }

  function handleStatusChange(next: OrdemStatus) {
    if (!form || !ordem) return;
    if (next === "CANCELADA" && form.status !== "CANCELADA") {
      const ok = window.confirm(
        `Cancelar a OS #${ordem.numero}? Ela sai da fila operacional.`,
      );
      if (!ok) return;
    }
    updateField("status", next);
  }

  async function handleDelete() {
    if (!ordem) return;
    const ok = window.confirm(
      `Excluir a OS #${ordem.numero}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteOrdem(ordem.id);
      router.push("/ordens");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-border/60" />
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  if (error && !ordem) {
    return (
      <div className="space-y-4">
        <p className="alert-error">{error}</p>
        <Link href="/ordens" className="btn-secondary inline-flex">
          Voltar para ordens
        </Link>
      </div>
    );
  }

  if (!ordem || !form) return null;

  const lucro = calcularLucro(parseMoney(form.preco), parseMoney(form.custo));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/ordens"
            className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Ordens
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              OS #{ordem.numero}
            </h1>
            <StatusBadge status={form.status} />
          </div>
          <p className="mt-1 text-sm text-secondary">
            Emissão {formatDate(ordem.dataEmissao)}
            {ordem.dataConclusao
              ? ` · Conclusão ${formatDate(ordem.dataConclusao)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ordens/${ordem.id}/imprimir?tipo=os`}
            className="btn-secondary h-10"
          >
            <Printer size={15} strokeWidth={1.75} aria-hidden />
            Imprimir
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || saving}
            className="btn-secondary h-10 text-error hover:border-error/40"
          >
            <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            {deleting ? "Excluindo…" : "Excluir"}
          </button>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Cliente</h2>
            {ordem.clienteId ? (
              <Link
                href={`/clientes/${ordem.clienteId}`}
                className="text-xs font-medium text-primary-light hover:underline"
              >
                Ver ficha
              </Link>
            ) : null}
          </div>
          <p className="text-sm text-foreground">{ordem.clienteNome || "—"}</p>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Chamado</h2>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Problema relatado</span>
            <textarea
              required
              rows={3}
              value={form.chamado}
              onChange={(e) => updateField("chamado", e.target.value)}
              className="input-field resize-y"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Descrição complementar</span>
            <textarea
              rows={2}
              value={form.descricaoChamado}
              onChange={(e) => updateField("descricaoChamado", e.target.value)}
              className="input-field resize-y"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Equipamento / lista de entrada</span>
            <textarea
              rows={2}
              value={form.listaEntrada}
              onChange={(e) => updateField("listaEntrada", e.target.value)}
              className="input-field resize-y"
            />
          </label>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Bancada</h2>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Diagnóstico técnico</span>
            <textarea
              rows={3}
              value={form.diagnosticoTecnico}
              onChange={(e) =>
                updateField("diagnosticoTecnico", e.target.value)
              }
              className="input-field resize-y"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Serviço executado</span>
            <textarea
              rows={2}
              value={form.servico}
              onChange={(e) => updateField("servico", e.target.value)}
              className="input-field resize-y"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Resolução</span>
            <textarea
              rows={2}
              value={form.resolucao}
              onChange={(e) => updateField("resolucao", e.target.value)}
              className="input-field resize-y"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Observações / garantia</span>
            <textarea
              rows={2}
              value={form.obs}
              onChange={(e) => updateField("obs", e.target.value)}
              className="input-field resize-y"
            />
          </label>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Equipe e datas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Atendente</span>
              <select
                value={form.atendenteId}
                onChange={(e) => updateField("atendenteId", e.target.value)}
                className="input-field"
              >
                <option value="">—</option>
                {tecnicos.map((t) => (
                  <option key={`at-${t.id}`} value={t.id}>
                    {t.nome}
                  </option>
                ))}
                {form.atendenteId &&
                !tecnicos.some((t) => t.id === form.atendenteId) &&
                ordem.atendenteNome ? (
                  <option value={form.atendenteId}>
                    {ordem.atendenteNome} (inativo)
                  </option>
                ) : null}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Técnico</span>
              <select
                value={form.tecnicoId}
                onChange={(e) => updateField("tecnicoId", e.target.value)}
                className="input-field"
              >
                <option value="">—</option>
                {tecnicos.map((t) => (
                  <option key={`tec-${t.id}`} value={t.id}>
                    {t.nome}
                  </option>
                ))}
                {form.tecnicoId &&
                !tecnicos.some((t) => t.id === form.tecnicoId) &&
                ordem.tecnicoNome ? (
                  <option value={form.tecnicoId}>
                    {ordem.tecnicoNome} (inativo)
                  </option>
                ) : null}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Previsão</span>
              <input
                type="date"
                value={form.previsao}
                onChange={(e) => updateField("previsao", e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Data de execução</span>
              <input
                type="date"
                value={form.dataExecucao}
                onChange={(e) => updateField("dataExecucao", e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as OrdemStatus)
                }
                className="input-field"
              >
                {ORDEM_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {ORDEM_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.resolvido}
                onChange={(e) => updateField("resolvido", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">Marcado como resolvido</span>
            </label>
          </div>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Valores</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Custo</span>
              <input
                value={form.custo}
                onChange={(e) => updateField("custo", e.target.value)}
                className="input-field"
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Preço</span>
              <input
                value={form.preco}
                onChange={(e) => updateField("preco", e.target.value)}
                className="input-field"
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs text-muted">Lucro</span>
              <p
                className={`rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium ${
                  lucro >= 0 ? "text-foreground" : "text-error"
                }`}
              >
                {formatMoney(lucro)}
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="btn-secondary text-error hover:border-error/40"
            disabled={saving || form.status === "CANCELADA"}
            onClick={() => void handleCancelar()}
          >
            <Ban size={15} strokeWidth={1.75} aria-hidden />
            Cancelar OS
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || form.status === "PRONTA"}
            onClick={() => void handleMarcarPronta()}
          >
            <PackageCheck size={15} strokeWidth={1.75} aria-hidden />
            Marcar pronta
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || form.status === "ENTREGUE"}
            onClick={() => void handleEntregar()}
          >
            <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden />
            Entregar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
