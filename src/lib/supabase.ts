import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HabitFrequency = "daily" | "weekly";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "doing" | "done";
export type GoalScope = "short" | "medium" | "long";
export type BookStatus = "reading" | "want" | "completed";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  frequency: HabitFrequency;
  targetPerWeek: number;
  target_per_week?: number;
  archivedAt: string | null;
  archived_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface HabitLog {
  id: string;
  user_id?: string;
  habitId: string;
  habit_id?: string;
  date: string;
  done: boolean;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  due_date?: string | null;
  projectId: string | null;
  project_id?: string | null;
  tags?: string[];
  checklist?: ChecklistItem[];
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  folderId: string | null;
  folder_id?: string | null;
  tags?: string[];
  deletedAt?: string | null;
  deleted_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  user_id?: string;
  name: string;
  parentId?: string | null;
  parent_id?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface NoteLink {
  id: string;
  user_id?: string;
  sourceNoteId: string;
  source_note_id?: string;
  targetNoteId: string;
  target_note_id?: string;
  createdAt: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  scope: GoalScope;
  targetDate: string;
  target_date?: string;
  progress: number;
  target: number;
  linkedHabitId?: string | null;
  linked_habit_id?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  content: string;
  highlights: string[];
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Metric {
  id: string;
  user_id?: string;
  key: string;
  value: number;
  unit: string;
  date: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Book {
  id: string;
  user_id?: string;
  title: string;
  author: string;
  cover?: string;
  totalPages: number;
  total_pages?: number;
  currentPage: number;
  current_page?: number;
  status: BookStatus;
  isbn?: string;
  publisher?: string;
  year?: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}
