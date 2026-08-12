import type { Timestamp } from "firebase/firestore";

/**
 * Converte valores vindos do CSV / formulário para number.
 * Aceita: "R$155,00", "155,00", "1.550,00", "155.00", 155, null.
 */
export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = value
    .trim()
    .replace(/R\$\s?/gi, "")
    .replace(/\s/g, "");

  if (!cleaned || cleaned.toUpperCase() === "NULL") {
    return 0;
  }

  // BR: 1.550,00 → remove milhar e troca vírgula decimal
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formata number como moeda BRL: R$ 155,00 */
export function formatMoney(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function calcularLucro(preco: number, custo: number): number {
  return (preco || 0) - (custo || 0);
}

export function calcularMargemPercentual(
  preco: number,
  custo: number,
): number | null {
  if (!preco) return null;
  return (calcularLucro(preco, custo) / preco) * 100;
}

type DateLike = Date | Timestamp | string | null | undefined;

export function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toUpperCase() === "NULL") return null;

    // dd/mm/yyyy ou dd/mm/yy
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (brMatch) {
      const day = Number(brMatch[1]);
      const month = Number(brMatch[2]);
      let year = Number(brMatch[3]);
      if (year < 100) {
        year += year >= 70 ? 1900 : 2000;
      }
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/** Formata data para exibição pt-BR (dd/mm/yyyy) */
export function formatDate(
  value: DateLike,
  options?: { withTime?: boolean },
): string {
  const date = toDate(value);
  if (!date) return "—";

  if (options?.withTime) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Converte string BR (dd/mm/yyyy) ou Date em Date.
 * Útil na importação de CSV.
 */
export function parseDateBR(value: string | Date | null | undefined): Date | null {
  return toDate(value);
}
