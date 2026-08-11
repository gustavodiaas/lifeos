import { useMemo, useState, useEffect } from "react";
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
import { useWorkspace } from "@/context/WorkspaceContext";
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
  ChevronLeft,
  Flame,
  Zap,
  Award,
  Library,
  PiggyBank,
  Timer,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardQuickActions } from "./components/DashboardQuickActions";

const LEVELS = [
  { level: 1, name: "Iniciante Focado", minXp: 0, maxXp: 100 },
  { level: 2, name: "Praticante Disciplinado", minXp: 100, maxXp: 300 },
  { level: 3, name: "Mestre da Rotina", minXp: 300, maxXp: 600 },
  { level: 4, name: "Titã da Produtividade", minXp: 600, maxXp: 1000 },
  { level: 5, name: "Lenda do LifeOS", minXp: 1000, maxXp: 2000 },
];

/** ── Componente de Pílula Noticiário de Eventos do Dia ────────────────────────────── */
function TodayEventsTicker({ userId, today, tasks, lancamentos }: { userId: string; today: string; tasks: any[]; lancamentos: any[] }) {
  const [events, setEvents] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const list: any[] = [];

    // 1. Calendário (v2 e v1)
    try {
      const v2 = localStorage.getItem(`lifeos_${userId}_calendar_events_v2`);
      if (v2) {
        const parsed = JSON.parse(v2);
        parsed.filter((e: any) => e.date === today).forEach((e: any) => {
          list.push({
            id: e.id,
            type: "calendar",
            title: e.title,
            time: e.startTime ? (e.endTime ? `${e.startTime} - ${e.endTime}` : e.startTime) : "Dia todo",
            color: e.color || "#a78bfa",
            badge: e.label || "COMPROMISSO",
          });
        });
      }
    } catch {}

    // 2. Tarefas do dia
    tasks.filter((t) => (t.dueDate || t.due_date) === today && t.status !== "done").forEach((t) => {
      list.push({
        id: t.id,
        type: "task",
        title: t.title,
        time: "Prazo Hoje",
        color: "#3b82f6",
        badge: "TAREFA",
      });
    });

    // 3. Lançamentos financeiros do dia
    lancamentos.filter((l) => l.data === today).forEach((l) => {
      list.push({
        id: l.id,
        type: "finance",
        title: `${l.tipo === "entrada" ? "Recebimento" : "Pagamento"}: ${l.descricao}`,
        time: formatBRL(l.valor),
        color: l.tipo === "entrada" ? "#10b981" : "#ef4444",
        badge: "FINANÇAS",
      });
    });

    setEvents(list);
    setCurrentIndex(0);
  }, [userId, today, tasks, lancamentos]);

  // Rotação automática a cada 3.5s
  useEffect(() => {
    if (events.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [events.length, isPaused]);

  if (events.length === 0) {
    return (
      <div className="glass-card px-4 py-3 rounded-2xl border border-border/70 flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse shrink-0" />
          <span className="font-extrabold text-foreground">Agenda de Hoje:</span>
          <span className="truncate text-muted-foreground font-medium">✨ Nenhum compromisso agendado para hoje. Aproveite o dia!</span>
        </div>
        <Link to="/calendar" className="text-[11px] font-black text-foreground hover:underline shrink-0 flex items-center gap-1">
          + Agendar no Calendário
        </Link>
      </div>
    );
  }

  const current = events[currentIndex % events.length];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="glass-card px-4 py-3 rounded-2xl border border-border/80 shadow-md hover:border-foreground/30 transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 overflow-hidden select-none"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Ponto reluzente pulsante com a cor do evento */}
        <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: current.color }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: current.color }} />
        </div>

        {/* Badge / Tag do tipo de evento */}
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 border"
          style={{
            backgroundColor: `${current.color}18`,
            color: current.color,
            borderColor: `${current.color}40`,
          }}
        >
          {current.badge}
        </span>

        {/* Texto do noticiário rodando */}
        <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden transition-all duration-300">
          <span className="text-xs font-black text-foreground shrink-0">{current.time}</span>
          <span className="text-xs font-semibold text-muted-foreground truncate">{current.title}</span>
        </div>
      </div>

      {/* Controles do Ticker & Link para o Calendário */}
      <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
        <span className="text-[10px] font-extrabold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
          {currentIndex + 1} / {events.length}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % events.length)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Próximo"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <Link to="/calendar" className="text-xs font-extrabold text-foreground hover:underline flex items-center gap-1 pl-1">
          Ver Agenda <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const { habits, logs } = useHabits(activeUserId);
  const { tasks } = useTasks(activeUserId);
  const { goals } = useGoals(activeUserId);
  const { notes } = useNotes(activeUserId);
  const { lancamentos } = useLancamentos(activeUserId);
  const { metrics } = useMetrics(activeUserId);

  const today = todayIso();
  const month = monthIso();

  const userId = activeUserId || user?.id || "guest";

  // Livros salvos no localStorage
  const savedBooks = useMemo(() => {
    try {
      const b = localStorage.getItem(`lifeos_${userId}_books`);
      if (b) return JSON.parse(b);
    } catch {}
    return [];
  }, [userId]);

  // Caixinhas salvas
  const savedBoxes = useMemo(() => {
    try {
      const saved = localStorage.getItem(`lifeos_${userId}_savings_boxes`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }, [userId]);

  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.archived_at);
    const logsToday = logs.filter((l) => l.date === today && l.done);
    const openTasks = tasks.filter((t) => t.status !== "done");
    const tasksDueToday = openTasks.filter((t) => (t.dueDate || t.due_date) === today);

    // Calculate streak
    const logDates = [...new Set(logs.filter((l) => l.done).map((l) => l.date))].sort().reverse();
    let streak = 0;
    const cursor = new Date(today);
    for (const d of logDates) {
      if (d === cursor.toISOString().slice(0, 10)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }

    const monthTxs = lancamentos.filter((l) => l.data?.startsWith(month));
    const income = monthTxs.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const expense = monthTxs.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

    const totalSavedInBoxes = savedBoxes.reduce((sum: number, b: any) => sum + (b.currentAmount || 0), 0);

    // XP calculation
    const totalXp =
      logsToday.length * 10 +
      tasks.filter((t) => t.status === "done").length * 15 +
      metrics.length * 10 +
      streak * 25;

    let curLevel = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVELS[i].minXp) {
        curLevel = LEVELS[i];
        break;
      }
    }

    const xpInLevel = totalXp - curLevel.minXp;
    const levelRange = curLevel.maxXp - curLevel.minXp;
    const levelPct = Math.min(100, Math.round((xpInLevel / levelRange) * 100));

    return {
      habitsDue: activeHabits.length,
      habitsDone: logsToday.length,
      tasksOpen: openTasks.length,
      tasksDueToday: tasksDueToday.length,
      goalsActive: goals.length,
      income,
      expense,
      totalSavedInBoxes,
      streak,
      totalXp,
      curLevel,
      levelPct,
      xpInLevel,
      levelRange,
      activeHabitsList: activeHabits.slice(0, 4),
      openTasksList: openTasks.slice(0, 4),
      readingBooks: savedBooks.filter((b: any) => b.status === "reading").slice(0, 2),
    };
  }, [habits, logs, tasks, goals, notes, lancamentos, metrics, savedBooks, savedBoxes, today, month]);

  const habitProgressPercent = stats.habitsDue > 0 ? Math.round((stats.habitsDone / stats.habitsDue) * 100) : 0;
  const netSavings = stats.income - stats.expense;

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Pessoal";

  return (
    <div className="space-y-6 fade-in select-none pb-12">
      {/* ── 1. Banner da Central de Comando com Gamificação & Nível ────────────── */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden border-border/80 shadow-xl space-y-6">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Saudação & Nível */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-xs font-black tracking-wide shadow-xs">
                <Zap size={14} fill="currentColor" />
                Nível {stats.curLevel.level} — {stats.curLevel.name}
              </span>
              {stats.streak > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/15 text-orange-500 border border-orange-500/30 text-xs font-black">
                  🔥 {stats.streak} dias em sequência!
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">
              Olá, {username} 👋
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl font-medium leading-relaxed">
              Bem-vindo à sua Central de Comando LifeOS. Você acumulou <strong className="text-foreground">{stats.totalXp} XP</strong> até agora.
            </p>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/tasks" className="btn-ios text-xs py-3 px-4 shadow-sm">
              <Plus size={15} strokeWidth={2.5} />
              <span>Nova Tarefa</span>
            </Link>
            <Link to="/books" className="px-4 py-3 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2 shadow-xs">
              <Library size={15} />
              <span>Estante Virtual</span>
            </Link>
          </div>
        </div>

        {/* Barra de Progresso XP do Nível */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-muted-foreground uppercase tracking-wider">
              Progresso do Nível {stats.curLevel.level}
            </span>
            <span className="text-foreground">
              {stats.xpInLevel} / {stats.levelRange} XP ({stats.levelPct}%)
            </span>
          </div>
          <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
              style={{ width: `${stats.levelPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Pílula Noticiário de Eventos do Dia ────────────────────────── */}
      <TodayEventsTicker userId={userId} today={today} tasks={tasks} lancamentos={lancamentos} />

      {/* ── Acessos Rápidos de Cadastro ──────────────────────────────────── */}
      <DashboardQuickActions userId={userId} />

      {/* ── 2. Grid de Resumo de Status (4 Cards Principais) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Hábitos Hoje"
          value={`${stats.habitsDone}/${stats.habitsDue}`}
          hint={stats.habitsDue > 0 ? `${habitProgressPercent}% concluído hoje` : "Nenhum hábito cadastrado"}
          icon={Repeat}
          iconBg="bg-muted"
          iconColor="text-foreground"
          progress={habitProgressPercent}
        />
        <StatCard
          label="Tarefas Abertas"
          value={stats.tasksOpen}
          hint={stats.tasksDueToday > 0 ? `${stats.tasksDueToday} agendadas para hoje` : "Todas em dia!"}
          icon={CheckSquare}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          tone={stats.tasksDueToday > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Reservas em Caixinhas"
          value={formatBRL(stats.totalSavedInBoxes)}
          hint="Guardado para metas"
          icon={PiggyBank}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Metas Ativas"
          value={stats.goalsActive}
          hint="Objetivos de vida"
          icon={Target}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-500"
        />
      </div>

      {/* ── 3. Balanço Financeiro & Livros em Leitura ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Financeiro Consolidado */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between space-y-5 rounded-3xl border border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Wallet size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Visão Financeira do Mês</h3>
                <p className="text-xs text-muted-foreground font-medium">Fluxo de receita, despesa e saldo acumulado</p>
              </div>
            </div>
            <Link to="/finance" className="text-xs font-extrabold text-foreground hover:underline flex items-center gap-1">
              Abrir Finanças
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Entradas</span>
              </div>
              <p className="text-lg font-black text-emerald-500">{formatBRL(stats.income)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-red-500" />
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Saídas</span>
              </div>
              <p className="text-lg font-black text-red-500">{formatBRL(stats.expense)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-foreground" />
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Saldo Líquido</span>
              </div>
              <p className={cn("text-lg font-black", netSavings >= 0 ? "text-emerald-500" : "text-red-500")}>
                {formatBRL(netSavings)}
              </p>
            </div>
          </div>
        </div>

        {/* Estante de Livros Atuais */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4 rounded-3xl border border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library size={18} className="text-foreground" />
              <h3 className="text-sm font-black text-foreground">Lendo Agora</h3>
            </div>
            <Link to="/books" className="text-xs font-bold text-muted-foreground hover:text-foreground">
              Ver Estante
            </Link>
          </div>

          {stats.readingBooks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-medium">
              Nenhum livro em leitura no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.readingBooks.map((b: any) => {
                const pct = b.totalPages ? Math.round(((b.currentPage || 0) / b.totalPages) * 100) : 0;
                return (
                  <div key={b.id} className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex items-center gap-3">
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt="" className="w-9 h-12 object-cover rounded-lg shadow-xs shrink-0" />
                    ) : (
                      <div className="w-9 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                        <BookOpen size={14} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-foreground block truncate">{b.title}</span>
                      <span className="text-[10px] text-muted-foreground block font-medium truncate">{b.author}</span>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            to="/books"
            className="w-full py-2.5 rounded-2xl border border-border/70 text-center text-xs font-extrabold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"
          >
            <span>Gerenciar Biblioteca</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── 4. Painéis de Ação Diária: Hábitos & Tarefas ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hábitos Ativos */}
        <div className="glass-card p-6 space-y-4 rounded-3xl border border-border/70">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Repeat size={18} className="text-foreground" />
              <h3 className="text-sm font-black text-foreground">Seus Hábitos de Hoje</h3>
            </div>
            <Link to="/habits" className="text-xs font-bold text-foreground hover:underline flex items-center gap-1">
              Ver Todos <ChevronRight size={14} />
            </Link>
          </div>

          {stats.activeHabitsList.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nenhum hábito cadastrado ainda.</p>
              <Link to="/habits" className="inline-block text-xs font-bold text-foreground">
                + Criar Primeiro Hábito
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.activeHabitsList.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                >
                  <span className="text-xs font-extrabold text-foreground">{h.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground">
                    {h.frequency === "weekly" ? `${h.targetPerWeek || h.target_per_week || 3}x/semana` : "Diário"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas Tarefas */}
        <div className="glass-card p-6 space-y-4 rounded-3xl border border-border/70">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckSquare size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-black text-foreground">Próximas Tarefas Pendentes</h3>
            </div>
            <Link to="/tasks" className="text-xs font-bold text-muted-foreground hover:underline flex items-center gap-1">
              Ver Quadro <ChevronRight size={14} />
            </Link>
          </div>

          {stats.openTasksList.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa aberta no momento.</p>
              <Link to="/tasks" className="inline-block text-xs font-bold text-muted-foreground">
                + Criar Nova Tarefa
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.openTasksList.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                >
                  <span className="text-xs font-extrabold text-foreground">{t.title}</span>
                  {(t.dueDate || t.due_date) && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      📅 {t.dueDate || t.due_date}
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
