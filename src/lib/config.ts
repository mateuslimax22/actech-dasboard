import { Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { COLLECTIONS, CONFIG_DOCS } from "@/types/collections";
import type { ConfigLoja } from "@/types/config";

export const DEFAULT_LOJA: ConfigLoja = {
  nome: "ACTech",
  cnpj: null,
  telefone: null,
  endereco: null,
  garantiaPadraoDias: 90,
};

function cleanText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function fetchConfigLoja(): Promise<ConfigLoja> {
  try {
    const snap = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.config, CONFIG_DOCS.loja),
    );
    if (!snap.exists()) return { ...DEFAULT_LOJA };

    const data = snap.data();
    return {
      nome: String(data.nome ?? DEFAULT_LOJA.nome),
      cnpj: data.cnpj ?? null,
      telefone: data.telefone ?? null,
      endereco: data.endereco ?? null,
      garantiaPadraoDias:
        typeof data.garantiaPadraoDias === "number"
          ? data.garantiaPadraoDias
          : DEFAULT_LOJA.garantiaPadraoDias,
      updatedAt: data.updatedAt,
    };
  } catch {
    return { ...DEFAULT_LOJA };
  }
}

export type ConfigLojaInput = {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  garantiaPadraoDias?: number | null;
};

export async function saveConfigLoja(input: ConfigLojaInput): Promise<void> {
  const nome = input.nome.trim();
  if (!nome) throw new Error("Nome da loja é obrigatório.");

  let garantia = input.garantiaPadraoDias ?? null;
  if (garantia !== null && garantia !== undefined) {
    if (!Number.isFinite(garantia) || garantia < 0) {
      throw new Error("Garantia inválida.");
    }
    garantia = Math.round(garantia);
  }

  const now = Timestamp.now();
  await setDoc(
    doc(getFirebaseDb(), COLLECTIONS.config, CONFIG_DOCS.loja),
    {
      nome,
      cnpj: cleanText(input.cnpj),
      telefone: cleanText(input.telefone),
      endereco: cleanText(input.endereco),
      garantiaPadraoDias: garantia ?? DEFAULT_LOJA.garantiaPadraoDias,
      updatedAt: now,
    },
    { merge: true },
  );
}
