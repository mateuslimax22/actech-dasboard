"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { Cliente, ClienteInput } from "@/types/cliente";

export type ClienteFormValues = {
  nome: string;
  telefone: string;
  email: string;
  nascimento: string;
  endereco: string;
  cidade: string;
  estado: string;
};

const emptyValues: ClienteFormValues = {
  nome: "",
  telefone: "",
  email: "",
  nascimento: "",
  endereco: "",
  cidade: "",
  estado: "",
};

export function clienteToFormValues(cliente: Cliente): ClienteFormValues {
  return {
    nome: cliente.nome ?? "",
    telefone: cliente.telefone ?? "",
    email: cliente.email ?? "",
    nascimento: cliente.nascimento ?? "",
    endereco: cliente.endereco ?? "",
    cidade: cliente.cidade ?? "",
    estado: cliente.estado ?? "",
  };
}

export function formValuesToInput(
  values: ClienteFormValues,
  legacyId?: number | null,
): ClienteInput {
  return {
    nome: values.nome,
    telefone: values.telefone,
    email: values.email,
    nascimento: values.nascimento,
    endereco: values.endereco,
    cidade: values.cidade,
    estado: values.estado,
    legacyId: legacyId ?? null,
  };
}

type ClienteFormProps = {
  initialValues?: ClienteFormValues;
  submitLabel: string;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  onCancel?: () => void;
};

export function ClienteForm({
  initialValues = emptyValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ClienteFormProps) {
  const [values, setValues] = useState<ClienteFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ClienteFormValues>(
    key: K,
    value: ClienteFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.nome.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    if (!values.telefone.trim()) {
      setError("Informe o telefone do cliente.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-4 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">
            Nome <span className="text-error">*</span>
          </span>
          <input
            required
            value={values.nome}
            onChange={(e) => update("nome", e.target.value)}
            className="input-field"
            placeholder="Nome completo"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Telefone <span className="text-error">*</span>
          </span>
          <input
            required
            value={values.telefone}
            onChange={(e) => update("telefone", e.target.value)}
            className="input-field"
            placeholder="(85) 99999-9999"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">E-mail</span>
          <input
            type="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            className="input-field"
            placeholder="cliente@email.com"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Nascimento</span>
          <input
            value={values.nascimento}
            onChange={(e) => update("nascimento", e.target.value)}
            className="input-field"
            placeholder="dd/mm/aaaa"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Cidade</span>
          <input
            value={values.cidade}
            onChange={(e) => update("cidade", e.target.value)}
            className="input-field"
            placeholder="Fortaleza"
          />
        </label>

        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Endereço</span>
          <input
            value={values.endereco}
            onChange={(e) => update("endereco", e.target.value)}
            className="input-field"
            placeholder="Rua, número, bairro"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Estado</span>
          <input
            value={values.estado}
            onChange={(e) => update("estado", e.target.value)}
            className="input-field"
            placeholder="CE"
          />
        </label>
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
