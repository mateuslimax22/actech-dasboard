import Papa from "papaparse";

export function parseCsv<T extends Record<string, unknown>>(
  csvText: string,
): T[] {
  const result = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().replace(/^"|"$/g, ""),
  });

  if (result.errors.length) {
    const fatal = result.errors.filter((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    // Papa ainda devolve rows úteis na maioria dos casos; só falha em erros graves
    if (fatal.length > 5) {
      throw new Error(
        `Erro ao ler CSV: ${fatal[0]?.message ?? result.errors[0].message}`,
      );
    }
  }

  return result.data;
}
