import { useState, useEffect } from "react";
import type { Task, Project, TaskPriority, TaskStatus, ChecklistItem } from "@/lib/supabase";
import { X, Save, Plus, Trash2, CheckSquare, Calendar, Folder } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { ModalPortal } from "@/components/ui/ModalPortal";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskData: {
    id?: string;
    title: string;
    notes?: string;
    priority: TaskPriority;
    dueDate?: string | null;
    projectId?: string | null;
    status: TaskStatus;
    checklist: ChecklistItem[];
  }) => void;
  projects: Project[];
  editingTask?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskModal({
  open,
  onClose,
  onSave,
  projects,
  editingTask,
  defaultStatus = "todo",
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setNotes(editingTask.notes || "");
      setPriority(editingTask.priority || "med");
      setDueDate(editingTask.dueDate || "");
      setProjectId(editingTask.projectId || null);
      setStatus(editingTask.status || "todo");
      setChecklist(editingTask.checklist || []);
    } else {
      setTitle("");
      setNotes("");
      setPriority("med");
      setDueDate("");
      setProjectId(null);
      setStatus(defaultStatus);
      setChecklist([]);
    }
    setNewChecklistText("");
  }, [editingTask, defaultStatus, open]);

  if (!open) return null;

  const projectOptions = [
    { value: "", label: "Nenhum Projeto" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newChecklistText.trim(),
      done: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingTask?.id,
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || null,
      projectId: projectId || null,
      status,
      checklist,
    });
  };

  return (
    <ModalPortal open={open} onClose={onClose}>
      <div className="bg-card w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh] slide-up">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <CheckSquare size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Título */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Título da Tarefa
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Finalizar relatório de vendas, Comprar suprimentos..."
              className="input-ios font-bold text-base"
              required
              autoFocus
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  priority === "low"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-500 font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                🟢 Baixa
              </button>

              <button
                type="button"
                onClick={() => setPriority("med")}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  priority === "med"
                    ? "border-foreground bg-muted text-foreground font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                🟡 Média
              </button>

              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  priority === "high"
                    ? "border-red-500 bg-red-500/15 text-red-500 font-extrabold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                🔴 Alta
              </button>
            </div>
          </div>

          {/* Grid de Projeto & Data Limite (Com componentes Apple Glass) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 ml-1">
                <Folder size={13} className="text-foreground" />
                Projeto
              </label>
              <CustomSelect
                options={projectOptions}
                value={projectId || ""}
                onChange={(val) => setProjectId(val || null)}
                placeholder="Selecione um Projeto..."
              />
            </div>

            <div>
              <CustomDatePicker
                label="Data de Entrega"
                value={dueDate}
                onChange={setDueDate}
              />
            </div>
          </div>

          {/* Notas / Descrição */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">
              Notas & Detalhes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações, links ou detalhes adicionais..."
              rows={2}
              className="input-ios text-sm"
            />
          </div>

          {/* Sub-checklist Dinâmico */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">
              Sub-tarefas (Checklist)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Adicionar item..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="input-ios py-2 text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="p-2.5 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs shrink-0 flex items-center gap-1 border border-border/60"
              >
                <Plus size={16} />
              </button>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-foreground truncate">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-ios w-full py-4 mt-3 text-sm font-black uppercase tracking-wider"
          >
            <Save size={18} />
            <span>{editingTask ? "Salvar Alterações" : "Criar Tarefa"}</span>
          </button>
        </form>
      </div>
    </ModalPortal>
  );
}
