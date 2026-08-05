import { useState, useEffect, useMemo, useCallback } from "react";
import { db, newId, nowIso } from "@/db";
import type { Task, Project, TaskStatus, TaskPriority, ChecklistItem } from "@/db/schema";
import { TaskCard } from "./components/TaskCard";
import { TaskModal } from "./components/TaskModal";
import { ProjectModal } from "./components/ProjectModal";
import { AlertModal } from "@/modules/finance/components/AlertModal";
import { toast } from "sonner";
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

export function TasksModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Carrega tarefas e projetos do IndexedDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const d = db();
      const [allTasks, allProjects] = await Promise.all([
        d.tasks.toArray(),
        d.projects.filter((p) => !p.archivedAt).toArray(),
      ]);
      setTasks(allTasks);
      setProjects(allProjects);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
      toast.error("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Alternar checkbox de status da tarefa
  const handleToggleStatus = async (taskId: string) => {
    try {
      const d = db();
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const newStatus: TaskStatus = target.status === "done" ? "todo" : "done";
      await d.tasks.update(taskId, { status: newStatus, updatedAt: nowIso() });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: nowIso() } : t))
      );

      if (newStatus === "done") toast.success("Tarefa concluída!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  };

  // Mover status de coluna (todo <-> doing <-> done)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const d = db();
      await d.tasks.update(taskId, { status: newStatus, updatedAt: nowIso() });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: nowIso() } : t))
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao mover tarefa.");
    }
  };

  // Alternar marcação de sub-checklist item
  const handleToggleChecklist = async (taskId: string, checklistId: string) => {
    try {
      const d = db();
      const target = tasks.find((t) => t.id === taskId);
      if (!target || !target.checklist) return;

      const updatedChecklist = target.checklist.map((c) =>
        c.id === checklistId ? { ...c, done: !c.done } : c
      );

      await d.tasks.update(taskId, { checklist: updatedChecklist, updatedAt: nowIso() });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, checklist: updatedChecklist, updatedAt: nowIso() } : t))
      );
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
      const d = db();
      const now = nowIso();

      if (taskData.id) {
        await d.tasks.update(taskData.id, {
          title: taskData.title,
          notes: taskData.notes,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          projectId: taskData.projectId,
          status: taskData.status,
          checklist: taskData.checklist,
          updatedAt: now,
        });
        toast.success("Tarefa atualizada!");
      } else {
        const newTask: Task = {
          id: newId(),
          title: taskData.title,
          notes: taskData.notes,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          projectId: taskData.projectId,
          status: taskData.status,
          checklist: taskData.checklist,
          createdAt: now,
          updatedAt: now,
        };
        await d.tasks.add(newTask);
        toast.success("Nova tarefa criada!");
      }

      setTaskModalOpen(false);
      setEditingTask(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar tarefa.");
    }
  };

  // Excluir Tarefa
  const confirmDeleteTask = async () => {
    if (!deleteConfig.id) return;
    try {
      const d = db();
      await d.tasks.delete(deleteConfig.id);
      toast.success("Tarefa excluída.");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir tarefa.");
    }
  };

  // Salvar Projeto
  const handleSaveProject = async (projectData: { name: string; color: string }) => {
    try {
      const d = db();
      const now = nowIso();
      const newProj: Project = {
        id: newId(),
        name: projectData.name,
        color: projectData.color,
        createdAt: now,
        updatedAt: now,
      };
      await d.projects.add(newProj);
      toast.success(`Projeto "${projectData.name}" criado!`);
      setProjectModalOpen(false);
      await loadData();
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
                viewMode === "kanban" ? "bg-card text-[#FCA311] shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={15} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "list" ? "bg-card text-[#FCA311] shadow-sm" : "text-muted-foreground hover:text-foreground"
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
            <FolderPlus size={15} className="text-[#FCA311]" />
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

      {/* ── 2. Cards de Métricas de Produtividade ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm">
            {openCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Abertas</p>
            <p className="text-xs font-extrabold text-foreground">Total Pendente</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center shrink-0 font-bold text-sm">
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
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 font-bold text-sm">
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
                ? "bg-[#FCA311] text-black shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todos os Projetos
          </button>

          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                selectedProjectId === p.id
                  ? "bg-[#FCA311] text-black shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || "#FCA311" }} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. CONTEÚDO: Visão Quadro KANBAN ─────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#FCA311] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">Carregando quadro de tarefas...</p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Coluna 1: A FAZER (Todo) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
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

            <div className="space-y-3 min-h-[150px]">
              {todoTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa pendente nesta coluna.</p>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FCA311]" />
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

            <div className="space-y-3 min-h-[150px]">
              {doingTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa em andamento.</p>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Concluídas</h3>
                <span className="text-xs font-extrabold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {doneTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[150px]">
              {doneTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa concluída ainda.</p>
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
              <div className="w-16 h-16 rounded-3xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto">
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
