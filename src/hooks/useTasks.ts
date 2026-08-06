import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, Project, TaskStatus, TaskPriority, ChecklistItem } from '@/lib/supabase';

function normalizeTask(item: any): Task {
  return {
    ...item,
    dueDate: item.due_date ?? item.dueDate ?? null,
    due_date: item.due_date ?? item.dueDate ?? null,
    projectId: item.project_id ?? item.projectId ?? null,
    project_id: item.project_id ?? item.projectId ?? null,
    checklist: Array.isArray(item.checklist) ? item.checklist : [],
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

function normalizeProject(item: any): Project {
  return {
    ...item,
    archivedAt: item.archived_at ?? item.archivedAt ?? null,
    archived_at: item.archived_at ?? item.archivedAt ?? null,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('projects').select('*').eq('user_id', userId),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setTasks((tasksRes.data || []).map(normalizeTask));
      setProjects((projectsRes.data || []).map(normalizeProject));
    } catch (err: any) {
      console.error('Erro ao buscar tarefas/projetos:', err);
      setError('Falha ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Realtime
  useEffect(() => {
    if (!userId) return;

    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const normalized = normalizeTask(payload.new);
            setTasks((prev) => (prev.some((t) => t.id === normalized.id) ? prev : [...prev, normalized]));
          } else if (payload.eventType === 'UPDATE') {
            const normalized = normalizeTask(payload.new);
            setTasks((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    const projectsChannel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const normalized = normalizeProject(payload.new);
            setProjects((prev) => (prev.some((p) => p.id === normalized.id) ? prev : [...prev, normalized]));
          } else if (payload.eventType === 'UPDATE') {
            const normalized = normalizeProject(payload.new);
            setProjects((prev) => prev.map((p) => (p.id === normalized.id ? normalized : p)));
          } else if (payload.eventType === 'DELETE') {
            setProjects((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [userId]);

  const addTask = async (task: {
    title: string;
    notes?: string;
    priority: TaskPriority;
    dueDate?: string | null;
    projectId?: string | null;
    status: TaskStatus;
    checklist?: ChecklistItem[];
  }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload = {
      user_id: userId,
      title: task.title,
      notes: task.notes || null,
      priority: task.priority,
      due_date: task.dueDate || null,
      project_id: task.projectId || null,
      status: task.status,
      checklist: task.checklist || [],
    };

    const { data, error: insertError } = await supabase.from('tasks').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar tarefa:', insertError);
      setError('Erro ao salvar tarefa.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeTask(data[0]);
      setTasks((prev) => (prev.some((t) => t.id === normalized.id) ? prev : [...prev, normalized]));
    }
    return true;
  };

  const updateTask = async (id: string, task: Partial<Task>): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload: any = {};
    if (task.title !== undefined) payload.title = task.title;
    if (task.notes !== undefined) payload.notes = task.notes;
    if (task.priority !== undefined) payload.priority = task.priority;
    if (task.dueDate !== undefined) payload.due_date = task.dueDate;
    if (task.due_date !== undefined) payload.due_date = task.due_date;
    if (task.projectId !== undefined) payload.project_id = task.projectId;
    if (task.project_id !== undefined) payload.project_id = task.project_id;
    if (task.status !== undefined) payload.status = task.status;
    if (task.checklist !== undefined) payload.checklist = task.checklist;
    payload.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar tarefa:', updateError);
      setError('Erro ao atualizar tarefa.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeTask(data[0]);
      setTasks((prev) => prev.map((t) => (t.id === id ? normalized : t)));
    }
    return true;
  };

  const removeTask = async (id: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao apagar tarefa:', deleteError);
      setError('Erro ao apagar tarefa.');
      return false;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    return true;
  };

  const addProject = async (project: { name: string; color?: string }): Promise<boolean> => {
    if (!userId) return false;
    setError(null);

    const payload = {
      user_id: userId,
      name: project.name,
      color: project.color || '#FCA311',
    };

    const { data, error: insertError } = await supabase.from('projects').insert([payload]).select();
    if (insertError) {
      console.error('Erro ao adicionar projeto:', insertError);
      setError('Erro ao criar projeto.');
      return false;
    }

    if (data && data[0]) {
      const normalized = normalizeProject(data[0]);
      setProjects((prev) => (prev.some((p) => p.id === normalized.id) ? prev : [...prev, normalized]));
    }
    return true;
  };

  return {
    tasks,
    projects,
    loading,
    error,
    addTask,
    updateTask,
    removeTask,
    addProject,
    refetch: fetchDados,
  };
}
