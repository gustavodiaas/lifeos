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
  Command,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/notes", label: "Knowledge", icon: BookOpen },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 ring-1 ring-primary/30 grid place-items-center text-primary text-xs font-semibold">
              Lo
            </div>
            <span className="text-sm font-medium tracking-tight">LifeOS</span>
            <span className="ml-auto text-[10px] text-muted-foreground">v0.1</span>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mb-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-background/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Quick switch</span>
          <kbd className="ml-auto text-[10px] text-muted-foreground/80">⌘K</kbd>
        </button>

        <nav className="flex-1 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between border-b border-border px-4 h-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/15 ring-1 ring-primary/30 grid place-items-center text-primary text-[10px] font-semibold">
              Lo
            </div>
            <span className="text-sm font-medium">LifeOS</span>
          </Link>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Command className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 min-w-0">{children ?? <Outlet />}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
        <ul className="flex justify-around">
          {[NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]].map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{label}</span>
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