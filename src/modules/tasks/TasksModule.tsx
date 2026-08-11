import { useState, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import type { Task, Project, TaskStatus, TaskPriority, ChecklistItem } from "@/lib/supabase";
import { TaskCard } from "./components/TaskCard";
import { TaskModal } from "./components/TaskModal";
import { ProjectModal } from "./components/ProjectModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "@/lib/toast";
import {
  Plus,
  CheckSquare,
  LayoutGrid,
  List,
  FolderPlus,
  Folder,
  Search,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

import { FocusTimer } from "@/components/widgets/FocusTimer";

export function TasksModule() {
  const { user } = useAuthContext();
  const {
    tasks,
    projects,
    loading,
    addTask,
    updateTask,
    removeTask,
    addProject,
  } = useTasks(user?.id);

  const activeProjects = useMemo(() => projects.filter((p) => !p.archivedAt && !p.archived_at), [projects]);

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>("todo");

  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDropOnColumn = (targetStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    handleStatusChange(taskId, targetStatus);
  };

  // Alternar checkbox de status da tarefa
  const handleToggleStatus = async (taskId: string) => {
    try {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const newStatus: TaskStatus = target.status === "done" ? "todo" : "done";
      const ok = await updateTask(taskId, { status: newStatus });
      if (ok && newStatus === "done") toast.success("Tarefa concluída!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  };

  // Mover status de coluna (todo <-> doing <-> done)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao mover tarefa.");
    }
  };

  // Alternar marcação de sub-checklist item
  const handleToggleChecklist = async (taskId: string, checklistId: string) => {
    try {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || !target.checklist) return;

      const updatedChecklist = target.checklist.map((c) =>
        c.id === checklistId ? { ...c, done: !c.done } : c
      );

      await updateTask(taskId, { checklist: updatedChecklist });
    } catch (err) {
      console.error(err);
    }
  };

  // Salvar / Editar Tarefa
  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    notes?: string;
    priority: TaskPriority;
    dueDate?: string | null;
    projectId?: string | null;
    status: TaskStatus;
    checklist: ChecklistItem[];
  }) => {
    try {
      if (taskData.id) {
        const ok = await updateTask(taskData.id, {
          title: taskData.title,
          notes: taskData.notes,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          projectId: taskData.projectId,
          status: taskData.status,
          checklist: taskData.checklist,
        });
        if (ok) toast.success("Tarefa atualizada!");
      } else {
        const ok = await addTask({
          title: taskData.title,
          notes: taskData.notes,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          projectId: taskData.projectId,
          status: taskData.status,
          checklist: taskData.checklist,
        });
        if (ok) toast.success("Nova tarefa criada!");
      }

      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar tarefa.");
    }
  };

  // Excluir Tarefa
  const confirmDeleteTask = async () => {
    if (!deleteConfig.id) return;
    try {
      const ok = await removeTask(deleteConfig.id);
      if (ok) toast.success("Tarefa excluída.");
      setDeleteConfig({ open: false, id: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir tarefa.");
    }
  };

  // Salvar Projeto
  const handleSaveProject = async (projectData: { name: string; color: string }) => {
    try {
      const ok = await addProject({
        name: projectData.name,
        color: projectData.color,
      });
      if (ok) {
        toast.success(`Projeto "${projectData.name}" criado!`);
        setProjectModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar projeto.");
    }
  };

  // Filtragem de tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedProjectId && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [tasks, searchQuery, selectedProjectId]);

  // Separação de colunas Kanban
  const todoTasks = useMemo(() => filteredTasks.filter((t) => t.status === "todo"), [filteredTasks]);
  const doingTasks = useMemo(() => filteredTasks.filter((t) => t.status === "doing"), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter((t) => t.status === "done"), [filteredTasks]);

  // Estatísticas do cabeçalho
  const todayStr = new Date().toISOString().slice(0, 10);
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const dueTodayCount = tasks.filter((t) => t.status !== "done" && t.dueDate === todayStr).length;
  const overdueCount = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr).length;
  const highPriorityCount = tasks.filter((t) => t.status !== "done" && t.priority === "high").length;

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── 1. Top Header & Ações ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-ios">Gerenciador de Tarefas</span>
            <span className="text-xs font-bold text-muted-foreground">{openCount} pendentes</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Tarefas & Projetos
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Modo Kanban vs Lista */}
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border/50">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "kanban" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={15} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "list" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={15} />
              <span>Lista</span>
            </button>
          </div>

          <button
            onClick={() => setProjectModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FolderPlus size={15} className="text-foreground" />
            <span>Novo Projeto</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setDefaultTaskStatus("todo");
              setTaskModalOpen(true);
            }}
            className="btn-ios text-xs py-2.5 px-4"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* ── Widget Pomodoro & Focus Timer ───────────────────────────── */}
      <FocusTimer tasks={tasks} />

      {/* ── 2. Cards de Métricas de Produtividade ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 font-bold text-sm">
            {openCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Abertas</p>
            <p className="text-xs font-extrabold text-foreground">Total Pendente</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 font-bold text-sm">
            {dueTodayCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hoje</p>
            <p className="text-xs font-extrabold text-foreground">Vencimento Hoje</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0 font-bold text-sm">
            {overdueCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atrasadas</p>
            <p className="text-xs font-extrabold text-foreground">Requerem Atenção</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 font-bold text-sm">
            {highPriorityCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prioritárias</p>
            <p className="text-xs font-extrabold text-foreground">Alta Prioridade</p>
          </div>
        </div>
      </div>

      {/* ── 3. Barra de Busca & Filtro de Projetos ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefa..."
            className="input-ios pl-10 py-2.5 text-xs"
          />
        </div>

        {/* Filtros por Projeto */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedProjectId === null
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todos os Projetos
          </button>

          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                selectedProjectId === p.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || "currentColor" }} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. CONTEÚDO: Visão Quadro KANBAN ─────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando quadro de tarefas...</p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Coluna 1: A FAZER (Todo) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn("todo"); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDropOnColumn("todo", e)}
            className={cn(
              "space-y-3 p-2 rounded-2xl transition-all duration-200 border border-transparent",
              dragOverColumn === "todo" && "border-foreground/50 bg-foreground/5 shadow-inner scale-[1.01]"
            )}
          >
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">A Fazer</h3>
                <span className="text-xs font-extrabold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {todoTasks.length}
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setDefaultTaskStatus("todo");
                  setTaskModalOpen(true);
                }}
                className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Adicionar A Fazer"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="space-y-3 min-h-[180px]">
              {todoTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center flex flex-col items-center justify-center h-32">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa pendente nesta coluna.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Arraste um cartão aqui</p>
                </div>
              ) : (
                todoTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    projects={projects}
                    onToggleStatus={handleToggleStatus}
                    onStatusChange={handleStatusChange}
                    onToggleChecklist={handleToggleChecklist}
                    onEdit={(tEdit) => {
                      setEditingTask(tEdit);
                      setTaskModalOpen(true);
                    }}
                    onDelete={(id) => setDeleteConfig({ open: true, id })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna 2: EM ANDAMENTO (Doing) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn("doing"); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDropOnColumn("doing", e)}
            className={cn(
              "space-y-3 p-2 rounded-2xl transition-all duration-200 border border-transparent",
              dragOverColumn === "doing" && "border-foreground/50 bg-foreground/5 shadow-inner scale-[1.01]"
            )}
          >
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Em Andamento</h3>
                <span className="text-xs font-extrabold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {doingTasks.length}
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setDefaultTaskStatus("doing");
                  setTaskModalOpen(true);
                }}
                className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Adicionar Em Andamento"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="space-y-3 min-h-[180px]">
              {doingTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center flex flex-col items-center justify-center h-32">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa em andamento.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Arraste um cartão aqui</p>
                </div>
              ) : (
                doingTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    projects={projects}
                    onToggleStatus={handleToggleStatus}
                    onStatusChange={handleStatusChange}
                    onToggleChecklist={handleToggleChecklist}
                    onEdit={(tEdit) => {
                      setEditingTask(tEdit);
                      setTaskModalOpen(true);
                    }}
                    onDelete={(id) => setDeleteConfig({ open: true, id })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna 3: CONCLUÍDAS (Done) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn("done"); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDropOnColumn("done", e)}
            className={cn(
              "space-y-3 p-2 rounded-2xl transition-all duration-200 border border-transparent",
              dragOverColumn === "done" && "border-emerald-500/50 bg-emerald-500/5 shadow-inner scale-[1.01]"
            )}
          >
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Concluídas</h3>
                <span className="text-xs font-extrabold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {doneTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[180px]">
              {doneTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center flex flex-col items-center justify-center h-32">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa concluída ainda.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Arraste um cartão aqui</p>
                </div>
              ) : (
                doneTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    projects={projects}
                    onToggleStatus={handleToggleStatus}
                    onStatusChange={handleStatusChange}
                    onToggleChecklist={handleToggleChecklist}
                    onEdit={(tEdit) => {
                      setEditingTask(tEdit);
                      setTaskModalOpen(true);
                    }}
                    onDelete={(id) => setDeleteConfig({ open: true, id })}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ── 5. CONTEÚDO: Visão LISTA Agrupada ───────────────────────────── */
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <CheckSquare size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Nenhuma tarefa encontrada</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 font-medium">
                  Crie a sua primeira tarefa para organizar o seu dia com prazos e checklists.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                className="btn-ios text-xs py-3 px-6"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Criar Primeira Tarefa</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  projects={projects}
                  onToggleStatus={handleToggleStatus}
                  onStatusChange={handleStatusChange}
                  onToggleChecklist={handleToggleChecklist}
                  onEdit={(tEdit) => {
                    setEditingTask(tEdit);
                    setTaskModalOpen(true);
                  }}
                  onDelete={(id) => setDeleteConfig({ open: true, id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Tarefa */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        projects={projects}
        editingTask={editingTask}
        defaultStatus={defaultTaskStatus}
      />

      {/* Modal de Criar Projeto */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
      />

      {/* Modal de Alerta para Exclusão */}
      <AlertModal
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDeleteTask}
        title="Excluir Tarefa?"
        message="Essa ação irá apagar permanentemente a tarefa e suas sub-tarefas."
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
