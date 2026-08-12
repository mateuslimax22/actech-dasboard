"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!configured) {
      return;
    }

    if (!user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [user, loading, configured, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-secondary">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="card-surface max-w-md p-6 text-sm text-secondary">
          Firebase não configurado. Preencha as variáveis{" "}
          <code className="font-mono text-primary-light">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          no arquivo <code className="font-mono text-foreground">.env</code>.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  return <>{children}</>;
}
