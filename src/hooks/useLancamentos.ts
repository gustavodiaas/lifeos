import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lancamento } from '@/lib/supabase';

export function useLancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('lancamentos')
      .select('*')
      .order('data', { ascending: true });

    if (fetchError) {
      setError('Falha ao carregar lançamentos.');
      console.error(fetchError.message);
    } else if (data) {
      setLancamentos(data as Lancamento[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Realtime sync entre dispositivos
  useEffect(() => {
    const channel = supabase
      .channel('lancamentos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLancamentos((prev) => {
            if (prev.some((l) => l.id === (payload.new as Lancamento).id)) return prev;
            return [...prev, payload.new as Lancamento].sort((a, b) => a.data.localeCompare(b.data));
          });
        }
        if (payload.eventType === 'UPDATE') {
          setLancamentos((prev) =>
            prev.map((l) => (l.id === (payload.new as Lancamento).id ? (payload.new as Lancamento) : l)),
          );
        }
        if (payload.eventType === 'DELETE') {
          setLancamentos((prev) => prev.filter((l) => l.id !== (payload.old as Lancamento).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const add = async (lancamento: Omit<Lancamento, 'id' | 'created_at'>): Promise<boolean> => {
    setError(null);
    const { data, error: insertError } = await supabase
      .from('lancamentos')
      .insert([{
        descricao: lancamento.descricao,
        valor: Number(lancamento.valor),
        data: lancamento.data,
        categoria: lancamento.categoria,
        tipo: lancamento.tipo,
        is_recorrente: Boolean(lancamento.is_recorrente),
      }])
      .select();

    if (insertError) {
      setError('Erro ao salvar lançamento.');
      return false;
    }
    if (data) setLancamentos((prev) => [...prev, data[0] as Lancamento]);
    return true;
  };

  const update = async (id: string, lancamento: Partial<Lancamento>): Promise<boolean> => {
    setError(null);
    const { data, error: updateError } = await supabase
      .from('lancamentos')
      .update({
        descricao: lancamento.descricao,
        valor: Number(lancamento.valor),
        data: lancamento.data,
        categoria: lancamento.categoria,
        tipo: lancamento.tipo,
        is_recorrente: Boolean(lancamento.is_recorrente),
      })
      .eq('id', id)
      .select();

    if (updateError) {
      setError('Erro ao atualizar lançamento.');
      return false;
    }
    if (data?.[0]) {
      setLancamentos((prev) => prev.map((l) => (l.id === id ? (data[0] as Lancamento) : l)));
    }
    return true;
  };

  const remove = async (id: string): Promise<boolean> => {
    setError(null);
    const { error: deleteError } = await supabase.from('lancamentos').delete().eq('id', id);
    if (deleteError) {
      setError('Erro ao apagar lançamento.');
      return false;
    }
    setLancamentos((prev) => prev.filter((l) => l.id !== id));
    return true;
  };

  return { lancamentos, setLancamentos, loading, error, add, remove, update, refetch: fetchDados };
}
