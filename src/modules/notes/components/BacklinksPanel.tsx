import type { Note } from "@/lib/supabase";
import { Link2, Sparkles, FileText, ArrowRight } from "lucide-react";

interface BacklinksPanelProps {
  currentNote: Note | null;
  allNotes: Note[];
  onSelectNote: (noteId: string) => void;
}

export function BacklinksPanel({ currentNote, allNotes, onSelectNote }: BacklinksPanelProps) {
  if (!currentNote) return null;

  // Procura notas que mencionam o título da nota atual em formato [[Título]]
  const title = currentNote.title.toLowerCase();

  const backlinks = allNotes.filter((n) => {
    if (n.id === currentNote.id) return false;
    if (!n.content) return false;
    return n.content.toLowerCase().includes(`[[${title}]]`) || n.content.toLowerCase().includes(title);
  });

  // Notas vinculadas que esta nota menciona
  const outgoingLinks = allNotes.filter((n) => {
    if (n.id === currentNote.id) return false;
    if (!currentNote.content) return false;
    return currentNote.content.toLowerCase().includes(`[[${n.title.toLowerCase()}]]`);
  });

  return (
    <div className="glass-card p-5 space-y-4 border-border select-none">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Link2 size={16} className="text-foreground" />
        <h4 className="text-xs font-extrabold text-foreground tracking-tight uppercase">Conexões & Backlinks</h4>
      </div>

      {/* Outgoing Links */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
          Notas Citadas nesta Página ({outgoingLinks.length})
        </span>

        {outgoingLinks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Nenhuma citação encontrada nesta nota.</p>
        ) : (
          <div className="space-y-1">
            {outgoingLinks.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="w-full text-left p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 text-xs font-semibold text-foreground flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={13} className="text-foreground shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
                <ArrowRight size={13} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backlinks */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
          Notas que Citam Esta Página ({backlinks.length})
        </span>

        {backlinks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Nenhuma outra nota cita esta página ainda.</p>
        ) : (
          <div className="space-y-1">
            {backlinks.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="w-full text-left p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 text-xs font-semibold text-foreground flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={13} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
                <ArrowRight size={13} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
