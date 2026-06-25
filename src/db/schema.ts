export interface Timestamped {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Note extends Timestamped {
  title: string;
  content: string;
  parentId?: string | null;
  folderId?: string | null;
  tags: string[];
}

export interface Folder extends Timestamped {
  name: string;
  parentId?: string | null;
}

export interface NoteLink {
  id: string;
  fromId: string;
  toId: string;
}

export type HabitFrequency = "daily" | "weekly" | "custom";

export interface Habit extends Timestamped {
  name: string;
  frequency: HabitFrequency;
  targetPerWeek: number;
  archivedAt?: string | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = "low" | "med" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task extends Timestamped {
  title: string;
  notes?: string;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  status: TaskStatus;
  checklist: ChecklistItem[];
}

export interface Project extends Timestamped {
  name: string;
  color?: string;
  archivedAt?: string | null;
}

export type GoalScope = "year" | "quarter" | "month";

export interface Goal extends Timestamped {
  title: string;
  scope: GoalScope;
  period: string; // e.g. 2026, 2026-Q1, 2026-03
  target?: number;
  unit?: string;
  progress: number;
  linkedHabitId?: string | null;
  linkedMetric?: string | null;
}

export type TxType = "income" | "expense";

export interface Transaction extends Timestamped {
  type: TxType;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  categoryId?: string | null;
  note?: string;
}

export interface Category extends Timestamped {
  name: string;
  type: TxType;
  color?: string;
  budget?: number;
}

export interface FinancialGoal extends Timestamped {
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string | null;
}

export interface JournalEntry extends Timestamped {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  content: string;
  highlights: string[];
}

export interface Metric {
  id: string;
  key: string; // weight, study_hours, etc.
  date: string;
  value: number;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  unlockedAt: string;
  meta?: Record<string, unknown>;
}

export interface KV {
  key: string;
  value: unknown;
}