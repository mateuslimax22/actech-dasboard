"use client";

import { useState } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import {
  runCsvImport,
  type ImportProgress,
  type ImportResult,
} from "@/lib/import/runImport";

async function readFile(file: File | null): Promise<string | null> {
  if (!file) return null;
  return file.text();
}

export default function ImportarPage() {
  const [clientesFile, setClientesFile] = useState<File | null>(null);
  const [ordensFile, setOrdensFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setResult(null);
    setRunning(true);
    setProgress(null);

    try {
      const [clientesCsv, ordensCsv] = await Promise.all([
        readFile(clientesFile),
        readFile(ordensFile),
      ]);

      if (!clientesCsv || !ordensCsv) {
        throw new Error("Selecione os dois arquivos: clientes.csv e os.csv");
      }

      const importResult = await runCsvImport(
        getFirebaseDb(),
        clientesCsv,
        ordensCsv,
        setProgress,
      );
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no import");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Importar CSVs
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Etapa 2.5 — carrega clientes e ordens no Firestore. Pode rodar de novo:
          usa IDs estáveis e faz merge.
        </p>
      </div>

      <div className="card-surface space-y-4 p-6">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">clientes.csv</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setClientesFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">os.csv</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setOrdensFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
          />
        </label>

        <button
          type="button"
          disabled={running || !clientesFile || !ordensFile}
          onClick={handleImport}
          className="btn-primary w-full"
        >
          {running ? "Importando…" : "Importar para o Firestore"}
        </button>

        {progress && (
          <p className="text-sm text-secondary">
            <span className="text-primary-light">{progress.phase}</span>:{" "}
            {progress.current}/{progress.total}
          </p>
        )}

        {error && <p className="alert-error">{error}</p>}

        {result && (
          <div className="alert-success space-y-2">
            <p className="font-medium text-foreground">Import concluído</p>
            <ul className="list-inside list-disc space-y-0.5 text-secondary">
              <li>{result.clientes} clientes</li>
              <li>{result.ordens} ordens</li>
              <li>{result.tecnicos} técnicos/atendentes</li>
              <li>Próximo nº OS: {result.maxNumeroOrdem + 1}</li>
              <li>OS sem match de cliente: {result.clientesSemMatch}</li>
            </ul>
            {result.warnings.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium text-foreground">
                  {result.warnings.length} avisos
                </summary>
                <ul className="mt-2 max-h-48 list-inside list-disc overflow-y-auto text-xs text-secondary">
                  {result.warnings.slice(0, 50).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Cópias locais em <code className="font-mono text-secondary">data/</code>.
        Selecione esses arquivos (ou os originais) para importar.
      </p>
    </div>
  );
}
