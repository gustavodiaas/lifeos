import { useState } from "react";
import type { Note, Folder } from "@/db/schema";
import {
  Folder as FolderIcon,
  FileText,
  Plus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Search,
  Hash,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderSidebarProps {
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  onSelectNote: (noteId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateNote: (folderId?: string | null) => void;
  onCreateFolder: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FolderSidebar({
  notes,
  folders,
  selectedNoteId,
  selectedFolderId,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  onCreateFolder,
  searchQuery,
  onSearchChange,
}: FolderSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Notas sem pasta (Raiz)
  const rootNotes = notes.filter((n) => !n.folderId);

  return (
    <div className="glass-card p-4 flex flex-col h-full space-y-4 border-border select-none">
      {/* ── Header da Sidebar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#FCA311]" />
          <h3 className="text-sm font-extrabold text-foreground tracking-tight">Conhecimento</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onCreateFolder}
            className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Nova Pasta"
          >
            <FolderPlus size={15} />
          </button>
          <button
            onClick={() => onCreateNote(selectedFolderId)}
            className="p-1.5 rounded-lg bg-[#FCA311] hover:bg-[#e8920a] text-black transition-colors"
            title="Nova Nota"
          >
            <Plus size={15} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ── Busca ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar notas..."
          className="input-ios pl-9 py-2 text-xs"
        />
      </div>

      {/* ── Diretório de Pastas e Notas ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-3 pt-1">

        {/* Botão "Todas as Notas" */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all",
            selectedFolderId === null && !selectedNoteId
              ? "bg-[#FCA311]/15 text-[#FCA311]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileText size={15} />
          <span>Todas as Notas ({notes.length})</span>
        </button>

        {/* Lista de Pastas */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest mb-1">
            Pastas ({folders.length})
          </p>

          {folders.map((folder) => {
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
            const isExpanded = expandedFolders[folder.id] ?? true;
            const isSelectedFolder = selectedFolderId === folder.id;

            return (
              <div key={folder.id} className="space-y-0.5">
                <div
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer group",
                    isSelectedFolder ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(folder.id);
                      }}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <FolderIcon size={15} className="text-[#FCA311] shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                    {folderNotes.length}
                  </span>
                </div>

                {/* Notas dentro da Pasta */}
                {isExpanded && (
                  <div className="pl-6 space-y-0.5 border-l-2 border-border/40 ml-4 py-0.5">
                    {folderNotes.map((note) => {
                      const isSelectedNote = selectedNoteId === note.id;
                      return (
                        <button
                          key={note.id}
                          onClick={() => onSelectNote(note.id)}
                          className={cn(
                            "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all truncate",
                            isSelectedNote
                              ? "bg-[#FCA311] text-black font-bold shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <FileText size={13} className="shrink-0" />
                          <span className="truncate">{note.title || "Nota Sem Título"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notas da Raiz (Sem Pasta) */}
        {rootNotes.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border/40">
            <p className="px-2 text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest mb-1">
              Notas Sem Pasta
            </p>

            {rootNotes.map((note) => {
              const isSelectedNote = selectedNoteId === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all truncate",
                    isSelectedNote
                      ? "bg-[#FCA311] text-black font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">{note.title || "Nota Sem Título"}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
