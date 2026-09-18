import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Eye,
  Grid2X2,
  LayoutDashboard,
  Library,
  NotebookPen,
  Plus,
  Repeat,
  Search,
  Settings,
  ShoppingCart,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { MobileAppDrawer } from "./MobileAppDrawer";
import { QuickActionFab } from "./QuickActionFab";
import { NotificationManager } from "./NotificationManager";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SharedAccessModal } from "@/components/modals/SharedAccessModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getFirstName(user: User | null): string {
  const name =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Você";
  return String(name).split(/[\s.]/)[0];
}

const NAV_GROUPS = [
  {
    label: "Organizar",
    items: [
      { to: "/", label: "Visão geral", icon: LayoutDashboard },
      { to: "/calendar", label: "Calendário", icon: Calendar },
      { to: "/tasks", label: "Tarefas", icon: CheckSquare },
      { to: "/goals", label: "Metas", icon: Target },
      { to: "/habits", label: "Hábitos", icon: Repeat },
    ],
  },
  {
    label: "Acompanhar",
    items: [
      { to: "/finance", label: "Finanças", icon: Wallet },
      { to: "/stats", label: "Estatísticas", icon: BarChart3 },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { to: "/notes", label: "Conhecimento", icon: BookOpen },
      { to: "/books", label: "Livros", icon: Library },
      { to: "/journal", label: "Diário", icon: NotebookPen },
      { to: "/shopping", label: "Compras", icon: ShoppingCart },
    ],
  },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/": "Visão geral",
  "/calendar": "Calendário",
  "/shopping": "Compras",
  "/books": "Livros",
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
  const workspaceDropRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const {
    activeUserId,
    isSharedWorkspace,
    activeWorkspace,
    myWorkspaces,
    setActiveUserId,
    joinWorkspaceByToken,
  } = useWorkspace();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const inviteToken = new URLSearchParams(window.location.search).get("invite");
    if (!inviteToken) return;

    joinWorkspaceByToken(inviteToken).then(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }, [joinWorkspaceByToken]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (workspaceDropRef.current && !workspaceDropRef.current.contains(event.target as Node)) {
        setWorkspaceDropOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  const firstName = getFirstName(user);
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    (typeof window !== "undefined" ? localStorage.getItem("lifeos_avatar_url") : null) ||
    "";
  const pageTitle =
    Object.entries(PAGE_TITLES)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ??
    "LifeOS";

  const workspaceOptions = [
    { id: user?.id || "guest", label: "Meu espaço", isOwn: true },
    ...myWorkspaces.map((workspace) => ({
      id: workspace.ownerId,
      label: workspace.ownerName,
      isOwn: false,
    })),
  ];
  const activeOption =
    workspaceOptions.find((option) => option.id === activeUserId) ?? workspaceOptions[0];

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <aside className="glass-panel hidden w-[272px] shrink-0 flex-col border-y-0 border-l-0 md:flex">
        <div className="px-4 pb-3 pt-5">
          <Link to="/" className="flex items-center gap-3 rounded-[14px] px-2 py-1.5">
            <BrandMark className="size-10" />
            <div className="min-w-0">
              <p className="sf-display text-[17px] font-bold tracking-[-0.035em]">LifeOS</p>
              <p className="text-[10px] font-medium text-muted-foreground">Seu sistema pessoal</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="material-button mt-4 flex h-10 w-full items-center gap-2.5 px-3 text-left text-xs font-medium text-muted-foreground"
          >
            <Search className="size-4" />
            <span className="flex-1">Buscar</span>
            <kbd className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">
              ⌘ K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && "mt-5")}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        "ios-spring group flex min-h-10 items-center gap-3 rounded-[12px] px-3 text-[13px] font-medium",
                        active ? "nav-pill-active" : "nav-pill-inactive",
                      )}
                    >
                      <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.25 : 1.85} />
                      <span>{label}</span>
                      {active && (
                        <span className="ml-auto size-1.5 rounded-full bg-[var(--system-blue)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="relative" ref={workspaceDropRef}>
            <button
              type="button"
              onClick={() => setWorkspaceDropOpen((open) => !open)}
              className="ios-spring flex w-full items-center gap-2.5 rounded-[13px] px-3 py-2 text-left hover:bg-muted/60"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground">
                {activeOption.isOwn ? <Grid2X2 className="size-4" /> : <Users className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {activeOption.label}
                </p>
                <p className="text-[10px] text-muted-foreground">Espaço ativo</p>
              </div>
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  workspaceDropOpen && "rotate-180",
                )}
              />
            </button>

            {workspaceDropOpen && (
              <div className="thin-material absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-[16px] p-1.5">
                {workspaceOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => {
                      setActiveUserId(option.id);
                      setWorkspaceDropOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium",
                      option.id === activeUserId
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted/70",
                    )}
                  >
                    {option.isOwn ? (
                      <Grid2X2 className="size-3.5" />
                    ) : (
                      <Users className="size-3.5" />
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.id === activeUserId && <Check className="size-3.5" />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceDropOpen(false);
                    setSharedModalOpen(true);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-[10px] border-t border-border px-2.5 py-2.5 text-left text-xs font-medium text-[var(--system-blue)] hover:bg-muted/70"
                >
                  <UserPlus className="size-3.5" />
                  Gerenciar acessos
                </button>
              </div>
            )}
          </div>

          <Link
            to="/settings"
            className={cn(
              "ios-spring mt-1 flex items-center gap-3 rounded-[13px] px-3 py-2.5",
              pathname.startsWith("/settings") ? "nav-pill-active" : "hover:bg-muted/60",
            )}
          >
            <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-muted text-muted-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt={firstName} className="size-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{firstName[0]?.toUpperCase() ?? "L"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{firstName}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.email || "Ajustes da conta"}
              </p>
            </div>
            <Settings className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-[var(--system-blue)]/[0.055] blur-3xl" />

        <header className="thin-material relative z-30 flex shrink-0 items-center justify-between border-x-0 border-t-0 px-5 pb-3 pt-[max(env(safe-area-inset-top),14px)] shadow-none md:hidden">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              {getGreeting()}, {firstName}
            </p>
            <h1 className="sf-display text-xl font-semibold tracking-[-0.035em] text-foreground">
              {pageTitle}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Pesquisar"
            className="material-button grid size-9 place-items-center rounded-full text-muted-foreground"
          >
            <Search className="size-4" />
          </button>
        </header>

        {isSharedWorkspace && (
          <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-5 py-2 text-xs font-medium text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Eye className="size-4" />
              <span>
                Visualizando o espaço de <strong>{activeWorkspace.ownerName}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveUserId(user?.id || "guest")}
              className="font-semibold text-[var(--system-blue)]"
            >
              Voltar
            </button>
          </div>
        )}

        <div className="relative z-10 flex-1 min-w-0 overflow-y-auto pb-28 md:pb-0">
          {children ?? <Outlet />}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-[100] flex justify-center px-4 md:hidden">
        <nav className="thin-material pointer-events-auto grid w-full max-w-sm grid-cols-5 items-center rounded-[25px] p-1.5 shadow-[0_18px_55px_-18px_rgba(0,0,0,0.42)]">
          <MobileNavItem to="/" label="Início" icon={LayoutDashboard} active={pathname === "/"} />
          <MobileNavItem
            to="/tasks"
            label="Tarefas"
            icon={CheckSquare}
            active={pathname.startsWith("/tasks")}
          />
          <button
            type="button"
            onClick={() => setFabOpen(true)}
            className="mx-auto grid size-12 place-items-center rounded-[17px] bg-[var(--system-blue)] text-white shadow-[0_10px_24px_-10px_rgba(0,122,255,0.9)] transition-transform active:scale-95"
            aria-label="Nova ação"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </button>
          <MobileNavItem
            to="/calendar"
            label="Agenda"
            icon={Calendar}
            active={pathname.startsWith("/calendar")}
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="ios-spring flex flex-col items-center gap-0.5 rounded-[17px] py-1.5 text-muted-foreground"
            aria-label="Mais módulos"
          >
            <Grid2X2 className="size-5" strokeWidth={1.9} />
            <span className="text-[9px] font-medium">Mais</span>
          </button>
        </nav>
      </div>

      <QuickActionFab open={fabOpen} onClose={() => setFabOpen(false)} />
      <MobileAppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <NotificationManager />
      <SharedAccessModal open={sharedModalOpen} onClose={() => setSharedModalOpen(false)} />
      <OnboardingModal />
    </div>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/" | "/tasks" | "/calendar";
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "ios-spring flex flex-col items-center gap-0.5 rounded-[17px] py-1.5",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.35 : 1.9} />
      <span className="text-[9px] font-medium">{label}</span>
    </Link>
  );
}
