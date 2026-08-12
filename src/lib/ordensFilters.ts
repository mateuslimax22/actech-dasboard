import { toDate } from "@/lib/format";
import type { Ordem, OrdemStatus } from "@/types/ordem";

export type OrdemFilters = {
  search?: string;
  status?: OrdemStatus | "";
  tecnicoId?: string;
  /** yyyy-mm-dd */
  de?: string;
  /** yyyy-mm-dd */
  ate?: string;
};

function parseInputDate(value: string, endOfDay = false): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterOrdens(ordens: Ordem[], filters: OrdemFilters): Ordem[] {
  const q = (filters.search ?? "").trim().toLowerCase();
  const de = parseInputDate(filters.de ?? "", false);
  const ate = parseInputDate(filters.ate ?? "", true);

  return ordens.filter((ordem) => {
    if (filters.status && ordem.status !== filters.status) return false;

    if (filters.tecnicoId) {
      if (ordem.tecnicoId !== filters.tecnicoId) return false;
    }

    if (de || ate) {
      const emissao = toDate(ordem.dataEmissao);
      if (!emissao) return false;
      if (de && emissao < de) return false;
      if (ate && emissao > ate) return false;
    }

    if (!q) return true;

    const haystack = [
      String(ordem.numero),
      ordem.clienteNome,
      ordem.chamado,
      ordem.tecnicoNome ?? "",
      ordem.atendenteNome ?? "",
      ordem.listaEntrada ?? "",
      ordem.servico ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

/** yyyy-mm-dd para input type=date */
export function timestampToInputDate(
  value: Ordem["dataEmissao"] | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function inputDateToDate(value: string): Date | null {
  return parseInputDate(value, false);
}
