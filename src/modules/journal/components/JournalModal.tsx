import { useState, useEffect } from "react";
import type { JournalEntry } from "@/lib/supabase";
import { X, Save, NotebookPen, Sparkles, Plus } from "lucide-react";
import { todayIso } from "@/lib/date";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";

interface JournalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entryData: {
    id?: string;
    date: string;
    mood: 1 | 2 | 3 | 4 | 5;
    content: string;
    highlights: string[];
  }) => void;
  editingEntry?: JournalEntry | null;
  defaultDate?: string;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: "😭", label: "Péssimo" },
  { value: 2, emoji: "🙁", label: "Difícil" },
  { value: 3, emoji: "😐", label: "Neutro" },
  { value: 4, emoji: "🙂", label: "Bom" },
  { value: 5, emoji: "🤩", label: "Excelente" },
] as const;

export function JournalModal({
  open,
  onClose,
  onSave,
  editingEntry,
  defaultDate,
}: JournalModalProps) {
  const [date, setDate] = useState(defaultDate || todayIso());
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [content, setContent] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlightText, setNewHighlightText] = useState("");

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || defaultDate || todayIso());
      setMood((editingEntry.mood as any) || 4);
      setContent(editingEntry.content || "");
      setHighlights(editingEntry.highlights || []);
    } else {
      setDate(defaultDate || todayIso());
      setMood(4);
      setContent("");
      setHighlights([]);
    }
    setNewHighlightText("");
  }, [editingEntry, defaultDate, open]);

  if (!open) return null;

  const handleAddHighlight = () => {
    if (!newHighlightText.trim()) return;
    setHighlights([...highlights, newHighlightText.trim()]);
    setNewHighlightText("");
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingEntry?.id,
      date,
      mood,
      content: content.trim(),
      highlights,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
      <div className="bg-card w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh] slide-up">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center">
              <NotebookPen size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {editingEntry ? "Editar Registro do Diário" : "Novo Registro Diário"}
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
          {/* Custom Date Picker */}
          <CustomDatePicker
            label="Data da Reflexão"
            value={date}
            onChange={setDate}
          />

          {/* Seleção de Humor (Mood Tracker) */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Como se sentiu neste dia? (Humor)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((item) => {
                const isSelected = mood === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMood(item.value as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ios-spring ${
                      isSelected
                        ? "border-[#FCA311] bg-[#FCA311]/15 scale-105 shadow-sm"
                        : "border-border/50 bg-muted/30 hover:bg-muted opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className={`text-[10px] font-bold mt-1 ${isSelected ? "text-[#FCA311]" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflexão / Texto do Diário */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Reflexão Diária
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sobre o seu dia, pensamentos, aprendizados ou sentimentos..."
              rows={5}
              className="input-ios text-sm font-medium leading-relaxed"
            />
          </div>

          {/* Destaques / Highlights do Dia */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1 flex items-center gap-1">
              <Sparkles size={13} className="text-[#FCA311]" />
              Destaques & Conquistas (Highlights)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHighlightText}
                onChange={(e) => setNewHighlightText(e.target.value)}
                placeholder="Ex: Treino concluído, Reunião produtiva..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
                className="input-ios py-2 text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleAddHighlight}
                className="p-2.5 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs shrink-0 flex items-center gap-1 border border-border/60"
              >
                <Plus size={16} />
              </button>
            </div>

            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {highlights.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 text-[#FCA311] border border-amber-500/20"
                  >
                    <span>✨ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(idx)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-ios w-full py-4 mt-3 text-sm font-black uppercase tracking-wider"
          >
            <Save size={18} />
            <span>{editingEntry ? "Salvar Alterações" : "Salvar Registro"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
