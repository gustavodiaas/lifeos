import { useState, useMemo } from "react";
import type { HabitLog } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Calendar, Flame, CheckCircle2 } from "lucide-react";

interface HabitHeatmapProps {
  logs: HabitLog[];
  totalHabitsCount: number;
  selectedHabitId?: string | null;
  habitName?: string;
}

export function HabitHeatmap({
  logs,
  totalHabitsCount,
  selectedHabitId,
  habitName,
}: HabitHeatmapProps) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; total: number; percent: number } | null>(null);

  // Mapeia histórico do ano selecionado em um mapa por data "YYYY-MM-DD"
  const heatmapData = useMemo(() => {
    const map = new Map<string, { doneCount: number; total: number }>();

    // Filtra logs do ano selecionado
    const yearLogs = logs.filter((l) => {
      if (!l.date) return false;
      const logYear = parseInt(l.date.slice(0, 4), 10);
      if (logYear !== currentYear) return false;
      if (selectedHabitId && l.habitId !== selectedHabitId) return false;
      return l.done;
    });

    for (const log of yearLogs) {
      const current = map.get(log.date) || { doneCount: 0, total: selectedHabitId ? 1 : totalHabitsCount };
      current.doneCount += 1;
      map.set(log.date, current);
    }

    return map;
  }, [logs, currentYear, selectedHabitId, totalHabitsCount]);

  // Gera semanas do ano (52-53 semanas x 7 dias)
  const weeks = useMemo(() => {
    const startDate = new Date(currentYear, 0, 1);
    // Ajusta para a primeira Segunda-feira do ano ou Domingo para alinhar a grade
    const dayOfWeek = startDate.getDay(); // 0 = Dom, 1 = Seg...
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

  // Meses para rótulos superiores
  const monthLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Determina nível de intensidade (0 a 4)
  const getIntensityClass = (dateStr: string, isCurrentYear: boolean) => {
    if (!isCurrentYear) return "bg-transparent opacity-0";
    const data = heatmapData.get(dateStr);
    if (!data || data.doneCount === 0) return "bg-muted/60 border border-border/30 hover:border-border";

    const targetTotal = selectedHabitId ? 1 : Math.max(1, totalHabitsCount);
    const ratio = data.doneCount / targetTotal;

    if (ratio >= 0.8) return "bg-foreground shadow-none";
    if (ratio >= 0.5) return "bg-foreground/80";
    if (ratio >= 0.25) return "bg-foreground/50";
    return "bg-foreground/25";
  };

  // Métricas do ano
  const totalYearDone = useMemo(() => {
    let count = 0;
    heatmapData.forEach((v) => {
      count += v.doneCount;
    });
    return count;
  }, [heatmapData]);

  const activeDaysCount = useMemo(() => {
    let days = 0;
    heatmapData.forEach((v) => {
      if (v.doneCount > 0) days += 1;
    });
    return days;
  }, [heatmapData]);

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header do Heatmap */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-foreground/15 text-foreground flex items-center justify-center shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              {habitName ? `Consistência: ${habitName}` : "Heatmap Anual de Consistência"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {activeDaysCount} dias com hábitos concluídos em {currentYear} ({totalYearDone} confirmações)
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
            {/* Rótulos dos Dias da semana */}
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
                    const data = heatmapData.get(day.dateStr);
                    const doneCount = data?.doneCount || 0;
                    const total = selectedHabitId ? 1 : Math.max(1, totalHabitsCount);
                    const percent = Math.round((doneCount / total) * 100);

                    return (
                      <div
                        key={dIdx}
                        onMouseEnter={() =>
                          day.isCurrentYear &&
                          setHoveredDay({ date: day.dateStr, count: doneCount, total, percent })
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

      {/* Rodapé: Legenda + Tooltip Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50 text-xs">
        {/* Tooltip do dia hovered */}
        <div className="min-h-[24px] flex items-center gap-2">
          {hoveredDay ? (
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-xl border border-border/60">
              <Calendar size={13} className="text-foreground" />
              <span className="font-bold">{hoveredDay.date}:</span> {hoveredDay.count} de {hoveredDay.total} hábitos ({hoveredDay.percent}%)
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground font-medium">
              Passe o cursor sobre os quadrados para ver detalhes diários.
            </span>
          )}
        </div>

        {/* Legenda de Intensidade */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          <span>Menos</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-[3px] bg-muted/60 border border-border/30" />
            <div className="w-3 h-3 rounded-[3px] bg-foreground/25" />
            <div className="w-3 h-3 rounded-[3px] bg-foreground/50" />
            <div className="w-3 h-3 rounded-[3px] bg-foreground/80" />
            <div className="w-3 h-3 rounded-[3px] bg-foreground shadow-none" />
          </div>
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
