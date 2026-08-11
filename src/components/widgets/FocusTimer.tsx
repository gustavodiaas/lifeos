import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, CheckCircle2, Flame, Award } from "lucide-react";
import type { Task } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface FocusTimerProps {
  tasks?: Task[];
  onFocusComplete?: (minutes: number, taskTitle?: string) => void;
}

type Mode = "focus" | "shortBreak" | "longBreak";

const MODE_CONFIG: Record<Mode, { label: string; durationMins: number; color: string }> = {
  focus: { label: "Sessão de Foco", durationMins: 25, color: "text-foreground bg-foreground/10 border-foreground/30" },
  shortBreak: { label: "Pausa Curta", durationMins: 5, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  longBreak: { label: "Pausa Longa", durationMins: 15, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
};

export function FocusTimer({ tasks = [], onFocusComplete }: FocusTimerProps) {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentConfig = MODE_CONFIG[mode];
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Alternar tempo quando mode muda
  useEffect(() => {
    setTimeLeft(MODE_CONFIG[mode].durationMins * 60);
    setIsRunning(false);
  }, [mode]);

  // Contagem regressiva
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerFinished();
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

  const handleTimerFinished = () => {
    setIsRunning(false);
    if (mode === "focus") {
      setCompletedSessions((prev) => prev + 1);
      toast.success("🏆 Sessão de Foco Concluída! Parabéns pela disciplina!");

      if (onFocusComplete) {
        onFocusComplete(25, selectedTask?.title);
      }

      // Sugerir pausa longa a cada 4 sessões
      if ((completedSessions + 1) % 4 === 0) {
        setMode("longBreak");
      } else {
        setMode("shortBreak");
      }
    } else {
      toast.info("Pausa finalizada. Hora de focar novamente!");
      setMode("focus");
    }
  };

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(currentConfig.durationMins * 60);
  };

  const skipTimer = () => {
    setIsRunning(false);
    if (mode === "focus") setMode("shortBreak");
    else setMode("focus");
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalDurationSeconds = currentConfig.durationMins * 60;
  const progressPct = Math.round(((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100);

  return (
    <div className="glass-card p-5 space-y-4 rounded-3xl border border-border/70 shadow-lg select-none">
      {/* Header com modos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center font-black">
            <Timer size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">Timer de Foco & Deep Work</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Técnica Pomodoro para produtividade máxima</p>
          </div>
        </div>

        {/* Pilulas de Modo */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => setMode("focus")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              mode === "focus" ? "bg-foreground text-background font-extrabold shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Foco (25m)
          </button>
          <button
            type="button"
            onClick={() => setMode("shortBreak")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              mode === "shortBreak" ? "bg-emerald-500 text-white font-extrabold shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pausa (5m)
          </button>
          <button
            type="button"
            onClick={() => setMode("longBreak")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              mode === "longBreak" ? "bg-blue-500 text-white font-extrabold shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Longa (15m)
          </button>
        </div>
      </div>

      {/* Main Display do Timer */}
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <div className="relative flex flex-col items-center justify-center">
          <span className="text-6xl sm:text-7xl font-black text-foreground tracking-tighter font-mono leading-none">
            {timeFormatted}
          </span>
          <span className={cn("text-xs font-black px-3 py-0.5 rounded-full border mt-3 uppercase tracking-wider", currentConfig.color)}>
            {currentConfig.label}
          </span>
        </div>

        {/* Barra de Progresso Circular/Linear */}
        <div className="w-full max-w-md h-2 bg-muted/60 rounded-full overflow-hidden border border-border/40">
          <div
            className="h-full bg-foreground transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Seletor de Tarefa Vinculada & Controles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-border/50">
        {/* Vincular Tarefa */}
        {tasks.length > 0 ? (
          <div className="w-full sm:w-64">
            <CustomSelect
              value={selectedTaskId || ""}
              onChange={(val) => setSelectedTaskId(val || null)}
              options={[
                { value: "", label: "Vincular a uma tarefa..." },
                ...tasks.filter((t) => t.status !== "done").map((t) => ({
                  value: t.id,
                  label: `📌 ${t.title}`,
                })),
              ]}
              placeholder="Vincular a uma tarefa..."
              className="text-xs font-bold"
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-semibold">
            Sessões concluídas hoje: <span className="font-extrabold text-foreground">{completedSessions} 🏆</span>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reiniciar"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={toggleRun}
            className="btn-ios text-xs py-2.5 px-6 flex items-center justify-center gap-2 min-w-[120px]"
          >
            {isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            <span>{isRunning ? "Pausar" : "Iniciar Foco"}</span>
          </button>

          <button
            type="button"
            onClick={skipTimer}
            className="p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Pular Etapa"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
