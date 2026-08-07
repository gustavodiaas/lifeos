import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useMetrics } from "@/hooks/useMetrics";
import { useHabits } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useJournal } from "@/hooks/useJournal";
import { useLancamentos } from "@/hooks/useLancamentos";
import { todayIso, monthIso, formatBRL } from "@/lib/date";
import { ActivityRing } from "./components/ActivityRing";
import { MetricLoggerModal } from "./components/MetricLoggerModal";
import { MetricTrendChart } from "./components/WeightTrendChart";
import { toast } from "sonner";
import {
  Repeat,
  CheckSquare,
  Wallet,
  Target,
  BookOpen,
  NotebookPen,
  Plus,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  Moon,
  Droplets,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Métricas manuais configuráveis
const METRIC_META: Record<string, {
  label: string;
  unit: string;
  icon: React.FC<any>;
  color: string;
  chartColor: string;
}> = {
  weight:       { label: "Peso",   unit: "kg",  icon: Scale,    color: "text-[#FCA311] bg-[#FCA311]/15",    chartColor: "#FCA311" },
  study_hours:  { label: "Estudo", unit: "h",   icon: Clock,    color: "text-indigo-500 bg-indigo-500/15",  chartColor: "#6366F1" },
  sleep_hours:  { label: "Sono",   unit: "h",   icon: Moon,     color: "text-purple-500 bg-purple-500/15",  chartColor: "#A855F7" },
  water_liters: { label: "Água",   unit: "L",   icon: Droplets, color: "text-blue-500 bg-blue-500/15",     chartColor: "#3B82F6" },
  workout_mins: { label: "Treino", unit: "min", icon: Dumbbell, color: "text-emerald-500 bg-emerald-500/15",chartColor: "#10B981" },
};

const ALL_MANUAL_KEYS = Object.keys(METRIC_META);

export function StatsModule() {
  const { user } = useAuthContext();
  const { metrics, addMetric }           = useMetrics(user?.id);
  const { habits, logs }                 = useHabits(user?.id);
  const { tasks }                        = useTasks(user?.id);
  const { goals }                        = useGoals(user?.id);
  const { entries: journalEntries }      = useJournal(user?.id);
  const { lancamentos }                  = useLancamentos(user?.id);

  const [loggerOpen, setLoggerOpen]         = useState(false);
  const [defaultMetricKey, setDefaultMetricKey] = useState("weight");

  const today        = todayIso();
  const currentMonth = monthIso();

  // ── Dados automáticos por módulo ──────────────────────────────────────
  const moduleStats = useMemo(() => {
    const activeHabits   = habits.filter((h) => !h.archivedAt && !h.archived_at);
    const habitsDoneToday = logs.filter((l) => l.date === today && l.done).length;

    // streak de hábitos (dias consecutivos com pelo menos 1 hábito feito)
    const logDates = [...new Set(logs.filter((l) => l.done).map((l) => l.date))].sort().reverse();
    let streak = 0;
    const cursor = new Date(today);
    for (const d of logDates) {
      const cur = cursor.toISOString().slice(0, 10);
      if (d === cur) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }

    const tasksDone    = tasks.filter((t) => t.status === "done").length;
    const tasksPending = tasks.filter((t) => t.status !== "done").length;

    const monthTxs = lancamentos.filter((l) => l.data?.startsWith(currentMonth));
    const income   = monthTxs.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const expense  = monthTxs.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
    const balance  = income - expense;
    const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

    const goalsActive   = goals.filter((g) => (g.progress || 0) < (g.target || 100));
    const goalsDone     = goals.filter((g) => (g.progress || 0) >= (g.target || 100)).length;
    const avgGoalPct    = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + ((g.progress || 0) / (g.target || 100)) * 100, 0) / goals.length)
      : null;

    const journalThisMonth = journalEntries.filter((e) =>
      (e.date || e.created_at || "").startsWith(currentMonth)
    ).length;

    // notas únicas (se existir campo de tema/tag)
    const journalTotal = journalEntries.length;

    return {
      habitsTotal: activeHabits.length,
      habitsDoneToday,
      streak,
      tasksDone,
      tasksPending,
      tasksTotal: tasks.length,
      income,
      expense,
      balance,
      savingRate,
      goalsDone,
      goalsTotal: goals.length,
      goalsActive: goalsActive.length,
      avgGoalPct,
      journalThisMonth,
      journalTotal,
    };
  }, [habits, logs, tasks, goals, journalEntries, lancamentos, today, currentMonth]);

  // ── Score geral ───────────────────────────────────────────────────────
  const overallScore = useMemo(() => {
    let s = 40;
    if (moduleStats.habitsTotal > 0)
      s += Math.round((moduleStats.habitsDoneToday / moduleStats.habitsTotal) * 20);
    if (moduleStats.tasksTotal > 0)
      s += Math.round((moduleStats.tasksDone / moduleStats.tasksTotal) * 20);
    if (moduleStats.income > 0 && moduleStats.savingRate !== null && moduleStats.savingRate > 0)
      s += Math.min(15, Math.round(moduleStats.savingRate * 0.15));
    if (moduleStats.journalThisMonth > 0) s += 5;
    if (moduleStats.goalsDone > 0) s += 10;
    if (moduleStats.streak >= 3) s += 5;
    return Math.min(100, Math.max(10, s));
  }, [moduleStats]);

  // ── Métricas manuais — só as que têm ao menos 1 registro ─────────────
  const metricGroups = useMemo(() => {
    const map = new Map<string, { key: string; unit: string; logs: typeof metrics }>();
    for (const m of metrics) {
      const ex = map.get(m.key) || { key: m.key, unit: m.unit || "", logs: [] };
      ex.logs.push(m);
      if (m.unit) ex.unit = m.unit;
      map.set(m.key, ex);
    }
    return Array.from(map.values()).filter((g) => g.logs.length > 0);
  }, [metrics]);

  // Quais métricas manuais ainda não têm dados
  const unloggedKeys = ALL_MANUAL_KEYS.filter(
    (k) => !metricGroups.some((g) => g.key === k)
  );

  const handleSaveMetric = async (data: { key: string; value: number; unit: string; date: string }) => {
    try {
      const ok = await addMetric(data);
      if (ok) { toast.success("Medição registrada!"); setLoggerOpen(false); }
    } catch {
      toast.error("Erro ao salvar medição.");
    }
  };

  const openLogger = (key: string) => {
    setDefaultMetricKey(key);
    setLoggerOpen(true);
  };

  return (
    <div className="space-y-5 fade-in px-4 md:px-6 py-4 pb-12">

      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="badge-ios text-[10px]">Tempo Real</span>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mt-1">
            Estatísticas
          </h2>
        </div>
        <button
          onClick={() => openLogger("weight")}
          className="btn-ios text-xs py-2 px-4"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Registrar</span>
        </button>
      </div>

      {/* ── Score Geral ─────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex items-center gap-5 bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10">
        <ActivityRing
          score={overallScore}
          size={90}
          strokeWidth={10}
          label="Score"
          sublabel="LifeOS"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Award size={13} className="text-[#FCA311] shrink-0" />
            <span className="text-[10px] font-extrabold text-[#FCA311] uppercase tracking-wider">
              Performance Geral
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Baseado nos seus hábitos de hoje, tarefas concluídas, saúde financeira e presença no diário.
          </p>
          {moduleStats.streak >= 2 && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              🔥 {moduleStats.streak} dias em sequência
            </span>
          )}
        </div>
      </div>

      {/* ── Cards dos módulos — dados automáticos ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        {/* Hábitos */}
        <ModuleCard
          icon={<Repeat size={16} />}
          iconClass="text-[#FCA311] bg-[#FCA311]/15"
          title="Hábitos"
          primary={`${moduleStats.habitsDoneToday} / ${moduleStats.habitsTotal}`}
          primaryLabel="feitos hoje"
          secondary={moduleStats.streak > 0 ? `${moduleStats.streak}d streak` : null}
          secondaryColor="text-emerald-500"
          emptyMsg={moduleStats.habitsTotal === 0 ? "Nenhum hábito ativo" : null}
          progress={moduleStats.habitsTotal > 0
            ? Math.round((moduleStats.habitsDoneToday / moduleStats.habitsTotal) * 100)
            : null}
        />

        {/* Tarefas */}
        <ModuleCard
          icon={<CheckSquare size={16} />}
          iconClass="text-blue-500 bg-blue-500/15"
          title="Tarefas"
          primary={String(moduleStats.tasksDone)}
          primaryLabel="concluídas"
          secondary={moduleStats.tasksPending > 0 ? `${moduleStats.tasksPending} pendentes` : "Tudo em dia!"}
          secondaryColor={moduleStats.tasksPending > 0 ? "text-amber-500" : "text-emerald-500"}
          emptyMsg={moduleStats.tasksTotal === 0 ? "Nenhuma tarefa" : null}
          progress={moduleStats.tasksTotal > 0
            ? Math.round((moduleStats.tasksDone / moduleStats.tasksTotal) * 100)
            : null}
        />

        {/* Finanças */}
        <ModuleCard
          icon={<Wallet size={16} />}
          iconClass="text-emerald-500 bg-emerald-500/15"
          title="Finanças"
          primary={formatBRL(moduleStats.balance)}
          primaryLabel="saldo do mês"
          secondary={moduleStats.savingRate !== null
            ? `${moduleStats.savingRate}% poupado`
            : moduleStats.income === 0 ? "Sem lançamentos" : null}
          secondaryColor={
            moduleStats.savingRate !== null && moduleStats.savingRate > 0
              ? "text-emerald-500"
              : "text-red-500"
          }
          emptyMsg={moduleStats.income === 0 && moduleStats.expense === 0 ? "Sem lançamentos" : null}
          progress={null}
          accentColor={moduleStats.balance >= 0 ? "border-emerald-500/30" : "border-red-500/30"}
        />

        {/* Metas */}
        <ModuleCard
          icon={<Target size={16} />}
          iconClass="text-purple-500 bg-purple-500/15"
          title="Metas"
          primary={`${moduleStats.goalsDone} / ${moduleStats.goalsTotal}`}
          primaryLabel="concluídas"
          secondary={moduleStats.avgGoalPct !== null
            ? `${moduleStats.avgGoalPct}% média geral`
            : null}
          secondaryColor="text-purple-500"
          emptyMsg={moduleStats.goalsTotal === 0 ? "Nenhuma meta" : null}
          progress={moduleStats.avgGoalPct}
        />

        {/* Diário */}
        <ModuleCard
          icon={<NotebookPen size={16} />}
          iconClass="text-rose-500 bg-rose-500/15"
          title="Diário"
          primary={String(moduleStats.journalThisMonth)}
          primaryLabel="entradas este mês"
          secondary={moduleStats.journalTotal > 0
            ? `${moduleStats.journalTotal} no total`
            : null}
          secondaryColor="text-muted-foreground"
          emptyMsg={moduleStats.journalTotal === 0 ? "Nenhuma entrada" : null}
          progress={null}
        />

        {/* Finanças: receita vs despesa */}
        <div className="glass-card p-3 rounded-2xl border border-border/60 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-indigo-500 bg-indigo-500/15 shrink-0">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-extrabold text-foreground">Fluxo</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Receita</span>
              <span className="font-extrabold text-emerald-500">{formatBRL(moduleStats.income)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Despesa</span>
              <span className="font-extrabold text-red-500">{formatBRL(moduleStats.expense)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Métricas manuais com dados ────────────────────────────────── */}
      {metricGroups.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
            Métricas Pessoais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricGroups.map((group) => {
              const meta = METRIC_META[group.key] || {
                label: group.key.replace(/_/g, " "),
                unit: group.unit,
                icon: Activity,
                color: "text-amber-500 bg-amber-500/15",
                chartColor: "#FCA311",
              };
              const Icon = meta.icon;
              const latest = group.logs.at(-1);
              const prev   = group.logs.at(-2);
              const trend  = latest && prev
                ? latest.value > prev.value ? "up" : latest.value < prev.value ? "down" : "flat"
                : null;

              return (
                <div key={group.key} className="glass-card p-4 rounded-2xl border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", meta.color)}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground">{meta.label}</p>
                        <p className="text-[10px] text-muted-foreground">{group.logs.length} medições</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend === "up" && <TrendingUp size={14} className="text-emerald-500" />}
                      {trend === "down" && <TrendingDown size={14} className="text-red-500" />}
                      <button
                        onClick={() => openLogger(group.key)}
                        className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-[#FCA311] transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">
                      {latest?.value ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{meta.unit}</span>
                    {prev && (
                      <span className={cn(
                        "ml-auto text-[10px] font-bold",
                        trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
                      )}>
                        anterior: {prev.value} {meta.unit}
                      </span>
                    )}
                  </div>

                  {/* Últimas medições */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                    {group.logs.slice(-6).map((log) => (
                      <div key={log.id} className="shrink-0 text-center p-1.5 rounded-xl bg-muted/50 border border-border/40 min-w-[52px]">
                        <span className="text-[9px] font-bold text-muted-foreground block">{log.date.slice(5)}</span>
                        <span className="text-[11px] font-black text-foreground">{log.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráficos — só se tiver >= 2 pontos */}
          {metricGroups.filter((g) => g.logs.length >= 2).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {metricGroups.filter((g) => g.logs.length >= 2).map((group) => {
                const meta = METRIC_META[group.key];
                if (!meta) return null;
                return (
                  <MetricTrendChart
                    key={group.key}
                    metrics={metrics}
                    metricKey={group.key}
                    title={meta.label}
                    unit={meta.unit}
                    color={meta.chartColor}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── CTAs para métricas ainda sem dados ───────────────────────── */}
      {unloggedKeys.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
            Rastrear Também
          </h3>
          <div className="flex flex-wrap gap-2">
            {unloggedKeys.map((k) => {
              const meta = METRIC_META[k];
              const Icon = meta.icon;
              return (
                <button
                  key={k}
                  onClick={() => openLogger(k)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon size={12} />
                  <span>{meta.label}</span>
                  <Plus size={11} className="opacity-60" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <MetricLoggerModal
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveMetric}
        defaultKey={defaultMetricKey}
      />
    </div>
  );
}

// ── Componente auxiliar: card de módulo ──────────────────────────────────
function ModuleCard({
  icon,
  iconClass,
  title,
  primary,
  primaryLabel,
  secondary,
  secondaryColor = "text-muted-foreground",
  emptyMsg,
  progress,
  accentColor,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  primary: string;
  primaryLabel: string;
  secondary: string | null;
  secondaryColor?: string;
  emptyMsg: string | null;
  progress: number | null;
  accentColor?: string;
}) {
  return (
    <div className={cn(
      "glass-card p-3 rounded-2xl border border-border/60 space-y-2.5",
      accentColor
    )}>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", iconClass)}>
          {icon}
        </div>
        <span className="text-xs font-extrabold text-foreground">{title}</span>
      </div>

      {emptyMsg ? (
        <p className="text-[11px] text-muted-foreground italic">{emptyMsg}</p>
      ) : (
        <>
          <div>
            <span className="text-xl font-black text-foreground leading-none">{primary}</span>
            <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">{primaryLabel}</span>
          </div>

          {secondary && (
            <span className={cn("text-[11px] font-bold", secondaryColor)}>{secondary}</span>
          )}

          {progress !== null && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FCA311] rounded-full transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
