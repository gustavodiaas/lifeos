import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Sparkles, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { useMetrics } from "@/hooks/useMetrics";
import { todayIso } from "@/lib/date";

interface FocusTimerProps {
  onSessionComplete?: (hours: number) => void;
}

type Mode = "focus" | "shortBreak" | "longBreak";

const MODE_CONFIG = {
  focus: { label: "Foco Total", duration: 25 * 60, color: "text-foreground", bg: "bg-muted" },
  shortBreak: { label: "Pausa Curta", duration: 5 * 60, color: "text-emerald-500", bg: "bg-emerald-500/15" },
  longBreak: { label: "Pausa Longa", duration: 15 * 60, color: "text-muted-foreground", bg: "bg-muted" },
};

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  const { user } = useAuthContext();
  const { addMetric } = useMetrics(user?.id);

  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito do Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleFinishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Troca de Modo
  const handleModeChange = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].duration);
  };

  // Quando a sessão de foco termina
  const handleFinishSession = async () => {
    if (mode === "focus") {
      setCompletedSessions((s) => s + 1);
      const hoursLogged = 25 / 60; // 0.42h

      try {
        const today = todayIso();
        await addMetric({
          key: "study_hours",
          value: parseFloat(hoursLogged.toFixed(2)),
          unit: "h",
          date: today,
        });

        toast.success("🧠 Sessão de Foco concluída! 25 min gravados no seu histórico de estudos!");
        if (onSessionComplete) onSessionComplete(hoursLogged);
      } catch (err) {
        console.error("Erro ao gravar horas de estudo:", err);
      }
    } else {
      toast.info("Pausa concluída! Pronto para retomar o foco?");
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIG[mode].duration);
  };

  // Formatação MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Cálculo de progresso do anel (0 a 100)
  const totalDuration = MODE_CONFIG[mode].duration;
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-6 border-border relative overflow-hidden bg-gradient-to-r from-muted/50 via-transparent to-transparent">
      
      {/* Informações da Sessão */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${MODE_CONFIG[mode].bg} ${MODE_CONFIG[mode].color}`}>
          <Clock size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Relógio de Foco (Pomodoro)</span>
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {completedSessions} sessões hoje
            </span>
          </div>
          <h3 className="text-lg font-black text-foreground tracking-tight mt-0.5">
            {MODE_CONFIG[mode].label}
          </h3>
        </div>
      </div>

      {/* Seletor de Modo */}
      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50">
        {(Object.keys(MODE_CONFIG) as Mode[]).map((mKey) => (
          <button
            key={mKey}
            type="button"
            onClick={() => handleModeChange(mKey)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === mKey
                ? `${MODE_CONFIG[mKey].bg} ${MODE_CONFIG[mKey].color} shadow-sm font-black`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {MODE_CONFIG[mKey].label}
          </button>
        ))}
      </div>

      {/* Cronômetro Digital + Play/Pause */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <span className="text-3xl md:text-4xl font-black text-foreground font-mono tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="w-12 h-12 rounded-2xl bg-foreground hover:bg-[currentColor] text-black shadow-md shadow-black/20 flex items-center justify-center transition-all active:scale-95"
            title={isRunning ? "Pausar" : "Iniciar Foco"}
          >
            {isRunning ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-10 h-10 rounded-xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors border border-border/50"
            title="Reiniciar"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
