import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Repeat,
  Target,
  Wallet,
  NotebookPen,
  BarChart3,
  Settings,
  Search,
  Grid,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { MobileAppDrawer } from "./MobileAppDrawer";
import { QuickActionFab } from "./QuickActionFab";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

const NAV_MAIN = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/goals", label: "Metas", icon: Target },
] as const;

const NAV_MODULES = [
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/notes", label: "Conhecimento", icon: BookOpen },
  { to: "/journal", label: "Diário", icon: NotebookPen },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
] as const;

// Tab bar no mobile — 4 mais usados + "Mais" (App Sheet)
const TAB_NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/": "LifeOS",
  "/notes": "Conhecimento",
  "/habits": "Hábitos",
  "/tasks": "Tarefas",
  "/goals": "Metas",
  "/finance": "Finanças",
  "/journal": "Diário",
  "/stats": "Estatísticas",
  "/settings": "Ajustes",
};

export function AppShell({ children }: { children?: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthContext();

  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ?? "LifeOS";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">

      {/* ── Desktop Sidebar — macOS Style ───────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col glass-panel border-r border-[var(--glass-border)] select-none">
        {/* Header / Brand */}
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-[#14213D] dark:bg-[#FCA311] flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-[#FCA311]/20 transition-transform group-hover:scale-105">
              <span className="text-white dark:text-black text-base font-extrabold tracking-tight">L</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-base font-extrabold text-foreground tracking-tight">LifeOS</p>
                <span className="badge-ios">v0.4</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Sistema Pessoal Pro</p>
            </div>
          </Link>
        </div>

        {/* Quick Search Trigger */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-xl bg-muted/60 hover:bg-muted px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-all border border-border/50 group shadow-sm"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#FCA311] transition-colors" />
            <span className="flex-1 text-left font-medium text-[12px]">Pesquisar no LifeOS...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">⌘K</kbd>
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto pt-2">
          {/* Seção Principal */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest mb-1.5">
              Principal
            </p>
            {NAV_MAIN.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                    active ? "nav-pill-active shadow-sm" : "nav-pill-inactive"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", active ? "text-[#FCA311]" : "")} />
                  <span>{label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FCA311]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Seção Gestão & Módulos */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest mb-1.5">
              Módulos
            </p>
            {NAV_MODULES.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                    active ? "nav-pill-active shadow-sm" : "nav-pill-inactive"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", active ? "text-[#FCA311]" : "")} />
                  <span>{label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FCA311]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer: User Profile & Settings */}
        <div className="p-3 border-t border-[var(--glass-border)] bg-muted/20">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all mb-1",
              pathname.startsWith("/settings") ? "nav-pill-active shadow-sm" : "nav-pill-inactive"
            )}
          >
            <Settings className={cn("h-4.5 w-4.5 shrink-0", pathname.startsWith("/settings") ? "text-[#FCA311]" : "")} />
            <span>Ajustes</span>
          </Link>

          {user && (
            <div className="mt-1 flex items-center gap-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-[#FCA311]/20 ring-2 ring-[#FCA311]/40 flex items-center justify-center overflow-hidden shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xs font-extrabold text-[#FCA311]">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-foreground truncate leading-tight">
                  {user.user_metadata?.username || user.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Mobile top bar — iOS Style Header */}
        <header className="md:hidden flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),14px)] pb-3 glass-panel border-b border-[var(--glass-border)] z-30">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Pesquisar"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-colors ios-spring"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            {user && (
              <div className="w-9 h-9 rounded-full bg-[#FCA311]/20 ring-2 ring-[#FCA311]/40 flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[11px] font-extrabold text-[#FCA311]">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page body content */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+76px)] md:pb-0">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ── Mobile Quick Action FAB (+ Botão Flutuante) ─────────────── */}
      <QuickActionFab />

      {/* ── Mobile Tab Bar — iOS Style ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-[var(--glass-border)]">
        <ul
          className="flex justify-around items-end px-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
        >
          {TAB_NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 pt-3 pb-1 px-3 transition-all ios-spring select-none",
                    active ? "tab-active" : "tab-inactive"
                  )}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.75} />
                    {active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FCA311]" />
                    )}
                  </div>
                  <span className={cn("text-[10px] tracking-tight", active ? "font-bold" : "font-semibold")}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Botão "Mais" que abre o App Sheet iOS */}
          <li>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-1 pt-3 pb-1 px-3 transition-all ios-spring select-none text-muted-foreground hover:text-foreground"
            >
              <Grid className="h-6 w-6" strokeWidth={1.75} />
              <span className="text-[10px] font-semibold tracking-tight">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Drawer de Todos os Apps */}
      <MobileAppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Palette de Pesquisa Rápida */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
