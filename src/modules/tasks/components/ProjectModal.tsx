import { useState } from "react";
import { X, Save, FolderPlus } from "lucide-react";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (projectData: { name: string; color: string }) => void;
}

const COLOR_OPTIONS = [
  "#FCA311", // Amber
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Orange
  "#64748B", // Slate
];

export function ProjectModal({ open, onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    setName("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
      <div className="bg-card w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden flex flex-col slide-up">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
              <FolderPlus size={18} />
            </div>
            <h2 className="text-base font-extrabold text-foreground tracking-tight">Novo Projeto</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trabalho, Estudos, Casa..."
              className="input-ios font-bold text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform border-2 ${
                    color === c ? "scale-125 border-foreground shadow-md" : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-ios w-full py-3.5 mt-2 text-xs font-black uppercase tracking-wider">
            <Save size={16} />
            <span>Criar Projeto</span>
          </button>
        </form>
      </div>
    </div>
  );
}
