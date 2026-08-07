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
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudLightning,
  Wind,
  CloudDrizzle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { MobileAppDrawer } from "./MobileAppDrawer";
import { QuickActionFab } from "./QuickActionFab";
import { NotificationManager } from "./NotificationManager";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

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

type WeatherInfo = { icon: React.ReactNode; label: string } | null;

/** WMO weather code -> icon + label */
function wmoToInfo(code: number): WeatherInfo {
  if (code === 0) return { icon: <Sun size={14} className="text-yellow-400" />, label: "Sol" };
  if (code <= 2) return { icon: <Cloud size={14} className="text-slate-400" />, label: "Nublado" };
  if (code <= 9) return { icon: <Wind size={14} className="text-blue-300" />, label: "Ventoso" };
  if (code <= 29) return { icon: <CloudDrizzle size={14} className="text-blue-400" />, label: "Garoa" };
  if (code <= 39) return { icon: <CloudRain size={14} className="text-blue-500" />, label: "Chuva" };
  if (code <= 49) return { icon: <CloudSnow size={14} className="text-blue-200" />, label: "Neve" };
  if (code <= 59) return { icon: <CloudDrizzle size={14} className="text-blue-400" />, label: "Garoa" };
  if (code <= 69) return { icon: <CloudRain size={14} className="text-blue-500" />, label: "Chuva" };
  if (code <= 79) return { icon: <CloudSnow size={14} className="text-blue-200" />, label: "Neve" };
  if (code <= 84) return { icon: <CloudRain size={14} className="text-blue-600" />, label: "Pancadas" };
  if (code <= 89) return { icon: <CloudLightning size={14} className="text-yellow-500" />, label: "Temporal" };
  return { icon: <CloudLightning size={14} className="text-yellow-500" />, label: "Temporal" };
}

function useWeather(): WeatherInfo {
  const [weather, setWeather] = useState<WeatherInfo>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`
          );
          const data = await res.json();
          const code = data?.current_weather?.weathercode ?? -1;
          if (code >= 0) setWeather(wmoToInfo(code));
        } catch {}
      },
      () => {} // silently ignore denied
    );
  }, []);

  return weather;
}

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
  const [fabOpen, setFabOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthContext();
  const weather = useWeather();
  const greeting = getGreeting();
  const firstName = getFirstName(user);

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
    <div className="flex h-[100dvh] w-full bg-background text-foreground">

      {/* ── Desktop Sidebar — macOS Style ───────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col glass-panel border-r border-[var(--glass-border)] select-none">
        {/* Header / Brand */}
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-[#14213D] dark:bg-[#FCA311] flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-[#FCA311]/20 transition-transform group-hover:scale-105">
              <span className="text-white dark:text-black text-base font-extrabold tracking-tight">
                {firstName[0]?.toUpperCase() ?? "L"}
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold text-foreground tracking-tight">{firstName}</p>
              <p className="text-[11px] text-muted-foreground font-medium">{greeting} 👋</p>
              {weather ? (
                <span className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                  {weather.icon}
                  <span>{weather.label}</span>
                </span>
              ) : null}
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
        <div className="flex-1 min-h-0 overflow-hidden">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ── iOS 26 Floating Glass Pill Bar no Mobile ────────────────── */}
      <div className="md:hidden fixed bottom-3 inset-x-0 z-[100] px-4 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto w-full max-w-md bg-card/85 dark:bg-[#14213D]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-full px-3 py-1.5 flex items-center justify-between">
          
          {/* Painel */}
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname === "/" ? "text-[#FCA311] font-bold" : "text-muted-foreground"
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
              pathname.startsWith("/habits") ? "text-[#FCA311] font-bold" : "text-muted-foreground"
            )}
          >
            <Repeat size={20} strokeWidth={pathname.startsWith("/habits") ? 2.5 : 1.75} />
            <span className="text-[9px] tracking-tight">Hábitos</span>
          </Link>

          {/* BOTÃO CENTRAL INTEGRADOR (+) DE AÇÃO RÁPIDA */}
          <button
            onClick={() => setFabOpen(true)}
            className="w-12 h-12 rounded-full bg-[#FCA311] text-black shadow-lg shadow-[#FCA311]/40 flex items-center justify-center active:scale-90 transition-all mx-1 shrink-0"
            title="Nova Ação"
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          {/* Finanças */}
          <Link
            to="/finance"
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 transition-all active:scale-95",
              pathname.startsWith("/finance") ? "text-[#FCA311] font-bold" : "text-muted-foreground"
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
              pathname.startsWith("/tasks") ? "text-[#FCA311] font-bold" : "text-muted-foreground"
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
    </div>
  );
}
