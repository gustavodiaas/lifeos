import { useState } from "react";
import type { Goal, Habit } from "@/db/schema";
import {
  Target,
  Trophy,
  CheckCircle2,
  MoreVertical,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Repeat,
  Calendar,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  habits: Habit[];
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({
  goal,
  habits,
  onUpdateProgress,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const linkedHabit = habits.find((h) => h.id === goal.linkedHabitId);
  const target = goal.target || 100;
  const current = goal.progress || 0;
  const percent = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const isCompleted = current >= target;

  const scopeLabel = {
    year: "Meta Anual",
    quarter: "Meta Trimestral",
    month: "Meta Mensal",
  }[goal.scope || "year"];

  const handleIncrement = (amount: number) => {
    const next = Math.max(0, current + amount);
    onUpdateProgress(goal.id, next);
  };

  return (
    <div
      className={cn(
        "glass-card p-6 flex flex-col justify-between space-y-4 relative transition-all duration-300 group",
        isCompleted && "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
      )}
    >
      {/* Background glow sutil se concluído */}
      {isCompleted && (
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
      )}

      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
              isCompleted
                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                : "bg-purple-500/15 text-purple-500"
            )}
          >
            {isCompleted ? <Trophy size={20} /> : <Target size={20} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-ios text-[10px] py-0.5">{scopeLabel}</span>
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <Calendar size={11} />
                <span>{goal.period}</span>
              </span>
            </div>

            <h3
              className={cn(
                "text-base font-extrabold text-foreground tracking-tight mt-1 transition-colors leading-tight",
                isCompleted && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {goal.title}
            </h3>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-9 w-40 glass-card p-1.5 z-30 shadow-xl border border-border space-y-1 fade-in"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => { onEdit(goal); setShowMenu(false); }}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Edit3 size={14} className="text-[#FCA311]" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => { onDelete(goal.id); setShowMenu(false); }}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Hábito Vinculado (Se houver) ─────────────────────────── */}
      {linkedHabit && (
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Repeat size={14} className="text-[#FCA311] shrink-0" />
          <span className="truncate">Vinculado a: <strong className="text-foreground">{linkedHabit.name}</strong></span>
        </div>
      )}

      {/* ── Barra de Progresso & Métricas ────────────────────────── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-muted-foreground">
            {current} / {target} {goal.unit || ""}
          </span>
          <span className={isCompleted ? "text-emerald-500" : "text-[#FCA311]"}>
            {percent}% Concluído
          </span>
        </div>

        <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden p-0.5 border border-border/40">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 shadow-sm",
              isCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-amber-500 to-[#FCA311]"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Botões de Atualização Rápida (+ / -) ──────────────────── */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Ajuste Rápido
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleIncrement(-1)}
            disabled={current <= 0}
            className="w-8 h-8 rounded-xl bg-muted hover:bg-secondary text-foreground font-bold flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Minus size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleIncrement(1)}
            disabled={isCompleted}
            className="w-8 h-8 rounded-xl bg-[#FCA311]/15 hover:bg-[#FCA311]/25 text-[#FCA311] font-bold flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Plus size={14} />
          </button>

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onUpdateProgress(goal.id, target)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 size={13} />
              <span>Concluir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
