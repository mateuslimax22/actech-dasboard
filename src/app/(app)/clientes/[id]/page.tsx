import { Suspense } from "react";
import ClienteDetalheClient from "./ClienteDetalheClient";

function Fallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
      <div className="card-surface h-48 animate-pulse" />
    </div>
  );
}

export default function ClienteDetalheRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <ClienteDetalheClient />
    </Suspense>
  );
}
