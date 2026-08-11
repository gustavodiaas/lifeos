import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Goal, GoalScope } from '@/lib/supabase';
import { isValidUuid } from '@/lib/utils';

function normalizeGoal(item: any): Goal {
  return {
    ...item,
    linkedHabitId: item.linked_habit_id ?? item.linkedHabitId ?? null,
    linked_habit_id: item.linked_habit_id ?? item.linkedHabitId ?? null,
    linkedMetric: item.linked_metric ?? item.linkedMetric ?? null,
    linked_metric: item.linked_metric ?? item.linkedMetric ?? null,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!isValidUuid(userId)) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId!);

      if (fetchErr) throw fetchErr;

      setGoals((data || []).map(normalizeGoal));
    } catch (err: any) {
      console.error('Erro ao buscar metas:', err);
      setError('Falha ao carregar metas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const addGoal = async (goal: {
    title: string;
    scope: GoalScope;
    period: string;
    target?: number;
    unit?: string;
    progress: number;
    linkedHabitId?: string | null;
    linkedMetric?: string | null;
  }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload = {
      user_id: userId,
      title: goal.title,
      scope: goal.scope,
      period: goal.period,
      target: goal.target,
      unit: goal.unit || null,
      progress: goal.progress || 0,
      linked_habit_id: goal.linkedHabitId || null,
      linked_metric: goal.linkedMetric || null,
    };

    const { data, error: insertError } = await supabase.from('goals').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar meta:', insertError);
      setError('Erro ao salvar meta.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeGoal(data[0]);
      setGoals((prev) => (prev.some((g) => g.id === normalized.id) ? prev : [...prev, normalized]));
    }
    return true;
  };

  const updateGoal = async (id: string, goal: Partial<Goal>): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload: any = {};
    if (goal.title !== undefined) payload.title = goal.title;
    if (goal.scope !== undefined) payload.scope = goal.scope;
    if (goal.period !== undefined) payload.period = goal.period;
    if (goal.target !== undefined) payload.target = goal.target;
    if (goal.unit !== undefined) payload.unit = goal.unit;
    if (goal.progress !== undefined) payload.progress = goal.progress;
    if (goal.linkedHabitId !== undefined) payload.linked_habit_id = goal.linkedHabitId;
    if (goal.linked_habit_id !== undefined) payload.linked_habit_id = goal.linked_habit_id;
    if (goal.linkedMetric !== undefined) payload.linked_metric = goal.linkedMetric;
    if (goal.linked_metric !== undefined) payload.linked_metric = goal.linked_metric;
    payload.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar meta:', updateError);
      setError('Erro ao atualizar meta.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeGoal(data[0]);
      setGoals((prev) => prev.map((g) => (g.id === id ? normalized : g)));
    }
    return true;
  };

  const removeGoal = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar meta:', deleteError);
      setError('Erro ao apagar meta.');
      return false;
    }

    setGoals((prev) => prev.filter((g) => g.id !== id));
    return true;
  };

  const updateProgress = async (id: string, progress: number): Promise<boolean> => {
    return updateGoal(id, { progress });
  };

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    removeGoal,
    updateProgress,
    refetch: fetchDados,
  };
}
