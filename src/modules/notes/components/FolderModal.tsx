import { useState } from "react";
import { X, Save, FolderPlus } from "lucide-react";

interface FolderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (folderName: string) => void;
}

export function FolderModal({ open, onClose, onSave }: FolderModalProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
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
            <h2 className="text-base font-extrabold text-foreground tracking-tight">Nova Pasta</h2>
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
              Nome da Pasta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Programação, Faculdade, Livros..."
              className="input-ios font-bold text-sm"
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn-ios w-full py-3.5 mt-2 text-xs font-black uppercase tracking-wider">
            <Save size={16} />
            <span>Criar Pasta</span>
          </button>
        </form>
      </div>
    </div>
  );
}
