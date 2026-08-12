"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Store, Upload } from "lucide-react";
import {
  DEFAULT_LOJA,
  fetchConfigLoja,
  saveConfigLoja,
} from "@/lib/config";

type FormState = {
  nome: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  garantiaPadraoDias: string;
};

function toForm(loja: {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  garantiaPadraoDias?: number | null;
}): FormState {
  return {
    nome: loja.nome ?? "",
    cnpj: loja.cnpj ?? "",
    telefone: loja.telefone ?? "",
    endereco: loja.endereco ?? "",
    garantiaPadraoDias:
      loja.garantiaPadraoDias !== null && loja.garantiaPadraoDias !== undefined
        ? String(loja.garantiaPadraoDias)
        : String(DEFAULT_LOJA.garantiaPadraoDias ?? 90),
  };
}

export default function ConfiguracoesClient() {
  const [form, setForm] = useState<FormState>(toForm(DEFAULT_LOJA));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loja = await fetchConfigLoja();
        if (!active) return;
        setForm(toForm(loja));
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Falha ao carregar configurações",
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      const garantiaRaw = form.garantiaPadraoDias.trim();
      const garantia = garantiaRaw === "" ? null : Number(garantiaRaw);
      if (garantiaRaw !== "" && !Number.isFinite(garantia)) {
        throw new Error("Informe a garantia em dias (número).");
      }

      await saveConfigLoja({
        nome: form.nome,
        cnpj: form.cnpj,
        telefone: form.telefone,
        endereco: form.endereco,
        garantiaPadraoDias: garantia,
      });
      setFeedback("Dados da loja salvos. A impressão já usa estas informações.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Dados da loja usados na impressão de OS.
        </p>
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

      {loading ? (
        <div className="card-surface h-72 animate-pulse" />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="card-surface space-y-4 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Store size={16} className="text-primary-light" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">
              Dados da loja
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Nome <span className="text-error">*</span>
              </span>
              <input
                required
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                className="input-field"
                placeholder="ACTech"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">CNPJ</span>
              <input
                value={form.cnpj}
                onChange={(e) => update("cnpj", e.target.value)}
                className="input-field"
                placeholder="00.000.000/0000-00"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Telefone
              </span>
              <input
                value={form.telefone}
                onChange={(e) => update("telefone", e.target.value)}
                className="input-field"
                placeholder="(85) 99999-9999"
              />
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Endereço
              </span>
              <input
                value={form.endereco}
                onChange={(e) => update("endereco", e.target.value)}
                className="input-field"
                placeholder="Rua, número, bairro, cidade"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Garantia padrão (dias)
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.garantiaPadraoDias}
                onChange={(e) => update("garantiaPadraoDias", e.target.value)}
                className="input-field"
                placeholder="90"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar loja"}
            </button>
          </div>
        </form>
      )}

      <Link
        href="/configuracoes/importar"
        className="card-surface flex items-center gap-3 p-4 transition hover:border-primary/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-elevated text-primary-light">
          <Upload size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Importar CSVs</p>
          <p className="text-xs text-secondary">
            Carregar clientes e ordens para o Firestore
          </p>
        </div>
      </Link>
    </div>
  );
}
