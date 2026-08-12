import { useState } from "react";
import { Plus, X, CheckSquare, Wallet, Repeat, BookOpen, NotebookPen, Send } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useTasks } from "@/hooks/useTasks";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useNotes } from "@/hooks/useNotes";
import { toast } from "@/lib/toast";
import { todayIso } from "@/lib/date";

interface QuickActionFabProps {
  open: boolean;
  onClose: () => void;
}

type QuickMode = "menu" | "task" | "finance" | "note";

export function QuickActionFab({ open, onClose }: QuickActionFabProps) {
  const navigate = useNavigate();
  const { activeUserId } = useWorkspace();
  const { addTask } = useTasks(activeUserId);
  const { addLancamento } = useLancamentos(activeUserId);
  const { createNote } = useNotes(activeUserId);

  const [mode, setMode] = useState<QuickMode>("menu");
  const [taskTitle, setTaskTitle] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finValor, setFinValor] = useState("");
  const [finTipo, setFinTipo] = useState<"saida" | "entrada">("saida");
  const [noteTitle, setNoteTitle] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setMode("menu");
    setTaskTitle("");
    setFinDesc("");
    setFinValor("");
    setNoteTitle("");
    onClose();
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      const ok = await addTask({
        title: taskTitle.trim(),
        status: "todo",
        priority: "medium",
        dueDate: todayIso(),
      });
      if (ok) {
        toast.success("Tarefa criada com sucesso!");
        handleClose();
      }
    } catch {
      toast.error("Erro ao criar tarefa rápida.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc.trim() || !finValor) return;
    setLoading(true);
    try {
      const ok = await addLancamento({
        descricao: finDesc.trim(),
        valor: parseFloat(finValor.replace(",", ".")),
        tipo: finTipo,
        data: todayIso(),
      });
      if (ok) {
        toast.success("Lançamento financeiro registrado!");
        handleClose();
      }
    } catch {
      toast.error("Erro ao registrar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setLoading(true);
    try {
      const created = await createNote({
        title: noteTitle.trim(),
        content: "",
      });
      if (created) {
        toast.success("Nota rápida criada!");
        handleClose();
      }
    } catch {
      toast.error("Erro ao criar nota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex flex-col items-center justify-end pb-24 p-4 fade-in md:hidden">
      <div className="w-full max-w-xs space-y-3 slide-up bg-card border border-border/80 rounded-3xl p-4 shadow-2xl">
        {mode === "menu" && (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <p className="text-xs font-black text-foreground uppercase tracking-wider">
                Captura Rápida
              </p>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <button
              onClick={() => setMode("task")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-accent/40 hover:bg-accent border border-border/50 text-xs font-bold text-foreground active:scale-95 transition-all"
            >
              <span className="font-bold text-sm">Nova Tarefa</span>
              <div className="w-8 h-8 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <CheckSquare size={16} />
              </div>
            </button>

            <button
              onClick={() => setMode("finance")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-accent/40 hover:bg-accent border border-border/50 text-xs font-bold text-foreground active:scale-95 transition-all"
            >
              <span className="font-bold text-sm">Novo Gasto / Receita</span>
              <div className="w-8 h-8 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <Wallet size={16} />
              </div>
            </button>

            <button
              onClick={() => setMode("note")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-accent/40 hover:bg-accent border border-border/50 text-xs font-bold text-foreground active:scale-95 transition-all"
            >
              <span className="font-bold text-sm">Nova Nota Rápida</span>
              <div className="w-8 h-8 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <BookOpen size={16} />
              </div>
            </button>

            <div className="pt-2 border-t border-border/40 flex justify-between gap-2">
              <button
                onClick={() => {
                  handleClose();
                  navigate({ to: "/habits" });
                }}
                className="flex-1 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 rounded-xl bg-muted/50"
              >
                <Repeat size={13} /> Hábitos
              </button>
              <button
                onClick={() => {
                  handleClose();
                  navigate({ to: "/journal" });
                }}
                className="flex-1 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 rounded-xl bg-muted/50"
              >
                <NotebookPen size={13} /> Diário
              </button>
            </div>
          </>
        )}

        {mode === "task" && (
          <form onSubmit={handleSaveTask} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckSquare size={14} className="text-primary" /> Nova Tarefa Rápida
              </span>
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Voltar
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="O que precisa ser feito?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !taskTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-primary/90"
              >
                <Send size={12} /> Salvar
              </button>
            </div>
          </form>
        )}

        {mode === "finance" && (
          <form onSubmit={handleSaveFinance} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Wallet size={14} className="text-primary" /> Registro Financeiro
              </span>
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Voltar
              </button>
            </div>

            <div className="flex gap-2 p-1 bg-muted/60 rounded-xl">
              <button
                type="button"
                onClick={() => setFinTipo("saida")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  finTipo === "saida" ? "bg-card text-foreground border border-border shadow-xs" : "text-muted-foreground"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setFinTipo("entrada")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  finTipo === "entrada" ? "bg-card text-foreground border border-border shadow-xs" : "text-muted-foreground"
                }`}
              >
                Receita
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Descrição (ex: Almoço, Uber)"
              value={finDesc}
              onChange={(e) => setFinDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <input
              type="number"
              step="0.01"
              placeholder="Valor R$ (ex: 25.90)"
              value={finValor}
              onChange={(e) => setFinValor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !finDesc.trim() || !finValor}
                className="flex-1 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-primary/90"
              >
                <Send size={12} /> Salvar
              </button>
            </div>
          </form>
        )}

        {mode === "note" && (
          <form onSubmit={handleSaveNote} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" /> Nota Rápida
              </span>
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Voltar
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Título da nota ou pensamento"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !noteTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-primary/90"
              >
                <Send size={12} /> Criar Nota
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
