import {
  Timestamp,
  addDoc,
  collection,
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
import type { Tecnico, TecnicoInput, TecnicoRole } from "@/types/tecnico";
import { TECNICO_ROLES } from "@/types/tecnico";

function asRole(value: unknown): TecnicoRole {
  if (
    typeof value === "string" &&
    (TECNICO_ROLES as readonly string[]).includes(value)
  ) {
    return value as TecnicoRole;
  }
  return "tecnico";
}

export function mapTecnicoDoc(
  snap: QueryDocumentSnapshot<DocumentData>,
): Tecnico {
  const data = snap.data();

  return {
    id: snap.id,
    nome: String(data.nome ?? ""),
    ativo: data.ativo !== false,
    role: asRole(data.role),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchAllTecnicos(): Promise<Tecnico[]> {
  const db = getFirebaseDb();
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.tecnicos), orderBy("nome")),
    );
    return snap.docs.map(mapTecnicoDoc);
  } catch {
    const snap = await getDocs(collection(db, COLLECTIONS.tecnicos));
    return snap.docs
      .map(mapTecnicoDoc)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }
}

/** Só ativos — para selects de OS */
export async function fetchActiveTecnicos(): Promise<Tecnico[]> {
  const all = await fetchAllTecnicos();
  return all.filter((t) => t.ativo);
}

export async function fetchTecnicoById(id: string): Promise<Tecnico | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTIONS.tecnicos, id));
  if (!snap.exists()) return null;
  return mapTecnicoDoc(snap as QueryDocumentSnapshot<DocumentData>);
}

function sanitizeInput(input: TecnicoInput): TecnicoInput {
  const nome = input.nome.trim();
  if (!nome) throw new Error("Nome é obrigatório.");
  if (!(TECNICO_ROLES as readonly string[]).includes(input.role)) {
    throw new Error("Função inválida.");
  }

  return {
    nome,
    ativo: Boolean(input.ativo),
    role: input.role,
  };
}

export async function createTecnico(input: TecnicoInput): Promise<string> {
  const data = sanitizeInput(input);
  const now = Timestamp.now();
  const ref = await addDoc(collection(getFirebaseDb(), COLLECTIONS.tecnicos), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateTecnico(
  id: string,
  input: TecnicoInput,
): Promise<void> {
  const data = sanitizeInput(input);
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.tecnicos, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function setTecnicoAtivo(
  id: string,
  ativo: boolean,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.tecnicos, id), {
    ativo,
    updatedAt: Timestamp.now(),
  });
}

export function filterTecnicos(tecnicos: Tecnico[], search: string): Tecnico[] {
  const q = search.trim().toLowerCase();
  if (!q) return tecnicos;
  return tecnicos.filter(
    (t) =>
      t.nome.toLowerCase().includes(q) ||
      t.role.toLowerCase().includes(q),
  );
}
