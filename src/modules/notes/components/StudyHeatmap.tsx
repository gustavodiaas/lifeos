import { useState, useMemo } from "react";
import type { Metric } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Clock, Flame, BookOpen } from "lucide-react";

interface StudyHeatmapProps {
  metrics: Metric[];
}

export function StudyHeatmap({ metrics }: StudyHeatmapProps) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<{ date: string; hours: number } | null>(null);

  // Mapeia horas de estudo por data "YYYY-MM-DD"
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();

    const studyMetrics = metrics.filter((m) => {
      if (m.key !== "study_hours" || !m.date) return false;
      const metricYear = parseInt(m.date.slice(0, 4), 10);
      return metricYear === currentYear;
    });

    for (const m of studyMetrics) {
      const current = map.get(m.date) || 0;
      map.set(m.date, current + (m.value || 0));
    }

    return map;
  }, [metrics, currentYear]);

  // Gera matriz de semanas do ano
  const weeks = useMemo(() => {
    const startDate = new Date(currentYear, 0, 1);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const endDate = new Date(currentYear, 11, 31);
    const result: { dateStr: string; month: number; isCurrentYear: boolean }[][] = [];

    let currentWeek: { dateStr: string; month: number; isCurrentYear: boolean }[] = [];
    const d = new Date(startDate);

    while (d <= endDate || currentWeek.length > 0) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateStr = d.toISOString().slice(0, 10);

      currentWeek.push({
        dateStr,
        month: m,
        isCurrentYear: y === currentYear,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
        if (d > endDate) break;
      }

      d.setDate(d.getDate() + 1);
    }

    return result;
  }, [currentYear]);

  const monthLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Determina nível de cor por horas de estudo
  const getIntensityClass = (dateStr: string, isCurrentYear: boolean) => {
    if (!isCurrentYear) return "bg-transparent opacity-0";
    const hours = heatmapData.get(dateStr) || 0;
    if (hours === 0) return "bg-muted/60 border border-border/30 hover:border-border";

    if (hours >= 4) return "bg-foreground shadow-none";
    if (hours >= 2) return "bg-muted-foreground/60";
    if (hours >= 1) return "bg-muted-foreground/30";
    return "bg-muted";
  };

  // Totais do Ano
  const totalYearHours = useMemo(() => {
    let sum = 0;
    heatmapData.forEach((h) => {
      sum += h;
    });
    return parseFloat(sum.toFixed(1));
  }, [heatmapData]);

  const activeDaysCount = useMemo(() => {
    let days = 0;
    heatmapData.forEach((h) => {
      if (h > 0) days += 1;
    });
    return days;
  }, [heatmapData]);

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Heatmap Anual de Horas de Estudo
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {totalYearHours} horas de estudo em {activeDaysCount} dias em {currentYear}
            </p>
          </div>
        </div>

        {/* Navegação de Ano */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentYear((y) => y - 1)}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Ano anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-muted border border-border text-foreground min-w-[60px] text-center">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear((y) => y + 1)}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Próximo ano"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grade de Heatmap */}
      <div className="overflow-x-auto pb-2 select-none">
        <div className="min-w-[720px]">
          {/* Rótulos dos Meses */}
          <div className="flex text-[10px] font-bold text-muted-foreground mb-2 pl-7">
            {monthLabels.map((m, idx) => (
              <div key={idx} className="flex-1 text-center">
                {m}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Dias da semana */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-muted-foreground pr-2 py-0.5 select-none shrink-0">
              <span>Dom</span>
              <span>Ter</span>
              <span>Qui</span>
              <span>Sáb</span>
            </div>

            {/* Matriz de semanas */}
            <div className="flex flex-1 gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1 flex-1">
                  {week.map((day, dIdx) => {
                    const hours = heatmapData.get(day.dateStr) || 0;

                    return (
                      <div
                        key={dIdx}
                        onMouseEnter={() =>
                          day.isCurrentYear &&
                          setHoveredDay({ date: day.dateStr, hours: parseFloat(hours.toFixed(1)) })
                        }
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-full aspect-square rounded-[4px] transition-all cursor-pointer ${getIntensityClass(
                          day.dateStr,
                          day.isCurrentYear
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé: Legenda + Tooltip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50 text-xs">
        <div className="min-h-[24px] flex items-center gap-2">
          {hoveredDay ? (
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-xl border border-border">
              <Clock size={13} />
              <span className="font-bold">{hoveredDay.date}:</span> {hoveredDay.hours} horas de foco estudadas
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground font-medium">
              Passe o cursor sobre os dias para ver as horas registradas pelo Relógio de Foco.
            </span>
          )}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          <span>0h</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-[3px] bg-muted/60 border border-border/30" />
            <div className="w-3 h-3 rounded-[3px] bg-muted" />
            <div className="w-3 h-3 rounded-[3px] bg-muted-foreground/30" />
            <div className="w-3 h-3 rounded-[3px] bg-muted-foreground/60" />
            <div className="w-3 h-3 rounded-[3px] bg-foreground shadow-none" />
          </div>
          <span>4h+</span>
        </div>
      </div>
    </div>
  );
}
