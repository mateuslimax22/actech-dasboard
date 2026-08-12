import type { OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS_LABELS } from "@/types/ordem";

const STATUS_BADGE_CLASS: Record<OrdemStatus, string> = {
  ABERTA: "badge-primary",
  EM_ANALISE: "badge-primary",
  AGUARDANDO_PECA: "badge-warning",
  AGUARDANDO_APROVACAO: "badge-warning",
  EM_SERVICO: "badge-primary",
  PRONTA: "badge-success",
  ENTREGUE: "badge-muted",
  CANCELADA: "badge-error",
  SEM_RESOLUCAO: "badge-error",
};

type StatusBadgeProps = {
  status: OrdemStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_BADGE_CLASS[status]} ${className}`}>
      {ORDEM_STATUS_LABELS[status]}
    </span>
  );
}
