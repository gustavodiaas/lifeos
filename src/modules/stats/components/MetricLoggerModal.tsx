import { useState } from "react";
import { X, Save, Clock, Scale, Plus } from "lucide-react";
import { todayIso } from "@/lib/date";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";

interface MetricLoggerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (metricData: { key: string; value: number; unit: string; date: string }) => void;
  defaultKey?: string;
}

export function MetricLoggerModal({
  open,
  onClose,
  onSave,
  defaultKey = "weight",
}: MetricLoggerModalProps) {
  const [key, setKey] = useState(defaultKey);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayIso());

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value.replace(",", "."));
    if (isNaN(numValue) || numValue <= 0) return;

    const unit = key === "weight" ? "kg" : key === "study_hours" ? "h" : "pts";
    onSave({ key, value: numValue, unit, date });
    setValue("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
      <div className="bg-card w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col slide-up">

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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKey("weight")}
                className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  key === "weight"
                    ? "border-[#FCA311] bg-[#FCA311]/15 text-[#FCA311] font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Scale size={16} />
                <span>Peso (kg)</span>
              </button>

              <button
                type="button"
                onClick={() => setKey("study_hours")}
                className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  key === "study_hours"
                    ? "border-indigo-500 bg-indigo-500/15 text-indigo-500 font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Clock size={16} />
                <span>Estudo (h)</span>
              </button>
            </div>
          </div>

          {/* Valor Numérico */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Valor Numérico ({key === "weight" ? "kg" : "horas"})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ""))}
              placeholder={key === "weight" ? "Ex: 75.5" : "Ex: 2.5"}
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
    </div>
  );
}
