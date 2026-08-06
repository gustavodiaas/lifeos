import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Metric } from '@/lib/supabase';

function normalizeMetric(item: any): Metric {
  return {
    ...item,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useMetrics(userId: string | undefined) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!userId) {
      setMetrics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (fetchErr) throw fetchErr;

      setMetrics((data || []).map(normalizeMetric));
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      setError('Falha ao carregar métricas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const addMetric = async (metric: {
    key: string;
    value: number;
    unit?: string;
    date: string;
  }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload = {
      user_id: userId,
      key: metric.key,
      value: metric.value,
      unit: metric.unit || null,
      date: metric.date,
    };

    const { data, error: insertError } = await supabase.from('metrics').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar métrica:', insertError);
      setError('Erro ao salvar métrica.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeMetric(data[0]);
      setMetrics((prev) => [...prev, normalized].sort((a, b) => a.date.localeCompare(b.date)));
    }
    return true;
  };

  const removeMetric = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const { error: deleteError } = await supabase
      .from('metrics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar métrica:', deleteError);
      setError('Erro ao apagar métrica.');
      return false;
    }

    setMetrics((prev) => prev.filter((m) => m.id !== id));
    return true;
  };

  return {
    metrics,
    loading,
    error,
    addMetric,
    removeMetric,
    refetch: fetchDados,
  };
}
