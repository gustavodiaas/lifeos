import { useState, useEffect, useMemo, useCallback } from "react";
import { db, newId, nowIso } from "@/db";
import type { Note, Folder, Metric } from "@/db/schema";
import { FocusTimer } from "./components/FocusTimer";
import { StudyHeatmap } from "./components/StudyHeatmap";
import { FolderSidebar } from "./components/FolderSidebar";
import { NoteEditor } from "./components/NoteEditor";
import { BacklinksPanel } from "./components/BacklinksPanel";
import { FolderModal } from "./components/FolderModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "sonner";

export function NotesModule() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Carrega notas, pastas e métricas de estudo do IndexedDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const d = db();
      const [allNotes, allFolders, allMetrics] = await Promise.all([
        d.notes.filter((n) => !n.deletedAt).toArray(),
        d.folders.toArray(),
        d.metrics.filter((m) => m.key === "study_hours").toArray(),
      ]);
      setNotes(allNotes);
      setFolders(allFolders);
      setMetrics(allMetrics);

      if (allNotes.length > 0 && !selectedNoteId) {
        setSelectedNoteId(allNotes[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar conhecimento:", err);
      toast.error("Erro ao carregar notas.");
    } finally {
      setLoading(false);
    }
  }, [selectedNoteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Nota Selecionada Atual
  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Notas Filtradas
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (
        searchQuery &&
        !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }
      if (selectedFolderId !== null && n.folderId !== selectedFolderId) return false;
      return true;
    });
  }, [notes, searchQuery, selectedFolderId]);

  // Criar Nova Nota
  const handleCreateNote = async (folderId?: string | null) => {
    try {
      const d = db();
      const now = nowIso();
      const newNote: Note = {
        id: newId(),
        title: "Nova Nota de Estudo",
        content: "# Nova Nota\n\nComece a escrever seus estudos em Markdown aqui...",
        folderId: folderId || selectedFolderId || null,
        tags: ["estudos"],
        createdAt: now,
        updatedAt: now,
      };

      await d.notes.add(newNote);
      toast.success("Nova nota criada!");
      await loadData();
      setSelectedNoteId(newNote.id);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar nota.");
    }
  };

  // Salvar Alterações da Nota
  const handleSaveNote = async (updated: Partial<Note>) => {
    if (!updated.id) return;
    try {
      const d = db();
      const now = nowIso();
      await d.notes.update(updated.id, {
        title: updated.title,
        content: updated.content,
        folderId: updated.folderId,
        tags: updated.tags,
        updatedAt: now,
      });

      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? ({ ...n, ...updated, updatedAt: now } as Note) : n))
      );
      toast.success("Nota salva com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar nota.");
    }
  };

  // Excluir Nota
  const confirmDeleteNote = async () => {
    if (!deleteConfig.id) return;
    try {
      const d = db();
      await d.notes.delete(deleteConfig.id);
      toast.success("Nota excluída.");
      setSelectedNoteId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir nota.");
    }
  };

  // Criar Nova Pasta
  const handleCreateFolder = async (folderName: string) => {
    try {
      const d = db();
      const now = nowIso();
      const newFolder: Folder = {
        id: newId(),
        name: folderName,
        createdAt: now,
        updatedAt: now,
      };

      await d.folders.add(newFolder);
      toast.success(`Pasta "${folderName}" criada!`);
      setFolderModalOpen(false);
      await loadData();
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
          loadData();
        }}
      />

      {/* ── 2. Heatmap Anual de Horas de Estudo ─────────────────────────── */}
      <StudyHeatmap metrics={metrics} />

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
