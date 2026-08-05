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
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

const NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/notes", label: "Conhecimento", icon: BookOpen },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/journal", label: "Diário", icon: NotebookPen },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
] as const;

// Tab bar no mobile — 5 itens mais usados
const TAB_NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

// Mapeia rota → título para a top bar do mobile
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

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col glass-panel border-r border-[var(--glass-border)]">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-[12px] bg-[#14213D] dark:bg-[#FCA311] flex items-center justify-center shadow-md">
              <span className="text-white dark:text-black text-sm font-black tracking-tight">Lo</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground tracking-tight">LifeOS</p>
              <p className="text-[10px] text-muted-foreground font-medium">Sistema pessoal</p>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-[12px] bg-[var(--color-muted)] px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-[var(--color-secondary)] transition-colors group"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-[13px]">Pesquisar...</span>
            <kbd className="text-[10px] text-muted-foreground/60 font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all",
                  active ? "nav-pill-active" : "nav-pill-inactive"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-[#FCA311]" : "")} />
                <span>{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FCA311]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings + user */}
        <div className="p-3 border-t border-[var(--glass-border)]">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all",
              pathname.startsWith("/settings") ? "nav-pill-active" : "nav-pill-inactive"
            )}
          >
            <Settings className={cn("h-[18px] w-[18px] shrink-0", pathname.startsWith("/settings") ? "text-[#FCA311]" : "")} />
            <span>Ajustes</span>
          </Link>

          {user && (
            <div className="mt-2 flex items-center gap-3 px-3.5 py-2">
              <div className="w-7 h-7 rounded-full bg-[#FCA311]/20 ring-2 ring-[#FCA311]/30 flex items-center justify-center overflow-hidden shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[10px] font-black text-[#FCA311]">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">
                  {user.user_metadata?.username || user.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Mobile top bar — estilo iOS */}
        <header className="md:hidden flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3 glass-panel border-b border-[var(--glass-border)] z-30">
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight leading-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Pesquisar"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-muted)] text-muted-foreground hover:text-foreground transition-colors ios-spring"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            {user && (
              <div className="w-9 h-9 rounded-full bg-[#FCA311]/20 ring-2 ring-[#FCA311]/40 flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[11px] font-black text-[#FCA311]">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ── Mobile Tab Bar — estilo iOS ─────────────────────────────── */}
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
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FCA311]" />
                    )}
                  </div>
                  <span className={cn("text-[10px] font-semibold tracking-tight", active ? "font-bold" : "")}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
