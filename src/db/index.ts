import Dexie, { type Table } from "dexie";
import type {
  Note,
  Folder,
  NoteLink,
  Habit,
  HabitLog,
  Task,
  Project,
  Goal,
  Transaction,
  Category,
  FinancialGoal,
  JournalEntry,
  Metric,
  Achievement,
  KV,
} from "./schema";

export class LifeOSDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  note_links!: Table<NoteLink, string>;
  habits!: Table<Habit, string>;
  habit_logs!: Table<HabitLog, string>;
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  goals!: Table<Goal, string>;
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  financial_goals!: Table<FinancialGoal, string>;
  journal_entries!: Table<JournalEntry, string>;
  metrics!: Table<Metric, string>;
  achievements!: Table<Achievement, string>;
  kv!: Table<KV, string>;

  constructor() {
    super("lifeos");
    this.version(1).stores({
      notes: "id, parentId, folderId, updatedAt, *tags",
      folders: "id, parentId, updatedAt",
      note_links: "id, fromId, toId",
      habits: "id, archivedAt, updatedAt",
      habit_logs: "id, [habitId+date], date",
      tasks: "id, status, dueDate, projectId, priority, updatedAt",
      projects: "id, archivedAt, updatedAt",
      goals: "id, scope, period, updatedAt",
      transactions: "id, date, categoryId, type, updatedAt",
      categories: "id, type, updatedAt",
      financial_goals: "id, dueDate, updatedAt",
      journal_entries: "id, date, updatedAt",
      metrics: "id, key, date, [key+date]",
      achievements: "id, key, unlockedAt",
      kv: "key",
    });
  }
}

let _db: LifeOSDB | null = null;
export function db(): LifeOSDB {
  if (typeof window === "undefined") {
    throw new Error("LifeOS DB is only available in the browser");
  }
  if (!_db) _db = new LifeOSDB();
  return _db;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const nowIso = () => new Date().toISOString();

export async function exportAll(): Promise<Record<string, unknown[]>> {
  const d = db();
  const out: Record<string, unknown[]> = {};
  await Promise.all(
    d.tables.map(async (t) => {
      out[t.name] = await t.toArray();
    }),
  );
  return out;
}

export async function importAll(data: Record<string, unknown[]>) {
  const d = db();
  await d.transaction("rw", d.tables, async () => {
    for (const t of d.tables) {
      const rows = data[t.name];
      if (!Array.isArray(rows)) continue;
      await t.clear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await t.bulkPut(rows as any);
    }
  });
}