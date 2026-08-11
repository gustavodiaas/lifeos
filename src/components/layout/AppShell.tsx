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
  Plus,
  Library,
  Calendar,
  Users,
  UserPlus,
  Eye,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { MobileAppDrawer } from "./MobileAppDrawer";
import { QuickActionFab } from "./QuickActionFab";
import { NotificationManager } from "./NotificationManager";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SharedAccessModal } from "@/components/modals/SharedAccessModal";

/** Returns greeting based on current hour */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Returns display name: username > full_name > email prefix */
function getFirstName(user: any): string {
  const name =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Você";
  return name.split(/[\s.]/)[0];
}

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendário", icon: Calendar },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/books", label: "Livros", icon: Library },
  { to: "/notes", label: "Conhecimento", icon: BookOpen },
  { to: "/journal", label: "Diário", icon: NotebookPen },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/": "LifeOS",
  "/calendar": "Calendário",
  "/books": "Estante Virtual",
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
  const [fabOpen, setFabOpen] = useState(false);
  const [sharedModalOpen, setSharedModalOpen] = useState(false);
  const [workspaceDropOpen, setWorkspaceDropOpen] = useState(false);
  const wsDropRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthContext();
  const { activeUserId, isSharedWorkspace, activeWorkspace, myWorkspaces, setActiveUserId } = useWorkspace();

  const greeting = getGreeting();
  const firstName = getFirstName(user);
  const avatarUrl = user?.user_metadata?.avatar_url || (typeof window !== "undefined" ? localStorage.getItem("lifeos_avatar_url") : null) || "";

  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ?? "LifeOS";

  // Build option list for the workspace dropdown
  const workspaceOptions = [
    { id: user?.id || "guest", label: "Minha Conta Pessoal", isOwn: true },
    ...myWorkspaces.map((ws) => ({ id: ws.ownerId, label: ws.ownerName, isOwn: false })),
  ];
  const activeOption = workspaceOptions.find((o) => o.id === activeUserId) ?? workspaceOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsDropRef.current && !wsDropRef.current.contains(e.target as Node)) {
        setWorkspaceDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <div className="flex h-[100dvh] w-full bg-background text-foreground">

      {/* ── Desktop Sidebar — macOS Style ───────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col glass-panel border-r border-[var(--glass-border)] select-none">
        {/* Header / Brand */}
        <div className="px-5 pt-6 pb-3">
          <Link to="/settings" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-full bg-[#212121] dark:bg-foreground flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-black/20 transition-transform group-hover:scale-105 overflow-hidden shrink-0 ring-2 ring-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white dark:text-black text-base font-extrabold tracking-tight">
                  {firstName[0]?.toUpperCase() ?? "L"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-foreground tracking-tight truncate">{firstName}</p>
              <p className="text-[11px] text-muted-foreground font-medium truncate">{greeting} 👋</p>
            </div>
          </Link>
        </div>

        {/* Navigation - Menu Único Unificado */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
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
                <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", active ? "text-foreground" : "")} />
                <span>{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Workspace Switcher + Settings + User */}
        <div className="p-3 border-t border-[var(--glass-border)] bg-muted/20 space-y-2">

          {/* Espaço Ativo — custom dropdown */}
          <div className="p-2 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Espaço Ativo</span>
              <button
                onClick={() => setSharedModalOpen(true)}
                className="text-[10px] font-extrabold text-foreground hover:underline flex items-center gap-1"
                title="Convidar ou Acessar Outras Contas"
              >
                <UserPlus size={12} />
                <span>Acessos</span>
              </button>
            </div>

            {/* Custom dropdown — NOT a native select */}
            <div className="relative" ref={wsDropRef}>
              <button
                onClick={() => setWorkspaceDropOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{activeOption.isOwn ? "👤" : "👥"}</span>
                  <span className="truncate">{activeOption.label}</span>
                </span>
                <ChevronDown
                  size={13}
                  className={cn("shrink-0 transition-transform duration-200", workspaceDropOpen && "rotate-180")}
                />
              </button>

              {workspaceDropOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  {workspaceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveUserId(opt.id);
                        setWorkspaceDropOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors text-left",
                        opt.id === activeUserId
                          ? "bg-foreground/10 text-foreground"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span>{opt.isOwn ? "👤" : "👥"}</span>
                      <span className="flex-1 truncate">{opt.label}</span>
                      {opt.id === activeUserId && <Check size={12} className="shrink-0 text-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ajustes */}
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
              pathname.startsWith("/settings") ? "nav-pill-active shadow-sm" : "nav-pill-inactive"
            )}
          >
            <Settings className={cn("h-4.5 w-4.5 shrink-0", pathname.startsWith("/settings") ? "text-foreground" : "")} />
            <span>Ajustes</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-foreground/20 ring-2 ring-foreground/40 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xs font-extrabold text-foreground">
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

        {/* Mobile top bar — Unificado com a Status Bar do iPhone */}
        <header className="md:hidden flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3 bg-background z-30 select-none">
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
              <div className="w-9 h-9 rounded-full bg-foreground/20 ring-2 ring-foreground/40 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[11px] font-extrabold text-foreground">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Banner de Aviso de Espaço Compartilhado */}
        {isSharedWorkspace && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-amber-500" />
              <span>
                Espaço Compartilhado: Visualizando a conta de <strong>{activeWorkspace.ownerName}</strong>
              </span>
            </div>
            <button
              onClick={() => setActiveUserId(user?.id || "guest")}
              className="text-[11px] font-black underline hover:opacity-80"
            >
              Voltar para Minha Conta
            </button>
          </div>
        )}

        {/* Page body content */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-28 md:pb-0">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ── iOS 26 Floating Glass Pill Bar no Mobile ────────────────── */}
      <div className="md:hidden fixed bottom-3 inset-x-0 z-[100] px-4 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto w-full max-w-md bg-card/85 dark:bg-[#212121]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-full px-3 py-1.5 flex items-center justify-between">
          
          {/* Painel */}
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname === "/" ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            <LayoutDashboard size={20} strokeWidth={pathname === "/" ? 2.5 : 1.75} />
            <span className="text-[9px] tracking-tight">Painel</span>
          </Link>

          {/* Hábitos */}
          <Link
            to="/habits"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname.startsWith("/habits") ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            <Repeat size={20} strokeWidth={pathname.startsWith("/habits") ? 2.5 : 1.75} />
            <span className="text-[9px] tracking-tight">Hábitos</span>
          </Link>

          {/* BOTÃO CENTRAL INTEGRADOR (+) DE AÇÃO RÁPIDA */}
          <button
            onClick={() => setFabOpen(true)}
            className="w-12 h-12 rounded-full bg-foreground text-background shadow-lg shadow-black/20 flex items-center justify-center active:scale-90 transition-all mx-1 shrink-0"
            title="Nova Ação"
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          {/* Finanças */}
          <Link
            to="/finance"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname.startsWith("/finance") ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            <Wallet size={20} strokeWidth={pathname.startsWith("/finance") ? 2.5 : 1.75} />
            <span className="text-[9px] tracking-tight">Finanças</span>
          </Link>

          {/* Tarefas */}
          <Link
            to="/tasks"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname.startsWith("/tasks") ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            <CheckSquare size={20} strokeWidth={pathname.startsWith("/tasks") ? 2.5 : 1.75} />
            <span className="text-[9px] tracking-tight">Tarefas</span>
          </Link>

          {/* Mais (App Sheet) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95 text-muted-foreground hover:text-foreground"
          >
            <Grid size={20} strokeWidth={1.75} />
            <span className="text-[9px] tracking-tight font-semibold">Mais</span>
          </button>
        </nav>
      </div>

      {/* Modal Speed Dial da Ação Rápida */}
      <QuickActionFab open={fabOpen} onClose={() => setFabOpen(false)} />

      {/* Drawer de Todos os Apps */}
      <MobileAppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Palette de Pesquisa Rápida */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Gerenciador Silencioso de Notificações PWA */}
      <NotificationManager />

      {/* Modal de Acessos Simultâneos & Convites */}
      <SharedAccessModal open={sharedModalOpen} onClose={() => setSharedModalOpen(false)} />
    </div>
  );
}
