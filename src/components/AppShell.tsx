"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  Wrench,
  X,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const SIDEBAR_KEY = "actech-sidebar-collapsed";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ordens", label: "Ordens", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/faturamento", label: "Faturamento", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/tecnicos", label: "Técnicos", icon: Wrench },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitial(email?: string | null) {
  if (!email) return "U";
  return email.charAt(0).toUpperCase();
}

function SidebarNav({
  collapsed,
  onToggle,
  onNavigate,
  showToggle = false,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  showToggle?: boolean;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const email = user?.email ?? "Usuário";

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex shrink-0 items-center border-b border-border ${
          collapsed
            ? "h-auto flex-col gap-1 px-2 py-2.5"
            : "h-14 gap-2 px-3"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-primary-light">
          <Cpu size={15} strokeWidth={1.75} aria-hidden />
        </span>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              ACTech
            </p>
          </div>
        ) : null}
        {showToggle && onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-foreground"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.75} />
            )}
          </button>
        ) : null}
      </div>

      <nav
        className={`flex-1 space-y-1 overflow-y-auto py-3 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition ${
                collapsed
                  ? "justify-center px-0 py-2.5"
                  : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-primary/15 text-primary-light"
                  : "text-secondary hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                className={`shrink-0 ${active ? "text-primary-light" : "text-muted"}`}
                aria-hidden
              />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={`shrink-0 border-t border-border ${
          collapsed ? "p-2" : "p-3"
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-light"
              title={email}
            >
              {userInitial(user?.email)}
            </span>
            <ThemeToggle className="h-8 w-8 border-0 bg-transparent" />
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-error"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-light">
              {userInitial(user?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {email}
              </p>
            </div>
            <ThemeToggle className="h-8 w-8 shrink-0 border-0 bg-transparent" />
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-error"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(pathname);

  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background print:block print:min-h-0 print:bg-white">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-surface transition-[width] duration-200 print:hidden lg:block ${
          collapsed ? "w-[4.25rem]" : "w-60"
        }`}
      >
        <SidebarNav
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          showToggle
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 print:hidden lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(100%,16.5rem)] border-r border-border bg-surface shadow-xl">
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-secondary hover:text-foreground"
                aria-label="Fechar menu"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <SidebarNav
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col print:block">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm print:hidden lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:text-foreground"
            aria-label="Abrir menu"
          >
            <Menu size={16} strokeWidth={1.75} />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <Cpu
              size={15}
              strokeWidth={1.75}
              className="text-primary-light"
              aria-hidden
            />
            <span className="truncate text-sm font-semibold text-foreground">
              ACTech
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 print:mx-0 print:max-w-none print:flex-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
