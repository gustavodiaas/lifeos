import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useJournal } from "@/hooks/useJournal";
import type { JournalEntry } from "@/lib/supabase";
import { todayIso } from "@/lib/date";
import { JournalEntryCard } from "./components/JournalEntryCard";
import { JournalModal } from "./components/JournalModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "@/lib/toast";
import {
  Plus,
  NotebookPen,
  Smile,
  Sparkles,
  Search,
  Calendar,
  Heart,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { MoodTrendChart } from "./components/MoodTrendChart";

import { useWorkspace } from "@/context/WorkspaceContext";

export function JournalModule() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const { entries, loading, saveEntry, removeEntry } = useJournal(activeUserId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<number | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Salvar / Editar Registro
  const handleSaveEntry = async (entryData: {
    id?: string;
    date: string;
    mood: 1 | 2 | 3 | 4 | 5;
    content: string;
    highlights: string[];
  }) => {
    try {
      const ok = await saveEntry(entryData);
      if (ok) {
        toast.success("Registro salvo no diário!");
        setModalOpen(false);
        setEditingEntry(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar no diário.");
    }
  };

  // Excluir Registro
  const confirmDeleteEntry = async () => {
    if (!deleteConfig.id) return;
    try {
      const ok = await removeEntry(deleteConfig.id);
      if (ok) toast.success("Registro excluído.");
      setDeleteConfig({ open: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir registro.");
    }
  };

  // Filtro de buscas e humores
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (
        searchQuery &&
        !e.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }
      if (selectedMoodFilter !== "all" && e.mood !== selectedMoodFilter) return false;
      return true;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  // Estatísticas de humor
  const totalEntriesCount = entries.length;
  const todayEntry = entries.find((e) => e.date === todayIso());

  const averageMood = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((s, e) => s + (e.mood || 3), 0);
    return (sum / entries.length).toFixed(1);
  }, [entries]);

  const totalHighlightsCount = useMemo(() => {
    return entries.reduce((sum, e) => sum + (e.highlights?.length || 0), 0);
  }, [entries]);

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header & Ações ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Reflexão Diária</span>
            {todayEntry ? (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Smile size={12} /> Hoje Registrado
              </span>
            ) : (
              <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">
                Pendente Hoje
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Diário Pessoal
          </h2>
        </div>

        <button
          onClick={() => {
            setEditingEntry(todayEntry || null);
            setModalOpen(true);
          }}
          className="btn-ios text-xs py-3 px-5 self-start md:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{todayEntry ? "Editar Hoje" : "Escrever Hoje"}</span>
        </button>
      </div>

      {/* ── Gráfico de Tendência de Humor (30 Dias) ────────────────────── */}
      <MoodTrendChart entries={entries} />

      {/* ── 2. Cards de Métricas do Diário ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-muted text-foreground flex items-center justify-center shrink-0">
            <NotebookPen size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Páginas</p>
            <p className="text-xl font-extrabold text-foreground">{totalEntriesCount} reflexões salvas</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <Smile size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Média de Humor</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {averageMood > 0 ? `${averageMood} / 5.0` : "—"}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destaques Registrados</p>
            <p className="text-xl font-extrabold text-foreground">{totalHighlightsCount} momentos</p>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Busca & Filtro de Humor ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar no diário..."
            className="input-ios pl-10 py-2.5 text-xs"
          />
        </div>

        {/* Filtros por Humor */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedMoodFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedMoodFilter === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todos ({entries.length})
          </button>

          {[
            { value: 5, emoji: "🤩" },
            { value: 4, emoji: "🙂" },
            { value: 3, emoji: "😐" },
            { value: 2, emoji: "🙁" },
            { value: 1, emoji: "😭" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMoodFilter(selectedMoodFilter === m.value ? "all" : (m.value as any))}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1",
                selectedMoodFilter === m.value
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{m.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Feed Timeline do Diário ──────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando diário...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-muted text-foreground flex items-center justify-center mx-auto">
            <NotebookPen size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Nenhum registro encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 font-medium">
              Comece a escrever sobre o seu dia para guardar momentos, conquistas e acompanhar o seu humor.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEntry(null);
              setModalOpen(true);
            }}
            className="btn-ios text-xs py-3 px-6"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Escrever Primeiro Registro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={(eEdit) => {
                setEditingEntry(eEdit);
                setModalOpen(true);
              }}
              onDelete={(id) => setDeleteConfig({ open: true, id })}
            />
          ))}
        </div>
      )}

      {/* Modal do Diário */}
      <JournalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
      />

      {/* Modal de Alerta para Exclusão */}
      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDeleteEntry}
        title="Excluir Registro?"
        message="Essa ação irá apagar permanentemente o registro do diário desta data."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
