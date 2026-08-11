import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'O título da tarefa é obrigatório'),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
});

export const habitSchema = z.object({
  name: z.string().min(1, 'O nome do hábito é obrigatório'),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  targetPerWeek: z.number().min(1).max(7).default(7),
});

export const lancamentoSchema = z.object({
  descricao: z.string().min(1, 'A descrição é obrigatória'),
  valor: z.number().positive('O valor deve ser maior que zero'),
  tipo: z.enum(['entrada', 'saida']),
  categoria: z.string().nullable().optional(),
  data: z.string().min(1, 'A data é obrigatória'),
  is_recorrente: z.boolean().default(false),
});

export const goalSchema = z.object({
  title: z.string().min(1, 'O título da meta é obrigatório'),
  scope: z.enum(['short', 'medium', 'long', 'year', 'quarter', 'month']).default('year'),
  period: z.string().min(1, 'O período é obrigatório'),
  target: z.number().min(1, 'A meta alvo deve ser pelo menos 1'),
  unit: z.string().default('%'),
  progress: z.number().min(0).default(0),
});
