import { useState, useEffect } from "react";
import { X, Save, Clock, Scale, Plus, Moon, Droplets, Dumbbell, Sparkles } from "lucide-react";
import { todayIso } from "@/lib/date";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface MetricLoggerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (metricData: { key: string; value: number; unit: string; date: string }) => void;
  defaultKey?: string;
}

const PRESETS = [
  { key: "weight", label: "Peso", unit: "kg", icon: Scale, color: "text-[#FCA311] border-[#FCA311] bg-[#FCA311]/15" },
  { key: "study_hours", label: "Estudo", unit: "h", icon: Clock, color: "text-indigo-500 border-indigo-500 bg-indigo-500/15" },
  { key: "sleep_hours", label: "Sono", unit: "h", icon: Moon, color: "text-purple-500 border-purple-500 bg-purple-500/15" },
  { key: "water_liters", label: "Água", unit: "L", icon: Droplets, color: "text-blue-500 border-blue-500 bg-blue-500/15" },
  { key: "workout_mins", label: "Treino", unit: "min", icon: Dumbbell, color: "text-emerald-500 border-emerald-500 bg-emerald-500/15" },
  { key: "custom", label: "Outro", unit: "un", icon: Sparkles, color: "text-rose-500 border-rose-500 bg-rose-500/15" },
];

export function MetricLoggerModal({
  open,
  onClose,
  onSave,
  defaultKey = "weight",
}: MetricLoggerModalProps) {
  const [selectedKey, setSelectedKey] = useState(defaultKey);
  const [customKey, setCustomKey] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayIso());

  useEffect(() => {
    setSelectedKey(defaultKey);
  }, [defaultKey, open]);

  if (!open) return null;

  const activePreset = PRESETS.find((p) => p.key === selectedKey) || PRESETS[5];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value.replace(",", "."));
    if (isNaN(numValue) || numValue <= 0) return;

    let finalKey = selectedKey;
    let finalUnit = activePreset.unit;

    if (selectedKey === "custom") {
      if (!customKey.trim()) return;
      finalKey = customKey.trim().toLowerCase().replace(/\s+/g, "_");
      finalUnit = customUnit.trim() || "un";
    }

    onSave({ key: finalKey, value: numValue, unit: finalUnit, date });
    setValue("");
    setCustomKey("");
    setCustomUnit("");
  };

  return (
    <ModalPortal open={open} onClose={onClose}>
      <div className="bg-card w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col slide-up max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center">
              <Plus size={18} />
            </div>
            <h2 className="text-base font-extrabold text-foreground tracking-tight">Registrar Métrica</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Métrica */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Métrica
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedKey === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSelectedKey(preset.key)}
                    className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? preset.color + " font-extrabold shadow-sm"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Custom se 'custom' for selecionado */}
          {selectedKey === "custom" && (
            <div className="grid grid-cols-2 gap-3 fade-in">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Nome da Métrica
                </label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Ex: Leitura, Passos..."
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Unidade (Ex: pág, km)
                </label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Ex: pág, km, pts"
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>
            </div>
          )}

          {/* Valor Numérico */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Valor ({selectedKey === "custom" ? customUnit || "unidade" : activePreset.unit})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ""))}
              placeholder="Ex: 75.5"
              className="input-ios font-extrabold text-lg"
              required
              autoFocus
            />
          </div>

          {/* Custom Date Picker */}
          <CustomDatePicker
            label="Data da Medição"
            value={date}
            onChange={setDate}
          />

          <button type="submit" className="btn-ios w-full py-3.5 mt-2 text-xs font-black uppercase tracking-wider">
            <Save size={16} />
            <span>Salvar Medição</span>
          </button>
        </form>
      </div>
    </ModalPortal>
  );
}
