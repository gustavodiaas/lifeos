import { useState, useEffect, useMemo, useCallback } from "react";
import { db, newId, nowIso } from "@/db";
import type { Habit, HabitLog } from "@/db/schema";
import { todayIso, lastNDates } from "@/lib/date";
import { HabitHeatmap } from "./components/HabitHeatmap";
import { HabitCard } from "./components/HabitCard";
import { HabitModal } from "./components/HabitModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "sonner";
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Carrega hábitos e logs do IndexedDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const d = db();
      const [allHabits, allLogs] = await Promise.all([
        d.habits.filter((h) => !h.archivedAt).toArray(),
        d.habit_logs.toArray(),
      ]);
      setHabits(allHabits);
      setLogs(allLogs);
    } catch (err) {
      console.error("Erro ao carregar hábitos:", err);
      toast.error("Erro ao carregar hábitos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Alternar marcação de um hábito em uma data específica
  const handleToggleHabit = async (habitId: string, date: string) => {
    try {
      const d = db();
      const existing = logs.find((l) => l.habitId === habitId && l.date === date);

      if (existing) {
        if (existing.done) {
          // Desmarca
          await d.habit_logs.update(existing.id, { done: false, updatedAt: nowIso() });
          setLogs((prev) =>
            prev.map((l) => (l.id === existing.id ? { ...l, done: false, updatedAt: nowIso() } : l))
          );
        } else {
          // Marca de novo
          await d.habit_logs.update(existing.id, { done: true, updatedAt: nowIso() });
          setLogs((prev) =>
            prev.map((l) => (l.id === existing.id ? { ...l, done: true, updatedAt: nowIso() } : l))
          );
        }
      } else {
        // Cria novo log
        const newLog: HabitLog = {
          id: newId(),
          habitId,
          date,
          done: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        await d.habit_logs.add(newLog);
        setLogs((prev) => [...prev, newLog]);
      }
    } catch (err) {
      console.error("Erro ao marcar hábito:", err);
      toast.error("Erro ao salvar alteração.");
    }
  };

  // Salvar/Editar hábito
  const handleSaveHabit = async (data: { id?: string; name: string; frequency: any; targetPerWeek: number }) => {
    try {
      const d = db();
      const now = nowIso();

      if (data.id) {
        // Edição
        await d.habits.update(data.id, {
          name: data.name,
          frequency: data.frequency,
          targetPerWeek: data.targetPerWeek,
          updatedAt: now,
        });
        toast.success("Hábito atualizado!");
      } else {
        // Criação
        const newHabit: Habit = {
          id: newId(),
          name: data.name,
          frequency: data.frequency,
          targetPerWeek: data.targetPerWeek,
          createdAt: now,
          updatedAt: now,
        };
        await d.habits.add(newHabit);
        toast.success("Novo hábito criado!");
      }

      setModalOpen(false);
      setEditingHabit(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar hábito.");
    }
  };

  // Excluir hábito
  const confirmDelete = async () => {
    if (!deleteConfig.id) return;
    try {
      const d = db();
      await d.habits.delete(deleteConfig.id);
      // Apaga logs associados
      const habitLogs = await d.habit_logs.where("habitId").equals(deleteConfig.id).toArray();
      await d.habit_logs.bulkDelete(habitLogs.map((l) => l.id));

      toast.success("Hábito excluído.");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir hábito.");
    }
  };

  // Arquivar hábito
  const handleArchiveHabit = async (habitId: string) => {
    try {
      const d = db();
      await d.habits.update(habitId, { archivedAt: nowIso() });
      toast.success("Hábito arquivado.");
      await loadData();
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
      const doneCount = habits.filter((h) =>
        logs.some((l) => l.habitId === h.id && l.date === dStr && l.done)
      ).length;

      return { dStr, dayName, dayNum, isToday, doneCount };
    });
  }, [habits, logs]);

  // Hábitos filtrados por busca e seleção
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedHabitId && h.id !== selectedHabitId) return false;
      return true;
    });
  }, [habits, searchQuery, selectedHabitId]);

  // Estatísticas calculadas
  const habitsDoneToday = habits.filter((h) =>
    logs.some((l) => l.habitId === h.id && l.date === selectedDate && l.done)
  ).length;

  const selectedHabitName = habits.find((h) => h.id === selectedHabitId)?.name;

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
          <CalendarIcon size={18} className="text-[#FCA311] mr-2 shrink-0" />
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
                    ? "bg-[#FCA311] text-black font-extrabold border-[#FCA311] shadow-md shadow-[#FCA311]/30 scale-105"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311] mt-1" />
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
                ? "bg-[#FCA311] text-black shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Todos os Hábitos ({habits.length})
          </button>

          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabitId(selectedHabitId === h.id ? null : h.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedHabitId === h.id
                  ? "bg-[#FCA311] text-black shadow-sm"
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
          <div className="w-8 h-8 border-3 border-[#FCA311] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando hábitos...</p>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center mx-auto">
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
