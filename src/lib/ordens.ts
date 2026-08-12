import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/collections";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS } from "@/types/ordem";

function asStatus(value: unknown): OrdemStatus {
  if (typeof value === "string" && (ORDEM_STATUS as readonly string[]).includes(value)) {
    return value as OrdemStatus;
  }
  return "ABERTA";
}

export function mapOrdemDoc(snap: QueryDocumentSnapshot<DocumentData>): Ordem {
  const data = snap.data();

  return {
    id: snap.id,
    numero: Number(data.numero) || 0,
    chamado: String(data.chamado ?? ""),
    atendenteId: data.atendenteId ?? null,
    atendenteNome: data.atendenteNome ?? null,
    clienteId: String(data.clienteId ?? ""),
    clienteNome: String(data.clienteNome ?? ""),
    servico: data.servico ?? null,
    tecnicoId: data.tecnicoId ?? null,
    tecnicoNome: data.tecnicoNome ?? null,
    dataEmissao: data.dataEmissao,
    dataExecucao: data.dataExecucao ?? null,
    previsao: data.previsao ?? null,
    custo: Number(data.custo) || 0,
    preco: Number(data.preco) || 0,
    resolvido: Boolean(data.resolvido),
    dataConclusao: data.dataConclusao ?? null,
    status: asStatus(data.status),
    obs: data.obs ?? null,
    listaEntrada: data.listaEntrada ?? null,
    descricaoChamado: data.descricaoChamado ?? null,
    resolucao: data.resolucao ?? null,
    diagnosticoTecnico: data.diagnosticoTecnico ?? null,
    legacyId: data.legacyId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchAllOrdens(): Promise<Ordem[]> {
  const snap = await getDocs(collection(getFirebaseDb(), COLLECTIONS.ordens));
  return snap.docs.map(mapOrdemDoc);
}

export async function fetchOrdensByClienteId(
  clienteId: string,
): Promise<Ordem[]> {
  const db = getFirebaseDb();
  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.ordens),
        where("clienteId", "==", clienteId),
      ),
    );
    return snap.docs
      .map(mapOrdemDoc)
      .sort((a, b) => (b.numero || 0) - (a.numero || 0));
  } catch {
    const all = await fetchAllOrdens();
    return all
      .filter((o) => o.clienteId === clienteId)
      .sort((a, b) => (b.numero || 0) - (a.numero || 0));
  }
}
