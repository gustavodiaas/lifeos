import { useState } from "react";
import {
  CheckSquare,
  Wallet,
  Repeat,
  Calendar,
  BookOpen,
  Target,
  Plus,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useHabits } from "@/hooks/useHabits";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useNotes } from "@/hooks/useNotes";
import { useGoals } from "@/hooks/useGoals";
import { toast } from "@/lib/toast";
import { todayIso } from "@/lib/date";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface DashboardQuickActionsProps {
  userId: string;
}

type ActionType = "task" | "finance" | "habit" | "calendar" | "note" | "goal" | null;

export function DashboardQuickActions({ userId }: DashboardQuickActionsProps) {
  const [activeModal, setActiveModal] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  // Hooks
  const { addTask } = useTasks(userId);
  const { addLancamento } = useLancamentos(userId);
  const { addHabit } = useHabits(userId);
  const { addEvent } = useCalendarEvents(userId);
  const { createNote } = useNotes(userId);
  const { addGoal } = useGoals(userId);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const [finDesc, setFinDesc] = useState("");
  const [finValor, setFinValor] = useState("");
  const [finTipo, setFinTipo] = useState<"saida" | "entrada">("saida");

  const [habitName, setHabitName] = useState("");

  const [calTitle, setCalTitle] = useState("");
  const [calDate, setCalDate] = useState(todayIso());
  const [calTime, setCalTime] = useState("09:00");

  const [noteTitle, setNoteTitle] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  const closeModal = () => {
    setActiveModal(null);
    setTaskTitle("");
    setFinDesc("");
    setFinValor("");
    setHabitName("");
    setCalTitle("");
    setNoteTitle("");
    setGoalTitle("");
    setGoalTarget("");
  };

  // Handlers
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      const ok = await addTask({
        title: taskTitle.trim(),
        status: "todo",
        priority: taskPriority,
        dueDate: todayIso(),
      });
      if (ok) {
        toast.success("Tarefa adicionada com sucesso!");
        closeModal();
      }
    } catch {
      toast.error("Erro ao salvar tarefa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc.trim() || !finValor) return;
    setLoading(true);
    try {
      const val = parseFloat(finValor.replace(",", "."));
      const ok = await addLancamento({
        descricao: finDesc.trim(),
        valor: val,
        tipo: finTipo,
        data: todayIso(),
      });
      if (ok) {
        toast.success(`${finTipo === "entrada" ? "Receita" : "Despesa"} registrada!`);
        closeModal();
      }
    } catch {
      toast.error("Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    setLoading(true);
    try {
      const ok = await addHabit({
        name: habitName.trim(),
        frequency: "daily",
        targetPerWeek: 7,
      });
      if (ok) {
        toast.success("Novo hábito criado!");
        closeModal();
      }
    } catch {
      toast.error("Erro ao salvar hábito.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calTitle.trim()) return;
    setLoading(true);
    try {
      await addEvent({
        title: calTitle.trim(),
        date: calDate,
        startTime: calTime,
        color: "#a78bfa",
      });
      toast.success("Compromisso agendado no calendário!");
      closeModal();
    } catch {
      toast.error("Erro ao agendar compromisso.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setLoading(true);
    try {
      await createNote({
        title: noteTitle.trim(),
        content: "",
      });
      toast.success("Nota rápida salva!");
      closeModal();
    } catch {
      toast.error("Erro ao salvar nota.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setLoading(true);
    try {
      const targetVal = goalTarget ? parseFloat(goalTarget) : 100;
      const ok = await addGoal({
        title: goalTitle.trim(),
        scope: "medium",
        period: "Em andamento",
        target: targetVal,
        progress: 0,
      });
      if (ok) {
        toast.success("Nova meta cadastrada!");
        closeModal();
      }
    } catch {
      toast.error("Erro ao salvar meta.");
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: "task",
      label: "Nova Tarefa",
      desc: "Adicionar pendência",
      icon: CheckSquare,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
    {
      id: "finance",
      label: "Novo Lançamento",
      desc: "Gasto ou receita",
      icon: Wallet,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
    {
      id: "habit",
      label: "Novo Hábito",
      desc: "Rotina diária",
      icon: Repeat,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
    {
      id: "calendar",
      label: "Novo Evento",
      desc: "Agenda & compromissos",
      icon: Calendar,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
    {
      id: "note",
      label: "Nova Nota",
      desc: "Pensamento ou estudo",
      icon: BookOpen,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
    {
      id: "goal",
      label: "Nova Meta",
      desc: "Objetivo de vida",
      icon: Target,
      color: "text-foreground",
      bgColor: "bg-muted/40 hover:bg-muted border-border/60",
    },
  ];

  return (
    <div className="glass-card p-4 md:p-5 rounded-2xl border border-border/80 shadow-md space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Acessos Rápidos de Cadastro
          </h3>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
          Cadastre itens instantaneamente no seu LifeOS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const IconComponent = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => setActiveModal(act.id as ActionType)}
              className={`p-3 rounded-2xl border transition-all text-left group flex flex-col justify-between gap-2.5 active:scale-95 ${act.bgColor}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl bg-background/80 shadow-xs ${act.color}`}>
                  <IconComponent size={18} />
                </div>
                <Plus size={14} className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <span className="text-xs font-black text-foreground block truncate">
                  {act.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block truncate">
                  {act.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Modais de Cadastro Rápido ────────────────────────────────────────────── */}
      {activeModal && (
        <ModalPortal
          open={!!activeModal}
          onClose={closeModal}
          maxWidth="max-w-md"
          title={
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              {activeModal === "task" && "Nova Tarefa Rápida"}
              {activeModal === "finance" && "Novo Lançamento Financeiro"}
              {activeModal === "habit" && "Novo Hábito Diário"}
              {activeModal === "calendar" && "Agendar no Calendário"}
              {activeModal === "note" && "Nova Nota Rápida"}
              {activeModal === "goal" && "Nova Meta"}
            </span>
          }
        >
          {/* Form Tarefa */}
          {activeModal === "task" && (
                <form onSubmit={handleSaveTask} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Título da Tarefa</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Enviar relatório mensal, Comprar leite..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Prioridade</label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskPriority(p)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                            taskPriority === p
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 border-border text-muted-foreground"
                          }`}
                        >
                          {p === "low" ? "Baixa" : p === "medium" ? "Média" : "Alta"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !taskTitle.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={13} /> Salvar Tarefa
                    </button>
                  </div>
                </form>
              )}

              {/* Form Finanças */}
              {activeModal === "finance" && (
                <form onSubmit={handleSaveFinance} className="space-y-3.5">
                  <div className="flex gap-2 p-1 bg-muted/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFinTipo("saida")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        finTipo === "saida" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground"
                      }`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinTipo("entrada")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        finTipo === "entrada" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground"
                      }`}
                    >
                      Receita
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Descrição</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Almoço de domingo, Salário, Uber"
                      value={finDesc}
                      onChange={(e) => setFinDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={finValor}
                      onChange={(e) => setFinValor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !finDesc.trim() || !finValor}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
                    >
                      <Send size={13} /> Salvar Lançamento
                    </button>
                  </div>
                </form>
              )}

              {/* Form Hábito */}
              {activeModal === "habit" && (
                <form onSubmit={handleSaveHabit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Nome do Hábito</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Beber 2L de água, Meditar 10min, Ler 15 págs"
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !habitName.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
                    >
                      <Send size={13} /> Criar Hábito
                    </button>
                  </div>
                </form>
              )}

              {/* Form Calendário */}
              {activeModal === "calendar" && (
                <form onSubmit={handleSaveCalendar} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Título do Evento</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Reunião de equipe, Consulta médica"
                      value={calTitle}
                      onChange={(e) => setCalTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Data</label>
                      <input
                        type="date"
                        value={calDate}
                        onChange={(e) => setCalDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Horário</label>
                      <input
                        type="time"
                        value={calTime}
                        onChange={(e) => setCalTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !calTitle.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
                    >
                      <Send size={13} /> Agendar Evento
                    </button>
                  </div>
                </form>
              )}

              {/* Form Nota */}
              {activeModal === "note" && (
                <form onSubmit={handleSaveNote} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Título da Nota</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Ideia de projeto, Resumo de aula..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !noteTitle.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
                    >
                      <Send size={13} /> Salvar Nota
                    </button>
                  </div>
                </form>
              )}

              {/* Form Meta */}
              {activeModal === "goal" && (
                <form onSubmit={handleSaveGoal} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Título da Meta</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Correr uma maratona, Juntar R$ 10.000"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Alvo Almejado (Número/Valor)</label>
                    <input
                      type="number"
                      placeholder="Ex: 100"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !goalTitle.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
                    >
                      <Send size={13} /> Criar Meta
                    </button>
                  </div>
                </form>
              )}
        </ModalPortal>
      )}
    </div>
  );
}
