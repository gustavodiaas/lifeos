import { useState, useEffect } from "react";
import type { Book } from "@/lib/supabase";
import { BookOpen, Plus, Trash2, Edit3, Bookmark, Quote, CheckCircle2, Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const DEFAULT_BOOKS: Book[] = [
  {
    id: "1",
    title: "Hábitos Atômicos",
    author: "James Clear",
    status: "reading",
    totalPages: 320,
    currentPage: 185,
    favoriteQuotes: ["Você não sobe ao nível dos seus objetivos. Você cai ao nível dos seus sistemas."],
  },
  {
    id: "2",
    title: "Essencialismo",
    author: "Greg McKeown",
    status: "completed",
    totalPages: 272,
    currentPage: 272,
    rating: 5,
    favoriteQuotes: ["Se você não priorizar sua vida, alguém fará isso por você."],
  },
  {
    id: "3",
    title: "Deep Work (Trabalho Focado)",
    author: "Cal Newport",
    status: "want",
    totalPages: 300,
    currentPage: 0,
    favoriteQuotes: [],
  },
];

export function BookTracker() {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem("lifeos_books");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOOKS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<Book["status"]>("reading");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [quoteInput, setQuoteInput] = useState("");
  const [quotesList, setQuotesList] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("lifeos_books", JSON.stringify(books));
  }, [books]);

  const handleOpenModal = (bookToEdit?: Book) => {
    if (bookToEdit) {
      setEditingBook(bookToEdit);
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author || "");
      setStatus(bookToEdit.status);
      setTotalPages(bookToEdit.totalPages?.toString() || "");
      setCurrentPage(bookToEdit.currentPage?.toString() || "");
      setQuotesList(bookToEdit.favoriteQuotes || []);
    } else {
      setEditingBook(null);
      setTitle("");
      setAuthor("");
      setStatus("reading");
      setTotalPages("");
      setCurrentPage("");
      setQuotesList([]);
    }
    setQuoteInput("");
    setShowModal(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const total = parseInt(totalPages, 10) || 100;
    const current = Math.min(total, parseInt(currentPage, 10) || 0);

    if (editingBook) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? {
                ...b,
                title: title.trim(),
                author: author.trim(),
                status,
                totalPages: total,
                currentPage: current,
                favoriteQuotes: quotesList,
              }
            : b
        )
      );
      toast.success("Livro atualizado!");
    } else {
      const newBook: Book = {
        id: crypto.randomUUID(),
        title: title.trim(),
        author: author.trim(),
        status,
        totalPages: total,
        currentPage: current,
        favoriteQuotes: quotesList,
      };
      setBooks((prev) => [newBook, ...prev]);
      toast.success("Novo livro adicionado à estante!");
    }

    setShowModal(false);
  };

  const handleAddQuote = () => {
    if (!quoteInput.trim()) return;
    setQuotesList([...quotesList, quoteInput.trim()]);
    setQuoteInput("");
  };

  const handleRemoveQuote = (idx: number) => {
    setQuotesList(quotesList.filter((_, i) => i !== idx));
  };

  const handleRemoveBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Livro removido.");
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const readingBooks = filteredBooks.filter((b) => b.status === "reading");
  const wantBooks = filteredBooks.filter((b) => b.status === "want");
  const completedBooks = filteredBooks.filter((b) => b.status === "completed");

  return (
    <div className="space-y-6 fade-in pb-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="badge-ios text-[10px]">Leitura & Conhecimento</span>
          <h3 className="text-xl font-black text-foreground tracking-tight mt-1">Estante Pessoal de Livros</h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livro ou autor..."
              className="input-ios pl-9 py-2 text-xs w-full"
            />
          </div>

          <button onClick={() => handleOpenModal()} className="btn-ios text-xs py-2.5 px-4 shrink-0">
            <Plus size={15} strokeWidth={2.5} />
            <span>Adicionar Livro</span>
          </button>
        </div>
      </div>

      {/* Grid de Seções (Lendo Atualmente, Quero Ler, Concluídos) */}
      <div className="space-y-6">
        {/* 1. LENDO ATUALMENTE */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-foreground" />
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Lendo Atualmente ({readingBooks.length})
            </h4>
          </div>

          {readingBooks.length === 0 ? (
            <div className="glass-card p-6 text-center text-xs text-muted-foreground font-medium rounded-2xl border border-dashed border-border">
              Nenhum livro sendo lido no momento. Adicione um para acompanhar as páginas!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingBooks.map((book) => (
                <BookCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>

        {/* 2. QUERO LER */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-muted-foreground" />
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Lista de Desejos / Quero Ler ({wantBooks.length})
            </h4>
          </div>

          {wantBooks.length === 0 ? (
            <div className="glass-card p-4 text-center text-xs text-muted-foreground font-medium rounded-2xl border border-dashed border-border">
              Sua lista de desejos está vazia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {wantBooks.map((book) => (
                <BookCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>

        {/* 3. CONCLUÍDOS */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Lidos & Concluídos ({completedBooks.length})
            </h4>
          </div>

          {completedBooks.length === 0 ? (
            <div className="glass-card p-4 text-center text-xs text-muted-foreground font-medium rounded-2xl border border-dashed border-border">
              Nenhum livro finalizado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {completedBooks.map((book) => (
                <BookCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Cadastro / Edição de Livro */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] slide-up">
            <div className="p-5 border-b border-border/60 flex items-center justify-between shrink-0">
              <h3 className="text-base font-extrabold text-foreground">
                {editingBook ? "Editar Livro" : "Adicionar Novo Livro"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                Fechar
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Título do Livro
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Hábitos Atômicos"
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Autor
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: James Clear"
                  className="input-ios text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="input-ios py-2 text-xs font-bold w-full bg-card text-foreground"
                  >
                    <option value="reading">Lendo</option>
                    <option value="want">Quero Ler</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                    Pág. Atual
                  </label>
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    placeholder="185"
                    className="input-ios text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                    Total Págs.
                  </label>
                  <input
                    type="number"
                    value={totalPages}
                    onChange={(e) => setTotalPages(e.target.value)}
                    placeholder="320"
                    className="input-ios text-xs font-bold"
                  />
                </div>
              </div>

              {/* Citações Favoritas */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                  <Quote size={12} />
                  <span>Citações & Trechos Favoritos</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quoteInput}
                    onChange={(e) => setQuoteInput(e.target.value)}
                    placeholder="Adicionar citação inspiradora..."
                    className="input-ios py-2 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuote}
                    className="p-2 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {quotesList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {quotesList.map((q, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-muted/50 border border-border text-[11px] font-medium text-foreground flex items-center justify-between gap-2">
                        <span className="italic">"{q}"</span>
                        <button type="button" onClick={() => handleRemoveQuote(idx)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-ios w-full py-3.5 text-xs font-black uppercase tracking-wider mt-2">
                <span>Salvar Livro</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BookCard({ book, onEdit, onDelete }: { book: Book; onEdit: () => void; onDelete: () => void }) {
  const total = book.totalPages || 100;
  const current = book.currentPage || 0;
  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="glass-card p-4 rounded-2xl border border-border space-y-3 relative group transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-foreground leading-tight">{book.title}</h4>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{book.author || "Autor desconhecido"}</p>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <Edit3 size={14} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progresso de Páginas */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-muted-foreground">Progresso: {current} / {total} págs</span>
          <span className="text-foreground font-black">{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              book.status === "completed" ? "bg-emerald-500" : "bg-foreground"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Citações */}
      {book.favoriteQuotes && book.favoriteQuotes.length > 0 && (
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-[11px] italic text-muted-foreground flex items-start gap-1.5">
          <Quote size={13} className="text-foreground shrink-0 mt-0.5" />
          <span className="line-clamp-2">"{book.favoriteQuotes[0]}"</span>
        </div>
      )}
    </div>
  );
}
