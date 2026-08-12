import type { OrdemStatus } from "@/types/ordem";

/** Normaliza nome para match cliente ↔ OS */
export function normalizeName(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function emptyToNull(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toUpperCase() === "NULL") return null;
  return trimmed;
}

export function parseResolvido(value: string | null | undefined): boolean {
  const v = emptyToNull(value)?.toUpperCase();
  return v === "SIM" || v === "S" || v === "TRUE" || v === "1";
}

/**
 * Mapeia status bagunçado do CSV para o enum do app.
 */
export function normalizeOrdemStatus(
  rawStatus: string | null | undefined,
  resolvido: boolean,
): OrdemStatus {
  const status = (emptyToNull(rawStatus) ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    status.includes("SEM RESOLU") ||
    status.includes("ANALISE SEM") ||
    status.includes("SEM_RESOLU")
  ) {
    return "SEM_RESOLUCAO";
  }

  if (status.includes("CANCEL")) {
    return "CANCELADA";
  }

  // CONCLUIDO / CONLCUDO (typo no CSV)
  if (status.includes("CONCL") || status.includes("CONLC")) {
    return "ENTREGUE";
  }

  if (status.includes("PRONTA") || status.includes("PRONTO")) {
    return "PRONTA";
  }

  if (status.includes("AGUARDANDO PECA") || status.includes("AGUARDANDO_PECA")) {
    return "AGUARDANDO_PECA";
  }

  if (status.includes("APROVAC")) {
    return "AGUARDANDO_APROVACAO";
  }

  if (status.includes("SERVICO") || status.includes("EXECUC")) {
    return "EM_SERVICO";
  }

  if (status.includes("ANALISE") || status.includes("ANALIS")) {
    return "EM_ANALISE";
  }

  if (status.includes("ABERT")) {
    return "ABERTA";
  }

  if (resolvido) {
    return "ENTREGUE";
  }

  return "ABERTA";
}

export function slugifyId(value: string): string {
  const base = normalizeName(value).toLowerCase().replace(/\s+/g, "_");
  return base || "desconhecido";
}
