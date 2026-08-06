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
  BarChart3,
  Scale,
  Clock,
  Repeat,
  CheckSquare,
  Wallet,
  Smile,
  Plus,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Calendar,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<string, { title: string; desc: string; iconColor: string; chartColor: string }> = {
  weight: { title: "Acompanhamento de Peso", desc: "Histórico de peso corporal", iconColor: "text-rose-500 bg-rose-500/15", chartColor: "#FCA311" },
  study_hours: { title: "Horas de Estudo", desc: "Tempo em foco e estudos", iconColor: "text-indigo-500 bg-indigo-500/15", chartColor: "#6366F1" },
  sleep_hours: { title: "Horas de Sono", desc: "Qualidade do descanso", iconColor: "text-purple-500 bg-purple-500/15", chartColor: "#A855F7" },
  water_liters: { title: "Consumo de Água", desc: "Hidratação diária", iconColor: "text-blue-500 bg-blue-500/15", chartColor: "#3B82F6" },
  workout_mins: { title: "Tempo de Treino", desc: "Atividade física", iconColor: "text-emerald-500 bg-emerald-500/15", chartColor: "#10B981" },
};

export function StatsModule() {
  const { user } = useAuthContext();
  const { metrics, addMetric } = useMetrics(user?.id);
  const { habits, logs } = useHabits(user?.id);
  const { tasks } = useTasks(user?.id);
  const { goals } = useGoals(user?.id);
  const { entries: journalEntries } = useJournal(user?.id);
  const { lancamentos } = useLancamentos(user?.id);

  const [loggerOpen, setLoggerOpen] = useState(false);
  const [defaultMetricKey, setDefaultMetricKey] = useState("weight");

  const today = todayIso();
  const currentMonth = monthIso();

  // Consolidação de estatísticas
  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.archived_at);
    const habitLogsToday = logs.filter(
      (l) => l.date === today && l.done
    );
    const tasksDone = tasks.filter((t) => t.status === "done").length;
    const goalsDone = goals.filter((g) => (g.progress || 0) >= (g.target || 100)).length;

    const monthTxs = lancamentos.filter((l) => l.data?.startsWith(currentMonth));
    const income = monthTxs.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const expense = monthTxs.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

    return {
      habitsTotal: activeHabits.length,
      habitsDoneToday: habitLogsToday.length,
      tasksTotal: tasks.length,
      tasksDone,
      goalsTotal: goals.length,
      goalsDone,
      journalCount: journalEntries.length,
      income,
      expense,
    };
  }, [habits, logs, tasks, goals, journalEntries, lancamentos, today, currentMonth]);

  // Salvar nova medição
  const handleSaveMetric = async (metricData: { key: string; value: number; unit: string; date: string }) => {
    try {
      const ok = await addMetric({
        key: metricData.key,
        value: metricData.value,
        unit: metricData.unit,
        date: metricData.date,
      });

      if (ok) {
        toast.success("Medição registrada com sucesso!");
        setLoggerOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar medição.");
    }
  };

  // Grupos de métricas dinâmicos por key
  const metricGroups = useMemo(() => {
    const map = new Map<string, { key: string; unit: string; logs: typeof metrics }>();
    
    // Garante peso e estudo como padrão se existirem
    ["weight", "study_hours"].forEach((k) => {
      map.set(k, { key: k, unit: k === "weight" ? "kg" : "h", logs: [] });
    });

    for (const m of metrics) {
      const existing = map.get(m.key) || { key: m.key, unit: m.unit || "", logs: [] };
      existing.logs.push(m);
      if (m.unit) existing.unit = m.unit;
      map.set(m.key, existing);
    }

    return Array.from(map.values());
  }, [metrics]);

  // Cálculo do LifeOS Score (0 a 100)
  const overallScore = useMemo(() => {
    let score = 50; // base

    if (stats.habitsTotal > 0) {
      score += Math.round((stats.habitsDoneToday / stats.habitsTotal) * 25);
    }

    if (stats.tasksTotal > 0) {
      score += Math.round((stats.tasksDone / stats.tasksTotal) * 25);
    } else {
      score += 10;
    }

    if (stats.income > 0) {
      const savingsRate = (stats.income - stats.expense) / stats.income;
      if (savingsRate > 0) score += Math.min(25, Math.round(savingsRate * 25));
    } else {
      score += 10;
    }

    if (stats.journalCount > 0) score += 10;
    if (stats.goalsDone > 0) score += 15;

    return Math.min(100, Math.max(10, score));
  }, [stats]);

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header & Ações ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Relatório Inteligente</span>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Tempo Real
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Estatísticas & Análise
          </h2>
        </div>

        <button
          onClick={() => {
            setDefaultMetricKey("weight");
            setLoggerOpen(true);
          }}
          className="btn-ios text-xs py-3 px-5 self-start md:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Registrar Medição</span>
        </button>
      </div>

      {/* ── 2. Anel de Pontuação de Desempenho Geral ───────────────────────── */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCA311]/15 text-[#FCA311] text-xs font-bold">
            <Award size={14} />
            <span>Produtividade Geral</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            LifeOS Performance Score
          </h3>

          <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
            O teu indicador consolidado avalia o hábito do dia, taxa de tarefas concluídas, saúde financeira e presença no diário.
          </p>
        </div>

        <div className="shrink-0">
          <ActivityRing
            score={overallScore}
            size={150}
            strokeWidth={14}
            label="Índice Global"
            sublabel="Métricas Ativas"
          />
        </div>
      </div>

      {/* ── 3. Rastreadores de Métricas Dinâmicos ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metricGroups.map((group) => {
          const info = METRIC_LABELS[group.key] || {
            title: group.key.replace(/_/g, " ").toUpperCase(),
            desc: "Registro de medições personalizadas",
            iconColor: "text-amber-500 bg-amber-500/15",
            chartColor: "#FCA311",
          };

          const latestValue = group.logs.at(-1)?.value ?? null;
          const totalSum = group.logs.reduce((sum, m) => sum + m.value, 0);

          return (
            <div key={group.key} className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${info.iconColor}`}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{info.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{info.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDefaultMetricKey(group.key);
                    setLoggerOpen(true);
                  }}
                  className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-[#FCA311] font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Log</span>
                </button>
              </div>

              <div className="flex items-baseline justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {group.key === "weight" ? "Último Valor" : "Total Acumulado"}
                  </span>
                  <span className="text-3xl font-black text-foreground">
                    {group.key === "weight"
                      ? latestValue != null ? `${latestValue} ${group.unit}` : "—"
                      : `${totalSum.toFixed(1)} ${group.unit}`}
                  </span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                  {group.logs.length} medições
                </span>
              </div>

              {/* Histórico recente */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Registros Recentes
                </span>
                {group.logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum registro nesta métrica ainda.</p>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {group.logs.slice(-5).map((log) => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-center shrink-0 min-w-[70px]">
                        <span className="text-[9px] font-bold text-muted-foreground block">{log.date.slice(5)}</span>
                        <span className="text-xs font-black text-foreground">{log.value} {group.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3.5 Gráficos de Tendência ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metricGroups.filter((g) => g.logs.length >= 2).map((group) => {
          const info = METRIC_LABELS[group.key] || {
            title: `Evolução: ${group.key}`,
            chartColor: "#FCA311",
          };
          return (
            <MetricTrendChart
              key={group.key}
              metrics={metrics}
              metricKey={group.key}
              title={info.title}
              unit={group.unit}
              color={info.chartColor}
            />
          );
        })}
      </div>

      {/* ── 4. Quadro Comparativo dos Módulos ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Hábitos & Tarefas */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <Repeat size={18} className="text-[#FCA311]" />
            <h3 className="text-sm font-extrabold text-foreground">Hábitos & Tarefas</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Hábitos Concluídos Hoje</span>
              <span className="font-extrabold text-foreground">{stats.habitsDoneToday}/{stats.habitsTotal}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Tarefas Concluídas</span>
              <span className="font-extrabold text-emerald-500">{stats.tasksDone}/{stats.tasksTotal}</span>
            </div>
          </div>
        </div>

        {/* Saúde Financeira */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <Wallet size={18} className="text-emerald-500" />
            <h3 className="text-sm font-extrabold text-foreground">Saúde Financeira</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Receita no Mês</span>
              <span className="font-extrabold text-emerald-500">{formatBRL(stats.income)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Despesa no Mês</span>
              <span className="font-extrabold text-red-500">{formatBRL(stats.expense)}</span>
            </div>
          </div>
        </div>

        {/* Diário & Metas */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <Smile size={18} className="text-purple-500" />
            <h3 className="text-sm font-extrabold text-foreground">Diário & Metas</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Metas Atingidas</span>
              <span className="font-extrabold text-purple-500">{stats.goalsDone}/{stats.goalsTotal}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Páginas no Diário</span>
              <span className="font-extrabold text-foreground">{stats.journalCount} salvos</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Registro de Métrica */}
      <MetricLoggerModal
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveMetric}
        defaultKey={defaultMetricKey}
      />
    </div>
  );
}
