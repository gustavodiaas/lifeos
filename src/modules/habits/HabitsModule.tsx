import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useHabits } from "@/hooks/useHabits";
import type { Habit } from "@/lib/supabase";
import { todayIso, lastNDates } from "@/lib/date";
import { HabitHeatmap } from "./components/HabitHeatmap";
import { HabitCard } from "./components/HabitCard";
import { HabitModal } from "./components/HabitModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "@/lib/toast";
import {
  Plus,
  Repeat,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter,
  Sparkles,
  TrendingUp,
  Search,
} from "lucide-react";

export function HabitsModule() {
  const { user } = useAuthContext();
  const {
    habits,
    logs,
    loading,
    addHabit,
    updateHabit,
    removeHabit,
    archiveHabit,
    toggleHabitLog,
  } = useHabits(user?.id);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archivedAt && !h.archived_at), [habits]);

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Alternar marcação de um hábito em uma data específica
  const handleToggleHabit = async (habitId: string, date: string) => {
    try {
      const ok = await toggleHabitLog(habitId, date);
      if (!ok) toast.error("Erro ao salvar alteração.");
    } catch (err) {
      console.error("Erro ao marcar hábito:", err);
      toast.error("Erro ao salvar alteração.");
    }
  };

  // Salvar/Editar hábito
  const handleSaveHabit = async (data: { id?: string; name: string; frequency: any; targetPerWeek: number }) => {
    try {
      if (data.id) {
        // Edição
        const ok = await updateHabit(data.id, {
          name: data.name,
          frequency: data.frequency,
          targetPerWeek: data.targetPerWeek,
        });
        if (ok) toast.success("Hábito atualizado!");
      } else {
        // Criação
        const ok = await addHabit({
          name: data.name,
          frequency: data.frequency,
          targetPerWeek: data.targetPerWeek,
        });
        if (ok) toast.success("Novo hábito criado!");
      }

      setModalOpen(false);
      setEditingHabit(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar hábito.");
    }
  };

  // Excluir hábito
  const confirmDelete = async () => {
    if (!deleteConfig.id) return;
    try {
      const ok = await removeHabit(deleteConfig.id);
      if (ok) toast.success("Hábito excluído.");
      setDeleteConfig({ open: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir hábito.");
    }
  };

  // Arquivar hábito
  const handleArchiveHabit = async (habitId: string) => {
    try {
      const ok = await archiveHabit(habitId);
      if (ok) toast.success("Hábito arquivado.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao arquivar hábito.");
    }
  };

  // Faixa dos últimos 7 dias para a barra de seleção de data
  const dateStrip = useMemo(() => {
    const dates = lastNDates(7); // 7 dias até hoje
    return dates.map((dStr) => {
      const dateObj = new Date(dStr + "T00:00:00");
      const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
      const dayNum = dateObj.getDate();
      const isToday = dStr === todayIso();

      // Conta quantos hábitos foram feitos nesse dia
      const doneCount = activeHabits.filter((h) =>
        logs.some((l) => (l.habitId === h.id || l.habit_id === h.id) && l.date === dStr && l.done)
      ).length;

      return { dStr, dayName, dayNum, isToday, doneCount };
    });
  }, [activeHabits, logs]);

  // Hábitos filtrados por busca e seleção
  const filteredHabits = useMemo(() => {
    return activeHabits.filter((h) => {
      if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedHabitId && h.id !== selectedHabitId) return false;
      return true;
    });
  }, [activeHabits, searchQuery, selectedHabitId]);

  // Estatísticas calculadas
  const habitsDoneToday = activeHabits.filter((h) =>
    logs.some((l) => (l.habitId === h.id || l.habit_id === h.id) && l.date === selectedDate && l.done)
  ).length;

  const selectedHabitName = activeHabits.find((h) => h.id === selectedHabitId)?.name;

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header com Métricas & Ações ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Consistência Diária</span>
            {selectedDate === todayIso() && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Hoje
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Rastreador de Hábitos
          </h2>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
          className="btn-ios text-xs py-3 px-5 self-start md:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Novo Hábito</span>
        </button>
      </div>

      {/* ── 2. Strip de Seleção de Data (Mini Calendário 7 dias) ───────── */}
      <div className="glass-card p-4 flex items-center justify-between gap-2 overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 min-w-max">
          <CalendarIcon size={18} className="text-foreground mr-2 shrink-0" />
          <span className="text-xs font-bold text-foreground mr-3 shrink-0">Data:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end min-w-max">
          {dateStrip.map((item) => {
            const isSelected = item.dStr === selectedDate;
            return (
              <button
                key={item.dStr}
                onClick={() => setSelectedDate(item.dStr)}
                className={`flex flex-col items-center justify-center w-12 h-14 rounded-2xl transition-all ios-spring border ${
                  isSelected
                    ? "bg-foreground text-background font-extrabold border-foreground shadow-md shadow-black/20 scale-105"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">
                  {item.dayName}
                </span>
                <span className="text-base font-extrabold leading-tight mt-0.5">
                  {item.dayNum}
                </span>
                {item.doneCount > 0 && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Heatmap Anual de Consistência (World-class Widget) ──────── */}
      <HabitHeatmap
        logs={logs}
        totalHabitsCount={habits.length}
        selectedHabitId={selectedHabitId}
        habitName={selectedHabitName}
      />

      {/* ── 4. Barra de Filtro e Busca de Hábitos ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar hábito..."
            className="input-ios pl-10 py-2.5 text-xs"
          />
        </div>

        {/* Filtros por Hábito */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedHabitId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedHabitId === null
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Todos os Hábitos ({activeHabits.length})
          </button>

          {activeHabits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabitId(selectedHabitId === h.id ? null : h.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedHabitId === h.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Lista de Hábitos (Cards Diários) ─────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando hábitos...</p>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-foreground/15 text-foreground flex items-center justify-center mx-auto">
            <Repeat size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Nenhum hábito encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 font-medium">
              Crie o seu primeiro hábito diário ou semanal para começar a rastrear a sua consistência com o heatmap.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingHabit(null);
              setModalOpen(true);
            }}
            className="btn-ios text-xs py-3 px-6"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Criar Primeiro Hábito</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              logs={logs}
              selectedDate={selectedDate}
              onToggle={handleToggleHabit}
              onEdit={(habitToEdit) => {
                setEditingHabit(habitToEdit);
                setModalOpen(true);
              }}
              onDelete={(id) => setDeleteConfig({ open: true, id })}
              onArchive={handleArchiveHabit}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <HabitModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      {/* Modal de Exclusão */}
      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir Hábito?"
        message="Essa ação irá remover o hábito e todo o seu histórico de consistência do heatmap."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
