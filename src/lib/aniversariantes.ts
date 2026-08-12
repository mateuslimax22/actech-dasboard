import { toDate } from "@/lib/format";
import type { Cliente } from "@/types/cliente";

/** Clientes que fazem aniversário hoje (compara dia/mês do nascimento) */
export function getAniversariantesDoDia(
  clientes: Cliente[],
  now = new Date(),
): Cliente[] {
  const day = now.getDate();
  const month = now.getMonth();

  return clientes
    .filter((cliente) => {
      const nasc = toDate(cliente.nascimento);
      if (!nasc) return false;
      return nasc.getDate() === day && nasc.getMonth() === month;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
