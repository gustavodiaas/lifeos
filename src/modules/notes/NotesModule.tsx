import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { useMetrics } from "@/hooks/useMetrics";
import type { Note, Folder } from "@/lib/supabase";
import { FocusTimer } from "./components/FocusTimer";
import { StudyHeatmap } from "./components/StudyHeatmap";
import { BookTracker } from "./components/BookTracker";
import { FolderSidebar } from "./components/FolderSidebar";
import { NoteEditor } from "./components/NoteEditor";
import { BacklinksPanel } from "./components/BacklinksPanel";
import { FolderModal } from "./components/FolderModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "sonner";

export function NotesModule() {
  const { user } = useAuthContext();
  const {
    notes,
    folders,
    loading,
    addNote,
    updateNote,
    removeNote,
    addFolder,
  } = useNotes(user?.id);
  const { metrics, refetch: refetchMetrics } = useMetrics(user?.id);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const activeNotes = useMemo(() => notes.filter((n) => !n.deletedAt && !n.deleted_at), [notes]);

  // Nota Selecionada Atual
  const selectedNote = useMemo(() => {
    if (selectedNoteId) {
      const found = activeNotes.find((n) => n.id === selectedNoteId);
      if (found) return found;
    }
    return activeNotes[0] || null;
  }, [activeNotes, selectedNoteId]);

  // Notas Filtradas
  const filteredNotes = useMemo(() => {
    return activeNotes.filter((n) => {
      if (
        searchQuery &&
        !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }
      if (selectedFolderId !== null && (n.folderId || n.folder_id) !== selectedFolderId) return false;
      return true;
    });
  }, [activeNotes, searchQuery, selectedFolderId]);

  // Criar Nova Nota
  const handleCreateNote = async (folderId?: string | null) => {
    try {
      const newNote = await addNote({
        title: "Nova Nota de Estudo",
        content: "# Nova Nota\n\nComece a escrever seus estudos em Markdown aqui...",
        folderId: folderId || selectedFolderId || null,
        tags: ["estudos"],
      });

      if (newNote) {
        toast.success("Nova nota criada!");
        setSelectedNoteId(newNote.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar nota.");
    }
  };

  // Salvar Alterações da Nota
  const handleSaveNote = async (updated: Partial<Note>) => {
    if (!updated.id) return;
    try {
      const ok = await updateNote(updated.id, updated);
      if (ok) toast.success("Nota salva com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar nota.");
    }
  };

  // Excluir Nota
  const confirmDeleteNote = async () => {
    if (!deleteConfig.id) return;
    try {
      const ok = await removeNote(deleteConfig.id);
      if (ok) {
        toast.success("Nota excluída.");
        setSelectedNoteId(null);
      }
      setDeleteConfig({ open: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir nota.");
    }
  };

  // Criar Nova Pasta
  const handleCreateFolder = async (folderName: string) => {
    try {
      const newFolder = await addFolder({ name: folderName });
      if (newFolder) {
        toast.success(`Pasta "${folderName}" criada!`);
        setFolderModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar pasta.");
    }
  };

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header: Relógio de Foco Pomodoro ─────────────────────── */}
      <FocusTimer
        onSessionComplete={() => {
          refetchMetrics();
        }}
      />

      {/* ── 2. Heatmap Anual de Horas de Estudo ─────────────────────────── */}
      <StudyHeatmap metrics={metrics} />

      {/* ── 2.5 Gerenciador de Leituras & Livros ────────────────────────── */}
      <BookTracker />

      {/* ── 3. Hub Principal de Conhecimento (Sidebar + Editor + Backlinks) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">

        {/* Coluna 1: Sidebar de Pastas & Notas (3 Colunas) */}
        <div className="lg:col-span-3">
          <FolderSidebar
            notes={filteredNotes}
            folders={folders}
            selectedNoteId={selectedNoteId}
            selectedFolderId={selectedFolderId}
            onSelectNote={setSelectedNoteId}
            onSelectFolder={setSelectedFolderId}
            onCreateNote={handleCreateNote}
            onCreateFolder={() => setFolderModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Coluna 2: Editor Notion/Obsidian Style (6 Colunas) */}
        <div className="lg:col-span-6">
          <NoteEditor
            note={selectedNote}
            folders={folders}
            onSave={handleSaveNote}
            onDelete={(id) => setDeleteConfig({ open: true, id })}
          />
        </div>

        {/* Coluna 3: Painel de Conexões & Backlinks (3 Colunas) */}
        <div className="lg:col-span-3">
          <BacklinksPanel
            currentNote={selectedNote}
            allNotes={notes}
            onSelectNote={setSelectedNoteId}
          />
        </div>

      </div>

      {/* Modal de Criar Pasta */}
      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSave={handleCreateFolder}
      />

      {/* Modal de Alerta para Exclusão */}
      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDeleteNote}
        title="Excluir Nota?"
        message="Essa ação irá apagar a nota de estudo permanentemente."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
