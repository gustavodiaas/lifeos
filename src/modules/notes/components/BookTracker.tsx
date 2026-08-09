import { useState, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useBooks } from "@/hooks/useBooks";
import type { Book, BookStatus } from "@/lib/supabase";
import {
  BookOpen, Plus, Trash2, Search, X, Check,
  BookMarked, Library, Clock, Edit3, Save, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Google Books API ───────────────────────────────────────────────────────
interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    publisher?: string;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=pt`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

// ── Meta de status ─────────────────────────────────────────────────────────
const STATUS_META: Record<BookStatus, { label: string; icon: React.FC<any>; pill: string }> = {
  reading:   { label: "Lendo",     icon: BookOpen, pill: "bg-foreground text-background border-foreground" },
  want:      { label: "Quero ler", icon: Clock,    pill: "bg-muted text-muted-foreground border-border" },
  completed: { label: "Concluído", icon: Check,    pill: "bg-foreground/10 text-foreground border-foreground/20" },
};

type LibTab = "all" | BookStatus;

// ── Componente principal ───────────────────────────────────────────────────
export function BookTracker() {
  const { user }                                    = useAuthContext();
  const { books, loading, addBook, updateBook, removeBook } = useBooks(user?.id);

  const [tab, setTab]           = useState<LibTab>("all");
  const [addOpen, setAddOpen]   = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const visible = books.filter((b) => tab === "all" || b.status === tab);

  const counts = {
    all:       books.length,
    reading:   books.filter((b) => b.status === "reading").length,
    want:      books.filter((b) => b.status === "want").length,
    completed: books.filter((b) => b.status === "completed").length,
  };

  const TABS: { id: LibTab; label: string }[] = [
    { id: "all",       label: "Todos" },
    { id: "reading",   label: "Lendo" },
    { id: "want",      label: "Quero ler" },
    { id: "completed", label: "Concluídos" },
  ];

  const handlePageUpdate = async (book: Book, page: number) => {
    const newPage   = Math.max(0, Math.min(book.totalPages, page));
    const newStatus: BookStatus =
      newPage >= book.totalPages ? "completed"
      : book.status === "want"  ? "reading"
      : book.status;
    await updateBook(book.id, { current_page: newPage, status: newStatus });
  };

  return (
    <div className="glass-card rounded-2xl border border-border overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Library size={17} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Biblioteca</h3>
            <p className="text-[11px] text-muted-foreground">{books.length} livro{books.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-ios text-xs py-1.5 px-3">
          <Plus size={13} strokeWidth={2.5} /><span>Adicionar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              tab === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
            <span className={cn("text-[10px] font-extrabold px-1 rounded", tab === id ? "opacity-70" : "opacity-50")}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="p-4">
        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <BookMarked size={24} className="mx-auto text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Nenhum livro aqui</p>
            <p className="text-xs text-muted-foreground">
              {tab === "all" ? "Adicione o primeiro livro da sua biblioteca." : `Nenhum livro com status "${STATUS_META[tab as BookStatus]?.label}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                onEdit={() => setEditBook(book)}
                onDelete={() => setDeleteId(book.id)}
                onPageUpdate={(page) => handlePageUpdate(book, page)}
              />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddBookModal
          onClose={() => setAddOpen(false)}
          onAdd={async (payload) => { await addBook(payload); setAddOpen(false); }}
        />
      )}

      {editBook && (
        <EditBookModal
          book={editBook}
          onClose={() => setEditBook(null)}
          onSave={async (id, payload) => { await updateBook(id, payload); setEditBook(null); }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-card rounded-2xl border border-border p-5 w-full max-w-xs space-y-4 shadow-2xl z-10">
            <p className="text-sm font-extrabold text-foreground">Remover livro?</p>
            <p className="text-xs text-muted-foreground">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-muted text-xs font-bold text-muted-foreground">Cancelar</button>
              <button onClick={() => { removeBook(deleteId); setDeleteId(null); }} className="flex-1 py-2 rounded-xl bg-foreground text-background text-xs font-bold">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de livro ─────────────────────────────────────────────────────────
function BookRow({ book, onEdit, onDelete, onPageUpdate }: {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
  onPageUpdate: (page: number) => void;
}) {
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput]     = useState(String(book.currentPage));

  const pct  = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
  const meta = STATUS_META[book.status];
  const Icon = meta.icon;

  const commitPage = () => {
    const p = Math.max(0, Math.min(book.totalPages, Number(pageInput) || 0));
    onPageUpdate(p);
    setEditingPage(false);
  };

  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors group">
      {/* Capa */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
        {book.cover
          ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-muted-foreground" /></div>
        }
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-foreground leading-tight line-clamp-1">{book.title}</h4>
            <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
          </div>
          <span className={cn("flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0", meta.pill)}>
            <Icon size={9} />{meta.label}
          </span>
        </div>

        {/* Progresso */}
        {book.status !== "want" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              {editingPage ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={commitPage}
                    onKeyDown={(e) => e.key === "Enter" && commitPage()}
                    className="w-14 px-1.5 py-0.5 rounded-lg border border-foreground bg-background text-foreground text-[10px] font-bold text-center"
                    min={0} max={book.totalPages} autoFocus
                  />
                  <span className="text-muted-foreground">/ {book.totalPages} pág</span>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingPage(true); setPageInput(String(book.currentPage)); }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group/page"
                >
                  <span className="font-bold">{book.currentPage}</span>
                  <span>/ {book.totalPages} pág</span>
                  <Edit3 size={9} className="opacity-0 group-hover/page:opacity-60 transition-opacity" />
                </button>
              )}
              <span className="font-extrabold text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-0.5">
          {book.status !== "want" ? (
            <div className="flex gap-1">
              {[10, 25, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => onPageUpdate(book.currentPage + n)}
                  className="px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border transition-colors"
                >+{n}</button>
              ))}
            </div>
          ) : <span />}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit3 size={11} /></button>
            <button onClick={onDelete} className="p-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"><Trash2 size={11} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Adicionar ────────────────────────────────────────────────────────
function AddBookModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (payload: {
    title: string; author: string; cover?: string;
    total_pages: number; current_page: number;
    status: string; isbn?: string; publisher?: string; year?: string;
  }) => Promise<void>;
}) {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<GoogleBook[]>([]);
  const [searching, setSearching]     = useState(false);
  const [title, setTitle]             = useState("");
  const [author, setAuthor]           = useState("");
  const [totalPages, setTotalPages]   = useState("");
  const [currentPage, setCurrentPage] = useState("0");
  const [status, setStatus]           = useState<BookStatus>("want");
  const [cover, setCover]             = useState("");
  const [publisher, setPublisher]     = useState("");
  const [year, setYear]               = useState("");
  const [saving, setSaving]           = useState(false);
  const timer                         = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchGoogleBooks(q);
      setResults(r);
      setSearching(false);
    }, 500);
  };

  const pickBook = (g: GoogleBook) => {
    const v = g.volumeInfo;
    setTitle(v.title || "");
    setAuthor(v.authors?.join(", ") || "");
    setTotalPages(String(v.pageCount || ""));
    setCover(v.imageLinks?.thumbnail?.replace("http://", "https://") || "");
    setPublisher(v.publisher || "");
    setYear(v.publishedDate?.slice(0, 4) || "");
    setResults([]);
    setQuery(v.title || "");
  };

  const handleSave = async () => {
    if (!title.trim() || !totalPages) return;
    setSaving(true);
    await onAdd({
      title:        title.trim(),
      author:       author.trim() || "Desconhecido",
      cover:        cover || undefined,
      total_pages:  Number(totalPages),
      current_page: Number(currentPage) || 0,
      status,
      publisher:    publisher || undefined,
      year:         year || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border flex flex-col max-h-[92dvh] z-10">

        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <span className="text-sm font-extrabold text-foreground">Adicionar Livro</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><X size={13} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Busca */}
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Buscar título ou autor</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ex: Hábitos Atômicos..." className="input-ios pl-8 text-sm w-full" autoFocus />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />}
            </div>

            {results.length > 0 && (
              <div className="mt-2 rounded-2xl border border-border overflow-hidden shadow-xl bg-card divide-y divide-border">
                {results.map((g) => {
                  const v = g.volumeInfo;
                  return (
                    <button key={g.id} onClick={() => pickBook(g)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors">
                      <div className="w-9 h-12 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                        {v.imageLinks?.thumbnail
                          ? <img src={v.imageLinks.thumbnail.replace("http://", "https://")} alt="" className="w-full h-full object-cover" />
                          : <BookOpen size={14} className="m-auto mt-3 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-foreground line-clamp-1">{v.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{v.authors?.join(", ")}</p>
                        {v.pageCount && <p className="text-[10px] text-muted-foreground">{v.pageCount} páginas</p>}
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground">ou preencha manualmente</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Título *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do livro" className="input-ios text-sm font-bold w-full" />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Autor</label>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor" className="input-ios text-xs w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Total de páginas *</label>
                <input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)}
                  placeholder="300" className="input-ios text-xs w-full" min={1} />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Página atual</label>
                <input type="number" value={currentPage} onChange={(e) => setCurrentPage(e.target.value)}
                  placeholder="0" className="input-ios text-xs w-full" min={0} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
              <div className="flex gap-2">
                {(["want", "reading", "completed"] as BookStatus[]).map((s) => {
                  const m = STATUS_META[s]; const Icon = m.icon;
                  return (
                    <button key={s} type="button" onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                        status === s ? m.pill : "border-border text-muted-foreground bg-muted/30"
                      )}>
                      <Icon size={12} />{m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-bold text-muted-foreground">Cancelar</button>
          <button onClick={handleSave} disabled={!title.trim() || !totalPages || saving}
            className="flex-1 btn-ios text-xs py-2.5 disabled:opacity-40">
            <Save size={13} /><span>{saving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar ──────────────────────────────────────────────────────────
function EditBookModal({ book, onClose, onSave }: {
  book: Book;
  onClose: () => void;
  onSave: (id: string, payload: Partial<{
    title: string; author: string; total_pages: number;
    current_page: number; status: string;
  }>) => Promise<void>;
}) {
  const [title, setTitle]             = useState(book.title);
  const [author, setAuthor]           = useState(book.author);
  const [totalPages, setTotalPages]   = useState(String(book.totalPages));
  const [currentPage, setCurrentPage] = useState(String(book.currentPage));
  const [status, setStatus]           = useState<BookStatus>(book.status);
  const [saving, setSaving]           = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(book.id, {
      title:        title.trim(),
      author:       author.trim(),
      total_pages:  Number(totalPages),
      current_page: Number(currentPage),
      status,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border flex flex-col max-h-[92dvh] z-10">

        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <span className="text-sm font-extrabold text-foreground">Editar Livro</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><X size={13} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-ios text-sm font-bold w-full" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Autor</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-ios text-xs w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Total páginas</label>
              <input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} className="input-ios text-xs w-full" min={1} />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Página atual</label>
              <input type="number" value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} className="input-ios text-xs w-full" min={0} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
            <div className="flex gap-2">
              {(["want", "reading", "completed"] as BookStatus[]).map((s) => {
                const m = STATUS_META[s]; const Icon = m.icon;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      status === s ? m.pill : "border-border text-muted-foreground bg-muted/30"
                    )}>
                    <Icon size={12} />{m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-bold text-muted-foreground">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-ios text-xs py-2.5 disabled:opacity-40">
            <Save size={13} /><span>{saving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
