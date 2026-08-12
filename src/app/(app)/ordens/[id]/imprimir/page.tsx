import { Suspense } from "react";
import ImprimirOrdemClient from "./ImprimirOrdemClient";

function Fallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-border/60" />
      <div className="card-surface h-96 animate-pulse" />
    </div>
  );
}

export default function ImprimirOrdemPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ImprimirOrdemClient />
    </Suspense>
  );
}
