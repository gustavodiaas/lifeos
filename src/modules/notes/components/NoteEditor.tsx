import { useState, useEffect } from "react";
import type { Note, Folder } from "@/db/schema";
import {
  Save,
  Trash2,
  Eye,
  Edit2,
  Folder as FolderIcon,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  onSave: (updated: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
}

export function NoteEditor({ note, folders, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setFolderId(note.folderId || null);
      setTagsInput(note.tags ? note.tags.join(", ") : "");
    } else {
      setTitle("");
      setContent("");
      setFolderId(null);
      setTagsInput("");
    }
  }, [note]);

  if (!note) {
    return (
      <div className="glass-card p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
          <Sparkles size={32} />
        </div>
        <h3 className="text-lg font-bold text-foreground">Nenhuma nota selecionada</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Selecione uma nota no menu lateral ou crie uma nova nota para começar a escrever seus estudos.
        </p>
      </div>
    );
  }

  const folderOptions = [
    { value: "", label: "Sem Pasta (Raiz)" },
    ...folders.map((f) => ({ value: f.id, label: `📁 ${f.name}` })),
  ];

  const handleSave = () => {
    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    onSave({
      id: note.id,
      title: title.trim() || "Nota Sem Título",
      content,
      folderId: folderId || null,
      tags: tagsArray,
    });
  };

  // Renderizador simples de Markdown / Live Preview
  const renderFormattedContent = (rawText: string) => {
    if (!rawText) return <p className="text-muted-foreground italic text-xs">Nota vazia.</p>;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-2xl font-black text-foreground my-3">{line.slice(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-xl font-bold text-foreground my-2.5">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-lg font-bold text-foreground my-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-foreground my-1">
            {line.slice(2)}
          </li>
        );
      }

      // Suporte simples para [[WikiLinks]]
      const parts = line.split(/(\[\[.*?\]\])/g);
      return (
        <p key={idx} className="text-sm font-medium text-foreground leading-relaxed my-1.5 min-h-[1em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith("[[") && part.endsWith("]]")) {
              const linkText = part.slice(2, -2);
              return (
                <span key={pIdx} className="text-[#FCA311] font-bold bg-[#FCA311]/10 px-1.5 py-0.5 rounded cursor-pointer hover:underline">
                  [[{linkText}]]
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full space-y-4 border-border">

      {/* ── Action Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Custom Folder Select */}
        <div className="w-56">
          <CustomSelect
            options={folderOptions}
            value={folderId || ""}
            onChange={(val) => setFolderId(val || null)}
            placeholder="Selecione uma pasta..."
          />
        </div>

        {/* Toggle Editor / Live Preview + Delete + Save */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border/50">
            <button
              onClick={() => setPreviewMode(false)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
                !previewMode ? "bg-card text-[#FCA311] shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Edit2 size={13} />
              <span>Editar</span>
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
                previewMode ? "bg-card text-[#FCA311] shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye size={13} />
              <span>Visualizar</span>
            </button>
          </div>

          <button
            onClick={() => onDelete(note.id)}
            className="p-2 rounded-xl bg-muted/60 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            title="Excluir Nota"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={handleSave}
            className="btn-ios text-xs py-2 px-4"
          >
            <Save size={15} />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* ── Title Input ────────────────────────────────────────────── */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da Nota..."
          className="w-full bg-transparent text-2xl font-black text-foreground outline-none tracking-tight placeholder:text-muted-foreground/50"
        />
      </div>

      {/* ── Tags Input ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Tag size={14} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Etiquetas (ex: react, estudos, backend...)"
          className="w-full bg-transparent text-xs font-semibold text-muted-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* ── Editor Area / Live Preview ─────────────────────────────── */}
      <div className="flex-1 min-h-[300px] overflow-y-auto pt-2">
        {!previewMode ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seus estudos e anotações em Markdown aqui... Use [[Nome Da Nota]] para criar conexões entre notas!"
            className="w-full h-full bg-transparent text-sm font-medium text-foreground outline-none resize-none leading-relaxed font-mono"
          />
        ) : (
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 min-h-full">
            {renderFormattedContent(content)}
          </div>
        )}
      </div>
    </div>
  );
}
