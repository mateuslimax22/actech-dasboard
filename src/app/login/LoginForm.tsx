"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

function loginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "E-mail inválido.";
      case "auth/user-disabled":
        return "Usuário desativado.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "E-mail ou senha incorretos.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Tente novamente em alguns minutos.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Não foi possível entrar.";
}

const features = [
  {
    icon: ClipboardList,
    label: "Ordens de serviço com status e histórico",
  },
  {
    icon: Users,
    label: "Cadastro de clientes e equipamentos",
  },
  {
    icon: BarChart3,
    label: "Indicadores de operação e faturamento",
  },
] as const;

function BrandMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-elevated text-primary-light">
      <Cpu size={16} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export default function LoginForm() {
  const { user, loading, configured, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    }
  }, [user, loading, router, nextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="relative grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <section className="relative hidden overflow-hidden border-b border-border lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:border-border lg:bg-surface lg:px-12 lg:py-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at 30% 20%, black 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                ACTech
              </p>
              <p className="text-xs text-muted">Operação técnica</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-[2.15rem] font-semibold leading-[1.15] tracking-tight text-foreground xl:text-[2.5rem]">
            Controle de clientes, OS e bancada em um só lugar.
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-secondary">
            Painel interno para abertura de chamados, acompanhamento de status,
            faturamento e impressão de comprovantes.
          </p>

          <ul className="space-y-3 border-t border-border pt-6">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 text-sm text-secondary">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-primary-light">
                  <Icon size={14} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="pt-1 leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative inline-flex items-center gap-2 text-xs text-muted">
          <ShieldCheck size={14} strokeWidth={1.75} className="text-secondary" aria-hidden />
          Acesso restrito à equipe autorizada.
        </p>
      </section>

      <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <div>
              <p className="text-sm font-semibold text-foreground">ACTech</p>
              <p className="text-xs text-muted">Operação técnica</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Entrar na conta
            </h2>
            <p className="text-sm leading-relaxed text-secondary">
              Use o e-mail corporativo cadastrado pela administração.
            </p>
          </div>

          {!configured && (
            <p className="alert-warning mt-6">
              Firebase não configurado. Verifique o arquivo{" "}
              <code className="font-mono text-foreground">.env</code>.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">E-mail</span>
              <div className="input-wrap">
                <span className="input-wrap__icon">
                  <Mail size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-wrap__control"
                  placeholder="nome@empresa.com"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Senha</span>
              <div className="input-wrap">
                <span className="input-wrap__icon">
                  <Lock size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-wrap__control"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="input-wrap__action"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.75} />
                  ) : (
                    <Eye size={16} strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="alert-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !configured}
              className="btn-primary h-11 w-full"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Autenticando…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Continuar
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 inline-flex items-start gap-2 border-t border-border pt-6 text-xs leading-relaxed text-muted">
            <ShieldCheck
              size={14}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0 text-secondary"
              aria-hidden
            />
            Problemas de acesso? Solicite reativação ao administrador do sistema.
          </p>
        </div>
      </section>
    </main>
  );
}
