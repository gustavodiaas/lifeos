import { Link } from "@tanstack/react-router";
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
  X,
  Sparkles,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface MobileAppDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ALL_MODULES = [
  { to: "/", label: "Painel", icon: LayoutDashboard, color: "bg-blue-500/15 text-blue-500" },
  { to: "/habits", label: "Hábitos", icon: Repeat, color: "bg-amber-500/15 text-amber-500" },
  { to: "/finance", label: "Finanças", icon: Wallet, color: "bg-emerald-500/15 text-emerald-500" },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare, color: "bg-indigo-500/15 text-indigo-500" },
  { to: "/goals", label: "Metas", icon: Target, color: "bg-purple-500/15 text-purple-500" },
  { to: "/notes", label: "Conhecimento", icon: BookOpen, color: "bg-orange-500/15 text-orange-500" },
  { to: "/journal", label: "Diário", icon: NotebookPen, color: "bg-rose-500/15 text-rose-500" },
  { to: "/stats", label: "Estatísticas", icon: BarChart3, color: "bg-teal-500/15 text-teal-500" },
  { to: "/settings", label: "Ajustes", icon: Settings, color: "bg-slate-500/15 text-slate-500" },
] as const;

export function MobileAppDrawer({ open, onClose }: MobileAppDrawerProps) {
  const { user } = useAuthContext();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-end justify-center fade-in md:hidden">
      <div className="bg-card w-full rounded-t-[32px] shadow-2xl border-t border-border p-6 space-y-6 max-h-[85vh] overflow-y-auto slide-up">
        
        {/* Header da Folha iOS */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FCA311] flex items-center justify-center text-black font-black">
              L
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">LifeOS Apps</h3>
              <p className="text-[11px] font-medium text-muted-foreground">Todas as ferramentas na sua mão</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grade de Aplicativos estilo iOS App Grid */}
        <div className="grid grid-cols-3 gap-4">
          {ALL_MODULES.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted transition-all active:scale-95 text-center"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-foreground tracking-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* Perfil do Usuário */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FCA311]/20 ring-2 ring-[#FCA311]/40 flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xs font-extrabold text-[#FCA311]">
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {user.user_metadata?.username || user.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Link
              to="/settings"
              onClick={onClose}
              className="text-xs font-bold text-[#FCA311] hover:underline"
            >
              Ajustes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
