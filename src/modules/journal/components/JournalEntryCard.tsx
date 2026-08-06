import type { JournalEntry } from "@/lib/supabase";
import { Calendar, Smile, Edit3, Trash2, Sparkles, Quote } from "lucide-react";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

const MOOD_CONFIG = {
  1: { emoji: "😭", label: "Péssimo", color: "bg-red-500/15 text-red-500 border-red-500/30" },
  2: { emoji: "🙁", label: "Difícil", color: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
  3: { emoji: "😐", label: "Neutro", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  4: { emoji: "🙂", label: "Bom", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  5: { emoji: "🤩", label: "Excelente", color: "bg-amber-500/15 text-[#FCA311] border-amber-500/30" },
};

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const moodInfo = MOOD_CONFIG[entry.mood || 3];

  const dateFormatted = (() => {
    try {
      const d = new Date(entry.date + "T00:00:00");
      return d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return entry.date;
    }
  })();

  return (
    <div className="glass-card p-6 flex flex-col justify-between space-y-4 relative group transition-all duration-300">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl border ${moodInfo.color}`}>
            {moodInfo.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${moodInfo.color}`}>
                Humor: {moodInfo.label}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground capitalize mt-0.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#FCA311]" />
              <span>{dateFormatted}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Editar registro"
          >
            <Edit3 size={15} className="text-[#FCA311]" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-xl bg-muted/60 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            title="Excluir registro"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Conteúdo da Reflexão ──────────────────────────────────── */}
      {entry.content ? (
        <div className="relative">
          <Quote size={16} className="text-[#FCA311]/30 absolute -top-1 -left-1 pointer-events-none" />
          <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed pl-5 whitespace-pre-wrap">
            {entry.content}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic pl-5">Sem anotações de reflexão para este dia.</p>
      )}

      {/* ── Destaques / Highlights ────────────────────────────────── */}
      {entry.highlights && entry.highlights.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-[#FCA311]" />
            Destaques do Dia
          </span>
          <div className="flex flex-wrap gap-1.5">
            {entry.highlights.map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 text-[#FCA311] border border-amber-500/20"
              >
                ✨ {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
