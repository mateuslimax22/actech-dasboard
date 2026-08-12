"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { deleteCliente, fetchClienteById } from "@/lib/clientes";
import { fetchOrdensByClienteId } from "@/lib/ordens";
import { formatDate, formatMoney } from "@/lib/format";
import type { Cliente } from "@/types/cliente";
import type { Ordem } from "@/types/ordem";
import { ORDEM_STATUS_LABELS } from "@/types/ordem";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-primary-light">
        <Icon size={14} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground">{value?.trim() ? value : "—"}</p>
      </div>
    </div>
  );
}

export default function ClienteDetalheClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(
    searchParams.get("created") === "1"
      ? "Cliente cadastrado com sucesso."
      : searchParams.get("updated") === "1"
        ? "Cliente atualizado com sucesso."
        : null,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [clienteData, ordensData] = await Promise.all([
          fetchClienteById(id),
          fetchOrdensByClienteId(id),
        ]);
        if (!active) return;
        if (!clienteData) {
          setError("Cliente não encontrado.");
          setCliente(null);
          setOrdens([]);
        } else {
          setCliente(clienteData);
          setOrdens(ordensData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar cliente",
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

  async function handleDelete() {
    if (!cliente) return;
    const ok = window.confirm(
      `Excluir o cliente "${cliente.nome}"? Esta ação não remove as OS vinculadas.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteCliente(cliente.id);
      router.push("/clientes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
        <div className="card-surface h-48 animate-pulse" />
      </div>
    );
  }

  if (error && !cliente) {
    return (
      <div className="space-y-4">
        <p className="alert-error">{error}</p>
        <Link href="/clientes" className="btn-secondary inline-flex">
          Voltar para clientes
        </Link>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/clientes"
            className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Clientes
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {cliente.nome}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {ordens.length} ordem(ns) de serviço
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="btn-secondary h-10"
          >
            <Pencil size={15} strokeWidth={1.75} aria-hidden />
            Editar
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
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

      <section className="card-surface grid gap-5 p-5 sm:grid-cols-2">
        <InfoRow icon={Phone} label="Telefone" value={cliente.telefone} />
        <InfoRow icon={Mail} label="E-mail" value={cliente.email} />
        <InfoRow
          icon={MapPin}
          label="Endereço"
          value={[cliente.endereco, cliente.cidade, cliente.estado]
            .filter(Boolean)
            .join(" · ")}
        />
        <InfoRow
          icon={ClipboardList}
          label="Nascimento"
          value={cliente.nascimento}
        />
      </section>

      <section className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Histórico de OS
          </h2>
          <Link
            href={`/ordens/nova?clienteId=${cliente.id}`}
            className="text-xs font-medium text-primary-light hover:underline"
          >
            Nova OS
          </Link>
        </div>

        {ordens.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ClipboardList
              size={20}
              className="mx-auto text-muted"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              Nenhuma OS para este cliente
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {ordens.map((ordem) => (
              <li key={ordem.id}>
                <Link
                  href={`/ordens/${ordem.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-elevated/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      #{ordem.numero} · {ordem.chamado || "Sem chamado"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {ORDEM_STATUS_LABELS[ordem.status]} ·{" "}
                      {formatDate(ordem.dataEmissao)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-secondary">
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
