import Link from "next/link";
import { Upload } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-sm text-secondary">
          Dados da loja e ferramentas administrativas — Etapa 12.
        </p>
      </div>

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
