"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  ClienteForm,
  formValuesToInput,
  type ClienteFormValues,
} from "@/components/clientes/ClienteForm";
import { createCliente } from "@/lib/clientes";

export default function NovoClientePage() {
  const router = useRouter();

  async function handleSubmit(values: ClienteFormValues) {
    const id = await createCliente(formValuesToInput(values));
    router.push(`/clientes/${id}?created=1`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary-light"
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          Voltar
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Novo cliente
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Nome e telefone são obrigatórios.
        </p>
      </div>

      <ClienteForm
        submitLabel="Salvar cliente"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/clientes")}
      />
    </div>
  );
}
