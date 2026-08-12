import { Suspense } from "react";
import OrdensListClient from "./OrdensListClient";

function Fallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-border/60" />
      <div className="card-surface h-64 animate-pulse" />
    </div>
  );
}

export default function OrdensPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <OrdensListClient />
    </Suspense>
  );
}
