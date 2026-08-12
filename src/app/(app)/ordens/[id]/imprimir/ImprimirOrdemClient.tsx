"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { fetchClienteById } from "@/lib/clientes";
import { fetchConfigLoja } from "@/lib/config";
import { fetchOrdemById } from "@/lib/ordens";
import { formatDate, formatMoney } from "@/lib/format";
import type { Cliente } from "@/types/cliente";
import type { ConfigLoja } from "@/types/config";
import type { Ordem } from "@/types/ordem";
import { ORDEM_STATUS_LABELS } from "@/types/ordem";

export const PRINT_TIPOS = ["entrada", "os", "entrega"] as const;
export type PrintTipo = (typeof PRINT_TIPOS)[number];

export const PRINT_TIPO_LABELS: Record<PrintTipo, string> = {
  entrada: "Comprovante de entrada",
  os: "Ordem de serviço completa",
  entrega: "Comprovante de entrega",
};

function asPrintTipo(value: string | null): PrintTipo {
  if (value && (PRINT_TIPOS as readonly string[]).includes(value)) {
    return value as PrintTipo;
  }
  return "os";
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold tracking-wide text-neutral-500 uppercase print:text-neutral-600">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-900">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div className="pt-10">
      <div className="mx-auto h-px w-48 bg-neutral-400" />
      <p className="mt-2 text-center text-xs text-neutral-600">{label}</p>
    </div>
  );
}

function LojaHeader({ loja }: { loja: ConfigLoja }) {
  return (
    <header className="border-b border-neutral-300 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            {loja.nome || "ACTech"}
          </h1>
          {loja.endereco ? (
            <p className="mt-1 text-xs text-neutral-600">{loja.endereco}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-neutral-600">
            {[loja.telefone, loja.cnpj ? `CNPJ ${loja.cnpj}` : null]
              .filter(Boolean)
              .join(" · ") || "Assistência técnica"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
            Documento
          </p>
        </div>
      </div>
    </header>
  );
}

function DocMeta({
  titulo,
  ordem,
}: {
  titulo: string;
  ordem: Ordem;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-neutral-900">{titulo}</p>
        <p className="mt-0.5 text-sm text-neutral-600">
          Status: {ORDEM_STATUS_LABELS[ordem.status]}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-neutral-900">#{ordem.numero}</p>
        <p className="text-xs text-neutral-600">
          Emissão {formatDate(ordem.dataEmissao)}
        </p>
      </div>
    </div>
  );
}

export default function ImprimirOrdemClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const tipo = asPrintTipo(searchParams.get("tipo"));

  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loja, setLoja] = useState<ConfigLoja | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordemData, lojaData] = await Promise.all([
          fetchOrdemById(id),
          fetchConfigLoja(),
        ]);
        if (!active) return;
        if (!ordemData) {
          setError("Ordem não encontrada.");
          setOrdem(null);
          setCliente(null);
          setLoja(lojaData);
          return;
        }
        setOrdem(ordemData);
        setLoja(lojaData);
        if (ordemData.clienteId) {
          const clienteData = await fetchClienteById(ordemData.clienteId);
          if (active) setCliente(clienteData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar impressão",
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

  const garantiaLabel = useMemo(() => {
    const dias = loja?.garantiaPadraoDias;
    if (!dias || dias <= 0) return "Conforme política da loja";
    return `${dias} dia${dias === 1 ? "" : "s"}`;
  }, [loja]);

  function setTipo(next: PrintTipo) {
    router.replace(`/ordens/${id}/imprimir?tipo=${next}`);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-border/60" />
        <div className="card-surface h-96 animate-pulse" />
      </div>
    );
  }

  if (error || !ordem || !loja) {
    return (
      <div className="space-y-4">
        <p className="alert-error">{error ?? "Não foi possível carregar."}</p>
        <Link href={`/ordens/${id}`} className="btn-secondary inline-flex">
          Voltar para a OS
        </Link>
      </div>
    );
  }

  const clienteContato = [
    cliente?.telefone,
    cliente?.email,
  ]
    .filter(Boolean)
    .join(" · ");
  const clienteEndereco = [
    cliente?.endereco,
    cliente?.cidade,
    cliente?.estado,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/ordens/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Voltar para a OS
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Impressão
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(asPrintTipo(e.target.value))}
            className="input-field h-10 w-full sm:w-auto"
            aria-label="Tipo de documento"
          >
            {PRINT_TIPOS.map((t) => (
              <option key={t} value={t}>
                {PRINT_TIPO_LABELS[t]}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary h-10" onClick={handlePrint}>
            <Printer size={15} strokeWidth={1.75} aria-hidden />
            Imprimir
          </button>
        </div>
      </div>

      <article className="print-sheet mx-auto max-w-[210mm] rounded-xl border border-border bg-white p-6 text-neutral-900 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <LojaHeader loja={loja} />
        <DocMeta titulo={PRINT_TIPO_LABELS[tipo]} ordem={ordem} />

        <section className="mt-6 grid gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2">
          <Field label="Cliente" value={ordem.clienteNome} />
          <Field label="Contato" value={clienteContato || undefined} />
          {clienteEndereco ? (
            <Field
              label="Endereço"
              value={clienteEndereco}
              className="sm:col-span-2"
            />
          ) : null}
        </section>

        {(tipo === "entrada" || tipo === "os") && (
          <section className="mt-5 grid gap-4 border-t border-neutral-200 pt-4">
            <Field label="Chamado / problema" value={ordem.chamado} />
            <Field
              label="Equipamento / lista de entrada"
              value={ordem.listaEntrada}
            />
            {ordem.descricaoChamado ? (
              <Field
                label="Descrição complementar"
                value={ordem.descricaoChamado}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Atendente" value={ordem.atendenteNome} />
              <Field label="Técnico" value={ordem.tecnicoNome} />
              <Field label="Previsão" value={formatDate(ordem.previsao)} />
              <Field label="Data de emissão" value={formatDate(ordem.dataEmissao)} />
            </div>
          </section>
        )}

        {tipo === "os" && (
          <section className="mt-5 space-y-4 border-t border-neutral-200 pt-4">
            <Field
              label="Diagnóstico técnico"
              value={ordem.diagnosticoTecnico}
            />
            <Field label="Serviço executado" value={ordem.servico} />
            <Field label="Resolução" value={ordem.resolucao} />
            <Field label="Observações" value={ordem.obs} />
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 print:bg-transparent">
              <Field label="Preço" value={formatMoney(ordem.preco)} />
            </div>
          </section>
        )}

        {tipo === "entrega" && (
          <section className="mt-5 space-y-4 border-t border-neutral-200 pt-4">
            <Field label="Chamado original" value={ordem.chamado} />
            <Field label="Resolução" value={ordem.resolucao || ordem.servico} />
            <Field label="Observações / garantia" value={ordem.obs} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor" value={formatMoney(ordem.preco)} />
              <Field label="Garantia" value={garantiaLabel} />
              <Field
                label="Data de conclusão"
                value={formatDate(ordem.dataConclusao)}
              />
              <Field label="Técnico" value={ordem.tecnicoNome} />
            </div>
            <div className="mt-4 grid gap-8 sm:grid-cols-2">
              <SignatureBlock label="Assinatura do cliente" />
              <SignatureBlock label="Assinatura da loja" />
            </div>
            <p className="mt-6 text-center text-[11px] text-neutral-500">
              Declaro ter recebido o equipamento em condições satisfatórias e
              estou ciente da garantia informada.
            </p>
          </section>
        )}

        {tipo === "entrada" && (
          <section className="mt-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <SignatureBlock label="Assinatura do cliente" />
              <SignatureBlock label="Assinatura do atendente" />
            </div>
            <p className="mt-6 text-center text-[11px] text-neutral-500">
              Comprovante de entrada do equipamento para análise/serviço.
            </p>
          </section>
        )}

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-500">
          Documento gerado em {formatDate(new Date(), { withTime: true })} ·{" "}
          {loja.nome || "ACTech"}
        </footer>
      </article>
    </div>
  );
}
