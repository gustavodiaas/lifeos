import { useMemo } from "react";
import { todayIso, monthIso, formatBRL } from "@/lib/date";
import { StatCard } from "@/components/layout/StatCard";
import { useAuthContext } from "@/context/AuthContext";
import { useHabits } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useNotes } from "@/hooks/useNotes";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useMetrics } from "@/hooks/useMetrics";
import { Link } from "@tanstack/react-router";
import {
  Repeat,
  CheckSquare,
  Target,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Plus,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";

export function Dashboard() {
  const { user } = useAuthContext();
  const { habits, logs } = useHabits(user?.id);
  const { tasks } = useTasks(user?.id);
  const { goals } = useGoals(user?.id);
  const { notes } = useNotes(user?.id);
  const { lancamentos } = useLancamentos(user?.id);
  const { metrics } = useMetrics(user?.id);

  const today = todayIso();
  const month = monthIso();

  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.archived_at);
    const logsToday = logs.filter((l) => l.date === today && l.done);
    const openTasks = tasks.filter((t) => t.status !== "done");
    const tasksDueToday = openTasks.filter((t) => (t.dueDate || t.due_date) === today);

    const monthTxs = lancamentos.filter((l) => l.data?.startsWith(month));
    const income = monthTxs.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const expense = monthTxs.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

    const studyLogs = metrics.filter((m) => m.key === "study_hours");
    const studyHours = studyLogs.reduce((sum, m) => sum + m.value, 0);

    const weightLogs = metrics.filter((m) => m.key === "weight").sort((a, b) => a.date.localeCompare(b.date));
    const latestWeight = weightLogs.at(-1)?.value ?? null;

    return {
      habitsDue: activeHabits.length,
      habitsDone: logsToday.length,
      tasksOpen: openTasks.length,
      tasksDueToday: tasksDueToday.length,
      goalsActive: goals.length,
      income,
      expense,
      studyHours,
      weight: latestWeight,
      notes: notes.length,
      activeHabitsList: activeHabits.slice(0, 4),
      openTasksList: openTasks.slice(0, 4),
    };
  }, [habits, logs, tasks, goals, notes, lancamentos, metrics, today, month]);

  const habitProgressPercent = stats.habitsDue > 0 ? Math.round((stats.habitsDone / stats.habitsDue) * 100) : 0;
  const netSavings = stats.income - stats.expense;
  const savingsRate = stats.income > 0 ? Math.round((netSavings / stats.income) * 100) : 0;

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Pessoal";

  return (
    <div className="space-y-6 fade-in">
      {/* ── Banner de Boas-vindas Apple Style ────────────────────────────── */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-muted/40 via-transparent to-muted/20 border-border">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/15 text-foreground text-xs font-bold tracking-wide">
              <Sparkles size={14} />
              <span>LifeOS Dashboard</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Olá, {username} 👋
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl font-medium leading-relaxed">
              Aqui está o teu resumo diário. Mantém o foco nos teus hábitos e tarefas para um dia produtivo.
            </p>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/tasks" className="btn-ios text-xs py-2.5 px-3.5">
              <Plus size={15} strokeWidth={2.5} />
              <span>Nova Tarefa</span>
            </Link>
            <Link to="/finance" className="px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shadow-sm">
              <Wallet size={15} className="text-foreground" />
              <span>Finanças</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Módulo de Métricas Principais (4 Widgets) ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Hábitos Hoje"
          value={`${stats.habitsDone}/${stats.habitsDue}`}
          hint={stats.habitsDue > 0 ? `${habitProgressPercent}% concluído hoje` : "Nenhum hábito pendente"}
          icon={Repeat}
          iconBg="bg-muted"
          iconColor="text-foreground"
          progress={habitProgressPercent}
        />
        <StatCard
          label="Tarefas Abertas"
          value={stats.tasksOpen}
          hint={stats.tasksDueToday > 0 ? `${stats.tasksDueToday} agendadas para hoje` : "Todas em dia"}
          icon={CheckSquare}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          tone={stats.tasksDueToday > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Metas Ativas"
          value={stats.goalsActive}
          hint="Objetivos em andamento"
          icon={Target}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
        />
        <StatCard
          label="Notas & Base"
          value={stats.notes}
          hint="Registros salvos"
          icon={BookOpen}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-500"
        />
      </div>

      {/* ── Resumo Financeiro & Produtividade ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card Financeiro Principal */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Wallet size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Balanço do Mês</h3>
                <p className="text-xs text-muted-foreground font-medium">Movimentações financeiras recentes</p>
              </div>
            </div>
            <Link to="/finance" className="text-xs font-bold text-foreground hover:underline flex items-center gap-1">
              Ver Detalhes
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Grid de Receita vs Despesa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground">Receitas</span>
              </div>
              <p className="text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatBRL(stats.income)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingDown size={16} className="text-red-500" />
                <span className="text-xs font-semibold text-muted-foreground">Despesas</span>
              </div>
              <p className="text-lg md:text-xl font-extrabold text-red-500 dark:text-red-400">
                {formatBRL(stats.expense)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Taxa de Poupança</span>
              </div>
              <p className="text-lg md:text-xl font-extrabold text-foreground">
                {stats.income > 0 ? `${savingsRate}%` : "—"}
              </p>
            </div>
          </div>

          {/* Progresso de economia */}
          {stats.income > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Saldo Líquido Economizado</span>
                <span className={netSavings >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {formatBRL(netSavings)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card de Métricas de Estudo & Peso */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Outras Métricas</h3>
            <span className="badge-ios">Estatísticas</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Horas de Estudo</p>
                  <p className="text-base font-extrabold text-foreground">{stats.studyHours.toFixed(1)} h</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Flame size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Peso Atual</p>
                  <p className="text-base font-extrabold text-foreground">
                    {stats.weight != null ? `${stats.weight} kg` : "Não registrado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/stats"
            className="w-full py-2.5 rounded-xl border border-border text-center text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"
          >
            <span>Ver Estatísticas Completas</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Seções Rápidas: Hábitos & Tarefas Pendentes ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Hábitos de Hoje */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Repeat size={18} className="text-foreground" />
              <h3 className="text-base font-bold text-foreground">Hábitos Cadastrados</h3>
            </div>
            <Link to="/habits" className="text-xs font-bold text-foreground hover:underline flex items-center gap-1">
              Gerenciar <ChevronRight size={14} />
            </Link>
          </div>

          {stats.activeHabitsList.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nenhum hábito cadastrado ainda.</p>
              <Link to="/habits" className="inline-block text-xs font-bold text-foreground">
                + Criar Primeiro Hábito
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.activeHabitsList.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground">{h.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground">
                    {h.frequency === "weekly" ? `${h.targetPerWeek || h.target_per_week || 3}x/sem` : "Diário"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas Tarefas */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckSquare size={18} className="text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">Próximas Tarefas</h3>
            </div>
            <Link to="/tasks" className="text-xs font-bold text-muted-foreground hover:underline flex items-center gap-1">
              Ver Todas <ChevronRight size={14} />
            </Link>
          </div>

          {stats.openTasksList.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa aberta no momento.</p>
              <Link to="/tasks" className="inline-block text-xs font-bold text-muted-foreground">
                + Criar Nova Tarefa
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.openTasksList.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground">{t.title}</span>
                  {(t.dueDate || t.due_date) && (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {t.dueDate || t.due_date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
