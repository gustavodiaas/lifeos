import { useMemo } from "react";
import type { JournalEntry } from "@/lib/supabase";
import { Smile, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodTrendChartProps {
  entries: JournalEntry[];
}

const MOOD_SCORE: Record<string, { score: number; emoji: string; label: string }> = {
  great: { score: 5, emoji: "🤩", label: "Excelente" },
  good: { score: 4, emoji: "😊", label: "Bom" },
  neutral: { score: 3, emoji: "😐", label: "Neutro" },
  bad: { score: 2, emoji: "🙁", label: "Ruim" },
  terrible: { score: 1, emoji: "😩", label: "Péssimo" },
};

export function MoodTrendChart({ entries }: MoodTrendChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      if (e.date && e.mood) {
        map.set(e.date, e.mood);
      }
    }

    const days: { date: string; mood: string | null; score: number; emoji: string; label: string }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const moodKey = map.get(dateStr) || null;
      const moodInfo = moodKey ? MOOD_SCORE[moodKey] || MOOD_SCORE.neutral : null;

      days.push({
        date: dateStr,
        mood: moodKey,
        score: moodInfo?.score || 0,
        emoji: moodInfo?.emoji || "·",
        label: moodInfo?.label || "Sem registro",
      });
    }

    return days;
  }, [entries]);

  const registeredDays = chartData.filter((d) => d.score > 0);
  const avgScore = registeredDays.length > 0
    ? (registeredDays.reduce((acc, d) => acc + d.score, 0) / registeredDays.length).toFixed(1)
    : "—";

  return (
    <div className="glass-card p-5 rounded-3xl border border-border/70 space-y-4 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Smile size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">Evolução do Humor (Últimos 30 Dias)</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Acompanhe seu estado emocional e bem-estar</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-2xl border border-border/50">
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-muted-foreground">Média do Período:</span>
          <span className="text-xs font-black text-foreground">{avgScore} / 5.0 ⭐</span>
        </div>
      </div>

      {/* Gráfico de Barras de Humor */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-end justify-between gap-1.5 min-w-[600px] h-32 pt-6">
          {chartData.map((d) => {
            const heightPct = d.score > 0 ? (d.score / 5) * 100 : 8;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {d.emoji}
                </span>

                <div
                  title={`${d.date.slice(5)}: ${d.label}`}
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-300",
                    d.score === 5 && "bg-emerald-500",
                    d.score === 4 && "bg-blue-500",
                    d.score === 3 && "bg-amber-500",
                    d.score === 2 && "bg-orange-500",
                    d.score === 1 && "bg-red-500",
                    d.score === 0 && "bg-muted/40"
                  )}
                  style={{ height: `${heightPct}%` }}
                />

                <span className="text-[9px] font-extrabold text-muted-foreground block">
                  {d.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
