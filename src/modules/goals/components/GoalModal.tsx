import { useState, useEffect } from "react";
import type { Goal, GoalScope, Habit } from "@/db/schema";
import { X, Save, Target, Repeat, Calendar } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (goalData: {
    id?: string;
    title: string;
    scope: GoalScope;
    period: string;
    target: number;
    unit: string;
    progress: number;
    linkedHabitId?: string | null;
  }) => void;
  habits: Habit[];
  editingGoal?: Goal | null;
}

export function GoalModal({
  open,
  onClose,
  onSave,
  habits,
  editingGoal,
}: GoalModalProps) {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<GoalScope>("year");
  const [period, setPeriod] = useState("");
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState("%");
  const [progress, setProgress] = useState(0);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title || "");
      setScope(editingGoal.scope || "year");
      setPeriod(editingGoal.period || `${currentYear}`);
      setTarget(editingGoal.target || 100);
      setUnit(editingGoal.unit || "%");
      setProgress(editingGoal.progress || 0);
      setLinkedHabitId(editingGoal.linkedHabitId || null);
    } else {
      setTitle("");
      setScope("year");
      setPeriod(`${currentYear}`);
      setTarget(100);
      setUnit("%");
      setProgress(0);
      setLinkedHabitId(null);
    }
  }, [editingGoal, open, currentYear]);

  if (!open) return null;

  const habitOptions = [
    { value: "", label: "Nenhum Hábito Vinculado" },
    ...habits.map((h) => ({ value: h.id, label: h.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingGoal?.id,
      title: title.trim(),
      scope,
      period: period.trim() || `${currentYear}`,
      target: Number(target) || 100,
      unit: unit.trim() || "%",
      progress: Number(progress) || 0,
      linkedHabitId: linkedHabitId || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
      <div className="bg-card w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh] slide-up">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Target size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {editingGoal ? "Editar Meta" : "Nova Meta"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Título */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Título da Meta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ler 12 livros, Juntar R$ 10.000, Correr 10km..."
              className="input-ios font-bold text-base"
              required
              autoFocus
            />
          </div>

          {/* Escopo (Ano / Trimestre / Mês) */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Escopo Temporal
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setScope("year"); setPeriod(`${currentYear}`); }}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  scope === "year"
                    ? "border-[#FCA311] bg-[#FCA311]/15 text-[#FCA311] font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                Anual
              </button>

              <button
                type="button"
                onClick={() => { setScope("quarter"); setPeriod(`${currentYear}-Q1`); }}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  scope === "quarter"
                    ? "border-[#FCA311] bg-[#FCA311]/15 text-[#FCA311] font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                Trimestral
              </button>

              <button
                type="button"
                onClick={() => { setScope("month"); setPeriod(`${currentYear}-08`); }}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  scope === "month"
                    ? "border-[#FCA311] bg-[#FCA311]/15 text-[#FCA311] font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                Mensal
              </button>
            </div>
          </div>

          {/* Período Texto */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 ml-1">
              <Calendar size={13} className="text-blue-500" />
              Identificador do Período
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ex: 2026, 2026-Q1, 2026-08..."
              className="input-ios font-semibold text-sm"
              required
            />
          </div>

          {/* Grid de Meta Numérica & Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
                Meta Alvo (Número)
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="input-ios font-bold text-base"
                required
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
                Unidade
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: %, livros, kg, R$"
                className="input-ios font-semibold text-sm"
              />
            </div>
          </div>

          {/* Progresso Inicial / Atual */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Progresso Atual ({progress} / {target})
            </label>
            <input
              type="number"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="input-ios font-semibold text-sm"
              min={0}
              max={target}
            />
          </div>

          {/* Vínculo com Hábito (CustomSelect) */}
          {habits.length > 0 && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 ml-1">
                <Repeat size={13} className="text-[#FCA311]" />
                Vincular a um Hábito (Opcional)
              </label>
              <CustomSelect
                options={habitOptions}
                value={linkedHabitId || ""}
                onChange={(val) => setLinkedHabitId(val || null)}
                placeholder="Selecione um Hábito..."
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-ios w-full py-4 mt-3 text-sm font-black uppercase tracking-wider"
          >
            <Save size={18} />
            <span>{editingGoal ? "Salvar Alterações" : "Criar Meta"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
