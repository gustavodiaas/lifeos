import { useState, useEffect } from "react";
import type { Book } from "@/lib/supabase";
import { BookOpen, Plus, Trash2, Edit3, Bookmark, Quote, CheckCircle2, Star, Search, Sparkles, Loader2, Image as ImageIcon, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useAuthContext } from "@/context/AuthContext";

export interface ExtendedBook extends Book {
  coverUrl?: string;
  description?: string;
  category?: string;
}

const DEFAULT_BOOKS: ExtendedBook[] = [
  {
    id: "1",
    title: "Hábitos Atômicos",
    author: "James Clear",
    status: "reading",
    totalPages: 320,
    currentPage: 185,
    coverUrl: "https://books.google.com/books/content?id=fLUwDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
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
    coverUrl: "https://books.google.com/books/content?id=01b4AwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    favoriteQuotes: ["Se você não priorizar sua vida, alguém fará isso por você."],
  },
  {
    id: "3",
    title: "Deep Work (Trabalho Focado)",
    author: "Cal Newport",
    status: "want",
    totalPages: 304,
    currentPage: 0,
    coverUrl: "https://books.google.com/books/content?id=T4vPCwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    favoriteQuotes: [],
  },
];

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
  };
}

export function BookTracker() {
  const { user } = useAuthContext();
  const userId = user?.id || "guest";
  const storageKey = `lifeos_${userId}_books`;

  const [books, setBooks] = useState<ExtendedBook[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setBooks(JSON.parse(saved));
      else setBooks([]);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(books));
  }, [books, storageKey]);

  // Google Books API Fetch
  const handleSearchGoogleBooks = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setApiResults([]);
      return;
    }

    setLoadingApi(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6`);
      if (!res.ok) throw new Error("Erro na busca");
      const data = await res.json();
      setApiResults(data.items || []);
    } catch {
      toast.error("Erro ao buscar livros online.");
    } finally {
      setLoadingApi(false);
    }
  };

  const handleSelectGoogleBook = (item: GoogleBookItem) => {
    const info = item.volumeInfo;
    setTitle(info.title || "");
    setAuthor(info.authors ? info.authors.join(", ") : "");
    setTotalPages(info.pageCount ? info.pageCount.toString() : "200");
    if (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail) {
      const img = (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || "").replace("http:", "https:");
      setCoverUrl(img);
    }
    setDescription(info.description || "");
    setModalMode("form");
    toast.success(`Livro "${info.title}" selecionado!`);
  };

  const handleOpenModal = (bookToEdit?: ExtendedBook) => {
    if (bookToEdit) {
      setEditingBook(bookToEdit);
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author || "");
      setStatus(bookToEdit.status);
      setTotalPages(bookToEdit.totalPages?.toString() || "");
      setCurrentPage(bookToEdit.currentPage?.toString() || "");
      setCoverUrl(bookToEdit.coverUrl || "");
      setDescription(bookToEdit.description || "");
      setQuotesList(bookToEdit.favoriteQuotes || []);
      setModalMode("form");
    } else {
      setEditingBook(null);
      setTitle("");
      setAuthor("");
      setStatus("reading");
      setTotalPages("");
      setCurrentPage("");
      setCoverUrl("");
      setDescription("");
      setQuotesList([]);
      setModalMode("search");
    }
    setApiSearchQuery("");
    setApiResults([]);
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
                coverUrl: coverUrl.trim() || undefined,
                description: description.trim() || undefined,
                favoriteQuotes: quotesList,
              }
            : b
        )
      );
      toast.success("Livro atualizado na estante!");
    } else {
      const newBook: ExtendedBook = {
        id: crypto.randomUUID(),
        title: title.trim(),
        author: author.trim(),
        status,
        totalPages: total,
        currentPage: current,
        coverUrl: coverUrl.trim() || undefined,
        description: description.trim() || undefined,
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
    toast.success("Livro removido da estante.");
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
    <div className="space-y-6 fade-in pb-12 select-none">
      {/* Header Estante Virtual */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="badge-ios text-[10px]">Sua Biblioteca Pessoal</span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Estante Virtual de Livros
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou autor..."
              className="input-ios pl-9 py-2 text-xs w-full"
            />
          </div>

          <button onClick={() => handleOpenModal()} className="btn-ios text-xs py-2.5 px-4 shrink-0">
            <Plus size={15} strokeWidth={2.5} />
            <span>Adicionar Livro</span>
          </button>
        </div>
      </div>

      {/* Categorias da Estante */}
      <div className="space-y-8">
        {/* 1. LENDO ATUALMENTE */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-foreground" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Lendo Atualmente ({readingBooks.length})
              </h3>
            </div>
          </div>

          {readingBooks.length === 0 ? (
            <div className="glass-card p-8 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border">
              Nenhum livro sendo lido no momento. Clique em "+ Adicionar Livro" para incluir um novo título com busca automática de capa!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readingBooks.map((book) => (
                <BookShelfCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>

        {/* 2. QUERO LER */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Bookmark size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Lista de Desejos / Quero Ler ({wantBooks.length})
              </h3>
            </div>
          </div>

          {wantBooks.length === 0 ? (
            <div className="glass-card p-6 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border">
              Sua lista de desejos de leitura está vazia.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wantBooks.map((book) => (
                <BookShelfCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>

        {/* 3. CONCLUÍDOS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Lidos & Concluídos ({completedBooks.length})
              </h3>
            </div>
          </div>

          {completedBooks.length === 0 ? (
            <div className="glass-card p-6 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border">
              Nenhum livro concluído ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedBooks.map((book) => (
                <BookShelfCard key={book.id} book={book} onEdit={() => handleOpenModal(book)} onDelete={() => handleRemoveBook(book.id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal Redesenhado Elegante com ModalPortal */}
      <ModalPortal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingBook ? "Editar Livro" : "Adicionar Livro à Estante"}
      >
        <div className="space-y-4">
          {/* Tabs Internas: Buscar Online vs Preencher */}
          {!editingBook && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => setModalMode("search")}
                className={cn(
                  "py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
                  modalMode === "search"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Buscar no Google Books</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode("form")}
                className={cn(
                  "py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
                  modalMode === "form"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Edit3 size={14} />
                <span>Preencher Manualmente</span>
              </button>
            </div>
          )}

          {/* MODO 1: Busca Online (Google Books API) */}
          {modalMode === "search" && !editingBook && (
            <div className="space-y-3 py-1 fade-in">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={apiSearchQuery}
                  onChange={(e) => {
                    setApiSearchQuery(e.target.value);
                    handleSearchGoogleBooks(e.target.value);
                  }}
                  placeholder="Digite o nome do livro ou autor (ex: O Alquimista)..."
                  className="input-ios pl-10 pr-10 py-3 text-xs font-bold w-full"
                  autoFocus
                />
                {loadingApi && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
              </div>

              {apiResults.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {apiResults.map((item) => {
                    const info = item.volumeInfo;
                    const img = (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "").replace("http:", "https:");

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectGoogleBook(item)}
                        className="w-full p-3 rounded-2xl bg-muted/40 hover:bg-muted border border-border/60 text-left flex items-center gap-3 transition-all group"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            className="w-11 h-16 object-cover rounded-xl shadow-md shrink-0 border border-black/10 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-11 h-16 bg-muted rounded-xl border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                            <ImageIcon size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-foreground block truncate">
                            {info.title}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground block truncate mt-0.5">
                            {info.authors?.join(", ") || "Autor não informado"}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-extrabold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                              📖 {info.pageCount || "?"} páginas
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : apiSearchQuery.length >= 2 && !loadingApi ? (
                <div className="p-6 text-center text-xs text-muted-foreground font-medium">
                  Nenhum livro encontrado. Tente buscar por outro termo ou preencha manualmente acima.
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground font-medium border border-dashed border-border/70 rounded-2xl">
                  Digite o título para buscar a capa, total de páginas e dados do livro em tempo real.
                </div>
              )}
            </div>
          )}

          {/* MODO 2: Formulário com Live Preview */}
          {(modalMode === "form" || editingBook) && (
            <form onSubmit={handleSaveBook} className="space-y-4 fade-in">
              {/* Card de Live Preview se tiver dados */}
              {(title || coverUrl) && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-3">
                  <div className="w-10 h-14 rounded-lg bg-muted overflow-hidden border border-black/10 shrink-0 shadow-sm flex items-center justify-center">
                    {coverUrl ? (
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block">Pré-visualização</span>
                    <span className="text-xs font-black text-foreground truncate block">{title || "Sem título"}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground truncate block">{author || "Autor não informado"}</span>
                  </div>
                </div>
              )}

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

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  URL da Capa da Imagem
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-ios text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                    Status na Estante
                  </label>
                  <CustomSelect
                    value={status}
                    onChange={(val) => setStatus(val as any)}
                    options={[
                      { value: "reading", label: "Lendo Atualmente" },
                      { value: "want", label: "Quero Ler" },
                      { value: "completed", label: "Concluído" },
                    ]}
                    className="text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                    Página Atual
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
                    Total de Páginas
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
                    placeholder="Adicionar citação..."
                    className="input-ios py-2 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuote}
                    className="p-2.5 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs"
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

              <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10 mt-2">
                Salvar na Estante
              </button>
            </form>
          )}
        </div>
      </ModalPortal>
    </div>
  );
}

function BookShelfCard({ book, onEdit, onDelete }: { book: ExtendedBook; onEdit: () => void; onDelete: () => void }) {
  const total = book.totalPages || 100;
  const current = book.currentPage || 0;
  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="glass-card p-4 rounded-3xl border border-border/70 flex gap-4 relative group transition-all hover:scale-[1.01] hover:shadow-xl">
      {/* Capa de Livro 3D Estilo Estante */}
      <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-lg border border-black/20 bg-muted flex items-center justify-center">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/30 flex flex-col items-center justify-center p-2 text-center">
            <BookOpen size={20} className="text-foreground mb-1" />
            <span className="text-[9px] font-black text-foreground line-clamp-2 leading-tight">{book.title}</span>
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
        <div className="flex items-start justify-between gap-1">
          <div>
            <h4 className="text-xs font-black text-foreground leading-tight line-clamp-2">{book.title}</h4>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">{book.author || "Autor não informado"}</p>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <Edit3 size={13} />
            </button>
            <button onClick={onDelete} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Progresso de Páginas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-muted-foreground">{current} / {total} págs</span>
            <span className="text-foreground font-black">{pct}%</span>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden border border-border/40">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                book.status === "completed" ? "bg-emerald-500" : "bg-foreground"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Citações */}
        {book.favoriteQuotes && book.favoriteQuotes.length > 0 && (
          <div className="text-[10px] italic text-muted-foreground truncate">
            "{book.favoriteQuotes[0]}"
          </div>
        )}
      </div>
    </div>
  );
}
