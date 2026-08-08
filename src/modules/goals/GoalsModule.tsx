import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useHabits } from "@/hooks/useHabits";
import type { Goal, GoalScope } from "@/lib/supabase";
import { GoalCard } from "./components/GoalCard";
import { GoalModal } from "./components/GoalModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "sonner";
import {
  Plus,
  Target,
  Trophy,
  Sparkles,
  Search,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalsModule() {
  const { user } = useAuthContext();
  const { goals, loading, addGoal, updateGoal, removeGoal, updateProgress } = useGoals(user?.id);
  const { habits } = useHabits(user?.id);

  const [selectedScope, setSelectedScope] = useState<GoalScope | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Atualizar progresso rápido da meta
  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    try {
      const ok = await updateProgress(goalId, newProgress);
      if (ok) {
        const target = goals.find((g) => g.id === goalId)?.target || 100;
        if (newProgress >= target) {
          toast.success("🏆 Meta Concluída com sucesso! Parabéns!");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar progresso.");
    }
  };

  // Salvar / Editar Meta
  const handleSaveGoal = async (goalData: {
    id?: string;
    title: string;
    scope: GoalScope;
    period: string;
    target: number;
    unit: string;
    progress: number;
    linkedHabitId?: string | null;
  }) => {
    try {
      if (goalData.id) {
        const ok = await updateGoal(goalData.id, {
          title: goalData.title,
          scope: goalData.scope,
          period: goalData.period,
          target: goalData.target,
          unit: goalData.unit,
          progress: goalData.progress,
          linkedHabitId: goalData.linkedHabitId,
        });
        if (ok) toast.success("Meta atualizada!");
      } else {
        const ok = await addGoal({
          title: goalData.title,
          scope: goalData.scope,
          period: goalData.period,
          target: goalData.target,
          unit: goalData.unit,
          progress: goalData.progress,
          linkedHabitId: goalData.linkedHabitId,
        });
        if (ok) toast.success("Nova meta cadastrada!");
      }

      setModalOpen(false);
      setEditingGoal(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar meta.");
    }
  };

  // Excluir Meta
  const confirmDeleteGoal = async () => {
    if (!deleteConfig.id) return;
    try {
      const ok = await removeGoal(deleteConfig.id);
      if (ok) toast.success("Meta excluída.");
      setDeleteConfig({ open: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir meta.");
    }
  };

  // Filtragem de metas
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedScope !== "all" && g.scope !== selectedScope) return false;
      return true;
    });
  }, [goals, searchQuery, selectedScope]);

  // Estatísticas calculadas
  const completedGoalsCount = goals.filter((g) => (g.progress || 0) >= (g.target || 100)).length;
  const activeGoalsCount = goals.length - completedGoalsCount;

  const averageProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalPercents = goals.reduce((sum, g) => {
      const target = g.target || 100;
      const current = g.progress || 0;
      return sum + Math.min(100, Math.round((current / target) * 100));
    }, 0);
    return Math.round(totalPercents / goals.length);
  }, [goals]);

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header & Ações ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Objetivos & Conquistas</span>
            <span className="text-xs font-bold text-muted-foreground">{activeGoalsCount} ativas</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Metas Pessoais
          </h2>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setModalOpen(true);
          }}
          className="btn-ios text-xs py-3 px-5 self-start md:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* ── 2. Cards de Métricas de Progresso ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Target size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metas Ativas</p>
            <p className="text-xl font-extrabold text-foreground">{activeGoalsCount} em andamento</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Concluídas</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedGoalsCount} objetivadas</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-muted text-foreground flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progresso Médio</p>
            <p className="text-xl font-extrabold text-foreground">{averageProgress}% geral</p>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Busca & Filtro de Escopo ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar meta..."
            className="input-ios pl-10 py-2.5 text-xs"
          />
        </div>

        {/* Filtro de Escopo */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedScope("all")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedScope === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todas ({goals.length})
          </button>

          <button
            onClick={() => setSelectedScope("year")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedScope === "year"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Anuais
          </button>

          <button
            onClick={() => setSelectedScope("quarter")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedScope === "quarter"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Trimestrais
          </button>

          <button
            onClick={() => setSelectedScope("month")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedScope === "month"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Mensais
          </button>
        </div>
      </div>

      {/* ── 4. Lista de Metas (Grid de Cards) ───────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando metas...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Target size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Nenhuma meta encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 font-medium">
              Defina os seus objetivos para este mês, trimestre ou ano com acompanhamento de progresso.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGoal(null);
              setModalOpen(true);
            }}
            className="btn-ios text-xs py-3 px-6"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Criar Primeira Meta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              habits={habits}
              onUpdateProgress={handleUpdateProgress}
              onEdit={(gEdit) => {
                setEditingGoal(gEdit);
                setModalOpen(true);
              }}
              onDelete={(id) => setDeleteConfig({ open: true, id })}
            />
          ))}
        </div>
      )}

      {/* Modal de Meta */}
      <GoalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        habits={habits}
        editingGoal={editingGoal}
      />

      {/* Modal de Alerta para Exclusão */}
      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDeleteGoal}
        title="Excluir Meta?"
        message="Essa ação irá apagar a meta e todo o seu histórico de progresso."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
