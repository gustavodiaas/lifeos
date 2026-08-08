import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, CheckCircle2, Bookmark, Quote, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export interface Book {
  id: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  status: "reading" | "completed" | "want_to_read";
  favoriteQuotes?: string[];
}

const STORAGE_KEY = "lifeos_books_data";

export function BookTracker() {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "1",
        title: "Hábitos Atômicos",
        author: "James Clear",
        currentPage: 180,
        totalPages: 320,
        status: "reading",
        favoriteQuotes: ["Você não se eleva ao nível dos seus objetivos. Você cai ao nível dos seus sistemas."],
      },
    ];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(300);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error(err);
    }
  }, [books]);

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newBook: Book = {
      id: generateId(),
      title: title.trim(),
      author: author.trim() || "Autor Desconhecido",
      currentPage: Number(currentPage) || 0,
      totalPages: Number(totalPages) || 100,
      status: currentPage >= totalPages ? "completed" : "reading",
      favoriteQuotes: [],
    };

    setBooks([newBook, ...books]);
    toast.success("Livro adicionado!");
    setModalOpen(false);
    setTitle("");
    setAuthor("");
    setCurrentPage(0);
    setTotalPages(300);
  };

  const handleUpdateProgress = (bookId: string, delta: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const newPage = Math.max(0, Math.min(b.totalPages, b.currentPage + delta));
        const newStatus = newPage >= b.totalPages ? "completed" : "reading";
        if (newPage >= b.totalPages && b.currentPage < b.totalPages) {
          toast.success(`🏆 Parabéns! Você concluiu a leitura de "${b.title}"!`);
        }
        return { ...b, currentPage: newPage, status: newStatus };
      })
    );
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter((b) => b.id !== bookId));
    toast.success("Livro removido.");
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">Leituras & Livros</h3>
            <p className="text-xs text-muted-foreground font-medium">Acompanhe seu progresso de leitura</p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-ios text-xs py-2 px-3.5"
        >
          <Plus size={14} />
          <span>Novo Livro</span>
        </button>
      </div>

      {/* Lista de Livros */}
      {books.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum livro registrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => {
            const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));

            return (
              <div key={book.id} className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-foreground leading-tight">{book.title}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{book.author}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="text-muted-foreground hover:text-red-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-muted-foreground">{book.currentPage} / {book.totalPages} pág ({percent}%)</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Incrementar Páginas */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Adicionar Páginas</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateProgress(book.id, 5)}
                      className="px-2 py-1 rounded-lg bg-muted hover:bg-secondary text-foreground text-xs font-bold border border-border/50"
                    >
                      +5 pág
                    </button>
                    <button
                      onClick={() => handleUpdateProgress(book.id, 10)}
                      className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted text-xs font-black border border-border"
                    >
                      +10 pág
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar Livro */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 fade-in">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl border border-border p-6 space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Novo Livro</h3>
            <form onSubmit={handleSaveBook} className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Livro..."
                className="input-ios text-sm font-bold"
                required
                autoFocus
              />
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Autor..."
                className="input-ios text-xs font-semibold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  placeholder="Pág Atual"
                  className="input-ios text-xs font-bold"
                  min={0}
                />
                <input
                  type="number"
                  value={totalPages}
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  placeholder="Pág Totais"
                  className="input-ios text-xs font-bold"
                  min={1}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-muted font-bold text-xs text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-ios py-3 text-xs uppercase tracking-wider font-black"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
