"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ClienteForm,
  clienteToFormValues,
  formValuesToInput,
  type ClienteFormValues,
} from "@/components/clientes/ClienteForm";
import { fetchClienteById, updateCliente } from "@/lib/clientes";
import type { Cliente } from "@/types/cliente";

export default function EditarClientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchClienteById(id);
        if (!active) return;
        if (!data) {
          setError("Cliente não encontrado.");
        } else {
          setCliente(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Falha ao carregar");
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

  async function handleSubmit(values: ClienteFormValues) {
    if (!cliente) return;
    await updateCliente(
      cliente.id,
      formValuesToInput(values, cliente.legacyId),
    );
    router.push(`/clientes/${cliente.id}?updated=1`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="space-y-4">
        <p className="alert-error">{error ?? "Cliente não encontrado."}</p>
        <Link href="/clientes" className="btn-secondary inline-flex">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/clientes/${cliente.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          Voltar
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Editar cliente
        </h1>
        <p className="mt-1 text-sm text-secondary">{cliente.nome}</p>
      </div>

      <ClienteForm
        initialValues={clienteToFormValues(cliente)}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/clientes/${cliente.id}`)}
      />
    </div>
  );
}
