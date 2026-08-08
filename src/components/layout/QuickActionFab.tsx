import { Plus, X, CheckSquare, Wallet, Repeat, BookOpen, NotebookPen } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface QuickActionFabProps {
  open: boolean;
  onClose: () => void;
}

export function QuickActionFab({ open, onClose }: QuickActionFabProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleAction = (path: string) => {
    onClose();
    navigate({ to: path });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex flex-col items-center justify-end pb-28 p-4 fade-in md:hidden">
      <div className="w-full max-w-xs space-y-2.5 slide-up">
        <p className="text-center text-xs font-black text-white/90 uppercase tracking-widest mb-3">
          Criar Novo no LifeOS
        </p>

        <button
          onClick={() => handleAction("/tasks")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-2xl text-xs font-bold text-foreground active:scale-95 transition-all"
        >
          <span className="font-extrabold text-sm">Nova Tarefa</span>
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            <CheckSquare size={18} />
          </div>
        </button>

        <button
          onClick={() => handleAction("/finance")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-2xl text-xs font-bold text-foreground active:scale-95 transition-all"
        >
          <span className="font-extrabold text-sm">Novo Gasto / Receita</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Wallet size={18} />
          </div>
        </button>

        <button
          onClick={() => handleAction("/habits")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-2xl text-xs font-bold text-foreground active:scale-95 transition-all"
        >
          <span className="font-extrabold text-sm">Marcar Hábito</span>
          <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center">
            <Repeat size={18} />
          </div>
        </button>

        <button
          onClick={() => handleAction("/notes")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-2xl text-xs font-bold text-foreground active:scale-95 transition-all"
        >
          <span className="font-extrabold text-sm">Nova Nota de Estudo</span>
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            <BookOpen size={18} />
          </div>
        </button>

        <button
          onClick={() => handleAction("/journal")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-2xl text-xs font-bold text-foreground active:scale-95 transition-all"
        >
          <span className="font-extrabold text-sm">Escrever Diário</span>
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            <NotebookPen size={18} />
          </div>
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-bold text-xs mt-2 border border-border/50 text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
