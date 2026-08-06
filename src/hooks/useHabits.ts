import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Habit, HabitLog } from '@/lib/supabase';

function normalizeHabit(item: any): Habit {
  return {
    ...item,
    targetPerWeek: item.target_per_week ?? item.targetPerWeek ?? 1,
    target_per_week: item.target_per_week ?? item.targetPerWeek ?? 1,
    archivedAt: item.archived_at ?? item.archivedAt ?? null,
    archived_at: item.archived_at ?? item.archivedAt ?? null,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

function normalizeHabitLog(item: any): HabitLog {
  return {
    ...item,
    habitId: item.habit_id ?? item.habitId,
    habit_id: item.habit_id ?? item.habitId,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useHabits(userId: string | undefined) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!userId) {
      setHabits([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId),
        supabase.from('habit_logs').select('*').eq('user_id', userId),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      setHabits((habitsRes.data || []).map(normalizeHabit));
      setLogs((logsRes.data || []).map(normalizeHabitLog));
    } catch (err: any) {
      console.error('Erro ao buscar hábitos/logs:', err);
      setError('Falha ao carregar hábitos.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const habitsChannel = supabase
      .channel('habits-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const normalized = normalizeHabit(payload.new);
            setHabits((prev) => (prev.some((h) => h.id === normalized.id) ? prev : [...prev, normalized]));
          } else if (payload.eventType === 'UPDATE') {
            const normalized = normalizeHabit(payload.new);
            setHabits((prev) => prev.map((h) => (h.id === normalized.id ? normalized : h)));
          } else if (payload.eventType === 'DELETE') {
            setHabits((prev) => prev.filter((h) => h.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    const logsChannel = supabase
      .channel('habit-logs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const normalized = normalizeHabitLog(payload.new);
            setLogs((prev) => (prev.some((l) => l.id === normalized.id) ? prev : [...prev, normalized]));
          } else if (payload.eventType === 'UPDATE') {
            const normalized = normalizeHabitLog(payload.new);
            setLogs((prev) => prev.map((l) => (l.id === normalized.id ? normalized : l)));
          } else if (payload.eventType === 'DELETE') {
            setLogs((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(habitsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [userId]);

  const addHabit = async (habit: { name: string; frequency: any; targetPerWeek: number }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload = {
      user_id: userId,
      name: habit.name,
      frequency: habit.frequency,
      target_per_week: habit.targetPerWeek,
    };

    const { data, error: insertError } = await supabase.from('habits').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar hábito:', insertError);
      setError('Erro ao salvar hábito.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeHabit(data[0]);
      setHabits((prev) => (prev.some((h) => h.id === normalized.id) ? prev : [...prev, normalized]));
    }
    return true;
  };

  const updateHabit = async (id: string, habit: Partial<Habit>): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload: any = {};
    if (habit.name !== undefined) payload.name = habit.name;
    if (habit.frequency !== undefined) payload.frequency = habit.frequency;
    if (habit.targetPerWeek !== undefined) payload.target_per_week = habit.targetPerWeek;
    if (habit.target_per_week !== undefined) payload.target_per_week = habit.target_per_week;
    if (habit.archivedAt !== undefined) payload.archived_at = habit.archivedAt;
    if (habit.archived_at !== undefined) payload.archived_at = habit.archived_at;
    payload.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar hábito:', updateError);
      setError('Erro ao atualizar hábito.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeHabit(data[0]);
      setHabits((prev) => prev.map((h) => (h.id === id ? normalized : h)));
    }
    return true;
  };

  const removeHabit = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    // Apagar os logs associados primeiro ou em paralelo
    await supabase.from('habit_logs').delete().eq('habit_id', id).eq('user_id', userId);

    const { error: deleteError } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar hábito:', deleteError);
      setError('Erro ao apagar hábito.');
      return false;
    }

    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id && l.habit_id !== id));
    return true;
  };

  const archiveHabit = async (id: string): Promise<boolean> => {
    return updateHabit(id, { archivedAt: new Date().toISOString() });
  };

  const toggleHabitLog = async (habitId: string, date: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const existing = logs.find((l) => (l.habitId === habitId || l.habit_id === habitId) && l.date === date);

    if (existing) {
      const newDone = !existing.done;
      const { data, error: updateErr } = await supabase
        .from('habit_logs')
        .update({ done: newDone, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select();

      if (updateErr) {
        console.error('Erro ao atualizar habit_log:', updateErr);
        setError('Erro ao atualizar registro.');
        return false;
      }

      if (data && data[0]) {
        const normalized = normalizeHabitLog(data[0]);
        setLogs((prev) => prev.map((l) => (l.id === existing.id ? normalized : l)));
      }
    } else {
      const payload = {
        user_id: userId,
        habit_id: habitId,
        date,
        done: true,
      };

      const { data, error: insertErr } = await supabase
        .from('habit_logs')
        .insert([payload])
        .select();

      if (insertErr) {
        console.error('Erro ao inserir habit_log:', insertErr);
        setError('Erro ao salvar registro.');
        return false;
      }

      if (data && data[0]) {
        const normalized = normalizeHabitLog(data[0]);
        setLogs((prev) => (prev.some((l) => l.id === normalized.id) ? prev : [...prev, normalized]));
      }
    }

    return true;
  };

  return {
    habits,
    logs,
    loading,
    error,
    addHabit,
    updateHabit,
    removeHabit,
    archiveHabit,
    toggleHabitLog,
    refetch: fetchDados,
  };
}
