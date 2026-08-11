import { useMemo } from "react";
import { Award, Zap, Shield, Flame, CheckCircle2, Trophy, Star, Sparkles, BookOpen, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamificationWidgetProps {
  habitsDoneCount: number;
  tasksDoneCount: number;
  journalCount: number;
  metricsCount: number;
  streakDays: number;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  unlocked: boolean;
  color: string;
}

const LEVELS = [
  { level: 1, name: "Iniciante Focado", minXp: 0, maxXp: 100 },
  { level: 2, name: "Praticante Disciplinado", minXp: 100, maxXp: 300 },
  { level: 3, name: "Mestre da Rotina", minXp: 300, maxXp: 600 },
  { level: 4, name: "Titã da Produtividade", minXp: 600, maxXp: 1000 },
  { level: 5, name: "Lenda do LifeOS", minXp: 1000, maxXp: 2000 },
];

export function GamificationWidget({
  habitsDoneCount,
  tasksDoneCount,
  journalCount,
  metricsCount,
  streakDays,
}: GamificationWidgetProps) {

  // Calcular XP Total
  const totalXp = useMemo(() => {
    return (
      habitsDoneCount * 10 +
      tasksDoneCount * 15 +
      journalCount * 20 +
      metricsCount * 10 +
      streakDays * 25
    );
  }, [habitsDoneCount, tasksDoneCount, journalCount, metricsCount, streakDays]);

  // Nível Atual
  const currentLevel = useMemo(() => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVELS[i].minXp) return LEVELS[i];
    }
    return LEVELS[0];
  }, [totalXp]);

  const xpInCurrentLevel = totalXp - currentLevel.minXp;
  const levelRange = currentLevel.maxXp - currentLevel.minXp;
  const levelPct = Math.min(100, Math.round((xpInCurrentLevel / levelRange) * 100));

  // Medalhas / Badges
  const badges: Badge[] = useMemo(() => [
    {
      id: "b1",
      title: "Primeiros Passos",
      description: "Conclua seu primeiro hábito",
      icon: CheckCircle2,
      unlocked: habitsDoneCount >= 1,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "b2",
      title: "Foco Imparável",
      description: "Alcance 3+ dias de streak",
      icon: Flame,
      unlocked: streakDays >= 3,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
    },
    {
      id: "b3",
      title: "Executor de Elite",
      description: "Conclua 5 tarefas",
      icon: Trophy,
      unlocked: tasksDoneCount >= 5,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "b4",
      title: "Mente Reflexiva",
      description: "Escreva 3 entradas no Diário",
      icon: BookOpen,
      unlocked: journalCount >= 3,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    },
    {
      id: "b5",
      title: "Guardião da Saúde",
      description: "Registre 3 medições pessoais",
      icon: Scale,
      unlocked: metricsCount >= 3,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
  ], [habitsDoneCount, streakDays, tasksDoneCount, journalCount, metricsCount]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="glass-card p-5 space-y-4 rounded-3xl border border-border/70 select-none">
      {/* Header Nível & XP */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-xl shadow-lg shadow-black/10">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground uppercase tracking-widest">
                Nível {currentLevel.level} — {currentLevel.name}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground border border-foreground/20">
                {totalXp} XP Acumulado
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Conclua tarefas, hábitos e medições para subir de nível e desbloquear insígnias.
            </p>
          </div>
        </div>

        {/* Status de Conquistas */}
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-2xl border border-border/50">
          <Award size={16} className="text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            {unlockedCount} / {badges.length} Conquistas
          </span>
        </div>
      </div>

      {/* Barra de Progresso de XP */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-extrabold">
          <span className="text-muted-foreground uppercase">Progresso do Nível {currentLevel.level}</span>
          <span className="text-foreground">{xpInCurrentLevel} / {levelRange} XP ({levelPct}%)</span>
        </div>
        <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/40">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
            style={{ width: `${levelPct}%` }}
          />
        </div>
      </div>

      {/* Grid de Medalhas / Badges */}
      <div className="pt-2">
        <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-2.5">
          Insígnias & Conquistas Desbloqueáveis
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={cn(
                  "p-3 rounded-2xl border flex flex-col items-center text-center space-y-1.5 transition-all duration-200",
                  badge.unlocked
                    ? `${badge.color} shadow-sm scale-[1.02]`
                    : "bg-muted/20 border-border/40 text-muted-foreground opacity-50 grayscale"
                )}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-background/80 shadow-xs">
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-xs font-extrabold block leading-tight">{badge.title}</span>
                  <span className="text-[9px] font-medium leading-tight block mt-0.5 opacity-90">
                    {badge.description}
                  </span>
                </div>
                {badge.unlocked && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 pt-0.5">
                    ✨ Desbloqueado!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
