import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { JournalEntry } from '@/lib/supabase';

function normalizeJournalEntry(item: any): JournalEntry {
  return {
    ...item,
    highlights: Array.isArray(item.highlights) ? item.highlights : [],
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useJournal(userId: string | undefined) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchErr) throw fetchErr;

      setEntries((data || []).map(normalizeJournalEntry));
    } catch (err: any) {
      console.error('Erro ao buscar entradas do diário:', err);
      setError('Falha ao carregar diário.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const saveEntry = async (entry: {
    id?: string;
    date: string;
    mood: 1 | 2 | 3 | 4 | 5;
    content: string;
    highlights: string[];
  }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const now = new Date().toISOString();

    if (entry.id) {
      // Edição por ID
      const payload = {
        date: entry.date,
        mood: entry.mood,
        content: entry.content,
        highlights: entry.highlights || [],
        updated_at: now,
      };

      const { data, error: updateErr } = await supabase
        .from('journal_entries')
        .update(payload)
        .eq('id', entry.id)
        .eq('user_id', userId)
        .select();

      if (updateErr) {
        console.error('Erro ao atualizar registro do diário:', updateErr);
        setError('Erro ao salvar no diário.');
        return false;
      }

      if (data && data[0]) {
        const normalized = normalizeJournalEntry(data[0]);
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? normalized : e)));
      }
    } else {
      // Verifica se existe por data
      const existing = entries.find((e) => e.date === entry.date);

      if (existing) {
        const payload = {
          mood: entry.mood,
          content: entry.content,
          highlights: entry.highlights || [],
          updated_at: now,
        };

        const { data, error: updateErr } = await supabase
          .from('journal_entries')
          .update(payload)
          .eq('id', existing.id)
          .eq('user_id', userId)
          .select();

        if (updateErr) {
          console.error('Erro ao atualizar registro do diário:', updateErr);
          setError('Erro ao salvar no diário.');
          return false;
        }

        if (data && data[0]) {
          const normalized = normalizeJournalEntry(data[0]);
          setEntries((prev) => prev.map((e) => (e.id === existing.id ? normalized : e)));
        }
      } else {
        const payload = {
          user_id: userId,
          date: entry.date,
          mood: entry.mood,
          content: entry.content,
          highlights: entry.highlights || [],
        };

        const { data, error: insertErr } = await supabase
          .from('journal_entries')
          .insert([payload])
          .select();

        if (insertErr) {
          console.error('Erro ao inserir registro no diário:', insertErr);
          setError('Erro ao salvar no diário.');
          return false;
        }

        if (data && data[0]) {
          const normalized = normalizeJournalEntry(data[0]);
          setEntries((prev) => [normalized, ...prev]);
        }
      }
    }

    return true;
  };

  const removeEntry = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar registro do diário:', deleteError);
      setError('Erro ao apagar registro.');
      return false;
    }

    setEntries((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  return {
    entries,
    loading,
    error,
    saveEntry,
    removeEntry,
    refetch: fetchDados,
  };
}
