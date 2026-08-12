import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/collections";
import type { Cliente, ClienteInput } from "@/types/cliente";

export function mapClienteDoc(snap: QueryDocumentSnapshot<DocumentData>): Cliente {
  const data = snap.data();

  return {
    id: snap.id,
    nome: String(data.nome ?? ""),
    nascimento: data.nascimento ?? null,
    endereco: data.endereco ?? null,
    cidade: data.cidade ?? null,
    telefone: data.telefone ?? null,
    email: data.email ?? null,
    estado: data.estado ?? null,
    legacyId: data.legacyId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchAllClientes(): Promise<Cliente[]> {
  const db = getFirebaseDb();
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.clientes), orderBy("nome")),
    );
    return snap.docs.map(mapClienteDoc);
  } catch {
    // Sem índice/orderBy: fallback e ordena no client
    const snap = await getDocs(collection(db, COLLECTIONS.clientes));
    return snap.docs
      .map(mapClienteDoc)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }
}

export async function fetchClienteById(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTIONS.clientes, id));
  if (!snap.exists()) return null;
  return mapClienteDoc(snap as QueryDocumentSnapshot<DocumentData>);
}

function sanitizeInput(input: ClienteInput): ClienteInput {
  const clean = (value?: string | null) => {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  return {
    nome: input.nome.trim(),
    telefone: clean(input.telefone),
    email: clean(input.email),
    nascimento: clean(input.nascimento),
    endereco: clean(input.endereco),
    cidade: clean(input.cidade),
    estado: clean(input.estado),
    legacyId: input.legacyId ?? null,
  };
}

export async function createCliente(input: ClienteInput): Promise<string> {
  const now = Timestamp.now();
  const data = sanitizeInput(input);

  if (!data.nome) {
    throw new Error("Nome é obrigatório.");
  }
  if (!data.telefone) {
    throw new Error("Telefone é obrigatório.");
  }

  const ref = await addDoc(collection(getFirebaseDb(), COLLECTIONS.clientes), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function updateCliente(
  id: string,
  input: ClienteInput,
): Promise<void> {
  const data = sanitizeInput(input);

  if (!data.nome) {
    throw new Error("Nome é obrigatório.");
  }
  if (!data.telefone) {
    throw new Error("Telefone é obrigatório.");
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.clientes, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCliente(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTIONS.clientes, id));
}

export function filterClientes(
  clientes: Cliente[],
  search: string,
): Cliente[] {
  const q = search.trim().toLowerCase();
  if (!q) return clientes;

  const digits = q.replace(/\D/g, "");

  return clientes.filter((cliente) => {
    const nome = cliente.nome.toLowerCase();
    const telefone = (cliente.telefone ?? "").toLowerCase();
    const telefoneDigits = (cliente.telefone ?? "").replace(/\D/g, "");
    const cidade = (cliente.cidade ?? "").toLowerCase();
    const email = (cliente.email ?? "").toLowerCase();

    return (
      nome.includes(q) ||
      telefone.includes(q) ||
      cidade.includes(q) ||
      email.includes(q) ||
      (digits.length > 0 && telefoneDigits.includes(digits))
    );
  });
}
