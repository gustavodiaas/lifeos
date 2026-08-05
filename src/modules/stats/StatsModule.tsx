import { useState, useEffect, useMemo, useCallback } from "react";
import { db, newId, nowIso } from "@/db";
import type { Metric } from "@/db/schema";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsModule() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  // Consolidação de estatísticas dos outros módulos
  const [stats, setStats] = useState({
    habitsTotal: 0,
    habitsDoneToday: 0,
    tasksTotal: 0,
    tasksDone: 0,
    goalsTotal: 0,
    goalsDone: 0,
    journalCount: 0,
    income: 0,
    expense: 0,
  });

  const [loggerOpen, setLoggerOpen] = useState(false);
  const [defaultMetricKey, setDefaultMetricKey] = useState("weight");

  // Carrega todas as métricas e dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const d = db();
      const today = todayIso();
      const month = monthIso();

      const [allMetrics, habits, habitLogsToday, tasks, goals, txs, journalEntries] =
        await Promise.all([
          d.metrics.orderBy("date").toArray(),
          d.habits.filter((h) => !h.archivedAt).toArray(),
          d.habit_logs.where("date").equals(today).filter((l) => l.done).toArray(),
          d.tasks.toArray(),
          d.goals.toArray(),
          d.transactions.filter((t) => t.date.startsWith(month)).toArray(),
          d.journal_entries.toArray(),
        ]);

      setMetrics(allMetrics);

      const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const tasksDone = tasks.filter((t) => t.status === "done").length;
      const goalsDone = goals.filter((g) => (g.progress || 0) >= (g.target || 100)).length;

      setStats({
        habitsTotal: habits.length,
        habitsDoneToday: habitLogsToday.length,
        tasksTotal: tasks.length,
        tasksDone,
        goalsTotal: goals.length,
        goalsDone,
        journalCount: journalEntries.length,
        income,
        expense,
      });
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      toast.error("Erro ao carregar métricas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Salvar nova medição de métrica (peso ou estudo)
  const handleSaveMetric = async (metricData: { key: string; value: number; unit: string; date: string }) => {
    try {
      const d = db();
      const now = nowIso();
      const newMetric: Metric = {
        id: newId(),
        key: metricData.key,
        value: metricData.value,
        unit: metricData.unit,
        date: metricData.date,
        createdAt: now,
        updatedAt: now,
      };

      await d.metrics.add(newMetric);
      toast.success("Medição registrada com sucesso!");
      setLoggerOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar medição.");
    }
  };

  // Separação de registros de peso e horas de estudo
  const weightLogs = useMemo(() => metrics.filter((m) => m.key === "weight"), [metrics]);
  const studyLogs = useMemo(() => metrics.filter((m) => m.key === "study_hours"), [metrics]);

  const latestWeight = weightLogs.at(-1)?.value ?? null;
  const totalStudyHours = useMemo(() => studyLogs.reduce((sum, m) => sum + m.value, 0), [studyLogs]);

  // Cálculo do LifeOS Score (0 a 100)
  const overallScore = useMemo(() => {
    let score = 50; // base

    // Hábitos (+0 a +25)
    if (stats.habitsTotal > 0) {
      score += Math.round((stats.habitsDoneToday / stats.habitsTotal) * 25);
    }

    // Tarefas (+0 a +25)
    if (stats.tasksTotal > 0) {
      score += Math.round((stats.tasksDone / stats.tasksTotal) * 25);
    } else {
      score += 10;
    }

    // Finanças (+0 a +25)
    if (stats.income > 0) {
      const savingsRate = (stats.income - stats.expense) / stats.income;
      if (savingsRate > 0) score += Math.min(25, Math.round(savingsRate * 25));
    } else {
      score += 10;
    }

    // Diário & Metas (+0 a +25)
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

      {/* ── 2. Anel de Pontuação de Desempenho Geral (Apple Watch Style) ── */}
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

        {/* Anel SVG Anotado */}
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

      {/* ── 3. Rastreadores de Métricas (Peso & Estudo) ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Rastreador de Peso */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Scale size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Acompanhamento de Peso</h3>
                <p className="text-xs text-muted-foreground font-medium">Registro do histórico de peso corporal</p>
              </div>
            </div>

            <button
              onClick={() => {
                setDefaultMetricKey("weight");
                setLoggerOpen(true);
              }}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-[#FCA311] font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Peso</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between py-2">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Último Peso</span>
              <span className="text-3xl font-black text-foreground">
                {latestWeight != null ? `${latestWeight} kg` : "—"}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
              {weightLogs.length} medições
            </span>
          </div>

          {/* Histórico recente */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Últimos Registros</span>
            {weightLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum peso registrado ainda.</p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {weightLogs.slice(-5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-center shrink-0 min-w-[70px]">
                    <span className="text-[9px] font-bold text-muted-foreground block">{log.date.slice(5)}</span>
                    <span className="text-xs font-black text-foreground">{log.value} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rastreador de Horas de Estudo */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Horas de Estudo</h3>
                <p className="text-xs text-muted-foreground font-medium">Tempo acumulado em foco e estudos</p>
              </div>
            </div>

            <button
              onClick={() => {
                setDefaultMetricKey("study_hours");
                setLoggerOpen(true);
              }}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-indigo-500 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Estudo</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between py-2">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Acumulado</span>
              <span className="text-3xl font-black text-foreground">
                {totalStudyHours.toFixed(1)} h
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
              {studyLogs.length} sessões
            </span>
          </div>

          {/* Histórico recente */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sessões Recentes</span>
            {studyLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma sessão registrada ainda.</p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {studyLogs.slice(-5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-center shrink-0 min-w-[70px]">
                    <span className="text-[9px] font-bold text-muted-foreground block">{log.date.slice(5)}</span>
                    <span className="text-xs font-black text-indigo-500">+{log.value} h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* ── 3.5 Gráficos de Tendência (Recharts) ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricTrendChart
          metrics={metrics}
          metricKey="weight"
          title="Gráfico de Evolução de Peso"
          unit="kg"
          color="#FCA311"
        />
        <MetricTrendChart
          metrics={metrics}
          metricKey="study_hours"
          title="Gráfico de Sessões de Estudo"
          unit="h"
          color="#6366F1"
        />
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
