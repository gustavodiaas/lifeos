import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  Library,
  NotebookPen,
  Repeat,
  Settings,
  ShoppingCart,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface MobileAppDrawerProps {
  open: boolean;
  onClose: () => void;
}

const MODULES = [
  { to: "/calendar", label: "Calendário", icon: Calendar, tint: "bg-blue-500/12 text-blue-500" },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare, tint: "bg-indigo-500/12 text-indigo-500" },
  { to: "/goals", label: "Metas", icon: Target, tint: "bg-orange-500/12 text-orange-500" },
  {
    to: "/habits",
    label: "Hábitos",
    icon: Repeat,
    tint: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400",
  },
  {
    to: "/finance",
    label: "Finanças",
    icon: Wallet,
    tint: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
  {
    to: "/stats",
    label: "Estatísticas",
    icon: BarChart3,
    tint: "bg-purple-500/12 text-purple-500",
  },
  {
    to: "/notes",
    label: "Conhecimento",
    icon: BookOpen,
    tint: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  },
  { to: "/books", label: "Livros", icon: Library, tint: "bg-rose-500/12 text-rose-500" },
  {
    to: "/journal",
    label: "Diário",
    icon: NotebookPen,
    tint: "bg-teal-500/12 text-teal-600 dark:text-teal-400",
  },
  { to: "/shopping", label: "Compras", icon: ShoppingCart, tint: "bg-pink-500/12 text-pink-500" },
] as const;

export function MobileAppDrawer({ open, onClose }: MobileAppDrawerProps) {
  const { user } = useAuthContext();

  if (!open) return null;

  const displayName = String(
    user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Você",
  );
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    (typeof window !== "undefined" ? localStorage.getItem("lifeos_avatar_url") : null) ||
    "";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/35 backdrop-blur-sm fade-in md:hidden"
      onClick={onClose}
    >
      <section
        className="thin-material max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] border-b-0 border-x-0 p-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-18px_60px_-30px_rgba(0,0,0,0.55)] slide-up"
        onClick={(event) => event.stopPropagation()}
        aria-label="Todos os módulos"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-foreground/15" />

        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">LifeOS</p>
            <h2 className="sf-display text-2xl font-semibold tracking-[-0.035em]">
              Todos os módulos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"
            aria-label="Fechar"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {MODULES.map(({ to, label, icon: Icon, tint }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="ios-spring flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-[18px] border border-border bg-card/55 px-2 py-3 text-center shadow-sm"
            >
              <div className={`ios-squircle size-11 ${tint}`}>
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-medium leading-tight text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        <Link
          to="/settings"
          onClick={onClose}
          className="mt-4 flex items-center gap-3 rounded-[18px] border border-border bg-card/55 p-3 shadow-sm"
        >
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-muted text-muted-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email || "Preferências do LifeOS"}
            </p>
          </div>
          <Settings className="size-4.5 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}
