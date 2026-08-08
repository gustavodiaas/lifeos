import { useState } from "react";
import type { Task, Project, TaskStatus } from "@/lib/supabase";
import {
  Check,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit3,
  Trash2,
  ListTodo,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  projects: Project[];
  onToggleStatus: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleChecklist: (taskId: string, checklistId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({
  task,
  projects,
  onToggleStatus,
  onStatusChange,
  onToggleChecklist,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);

  // Calcula estatísticas do checklist
  const totalChecklist = task.checklist?.length || 0;
  const doneChecklist = task.checklist?.filter((c) => c.done).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((doneChecklist / totalChecklist) * 100) : 0;

  // Verificação de data limite / atraso
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== "done";
  const isDueToday = task.dueDate === todayStr && task.status !== "done";

  // Visual da Prioridade
  const priorityConfig = {
    high: { label: "Alta", color: "bg-red-500/15 text-red-500 border-red-500/30" },
    med: { label: "Média", color: "bg-muted text-foreground border-border" },
    low: { label: "Baixa", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  }[task.priority || "med"];

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all duration-200 relative group flex flex-col justify-between space-y-3",
        task.status === "done" && "opacity-75 bg-muted/20"
      )}
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Status Checkbox */}
          <button
            type="button"
            onClick={() => onToggleStatus(task.id)}
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ios-spring mt-0.5 border-2",
              task.status === "done"
                ? "bg-foreground border-foreground text-black shadow-sm"
                : "border-border/80 hover:border-foreground bg-muted/40 text-transparent"
            )}
          >
            <Check size={14} strokeWidth={3} className={task.status === "done" ? "opacity-100" : "opacity-0"} />
          </button>

          {/* Title & Project Pill */}
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                "text-sm font-bold text-foreground tracking-tight leading-snug transition-colors",
                task.status === "done" && "line-through text-muted-foreground font-normal"
              )}
            >
              {task.title}
            </h4>

            {/* Sub-info: Project & Priority */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {project && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                  <Folder size={11} style={{ color: project.color || "currentColor" }} />
                  <span>{project.name}</span>
                </span>
              )}

              <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-md border", priorityConfig.color)}>
                {priorityConfig.label}
              </span>

              {/* Data limite */}
              {task.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border",
                    isOverdue
                      ? "bg-red-500/15 text-red-500 border-red-500/30 font-black animate-pulse"
                      : isDueToday
                      ? "bg-muted text-foreground border-border"
                      : "bg-muted text-muted-foreground border-border/50"
                  )}
                >
                  <Calendar size={11} />
                  <span>{isOverdue ? `Atrasou (${task.dueDate})` : isDueToday ? "Vence Hoje" : task.dueDate}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MoreVertical size={15} />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 w-44 glass-card p-1.5 z-30 shadow-xl border border-border space-y-1 fade-in"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => { onEdit(task); setShowMenu(false); }}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Edit3 size={14} className="text-foreground" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Descrição / Notas ─────────────────────────────────────── */}
      {task.notes && (
        <p className="text-xs text-muted-foreground font-medium line-clamp-2 pl-9">
          {task.notes}
        </p>
      )}

      {/* ── Sub-checklist ────────────────────────────────────────── */}
      {totalChecklist > 0 && (
        <div className="pl-9 space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpandedChecklist(!expandedChecklist)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ListTodo size={13} className="text-foreground" />
              <span>Sub-tarefas ({doneChecklist}/{totalChecklist})</span>
            </button>
            <span className="text-[10px] font-black text-muted-foreground">{checklistPercent}%</span>
          </div>

          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${checklistPercent}%` }}
            />
          </div>

          {expandedChecklist && (
            <div className="space-y-1.5 pt-1">
              {task.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggleChecklist(task.id, item.id)}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0",
                      item.done
                        ? "bg-foreground border-foreground text-black"
                        : "border-border text-transparent"
                    )}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold text-foreground transition-all truncate",
                      item.done && "line-through text-muted-foreground font-normal"
                    )}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mover entre colunas no Kanban ──────────────────────────── */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-muted-foreground/70">Mover:</span>

        <div className="flex items-center gap-1">
          {task.status !== "todo" && (
            <button
              onClick={() => onStatusChange(task.id, task.status === "done" ? "doing" : "todo")}
              className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={12} />
              <span>{task.status === "done" ? "Em Andamento" : "A Fazer"}</span>
            </button>
          )}

          {task.status !== "done" && (
            <button
              onClick={() => onStatusChange(task.id, task.status === "todo" ? "doing" : "done")}
              className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 transition-colors"
            >
              <span>{task.status === "todo" ? "Em Andamento" : "Concluir"}</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
