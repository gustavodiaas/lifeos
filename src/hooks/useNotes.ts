import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Note, Folder, NoteLink } from '@/lib/supabase';
import { isValidUuid } from '@/lib/utils';

function normalizeNote(item: any): Note {
  return {
    ...item,
    parentId: item.parent_id ?? item.parentId ?? null,
    parent_id: item.parent_id ?? item.parentId ?? null,
    folderId: item.folder_id ?? item.folderId ?? null,
    folder_id: item.folder_id ?? item.folderId ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
    deletedAt: item.deleted_at ?? item.deletedAt ?? null,
    deleted_at: item.deleted_at ?? item.deletedAt ?? null,
  };
}

function normalizeFolder(item: any): Folder {
  return {
    ...item,
    parentId: item.parent_id ?? item.parentId ?? null,
    parent_id: item.parent_id ?? item.parentId ?? null,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

function normalizeNoteLink(item: any): NoteLink {
  return {
    ...item,
    fromId: item.from_id ?? item.fromId,
    from_id: item.from_id ?? item.fromId,
    toId: item.to_id ?? item.toId,
    to_id: item.to_id ?? item.toId,
  };
}

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!isValidUuid(userId)) {
      setNotes([]);
      setFolders([]);
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [notesRes, foldersRes, linksRes] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', userId!),
        supabase.from('folders').select('*').eq('user_id', userId!),
        supabase.from('note_links').select('*').eq('user_id', userId!),
      ]);

      if (notesRes.error) throw notesRes.error;
      if (foldersRes.error) throw foldersRes.error;
      if (linksRes.error) throw linksRes.error;

      setNotes((notesRes.data || []).map(normalizeNote));
      setFolders((foldersRes.data || []).map(normalizeFolder));
      setLinks((linksRes.data || []).map(normalizeNoteLink));
    } catch (err: any) {
      console.error('Erro ao buscar notas/pastas:', err);
      setError('Falha ao carregar bloco de notas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const addNote = async (note: {
    title: string;
    content: string;
    folderId?: string | null;
    parentId?: string | null;
    tags?: string[];
  }): Promise<Note | null> => {
    if (!userId) return null;
    setError(null);

    const payload = {
      user_id: userId,
      title: note.title,
      content: note.content,
      folder_id: note.folderId || null,
      parent_id: note.parentId || null,
      tags: note.tags || [],
    };

    const { data, error: insertError } = await supabase.from('notes').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar nota:', insertError);
      setError('Erro ao salvar nota.');
      return null;
    }

    if (data && data[0]) {
      const normalized = normalizeNote(data[0]);
      setNotes((prev) => (prev.some((n) => n.id === normalized.id) ? prev : [...prev, normalized]));
      return normalized;
    }
    return null;
  };

  const updateNote = async (id: string, note: Partial<Note>): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload: any = {};
    if (note.title !== undefined) payload.title = note.title;
    if (note.content !== undefined) payload.content = note.content;
    if (note.folderId !== undefined) payload.folder_id = note.folderId;
    if (note.folder_id !== undefined) payload.folder_id = note.folder_id;
    if (note.parentId !== undefined) payload.parent_id = note.parentId;
    if (note.parent_id !== undefined) payload.parent_id = note.parent_id;
    if (note.tags !== undefined) payload.tags = note.tags;
    if (note.deletedAt !== undefined) payload.deleted_at = note.deletedAt;
    if (note.deleted_at !== undefined) payload.deleted_at = note.deleted_at;
    payload.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('notes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar nota:', updateError);
      setError('Erro ao atualizar nota.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeNote(data[0]);
      setNotes((prev) => prev.map((n) => (n.id === id ? normalized : n)));
    }
    return true;
  };

  const removeNote = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    // Remove links
    await supabase
      .from('note_links')
      .delete()
      .or(`from_id.eq.${id},to_id.eq.${id}`)
      .eq('user_id', userId);

    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar nota:', deleteError);
      setError('Erro ao apagar nota.');
      return false;
    }

    setNotes((prev) => prev.filter((n) => n.id !== id));
    setLinks((prev) => prev.filter((l) => l.fromId !== id && l.toId !== id && l.from_id !== id && l.to_id !== id));
    return true;
  };

  const addFolder = async (folder: { name: string; parentId?: string | null }): Promise<Folder | null> => {
    if (!userId) return null;
    setError(null);

    const payload = {
      user_id: userId,
      name: folder.name,
      parent_id: folder.parentId || null,
    };

    const { data, error: insertError } = await supabase.from('folders').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao criar pasta:', insertError);
      setError('Erro ao criar pasta.');
      return null;
    }

    if (data && data[0]) {
      const normalized = normalizeFolder(data[0]);
      setFolders((prev) => (prev.some((f) => f.id === normalized.id) ? prev : [...prev, normalized]));
      return normalized;
    }
    return null;
  };

  const removeFolder = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar pasta:', deleteError);
      setError('Erro ao apagar pasta.');
      return false;
    }

    setFolders((prev) => prev.filter((f) => f.id !== id));
    return true;
  };

  return {
    notes,
    folders,
    links,
    loading,
    error,
    addNote,
    updateNote,
    removeNote,
    addFolder,
    removeFolder,
    refetch: fetchDados,
  };
}
