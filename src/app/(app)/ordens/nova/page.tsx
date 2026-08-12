import { Suspense } from "react";
import NovaOrdemClient from "./NovaOrdemClient";

function Fallback() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
      <div className="card-surface h-72 animate-pulse" />
    </div>
  );
}

export default function NovaOrdemPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <NovaOrdemClient />
    </Suspense>
  );
}
