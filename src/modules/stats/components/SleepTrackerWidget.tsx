import { useState, useMemo, useEffect } from "react";
import type { Metric } from "@/lib/supabase";
import { Moon, Sparkles, Sliders, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SleepTrackerWidgetProps {
  sleepLogs: Metric[];
  onOpenLogger: () => void;
}

export function SleepTrackerWidget({ sleepLogs, onOpenLogger }: SleepTrackerWidgetProps) {
  const [targetHours, setTargetHours] = useState<number>(() => {
    return parseInt(localStorage.getItem("lifeos_sleep_target") || "8", 10);
  });
  const [showHygiene, setShowHygiene] = useState(false);

  useEffect(() => {
    localStorage.setItem("lifeos_sleep_target", targetHours.toString());
  }, [targetHours]);

  // Generate past 365 days sleep heatmap data
  const sleepHeatmap = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();

    // Map sleep_hours by date YYYY-MM-DD
    for (const log of sleepLogs) {
      if (log.date && typeof log.value === "number") {
        map.set(log.date, log.value);
      }
    }

    const days: { date: string; hours: number; pctOfTarget: number; dayOfWeek: number }[] = [];
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);

    const curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().slice(0, 10);
      const hours = map.get(dateStr) || 0;
      const pctOfTarget = targetHours > 0 ? (hours / targetHours) * 100 : 0;

      days.push({
        date: dateStr,
        hours,
        pctOfTarget,
        dayOfWeek: curr.getDay(),
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Group into 52 weeks (cols)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];

    days.forEach((d) => {
      currentWeek.push(d);
      if (d.dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [sleepLogs, targetHours]);

  const latestSleep = sleepLogs.at(-1)?.value || 0;

  const getSleepColorClass = (hours: number, pct: number) => {
    if (hours === 0) return "bg-muted/40 border-border/40";
    if (pct < 50) return "bg-indigo-500/25 border-indigo-500/30 text-indigo-300";
    if (pct < 100) return "bg-indigo-500/60 border-indigo-500/70 text-white";
    return "bg-indigo-500 border-indigo-400 font-bold shadow-sm shadow-indigo-500/20 text-white";
  };

  return (
    <div className="glass-card p-5 space-y-4 rounded-3xl border border-border/70">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Moon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight">Análise do Sono & Restauro</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Heatmap de qualidade do sono e metas noturnas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Configurar Meta de Sono */}
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-xl border border-border/60">
            <Sliders size={13} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">Meta:</span>
            <select
              value={targetHours}
              onChange={(e) => setTargetHours(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-black text-foreground outline-none cursor-pointer"
            >
              <option value={6} className="bg-card text-foreground">6 horas</option>
              <option value={7} className="bg-card text-foreground">7 horas</option>
              <option value={8} className="bg-card text-foreground">8 horas</option>
              <option value={9} className="bg-card text-foreground">9 horas</option>
            </select>
          </div>

          <button onClick={onOpenLogger} className="btn-ios text-xs py-2 px-3">
            <span>Registrar Sono</span>
          </button>
        </div>
      </div>

      {/* Estatísticas de Sono Recente */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Última Noite</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-foreground">{latestSleep || "—"}</span>
            <span className="text-xs font-bold text-muted-foreground">horas</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Sua Meta Definida</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-foreground">{targetHours}h</span>
            <span className="text-xs font-bold text-muted-foreground">/noite</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-muted/40 border border-border/50">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Desempenho</span>
          <span className="text-xs font-extrabold text-foreground block mt-1">
            {latestSleep >= targetHours
              ? "🎯 Meta Atingida!"
              : latestSleep > 0
              ? `${Math.round((latestSleep / targetHours) * 100)}% da meta`
              : "Sem registro hoje"}
          </span>
        </div>
      </div>

      {/* Heatmap de Sono Anual */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
            Matriz de Sono (365 Dias)
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <span>&lt;50%</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/40 border border-border/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>&ge;100% (Meta)</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-1 min-w-[700px] justify-between">
            {sleepHeatmap.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.hours}h de sono (${Math.round(day.pctOfTarget)}% da meta)`}
                    className={`w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getSleepColorClass(
                      day.hours,
                      day.pctOfTarget
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dicas de Higiene do Sono */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
        <button
          onClick={() => setShowHygiene(!showHygiene)}
          className="w-full flex items-center justify-between text-left font-extrabold text-xs text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-indigo-400" />
            <span>Guia de Higiene do Sono & Recuperação</span>
          </span>
          {showHygiene ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showHygiene && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground leading-relaxed fade-in">
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
              <strong className="text-foreground block">📵 Zero Telas 1h Antes</strong>
              <span>Desligue smartphones e luz azul para estimular a liberação natural de melatonina.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
              <strong className="text-foreground block">☕ Cafeína Apenas até 14h</strong>
              <span>A meia-vida da cafeína é de 6 horas; evite bebidas estimulantes no fim da tarde.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
              <strong className="text-foreground block">🕒 Horário Consistente</strong>
              <span>Deitar e acordar no mesmo horário reforça o ritmo circadiano do seu organismo.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
              <strong className="text-foreground block">🌡️ Quarto Frio e Escuro</strong>
              <span>Temperaturas entre 18°C e 21°C proporcionam estágios mais profundos de sono REM.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
