import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Book } from '@/lib/supabase';
import { isValidUuid } from '@/lib/utils';

function normalize(item: any): Book {
  return {
    id:           item.id,
    user_id:      item.user_id,
    title:        item.title,
    author:       item.author ?? '',
    cover:        item.cover ?? undefined,
    totalPages:   item.total_pages,
    total_pages:  item.total_pages,
    currentPage:  item.current_page,
    current_page: item.current_page,
    status:       item.status,
    isbn:         item.isbn ?? undefined,
    publisher:    item.publisher ?? undefined,
    year:         item.year ?? undefined,
    createdAt:    item.created_at,
    created_at:   item.created_at,
    updatedAt:    item.updated_at,
    updated_at:   item.updated_at,
  };
}

export function useBooks(userId: string | undefined) {
  const [books, setBooks]     = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isValidUuid(userId)) { setBooks([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setBooks((data || []).map(normalize));
    } catch (e: any) {
      console.error('useBooks fetch:', e);
      setError('Falha ao carregar livros.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBook = async (payload: {
    title: string;
    author: string;
    cover?: string;
    total_pages: number;
    current_page: number;
    status: string;
    isbn?: string;
    publisher?: string;
    year?: string;
  }): Promise<Book | null> => {
    if (!userId) return null;
    const { data, error: err } = await supabase
      .from('books')
      .insert([{ ...payload, user_id: userId }])
      .select()
      .single();
    if (err) { console.error('addBook:', err); return null; }
    const book = normalize(data);
    setBooks((p) => [book, ...p]);
    return book;
  };

  const updateBook = async (
    id: string,
    payload: Partial<{
      title: string;
      author: string;
      cover: string;
      total_pages: number;
      current_page: number;
      status: string;
    }>
  ): Promise<boolean> => {
    if (!userId) return false;
    const { data, error: err } = await supabase
      .from('books')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (err) { console.error('updateBook:', err); return false; }
    setBooks((p) => p.map((b) => b.id === id ? normalize(data) : b));
    return true;
  };

  const removeBook = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    const { error: err } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (err) { console.error('removeBook:', err); return false; }
    setBooks((p) => p.filter((b) => b.id !== id));
    return true;
  };

  return { books, loading, error, addBook, updateBook, removeBook, refetch: fetch };
}
