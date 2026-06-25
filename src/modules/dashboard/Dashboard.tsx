import { useEffect, useState } from "react";
import { db } from "@/db";
import { todayIso, monthIso, formatBRL } from "@/lib/date";
import { StatCard } from "@/components/layout/StatCard";

export function Dashboard() {
  const [stats, setStats] = useState({
    habitsDue: 0,
    habitsDone: 0,
    tasksOpen: 0,
    tasksDueToday: 0,
    goalsActive: 0,
    income: 0,
    expense: 0,
    studyHours: 0,
    weight: null as number | null,
    notes: 0,
  });

  useEffect(() => {
    (async () => {
      const d = db();
      const today = todayIso();
      const month = monthIso();
      const [habits, logsToday, tasks, goals, txs, studies, weights, notesCount] =
        await Promise.all([
          d.habits.filter((h) => !h.archivedAt).toArray(),
          d.habit_logs.where("date").equals(today).toArray(),
          d.tasks.filter((t) => t.status !== "done").toArray(),
          d.goals.toArray(),
          d.transactions.filter((t) => t.date.startsWith(month)).toArray(),
          d.metrics.where("key").equals("study_hours").toArray(),
          d.metrics.where("key").equals("weight").sortBy("date"),
          d.notes.count(),
        ]);

      const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const studyHours = studies.reduce((s, m) => s + m.value, 0);

      setStats({
        habitsDue: habits.length,
        habitsDone: logsToday.filter((l) => l.done).length,
        tasksOpen: tasks.length,
        tasksDueToday: tasks.filter((t) => t.dueDate === today).length,
        goalsActive: goals.length,
        income,
        expense,
        studyHours,
        weight: weights.at(-1)?.value ?? null,
        notes: notesCount,
      });
    })();
  }, []);

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Hábitos hoje" value={`${stats.habitsDone}/${stats.habitsDue}`} />
        <StatCard label="Tarefas abertas" value={stats.tasksOpen} hint={`${stats.tasksDueToday} para hoje`} />
        <StatCard label="Metas ativas" value={stats.goalsActive} />
        <StatCard label="Notas" value={stats.notes} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Este mês - receitas"
          value={formatBRL(stats.income)}
          tone="positive"
        />
        <StatCard
          label="Este mês - despesas"
          value={formatBRL(stats.expense)}
          tone="negative"
        />
        <StatCard
          label="Taxa de poupança"
          value={
            stats.income > 0
              ? `${Math.round(((stats.income - stats.expense) / stats.income) * 100)}%`
              : "-"
          }
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard
          label="Horas de estudo (total)"
          value={`${stats.studyHours.toFixed(1)} h`}
        />
        <StatCard
          label="Peso atual"
          value={stats.weight != null ? `${stats.weight} kg` : "-"}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        LifeOS v0.1 - fundação. Adicione hábitos, tarefas, metas e transações conforme os módulos
        evoluem. Seus dados ficam armazenados localmente neste navegador.
      </p>
    </>
  );
}
