import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrdemDetalhePlaceholder({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Ordem de serviço
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          OS {id}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Detalhe completo entra na Etapa 6. Por enquanto este link existe para o
          dashboard.
        </p>
      </div>
      <Link href="/ordens" className="btn-secondary inline-flex">
        Voltar para ordens
      </Link>
    </div>
  );
}
