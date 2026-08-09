import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Note } from "@/lib/supabase";
import {
  Plus, Search, Atom, GitBranch, LayoutGrid,
  Sprout, Leaf, TreePine, Tag, X, Edit3, Trash2,
  Save, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/modules/finance/components/AlertModal";

// ── Tipos ─────────────────────────────────────────────────────────────────
type Maturity = "semente" | "crescimento" | "evergreen";
type ViewMode = "grid" | "graph";

interface AtomicNote extends Note {
  domain: string;
  maturity: Maturity;
  cleanContent: string;
}

// Metadados armazenados nas tags: "domain:lean", "maturity:evergreen"
function parseTags(tags: string[] = []): { domain: string; maturity: Maturity; userTags: string[] } {
  let domain = "";
  let maturity: Maturity = "semente";
  const userTags: string[] = [];
  for (const t of tags) {
    if (t.startsWith("domain:")) domain = t.slice(7);
    else if (t.startsWith("maturity:")) maturity = t.slice(9) as Maturity;
    else userTags.push(t);
  }
  return { domain, maturity, userTags };
}

function buildTags(userTags: string[], domain: string, maturity: Maturity): string[] {
  return [
    ...userTags,
    ...(domain ? [`domain:${domain}`] : []),
    `maturity:${maturity}`,
  ];
}

function toAtomic(note: Note): AtomicNote {
  const { domain, maturity, userTags } = parseTags(note.tags);
  return { ...note, domain, maturity, cleanContent: note.content, tags: userTags };
}

// ── Domínios predefinidos ─────────────────────────────────────────────────
const DOMAINS = [
  "Lean", "Desenvolvimento", "Finanças", "Gestão",
  "Sistemas", "Aprendizado", "Produtividade", "Outros",
];

// ── Maturidade — visual monocromático com densidade de preenchimento ──────
const MATURITY: Record<Maturity, {
  label: string;
  icon: React.FC<any>;
  pill: string;       // classe da pílula no card
  border: string;     // borda do card
}> = {
  semente:     { label: "Semente",     icon: Sprout,   pill: "bg-muted text-muted-foreground border-border",          border: "border-border" },
  crescimento: { label: "Crescimento", icon: Leaf,     pill: "bg-foreground/10 text-foreground border-foreground/20", border: "border-foreground/30" },
  evergreen:   { label: "Evergreen",   icon: TreePine, pill: "bg-foreground text-background border-foreground",        border: "border-foreground" },
};

// ── Props ─────────────────────────────────────────────────────────────────
interface AtomicNotesViewProps {
  notes: Note[];
  onSave: (updated: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => void;
  onCreateNote: (overrides: { title: string; content: string; tags: string[] }) => Promise<Note | null>;
}

export function AtomicNotesView({ notes, onSave, onDelete, onCreateNote }: AtomicNotesViewProps) {
  const [viewMode, setViewMode]               = useState<ViewMode>("grid");
  const [search, setSearch]                   = useState("");
  const [filterDomain, setFilterDomain]       = useState("");
  const [filterMaturity, setFilterMaturity]   = useState<Maturity | "">("");
  const [editingNote, setEditingNote]         = useState<AtomicNote | null>(null);
  const [deleteId, setDeleteId]               = useState<string | null>(null);

  const atomicNotes = useMemo(() => notes.map(toAtomic), [notes]);

  const existingDomains = useMemo(() => {
    const s = new Set(atomicNotes.map((n) => n.domain).filter(Boolean));
    return Array.from(s);
  }, [atomicNotes]);

  const filtered = useMemo(() => atomicNotes.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.cleanContent.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDomain   && n.domain   !== filterDomain)   return false;
    if (filterMaturity && n.maturity !== filterMaturity)  return false;
    return true;
  }), [atomicNotes, search, filterDomain, filterMaturity]);

  const handleCreate = async () => {
    const tags = buildTags([], filterDomain || "Outros", filterMaturity || "semente");
    const created = await onCreateNote({ title: "Nova Nota Atômica", content: "", tags });
    if (created) setEditingNote(toAtomic(created));
  };

  const handleSaveEdit = async (draft: AtomicNote, userTags: string[]) => {
    const tags = buildTags(userTags, draft.domain, draft.maturity);
    await onSave({ id: draft.id, title: draft.title, content: draft.cleanContent, tags });
    setEditingNote(null);
  };

  // Contadores por maturidade
  const counts = useMemo(() => {
    const c: Record<Maturity, number> = { semente: 0, crescimento: 0, evergreen: 0 };
    atomicNotes.forEach((n) => c[n.maturity]++);
    return c;
  }, [atomicNotes]);

  return (
    <div className="space-y-4 fade-in">

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="glass-card p-3 rounded-2xl border border-border flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas atômicas..."
            className="input-ios pl-8 py-1.5 text-xs w-full"
          />
        </div>

        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="input-ios py-1.5 text-xs min-w-[110px] flex-none"
        >
          <option value="">Todos domínios</option>
          {[...new Set([...existingDomains, ...DOMAINS])].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Toggle view */}
        <div className="flex p-0.5 bg-muted rounded-xl border border-border shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          ><LayoutGrid size={14} /></button>
          <button
            onClick={() => setViewMode("graph")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "graph" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          ><GitBranch size={14} /></button>
        </div>

        <button onClick={handleCreate} className="btn-ios text-xs py-1.5 px-3 shrink-0">
          <Plus size={13} strokeWidth={2.5} /><span>Nova</span>
        </button>
      </div>

      {/* ── Filtros de maturidade ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["semente", "crescimento", "evergreen"] as Maturity[]).map((m) => {
          const meta = MATURITY[m];
          const Icon = meta.icon;
          const active = filterMaturity === m;
          return (
            <button
              key={m}
              onClick={() => setFilterMaturity(active ? "" : m)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all",
                active ? meta.pill : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon size={12} />
              <span>{meta.label}</span>
              <span className="font-extrabold opacity-70">{counts[m]}</span>
            </button>
          );
        })}
        <span className="text-[11px] text-muted-foreground ml-auto font-medium">
          {filtered.length} / {atomicNotes.length}
        </span>
      </div>

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      {viewMode === "grid"
        ? <AtomicGrid notes={filtered} onEdit={setEditingNote} onDelete={setDeleteId} />
        : <AtomicGraph notes={atomicNotes} filtered={filtered} onEdit={setEditingNote} />
      }

      {/* ── Modal de edição ──────────────────────────────────────────── */}
      {editingNote && (
        <AtomicEditModal
          note={editingNote}
          onSave={handleSaveEdit}
          onClose={() => setEditingNote(null)}
        />
      )}

      <AlertModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        title="Excluir nota atômica?"
        message="Essa ação é irreversível."
        type="danger"
        confirmText="Excluir"
      />
    </div>
  );
}

// ── Grade por domínio ─────────────────────────────────────────────────────
function AtomicGrid({ notes, onEdit, onDelete }: {
  notes: AtomicNote[];
  onEdit: (n: AtomicNote) => void;
  onDelete: (id: string) => void;
}) {
  if (notes.length === 0) return (
    <div className="glass-card p-10 text-center rounded-2xl border border-border space-y-3">
      <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center mx-auto">
        <Atom size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-bold text-foreground">Nenhuma nota atômica</p>
      <p className="text-xs text-muted-foreground">Uma nota = uma ideia. Crie a primeira.</p>
    </div>
  );

  const grouped = notes.reduce<Record<string, AtomicNote[]>>((acc, n) => {
    const d = n.domain || "Sem Domínio";
    (acc[d] = acc[d] || []).push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([domain, items]) => (
        <div key={domain} className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{domain}</span>
            <span className="text-[10px] text-muted-foreground">({items.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((note) => <AtomicCard key={note.id} note={note} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function AtomicCard({ note, onEdit, onDelete }: {
  note: AtomicNote;
  onEdit: (n: AtomicNote) => void;
  onDelete: (id: string) => void;
}) {
  const meta = MATURITY[note.maturity];
  const Icon = meta.icon;
  const preview = note.cleanContent.replace(/#+\s/g, "").slice(0, 110);

  return (
    <div
      onClick={() => onEdit(note)}
      className={cn(
        "glass-card p-4 rounded-2xl border flex flex-col gap-2.5 cursor-pointer transition-all group hover:shadow-md",
        meta.border
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border", meta.pill)}>
          <Icon size={10} />{meta.label}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            className="p-1 rounded-lg bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground">
            <Edit3 size={11} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="p-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-extrabold text-foreground leading-tight line-clamp-2">{note.title}</h3>

      {preview && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{preview}</p>}

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {note.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Grafo SVG ─────────────────────────────────────────────────────────────
function AtomicGraph({ notes, filtered, onEdit }: {
  notes: AtomicNote[];
  filtered: AtomicNote[];
  onEdit: (n: AtomicNote) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dim, setDim]         = useState({ w: 800, h: 480 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pos, setPos]         = useState<Record<string, { x: number; y: number }>>({});
  const offset                = useRef({ x: 0, y: 0 });

  const filteredIds = useMemo(() => new Set(filtered.map((n) => n.id)), [filtered]);

  // Inicializa posições em clusters por domínio
  useEffect(() => {
    if (!notes.length) return;
    const { w, h } = dim;
    const byDomain: Record<string, AtomicNote[]> = {};
    notes.forEach((n) => { const d = n.domain || "—"; (byDomain[d] = byDomain[d] || []).push(n); });
    const domains = Object.keys(byDomain);
    const next: Record<string, { x: number; y: number }> = {};
    domains.forEach((d, di) => {
      const a = (di / domains.length) * Math.PI * 2;
      const cr = Math.min(w, h) * 0.28;
      const cx = w / 2 + Math.cos(a) * cr;
      const cy = h / 2 + Math.sin(a) * cr;
      byDomain[d].forEach((n, ni) => {
        if (pos[n.id]) { next[n.id] = pos[n.id]; return; }
        const na = (ni / byDomain[d].length) * Math.PI * 2;
        const nr = Math.min(55, 18 + byDomain[d].length * 5);
        next[n.id] = { x: cx + Math.cos(na) * nr, y: cy + Math.sin(na) * nr };
      });
    });
    setPos(next);
  }, [notes.length, dim.w]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDim({ w: Math.max(e.contentRect.width, 300), h: 480 });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const edges = useMemo(() => {
    const res: { from: string; to: string }[] = [];
    notes.forEach((n) => {
      (n.cleanContent.match(/\[\[(.+?)\]\]/g) || []).forEach((m) => {
        const title = m.slice(2, -2).toLowerCase();
        const target = notes.find((t) => t.title.toLowerCase() === title);
        if (target && target.id !== n.id) res.push({ from: n.id, to: target.id });
      });
    });
    return res;
  }, [notes]);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const p = pos[id]; if (!p) return;
    offset.current = { x: e.clientX - p.x, y: e.clientY - p.y };
    setDragging(id);
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setPos((prev) => ({
      ...prev,
      [dragging]: {
        x: Math.max(24, Math.min(dim.w - 24, e.clientX - offset.current.x)),
        y: Math.max(24, Math.min(dim.h - 24, e.clientY - offset.current.y)),
      },
    }));
  }, [dragging, dim]);
  const onMouseUp = useCallback(() => setDragging(null), []);
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  // Raio do nó varia com maturidade (visual hierárquico)
  const nodeRadius: Record<Maturity, number> = { semente: 5, crescimento: 7, evergreen: 10 };

  if (!notes.length) return (
    <div className="glass-card p-10 text-center rounded-2xl border border-border">
      <GitBranch size={22} className="mx-auto text-muted-foreground mb-2" />
      <p className="text-xs text-muted-foreground">Crie notas para ver o grafo de conexões.</p>
    </div>
  );

  return (
    <div ref={wrapRef} className="glass-card rounded-2xl border border-border overflow-hidden relative" style={{ height: 480 }}>
      {/* Legenda */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <span className="text-[10px] font-bold text-muted-foreground bg-card/80 px-2 py-1 rounded-lg backdrop-blur-sm">
          Grafo de conexões · arraste os nós · duplo-clique para editar
        </span>
        <div className="flex gap-2 bg-card/80 px-2 py-1 rounded-lg backdrop-blur-sm">
          {(["semente", "crescimento", "evergreen"] as Maturity[]).map((m) => {
            const Icon = MATURITY[m].icon;
            return (
              <span key={m} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Icon size={11} className="text-foreground" />{MATURITY[m].label}
              </span>
            );
          })}
        </div>
      </div>

      <svg width="100%" height="100%" className="absolute inset-0" style={{ cursor: dragging ? "grabbing" : "default" }}>
        {/* Arestas */}
        {edges.map(({ from, to }, i) => {
          const a = pos[from]; const b = pos[to]; if (!a || !b) return null;
          const hi = hoverId === from || hoverId === to;
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="currentColor" className="text-foreground"
              strokeOpacity={hi ? 0.7 : 0.12} strokeWidth={hi ? 1.5 : 1}
            />
          );
        })}

        {/* Nós */}
        {notes.map((note) => {
          const p = pos[note.id]; if (!p) return null;
          const isFiltered = filteredIds.has(note.id);
          const isHov = hoverId === note.id;
          const r = nodeRadius[note.maturity];
          const filled = note.maturity === "evergreen";
          return (
            <g key={note.id}>
              {isHov && <circle cx={p.x} cy={p.y} r={r + 8} fill="currentColor" className="text-foreground" opacity={0.06} />}
              <circle
                cx={p.x} cy={p.y} r={isHov ? r + 2 : r}
                fill={filled ? "currentColor" : "none"}
                className="text-foreground"
                stroke="currentColor"
                strokeWidth={filled ? 0 : note.maturity === "crescimento" ? 2 : 1}
                opacity={isFiltered ? 1 : 0.2}
                style={{ cursor: "grab" }}
                onMouseDown={(e) => onMouseDown(e, note.id)}
                onMouseEnter={() => setHoverId(note.id)}
                onMouseLeave={() => setHoverId(null)}
                onDoubleClick={() => onEdit(note)}
              />
              {(isHov || (isFiltered && note.maturity === "evergreen")) && (
                <text x={p.x} y={p.y - r - 6} textAnchor="middle" fontSize={10} fontWeight="700"
                  fill="currentColor" className="text-foreground pointer-events-none select-none"
                  opacity={isFiltered ? 0.9 : 0.35}>
                  {note.title.slice(0, 24)}{note.title.length > 24 ? "…" : ""}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Modal de Edição ───────────────────────────────────────────────────────
function AtomicEditModal({ note, onSave, onClose }: {
  note: AtomicNote;
  onSave: (draft: AtomicNote, userTags: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft]       = useState<AtomicNote>({ ...note });
  const [tagsInput, setTagsInput] = useState((note.tags || []).join(", "));
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const userTags = tagsInput.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    await onSave(draft, userTags);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border flex flex-col max-h-[92dvh] z-10">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Atom size={15} className="text-muted-foreground" />
            <span className="text-sm font-extrabold text-foreground">Nota Atômica</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Título</label>
            <input type="text" value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="input-ios text-sm font-extrabold w-full" placeholder="Uma ideia, um conceito" autoFocus />
          </div>

          {/* Domínio + Maturidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Domínio</label>
              <select value={draft.domain} onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
                className="input-ios text-xs w-full">
                <option value="">Sem domínio</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Maturidade</label>
              <div className="flex gap-1">
                {(["semente", "crescimento", "evergreen"] as Maturity[]).map((m) => {
                  const meta = MATURITY[m]; const Icon = meta.icon;
                  return (
                    <button key={m} type="button" title={meta.label}
                      onClick={() => setDraft((d) => ({ ...d, maturity: m }))}
                      className={cn(
                        "flex-1 flex items-center justify-center py-2 rounded-xl border-2 transition-all",
                        draft.maturity === m ? meta.pill : "border-border text-muted-foreground bg-muted/30"
                      )}
                    ><Icon size={14} /></button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">{MATURITY[draft.maturity].label}</p>
            </div>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Conteúdo · use [[Título]] para conectar notas
            </label>
            <textarea value={draft.cleanContent}
              onChange={(e) => setDraft((d) => ({ ...d, cleanContent: e.target.value }))}
              rows={9} className="input-ios text-xs font-mono w-full resize-none leading-relaxed"
              placeholder="Uma ideia por nota. Escreva denso e direto." />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Tags</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              className="input-ios text-xs w-full" placeholder="lean, melhoria, processo..." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-ios text-xs py-2 px-4">
            <Save size={13} /><span>{saving ? "Salvando…" : "Salvar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
