import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { useMetrics } from "@/hooks/useMetrics";
import type { Note } from "@/lib/supabase";
import { FocusTimer } from "./components/FocusTimer";
import { StudyHeatmap } from "./components/StudyHeatmap";
import { BookTracker } from "./components/BookTracker";
import { FolderSidebar } from "./components/FolderSidebar";
import { NoteEditor } from "./components/NoteEditor";
import { BacklinksPanel } from "./components/BacklinksPanel";
import { FolderModal } from "./components/FolderModal";
import { AtomicNotesView } from "./components/AtomicNotesView";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "@/lib/toast";
import { BookOpen, Atom } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "conhecimento" | "atomicas";

import { useWorkspace } from "@/context/WorkspaceContext";

export function NotesModule() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const {
    notes, folders, loading,
    addNote, updateNote, removeNote, addFolder,
  } = useNotes(activeUserId);
  const { metrics, refetch: refetchMetrics } = useMetrics(activeUserId);

  const [tab, setTab]                     = useState<Tab>("conhecimento");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig]   = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const activeNotes = useMemo(() => notes.filter((n) => !n.deletedAt && !n.deleted_at), [notes]);

  const selectedNote = useMemo(() => {
    if (selectedNoteId) {
      const found = activeNotes.find((n) => n.id === selectedNoteId);
      if (found) return found;
    }
    return activeNotes[0] || null;
  }, [activeNotes, selectedNoteId]);

  const filteredNotes = useMemo(() => activeNotes.filter((n) => {
    if (searchQuery &&
      !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
      return false;
    if (selectedFolderId !== null && (n.folderId || n.folder_id) !== selectedFolderId) return false;
    return true;
  }), [activeNotes, searchQuery, selectedFolderId]);

  // Notas atômicas = notas que têm tag "maturity:*"
  const atomicNotes = useMemo(
    () => activeNotes.filter((n) => n.tags?.some((t) => t.startsWith("maturity:"))),
    [activeNotes]
  );

  const handleCreateNote = async (overrides?: { title?: string; content?: string; tags?: string[] }) => {
    try {
      const newNote = await addNote({
        title:    overrides?.title   ?? "Nova Nota de Estudo",
        content:  overrides?.content ?? "# Nova Nota\n\nComece a escrever...",
        folderId: selectedFolderId || null,
        tags:     overrides?.tags   ?? ["estudos"],
      });
      if (newNote) {
        toast.success("Nova nota criada!");
        setSelectedNoteId(newNote.id);
        return newNote;
      }
      return null;
    } catch {
      toast.error("Erro ao criar nota.");
      return null;
    }
  };

  const handleSaveNote = async (updated: Partial<Note>) => {
    if (!updated.id) return;
    try {
      await updateNote(updated.id, updated);
    } catch {
      toast.error("Erro ao salvar nota.");
    }
  };

  const confirmDeleteNote = async () => {
    if (!deleteConfig.id) return;
    try {
      await removeNote(deleteConfig.id);
      toast.success("Nota excluída.");
      setSelectedNoteId(null);
    } catch {
      toast.error("Erro ao excluir nota.");
    } finally {
      setDeleteConfig({ open: false, id: null });
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await addFolder({ name });
      toast.success(`Pasta "${name}" criada!`);
      setFolderModalOpen(false);
    } catch {
      toast.error("Erro ao criar pasta.");
    }
  };

  const TABS: { id: Tab; label: string; Icon: React.FC<any>; count?: number }[] = [
    { id: "conhecimento", label: "Conhecimento", Icon: BookOpen, count: activeNotes.length },
    { id: "atomicas",     label: "Atômicas",     Icon: Atom,     count: atomicNotes.length },
  ];

  return (
    <div className="space-y-5 fade-in pb-12 px-4 md:px-6 py-4">

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-2xl border border-border w-fit">
        {TABS.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={13} />
            <span>{label}</span>
            {count !== undefined && (
              <span className={cn(
                "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
                tab === id ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground"
              )}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Aba: Conhecimento ─────────────────────────────────────────── */}
      {tab === "conhecimento" && (
        <>
          <FocusTimer onSessionComplete={refetchMetrics} />
          <StudyHeatmap metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
            <div className="lg:col-span-3">
              <FolderSidebar
                notes={filteredNotes}
                folders={folders}
                selectedNoteId={selectedNoteId}
                selectedFolderId={selectedFolderId}
                onSelectNote={setSelectedNoteId}
                onSelectFolder={setSelectedFolderId}
                onCreateNote={() => handleCreateNote()}
                onCreateFolder={() => setFolderModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <div className="lg:col-span-6">
              <NoteEditor
                note={selectedNote}
                folders={folders}
                onSave={handleSaveNote}
                onDelete={(id) => setDeleteConfig({ open: true, id })}
              />
            </div>
            <div className="lg:col-span-3">
              <BacklinksPanel
                currentNote={selectedNote}
                allNotes={notes}
                onSelectNote={setSelectedNoteId}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Aba: Atômicas ────────────────────────────────────────────── */}
      {tab === "atomicas" && (
        <AtomicNotesView
          notes={atomicNotes}
          onSave={handleSaveNote}
          onDelete={(id) => setDeleteConfig({ open: true, id })}
          onCreateNote={handleCreateNote}
        />
      )}

      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSave={handleCreateFolder}
      />

      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDeleteNote}
        title="Excluir Nota?"
        message="Essa ação irá apagar a nota permanentemente."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
