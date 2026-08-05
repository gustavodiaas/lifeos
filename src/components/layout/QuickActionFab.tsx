import { useState } from "react";
import { Plus, X, CheckSquare, Wallet, Repeat, BookOpen, NotebookPen } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <div className="md:hidden fixed bottom-20 right-5 z-[120]">
      {/* Opções Flutuantes Speed Dial */}
      {open && (
        <div className="flex flex-col items-end gap-2.5 mb-3 fade-in">
          <button
            onClick={() => handleAction("/tasks")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xl text-xs font-bold text-foreground active:scale-95 transition-all"
          >
            <span>Nova Tarefa</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
          </button>

          <button
            onClick={() => handleAction("/finance")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xl text-xs font-bold text-foreground active:scale-95 transition-all"
          >
            <span>Novo Gasto / Receita</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </button>

          <button
            onClick={() => handleAction("/habits")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xl text-xs font-bold text-foreground active:scale-95 transition-all"
          >
            <span>Marcar Hábito</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center">
              <Repeat size={16} />
            </div>
          </button>

          <button
            onClick={() => handleAction("/notes")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xl text-xs font-bold text-foreground active:scale-95 transition-all"
          >
            <span>Nova Nota</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </button>

          <button
            onClick={() => handleAction("/journal")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xl text-xs font-bold text-foreground active:scale-95 transition-all"
          >
            <span>Escrever Diário</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <NotebookPen size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Botão FAB Principal */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#FCA311] text-black shadow-2xl flex items-center justify-center transition-transform active:scale-90 shadow-[#FCA311]/40 border-2 border-background"
        title="Ação Rápida"
      >
        {open ? <X size={26} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
