import type { Habit, HabitLog } from "@/lib/supabase";
import { Check, Flame, MoreVertical, Trash2, Edit3, Archive } from "lucide-react";
import { useState } from "react";

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  selectedDate: string; // YYYY-MM-DD
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onArchive: (habitId: string) => void;
}

export function HabitCard({
  habit,
  logs,
  selectedDate,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Log da data selecionada
  const isDoneSelected = logs.some((l) => l.habitId === habit.id && l.date === selectedDate && l.done);

  // Calcula os últimos 7 dias para as bolinhas de histórico
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const isDone = logs.some((l) => l.habitId === habit.id && l.date === dateStr && l.done);
    const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short" })[0].toUpperCase();
    return { dateStr, isDone, dayLabel };
  });

  // Calcula Streak atual (dias consecutivos até hoje)
  const streak = (() => {
    let count = 0;
    const base = new Date();
    while (true) {
      const d = new Date(base);
      d.setDate(base.getDate() - count);
      const dateStr = d.toISOString().slice(0, 10);
      const hasDone = logs.some((l) => l.habitId === habit.id && l.date === dateStr && l.done);
      if (hasDone) {
        count++;
      } else {
        // Se a data for hoje e ainda não fez, não zera se ontem fez
        if (count === 0) {
          const yesterday = new Date(base);
          yesterday.setDate(base.getDate() - 1);
          const yStr = yesterday.toISOString().slice(0, 10);
          const yDone = logs.some((l) => l.habitId === habit.id && l.date === yStr && l.done);
          if (yDone) {
            // Conta a partir de ontem
            let yCount = 1;
            while (true) {
              const yd = new Date(yesterday);
              yd.setDate(yesterday.getDate() - yCount);
              const ydStr = yd.toISOString().slice(0, 10);
              if (logs.some((l) => l.habitId === habit.id && l.date === ydStr && l.done)) {
                yCount++;
              } else {
                break;
              }
            }
            return yCount;
          }
        }
        break;
      }
    }
    return count;
  })();

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 relative ${
        isDoneSelected ? "border-[#FCA311]/50 bg-[#FCA311]/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Checkbox interativo + Nome */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggle(habit.id, selectedDate)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ios-spring mt-0.5 ${
              isDoneSelected
                ? "bg-[#FCA311] text-black shadow-md shadow-[#FCA311]/30 scale-105"
                : "bg-muted hover:bg-muted/80 border-2 border-border text-transparent"
            }`}
          >
            <Check size={20} strokeWidth={3} className={isDoneSelected ? "opacity-100" : "opacity-0"} />
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-base font-extrabold tracking-tight transition-colors truncate ${
                isDoneSelected ? "text-foreground line-through opacity-80" : "text-foreground"
              }`}
            >
              {habit.name}
            </h4>

            <div className="flex items-center gap-2 mt-1">
              <span className="badge-ios text-[10px] py-0.5">
                {habit.frequency === "daily" ? "Diário" : `${habit.targetPerWeek}x / semana`}
              </span>

              {streak > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-black text-[#FCA311] bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Flame size={12} fill="#FCA311" />
                  <span>{streak}d streak</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu de Opções */}
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
                onClick={() => { onEdit(habit); setShowMenu(false); }}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Edit3 size={14} className="text-[#FCA311]" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => { onArchive(habit.id); setShowMenu(false); }}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Archive size={14} />
                <span>Arquivar</span>
              </button>

              <button
                onClick={() => { onDelete(habit.id); setShowMenu(false); }}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Histórico dos últimos 7 dias */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Últimos 7 dias
        </span>

        <div className="flex items-center gap-1.5">
          {last7Days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold text-muted-foreground/70">{d.dayLabel}</span>
              <button
                type="button"
                onClick={() => onToggle(habit.id, d.dateStr)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  d.isDone
                    ? "bg-[#FCA311] text-black shadow-sm"
                    : "bg-muted/60 border border-border/40 hover:border-[#FCA311]/50"
                }`}
                title={`${d.dateStr}: ${d.isDone ? "Concluído" : "Pendente"}`}
              >
                {d.isDone && <Check size={12} strokeWidth={3} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
