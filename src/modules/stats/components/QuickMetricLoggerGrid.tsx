import { Scale, Clock, Moon, Droplets, Dumbbell, Sparkles, Plus } from "lucide-react";

interface QuickMetricLoggerGridProps {
  onOpenLogger: (key: string) => void;
  onQuickAdd: (key: string, value: number, unit: string) => void;
}

const PRESETS = [
  { key: "weight", label: "Peso", unit: "kg", icon: Scale, quickVal: null, color: "hover:border-foreground" },
  { key: "study_hours", label: "Estudo", unit: "h", icon: Clock, quickVal: 1, color: "hover:border-foreground" },
  { key: "sleep_hours", label: "Sono", unit: "h", icon: Moon, quickVal: 8, color: "hover:border-foreground" },
  { key: "water_liters", label: "Água", unit: "L", icon: Droplets, quickVal: 0.5, color: "hover:border-blue-500" },
  { key: "workout_mins", label: "Treino", unit: "min", icon: Dumbbell, quickVal: 30, color: "hover:border-emerald-500" },
  { key: "custom", label: "Outro", unit: "un", icon: Sparkles, quickVal: null, color: "hover:border-rose-500" },
];

export function QuickMetricLoggerGrid({ onOpenLogger, onQuickAdd }: QuickMetricLoggerGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
          Registrar Métrica Rápida
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground">Clique para abrir ou adicione com 1 clique</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <div
              key={preset.key}
              className={`glass-card p-3 rounded-2xl border border-border/70 flex flex-col justify-between space-y-2 transition-all duration-200 hover:scale-[1.02] shadow-sm ${preset.color}`}
            >
              <button
                type="button"
                onClick={() => onOpenLogger(preset.key)}
                className="flex flex-col items-center text-center space-y-1.5 w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 shadow-xs">
                  <Icon size={20} />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-foreground block">{preset.label}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">({preset.unit})</span>
                </div>
              </button>

              {preset.quickVal ? (
                <button
                  type="button"
                  onClick={() => onQuickAdd(preset.key, preset.quickVal!, preset.unit)}
                  className="w-full py-1 px-2 rounded-lg bg-foreground/10 hover:bg-foreground hover:text-background text-foreground text-[10px] font-black transition-all flex items-center justify-center gap-1 border border-foreground/20"
                >
                  <Plus size={11} />
                  <span>+{preset.quickVal}{preset.unit}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenLogger(preset.key)}
                  className="w-full py-1 px-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold transition-all text-center"
                >
                  Registrar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
