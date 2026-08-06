import { useState, useEffect } from "react";
import type { Habit, HabitFrequency } from "@/lib/supabase";
import { X, Save, Repeat, Sparkles } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (habit: { id?: string; name: string; frequency: HabitFrequency; targetPerWeek: number }) => void;
  editingHabit?: Habit | null;
}

export function HabitModal({ open, onClose, onSave, editingHabit }: HabitModalProps) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetPerWeek, setTargetPerWeek] = useState(7);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name || "");
      setFrequency(editingHabit.frequency || "daily");
      setTargetPerWeek(editingHabit.targetPerWeek || 7);
    } else {
      setName("");
      setFrequency("daily");
      setTargetPerWeek(7);
    }
  }, [editingHabit, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: editingHabit?.id,
      name: name.trim(),
      frequency,
      targetPerWeek: frequency === "daily" ? 7 : targetPerWeek,
    });
  };

  return (
    <ModalPortal open={open} onClose={onClose}>
      <div className="bg-card w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[95vh] slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
              <Repeat size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {editingHabit ? "Editar Hábito" : "Novo Hábito"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Nome do Hábito
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treinar 45 min, Meditar, Ler 20 pág..."
              className="input-ios font-bold text-base"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Frequência
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setFrequency("daily"); setTargetPerWeek(7); }}
                className={`p-3.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  frequency === "daily"
                    ? "border-[#FCA311] bg-[#FCA311]/10 text-foreground"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Repeat size={15} />
                <span>Todos os dias</span>
              </button>

              <button
                type="button"
                onClick={() => { setFrequency("weekly"); setTargetPerWeek(3); }}
                className={`p-3.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  frequency === "weekly"
                    ? "border-[#FCA311] bg-[#FCA311]/10 text-foreground"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Sparkles size={15} />
                <span>Semanal (Meta)</span>
              </button>
            </div>
          </div>

          {frequency === "weekly" && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
                Dias por semana
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetPerWeek(num)}
                    className={`flex-1 py-3 rounded-xl border-2 font-black text-sm transition-all ${
                      targetPerWeek === num
                        ? "border-[#FCA311] bg-[#FCA311] text-black shadow-md shadow-[#FCA311]/30"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-ios w-full py-4 mt-2 text-sm font-black uppercase tracking-wider"
          >
            <Save size={18} />
            <span>{editingHabit ? "Salvar Alterações" : "Criar Hábito"}</span>
          </button>
        </form>
      </div>
    </ModalPortal>
  );
}
