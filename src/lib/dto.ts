import type { Task, Habit, Goal, Lancamento } from './supabase';

export function toTaskDTO(item: any): Task {
  return {
    ...item,
    dueDate: item.due_date ?? item.dueDate ?? null,
    due_date: item.due_date ?? item.dueDate ?? null,
    projectId: item.project_id ?? item.projectId ?? null,
    project_id: item.project_id ?? item.projectId ?? null,
    priority: (item.priority === 'med' ? 'medium' : item.priority) || 'medium',
    checklist: Array.isArray(item.checklist) ? item.checklist : [],
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function toHabitDTO(item: any): Habit {
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

export function toGoalDTO(item: any): Goal {
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

export function toLancamentoDTO(item: any): Lancamento {
  return {
    id: item.id,
    user_id: item.user_id,
    descricao: item.descricao || '',
    valor: Number(item.valor) || 0,
    data: item.data || new Date().toISOString().slice(0, 10),
    categoria: item.categoria || null,
    tipo: item.tipo === 'entrada' ? 'entrada' : 'saida',
    is_recorrente: Boolean(item.is_recorrente),
    grupo_recorrencia_id: item.grupo_recorrencia_id || null,
    created_at: item.created_at,
  };
}
