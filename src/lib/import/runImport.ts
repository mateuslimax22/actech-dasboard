import {
  Timestamp,
  writeBatch,
  doc,
  type Firestore,
} from "firebase/firestore";
import { parseCsv } from "@/lib/import/parseCsv";
import {
  emptyToNull,
  normalizeName,
  normalizeOrdemStatus,
  parseResolvido,
  slugifyId,
} from "@/lib/import/normalize";
import { parseDateBR, parseMoney } from "@/lib/format";
import { COLLECTIONS, CONFIG_DOCS } from "@/types/collections";

type ClienteCsv = {
  id?: string;
  nome?: string;
  nascimento?: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  email?: string;
  estado?: string;
};

type OrdemCsv = {
  id?: string;
  chamado?: string;
  atendente?: string;
  dataemi?: string;
  cliente?: string;
  servico?: string;
  tecnico?: string;
  dataexe?: string;
  previsao?: string;
  custo?: string;
  preco?: string;
  resolvido?: string;
  dataconclu?: string;
  status?: string;
  temporesp?: string;
  obs?: string;
  tempoexe?: string;
  listain?: string;
  descricha?: string;
  resolucao?: string;
  diagtec?: string;
};

export type ImportProgress = {
  phase: string;
  current: number;
  total: number;
};

export type ImportResult = {
  clientes: number;
  ordens: number;
  tecnicos: number;
  clientesSemMatch: number;
  maxNumeroOrdem: number;
  warnings: string[];
};

const BATCH_SIZE = 400;

function toTimestamp(value: string | null | undefined): Timestamp | null {
  const date = parseDateBR(emptyToNull(value));
  return date ? Timestamp.fromDate(date) : null;
}

async function commitInChunks(
  db: Firestore,
  writer: (batch: ReturnType<typeof writeBatch>, index: number) => void,
  total: number,
  onProgress?: (current: number, total: number) => void,
) {
  for (let start = 0; start < total; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const end = Math.min(start + BATCH_SIZE, total);
    for (let i = start; i < end; i += 1) {
      writer(batch, i);
    }
    await batch.commit();
    onProgress?.(end, total);
  }
}

export async function runCsvImport(
  db: Firestore,
  clientesCsv: string,
  ordensCsv: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const warnings: string[] = [];
  const now = Timestamp.now();

  const clienteRows = parseCsv<ClienteCsv>(clientesCsv);
  const ordemRows = parseCsv<OrdemCsv>(ordensCsv);

  onProgress?.({ phase: "clientes", current: 0, total: clienteRows.length });

  const clienteByName = new Map<string, { id: string; nome: string }>();
  const clienteDocs: Array<{
    id: string;
    data: Record<string, unknown>;
  }> = [];

  for (const row of clienteRows) {
    const legacyId = Number(row.id);
    const nome = emptyToNull(row.nome);
    if (!nome || !Number.isFinite(legacyId)) {
      warnings.push(`Cliente ignorado (sem nome/id): ${JSON.stringify(row)}`);
      continue;
    }

    const id = `c_${legacyId}`;
    const data = {
      nome,
      nascimento: emptyToNull(row.nascimento),
      endereco: emptyToNull(row.endereco),
      cidade: emptyToNull(row.cidade),
      telefone: emptyToNull(row.telefone),
      email: emptyToNull(row.email),
      estado: emptyToNull(row.estado),
      legacyId,
      createdAt: now,
      updatedAt: now,
    };

    clienteDocs.push({ id, data });

    const key = normalizeName(nome);
    if (key) {
      // Se houver duplicata de nome, mantém o primeiro e avisa
      if (clienteByName.has(key)) {
        warnings.push(`Nome duplicado no CSV de clientes: ${nome}`);
      } else {
        clienteByName.set(key, { id, nome });
      }
    }
  }

  await commitInChunks(
    db,
    (batch, index) => {
      const item = clienteDocs[index];
      batch.set(doc(db, COLLECTIONS.clientes, item.id), item.data, {
        merge: true,
      });
    },
    clienteDocs.length,
    (current, total) => onProgress?.({ phase: "clientes", current, total }),
  );

  // Técnicos a partir de atendente + tecnico nas OS
  const tecnicoNames = new Set<string>();
  for (const row of ordemRows) {
    const tecnico = emptyToNull(row.tecnico);
    const atendente = emptyToNull(row.atendente);
    if (tecnico) tecnicoNames.add(tecnico);
    if (atendente) tecnicoNames.add(atendente);
  }

  const tecnicoDocs = Array.from(tecnicoNames).map((nome) => ({
    id: `t_${slugifyId(nome)}`,
    data: {
      nome,
      ativo: true,
      role: "tecnico" as "tecnico" | "atendente",
      createdAt: now,
      updatedAt: now,
    },
  }));

  const atendenteSet = new Set(
    ordemRows
      .map((r) => emptyToNull(r.atendente))
      .filter((v): v is string => Boolean(v))
      .map(normalizeName),
  );
  const tecnicoOnlySet = new Set(
    ordemRows
      .map((r) => emptyToNull(r.tecnico))
      .filter((v): v is string => Boolean(v))
      .map(normalizeName),
  );

  for (const item of tecnicoDocs) {
    const key = normalizeName(item.data.nome);
    const isAtendente = atendenteSet.has(key);
    const isTecnico = tecnicoOnlySet.has(key);
    item.data.role =
      isAtendente && !isTecnico
        ? "atendente"
        : isTecnico
          ? "tecnico"
          : "atendente";
  }

  onProgress?.({ phase: "tecnicos", current: 0, total: tecnicoDocs.length });
  await commitInChunks(
    db,
    (batch, index) => {
      const item = tecnicoDocs[index];
      batch.set(doc(db, COLLECTIONS.tecnicos, item.id), item.data, {
        merge: true,
      });
    },
    tecnicoDocs.length,
    (current, total) => onProgress?.({ phase: "tecnicos", current, total }),
  );

  const tecnicoByName = new Map(
    tecnicoDocs.map((t) => [normalizeName(t.data.nome), t.id]),
  );

  let clientesSemMatch = 0;
  let maxNumeroOrdem = 0;

  const ordemDocs: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const row of ordemRows) {
    const legacyId = Number(row.id);
    if (!Number.isFinite(legacyId)) {
      warnings.push(`OS ignorada (sem id): ${JSON.stringify(row)}`);
      continue;
    }

    const clienteNome = emptyToNull(row.cliente) ?? "Cliente não informado";
    const clienteMatch = clienteByName.get(normalizeName(clienteNome));
    if (!clienteMatch) {
      clientesSemMatch += 1;
    }

    const resolvido = parseResolvido(row.resolvido);
    const status = normalizeOrdemStatus(row.status, resolvido);
    const dataEmissao =
      toTimestamp(row.dataemi) ?? toTimestamp(row.dataconclu) ?? now;
    const dataConclusao = toTimestamp(row.dataconclu);
    const dataExecucao = toTimestamp(row.dataexe);
    const previsao = toTimestamp(row.previsao);

    const atendenteNome = emptyToNull(row.atendente);
    const tecnicoNome = emptyToNull(row.tecnico);

    const numero = legacyId;
    if (numero > maxNumeroOrdem) maxNumeroOrdem = numero;

    const id = `o_${legacyId}`;
    ordemDocs.push({
      id,
      data: {
        numero,
        chamado: emptyToNull(row.chamado) ?? "",
        atendenteId: atendenteNome
          ? (tecnicoByName.get(normalizeName(atendenteNome)) ?? null)
          : null,
        atendenteNome,
        clienteId: clienteMatch?.id ?? "cliente_nao_encontrado",
        clienteNome: clienteMatch?.nome ?? clienteNome,
        servico: emptyToNull(row.servico),
        tecnicoId: tecnicoNome
          ? (tecnicoByName.get(normalizeName(tecnicoNome)) ?? null)
          : null,
        tecnicoNome,
        dataEmissao,
        dataExecucao,
        previsao,
        custo: parseMoney(row.custo),
        preco: parseMoney(row.preco),
        resolvido,
        dataConclusao,
        status,
        obs: emptyToNull(row.obs),
        listaEntrada: emptyToNull(row.listain),
        descricaoChamado: emptyToNull(row.descricha),
        resolucao: emptyToNull(row.resolucao),
        diagnosticoTecnico: emptyToNull(row.diagtec),
        legacyId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  onProgress?.({ phase: "ordens", current: 0, total: ordemDocs.length });
  await commitInChunks(
    db,
    (batch, index) => {
      const item = ordemDocs[index];
      batch.set(doc(db, COLLECTIONS.ordens, item.id), item.data, { merge: true });
    },
    ordemDocs.length,
    (current, total) => onProgress?.({ phase: "ordens", current, total }),
  );

  // counters + loja mínima
  onProgress?.({ phase: "config", current: 0, total: 2 });
  const configBatch = writeBatch(db);
  configBatch.set(
    doc(db, COLLECTIONS.config, CONFIG_DOCS.counters),
    {
      proximoNumeroOrdem: maxNumeroOrdem + 1,
      updatedAt: now,
    },
    { merge: true },
  );
  configBatch.set(
    doc(db, COLLECTIONS.config, CONFIG_DOCS.loja),
    {
      nome: "ACTech",
      telefone: null,
      cnpj: null,
      endereco: null,
      garantiaPadraoDias: 90,
      updatedAt: now,
    },
    { merge: true },
  );
  await configBatch.commit();
  onProgress?.({ phase: "config", current: 2, total: 2 });

  if (clientesSemMatch > 0) {
    warnings.push(
      `${clientesSemMatch} OS sem cliente correspondente por nome (clienteId = cliente_nao_encontrado).`,
    );
  }

  return {
    clientes: clienteDocs.length,
    ordens: ordemDocs.length,
    tecnicos: tecnicoDocs.length,
    clientesSemMatch,
    maxNumeroOrdem,
    warnings,
  };
}
