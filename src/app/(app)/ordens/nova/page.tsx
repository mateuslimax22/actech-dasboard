import Link from "next/link";
import { ClipboardPlus } from "lucide-react";

export default function NovaOrdemPlaceholder() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nova OS
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Formulário de abertura entra na Etapa 6.
        </p>
      </div>
      <div className="card-surface flex items-center gap-3 p-5">
        <ClipboardPlus size={18} className="text-primary-light" aria-hidden />
        <p className="text-sm text-secondary">
          Em breve: selecionar cliente, equipamento e chamado.
        </p>
      </div>
      <Link href="/dashboard" className="btn-secondary inline-flex">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
