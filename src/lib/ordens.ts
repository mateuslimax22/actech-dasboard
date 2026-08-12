import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { COLLECTIONS, CONFIG_DOCS } from "@/types/collections";
import type { Ordem, OrdemStatus } from "@/types/ordem";
import { ORDEM_STATUS } from "@/types/ordem";

export type { OrdemFilters } from "@/lib/ordensFilters";
export {
  filterOrdens,
  inputDateToDate,
  timestampToInputDate,
} from "@/lib/ordensFilters";

function asStatus(value: unknown): OrdemStatus {
  if (typeof value === "string" && (ORDEM_STATUS as readonly string[]).includes(value)) {
    return value as OrdemStatus;
  }
  return "ABERTA";
}

function cleanText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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
  const db = getFirebaseDb();
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.ordens), orderBy("numero", "desc")),
    );
    return snap.docs.map(mapOrdemDoc);
  } catch {
    const snap = await getDocs(collection(db, COLLECTIONS.ordens));
    return snap.docs
      .map(mapOrdemDoc)
      .sort((a, b) => (b.numero || 0) - (a.numero || 0));
  }
}

export async function fetchOrdemById(id: string): Promise<Ordem | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTIONS.ordens, id));
  if (!snap.exists()) return null;
  return mapOrdemDoc(snap as QueryDocumentSnapshot<DocumentData>);
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
        orderBy("numero", "desc"),
      ),
    );
    return snap.docs.map(mapOrdemDoc);
  } catch {
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
}

export type CreateOrdemInput = {
  clienteId: string;
  clienteNome: string;
  chamado: string;
  listaEntrada?: string | null;
  descricaoChamado?: string | null;
  atendenteId?: string | null;
  atendenteNome?: string | null;
  tecnicoId?: string | null;
  tecnicoNome?: string | null;
  previsao?: Date | null;
  obs?: string | null;
};

export type UpdateOrdemInput = {
  chamado: string;
  listaEntrada?: string | null;
  descricaoChamado?: string | null;
  diagnosticoTecnico?: string | null;
  servico?: string | null;
  resolucao?: string | null;
  obs?: string | null;
  atendenteId?: string | null;
  atendenteNome?: string | null;
  tecnicoId?: string | null;
  tecnicoNome?: string | null;
  previsao?: Date | null;
  dataExecucao?: Date | null;
  custo: number;
  preco: number;
  status: OrdemStatus;
  resolvido: boolean;
  dataConclusao?: Date | null;
};

export async function createOrdem(input: CreateOrdemInput): Promise<string> {
  const clienteId = input.clienteId.trim();
  const clienteNome = input.clienteNome.trim();
  const chamado = input.chamado.trim();

  if (!clienteId) throw new Error("Selecione um cliente.");
  if (!clienteNome) throw new Error("Nome do cliente é obrigatório.");
  if (!chamado) throw new Error("Informe o chamado / problema.");

  const db = getFirebaseDb();
  const counterRef = doc(db, COLLECTIONS.config, CONFIG_DOCS.counters);
  const ordemRef = doc(collection(db, COLLECTIONS.ordens));

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const next =
      counterSnap.exists() &&
      Number(counterSnap.data().proximoNumeroOrdem) > 0
        ? Number(counterSnap.data().proximoNumeroOrdem)
        : 1;

    const now = Timestamp.now();

    tx.set(
      counterRef,
      {
        proximoNumeroOrdem: next + 1,
        updatedAt: now,
      },
      { merge: true },
    );

    tx.set(ordemRef, {
      numero: next,
      chamado,
      clienteId,
      clienteNome,
      listaEntrada: cleanText(input.listaEntrada),
      descricaoChamado: cleanText(input.descricaoChamado),
      atendenteId: cleanText(input.atendenteId),
      atendenteNome: cleanText(input.atendenteNome),
      tecnicoId: cleanText(input.tecnicoId),
      tecnicoNome: cleanText(input.tecnicoNome),
      previsao: input.previsao ? Timestamp.fromDate(input.previsao) : null,
      obs: cleanText(input.obs),
      servico: null,
      diagnosticoTecnico: null,
      resolucao: null,
      dataEmissao: now,
      dataExecucao: null,
      dataConclusao: null,
      custo: 0,
      preco: 0,
      resolvido: false,
      status: "ABERTA" satisfies OrdemStatus,
      legacyId: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  return ordemRef.id;
}

export async function updateOrdem(
  id: string,
  input: UpdateOrdemInput,
): Promise<void> {
  const chamado = input.chamado.trim();
  if (!chamado) throw new Error("Informe o chamado / problema.");
  if (!Number.isFinite(input.custo) || input.custo < 0) {
    throw new Error("Custo inválido.");
  }
  if (!Number.isFinite(input.preco) || input.preco < 0) {
    throw new Error("Preço inválido.");
  }
  if (!(ORDEM_STATUS as readonly string[]).includes(input.status)) {
    throw new Error("Status inválido.");
  }

  const toTs = (value?: Date | null) =>
    value ? Timestamp.fromDate(value) : null;

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.ordens, id), {
    chamado,
    listaEntrada: cleanText(input.listaEntrada),
    descricaoChamado: cleanText(input.descricaoChamado),
    diagnosticoTecnico: cleanText(input.diagnosticoTecnico),
    servico: cleanText(input.servico),
    resolucao: cleanText(input.resolucao),
    obs: cleanText(input.obs),
    atendenteId: cleanText(input.atendenteId),
    atendenteNome: cleanText(input.atendenteNome),
    tecnicoId: cleanText(input.tecnicoId),
    tecnicoNome: cleanText(input.tecnicoNome),
    previsao: toTs(input.previsao),
    dataExecucao: toTs(input.dataExecucao),
    dataConclusao: toTs(input.dataConclusao),
    custo: input.custo,
    preco: input.preco,
    status: input.status,
    resolvido: Boolean(input.resolvido),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteOrdem(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTIONS.ordens, id));
}
