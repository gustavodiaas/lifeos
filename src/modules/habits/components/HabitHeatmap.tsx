import { useMemo } from "react";
import type { HabitLog } from "@/lib/supabase";
import { Sparkles } from "lucide-react";

interface HabitHeatmapProps {
  logs: HabitLog[];
}

export function HabitHeatmap({ logs }: HabitHeatmapProps) {
  // Generate past 365 days dates (by weeks)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();

    // Count done logs per day YYYY-MM-DD
    for (const l of logs) {
      if (l.done && l.date) {
        map.set(l.date, (map.get(l.date) || 0) + 1);
      }
    }

    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); // 52 weeks

    const curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        count: map.get(dateStr) || 0,
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
  }, [logs]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/40 border-border/40";
    if (count === 1) return "bg-emerald-500/30 border-emerald-500/40 text-emerald-300";
    if (count === 2) return "bg-emerald-500/60 border-emerald-500/70 text-white";
    return "bg-emerald-500 border-emerald-400 font-bold shadow-sm shadow-emerald-500/20 text-white";
  };

  return (
    <div className="glass-card p-5 space-y-3 rounded-3xl border border-border/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">
              Matriz de Consistência (365 Dias)
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Frequência e histórico de hábitos no último ano
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-muted/40 border border-border/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Mais</span>
        </div>
      </div>

      {/* Grid Overflow Container */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-1 min-w-[700px] justify-between">
          {heatmapData.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} hábito(s) concluído(s)`}
                  className={`w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getColorClass(
                    day.count
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
