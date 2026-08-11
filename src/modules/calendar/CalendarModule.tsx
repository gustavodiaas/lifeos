import { useState, useMemo, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useGoals } from "@/hooks/useGoals";
import { useAuthContext } from "@/context/AuthContext";
import { formatBRL } from "@/lib/date";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Tag,
  CheckCircle2,
  Wallet,
  Target,
  CheckSquare,
  Sparkles,
  Trash2,
  Filter,
  Grid,
  List,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  category: "trabalho" | "pessoal" | "saude" | "estudos" | "financas";
  colorTag: "lavender" | "rose" | "mint" | "sky" | "peach";
  description?: string;
}

const CATEGORY_COLORS: Record<
  CustomEvent["colorTag"],
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  lavender: {
    bg: "bg-purple-500/15 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300 font-extrabold",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
    label: "Lavanda (Projetos)",
  },
  rose: {
    bg: "bg-rose-500/15 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300 font-extrabold",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
    label: "Rosa Pastel (Pessoal)",
  },
  mint: {
    bg: "bg-emerald-500/15 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300 font-extrabold",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Menta (Saúde)",
  },
  sky: {
    bg: "bg-sky-500/15 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300 font-extrabold",
    border: "border-sky-500/30",
    dot: "bg-sky-500",
    label: "Azul Céu (Estudos)",
  },
  peach: {
    bg: "bg-amber-500/15 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300 font-extrabold",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    label: "Pêssego (Finanças)",
  },
};

const DEFAULT_EVENTS: CustomEvent[] = [
  {
    id: "evt-1",
    title: "Reunião de Alinhamento Semanal",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "11:00",
    category: "trabalho",
    colorTag: "lavender",
    description: "Revisão dos OKRs e entregas da semana.",
  },
  {
    id: "evt-2",
    title: "Treino de Musculação & Cardio",
    date: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "19:15",
    category: "saude",
    colorTag: "mint",
    description: "Treino de pernas e abdominais.",
  },
];

type ViewMode = "month" | "week" | "day";

export function CalendarModule() {
  const { user } = useAuthContext();
  const { tasks } = useTasks(user?.id);
  const { lancamentos } = useLancamentos(user?.id);
  const { goals } = useGoals(user?.id);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDateIso, setSelectedDateIso] = useState(new Date().toISOString().slice(0, 10));

  // Custom events
  const [events, setEvents] = useState<CustomEvent[]>(() => {
    try {
      const saved = localStorage.getItem("lifeos_calendar_events");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_EVENTS;
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(selectedDateIso);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [colorTag, setColorTag] = useState<CustomEvent["colorTag"]>("lavender");
  const [description, setDescription] = useState("");

  useEffect(() => {
    localStorage.setItem("lifeos_calendar_events", JSON.stringify(events));
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Month Grid Calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthGridDays = useMemo(() => {
    const days: { dateIso: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({ dateIso: prevDate.toISOString().slice(0, 10), dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      // Adjust timezone offset iso
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateIso: iso, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({ dateIso: nextDate.toISOString().slice(0, 10), dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month, firstDayIndex, daysInMonth]);

  // Aggregated items per date map
  const itemsByDate = useMemo(() => {
    const map: Record<
      string,
      {
        customEvents: CustomEvent[];
        tasksDue: typeof tasks;
        txs: typeof lancamentos;
        goalsDue: typeof goals;
      }
    > = {};

    // Helper init
    const ensure = (iso: string) => {
      if (!map[iso]) map[iso] = { customEvents: [], tasksDue: [], txs: [], goalsDue: [] };
    };

    events.forEach((evt) => {
      ensure(evt.date);
      map[evt.date].customEvents.push(evt);
    });

    tasks.forEach((t) => {
      const iso = t.dueDate || t.due_date;
      if (iso) {
        ensure(iso);
        map[iso].tasksDue.push(t);
      }
    });

    lancamentos.forEach((l) => {
      if (l.data) {
        ensure(l.data);
        map[l.data].txs.push(l);
      }
    });

    goals.forEach((g) => {
      const iso = g.targetDate || g.target_date;
      if (iso) {
        ensure(iso);
        map[iso].goalsDue.push(g);
      }
    });

    return map;
  }, [events, tasks, lancamentos, goals]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateIso(now.toISOString().slice(0, 10));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvt: CustomEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date: eventDate,
      startTime,
      endTime,
      category: "trabalho",
      colorTag,
      description: description.trim() || undefined,
    };

    setEvents((prev) => [...prev, newEvt]);
    setShowModal(false);
    toast.success("Compromisso agendado!");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Compromisso removido.");
  };

  const selectedItems = itemsByDate[selectedDateIso] || { customEvents: [], tasksDue: [], txs: [], goalsDue: [] };
  const todayIsoString = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 fade-in select-none pb-12">
      {/* ── Header Principal Notion Calendar Style ────────────────────── */}
      <div className="glass-card p-6 rounded-3xl border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
            <CalendarIcon size={24} />
          </div>
          <div>
            <span className="badge-ios text-[10px]">Agenda Inteligente</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {capitalizedMonth}
            </h2>
          </div>
        </div>

        {/* NAVEGAÇÃO & ALTERNADOR DE VISÃO */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/50">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
                viewMode === "month" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid size={14} />
              <span>Mês</span>
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
                viewMode === "day" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={14} />
              <span>Dia</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-extrabold text-foreground transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setEventDate(selectedDateIso);
              setTitle("");
              setDescription("");
              setShowModal(true);
            }}
            className="btn-ios text-xs py-2.5 px-4"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* ── PAINEL PRINCIPAL: MATRIZ DE MÊS OU CRONOGRAMA ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRID DO CALENDÁRIO (COLUNA MAIOR) */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === "month" && (
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-border/70 shadow-lg space-y-4">
              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 text-center border-b border-border/50 pb-3">
                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
                  <span key={d} className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Matriz 7x5 de dias */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthGridDays.map((cell) => {
                  const isSelected = cell.dateIso === selectedDateIso;
                  const isToday = cell.dateIso === todayIsoString;
                  const cellData = itemsByDate[cell.dateIso];
                  const totalItems =
                    (cellData?.customEvents.length || 0) +
                    (cellData?.tasksDue.length || 0) +
                    (cellData?.txs.length || 0);

                  return (
                    <button
                      key={cell.dateIso}
                      onClick={() => setSelectedDateIso(cell.dateIso)}
                      className={cn(
                        "min-h-[75px] sm:min-h-[90px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative group",
                        cell.isCurrentMonth ? "bg-card/70 border-border/60" : "bg-muted/20 border-transparent text-muted-foreground/40",
                        isSelected && "ring-2 ring-foreground bg-muted/50 shadow-md",
                        isToday && !isSelected && "border-foreground/50 bg-foreground/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center",
                            isToday ? "bg-foreground text-background" : "text-foreground"
                          )}
                        >
                          {cell.dayNum}
                        </span>
                        {totalItems > 0 && (
                          <span className="w-2 h-2 rounded-full bg-foreground" />
                        )}
                      </div>

                      {/* Pill Preview de Compromissos Pinterest Style */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {cellData?.customEvents.slice(0, 2).map((evt) => {
                          const tag = CATEGORY_COLORS[evt.colorTag];
                          return (
                            <div
                              key={evt.id}
                              className={cn(
                                "px-1.5 py-0.5 rounded-lg text-[9px] truncate border",
                                tag.bg,
                                tag.text,
                                tag.border
                              )}
                            >
                              {evt.startTime && `${evt.startTime} `}{evt.title}
                            </div>
                          );
                        })}
                        {cellData?.tasksDue.slice(0, 1).map((t) => (
                          <div
                            key={t.id}
                            className="px-1.5 py-0.5 rounded-lg text-[9px] truncate bg-muted border border-border text-foreground font-bold"
                          >
                            📌 {t.title}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODO DIA / VISÃO DETALHADA */}
          {viewMode === "day" && (
            <div className="glass-card p-6 rounded-3xl border border-border/70 space-y-4">
              <h3 className="text-base font-black text-foreground border-b border-border/50 pb-2">
                Compromissos para {selectedDateIso}
              </h3>

              {selectedItems.customEvents.length === 0 &&
              selectedItems.tasksDue.length === 0 &&
              selectedItems.txs.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-medium">
                  Nenhum evento registrado para este dia.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.customEvents.map((evt) => {
                    const tag = CATEGORY_COLORS[evt.colorTag];
                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-4 rounded-2xl border flex items-start justify-between gap-3 transition-all",
                          tag.bg,
                          tag.border
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2.5 h-2.5 rounded-full", tag.dot)} />
                            <span className={cn("text-xs font-black", tag.text)}>{evt.title}</span>
                          </div>
                          {evt.startTime && (
                            <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock size={12} />
                              {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ""}
                            </p>
                          )}
                          {evt.description && (
                            <p className="text-xs text-muted-foreground font-medium pt-1">{evt.description}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DETALHES DO DIA SELECIONADO (COLUNA DIREITA NOTION STYLE) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-border/80 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Dia Selecionado
                </span>
                <h3 className="text-lg font-black text-foreground mt-0.5">
                  {selectedDateIso}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEventDate(selectedDateIso);
                  setShowModal(true);
                }}
                className="p-2 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {/* Lista Unificada do Dia */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {/* Eventos Customizados */}
              {selectedItems.customEvents.map((evt) => {
                const tag = CATEGORY_COLORS[evt.colorTag];
                return (
                  <div
                    key={evt.id}
                    className={cn(
                      "p-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs",
                      tag.bg,
                      tag.border
                    )}
                  >
                    <div className="min-w-0">
                      <span className={cn("text-xs font-black block truncate", tag.text)}>
                        {evt.title}
                      </span>
                      {evt.startTime && (
                        <span className="text-[10px] font-extrabold text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {evt.startTime}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {/* Tarefas com Vencimento neste dia */}
              {selectedItems.tasksDue.map((t) => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-muted-foreground" />
                    <span className="text-xs font-black text-foreground truncate">{t.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground block pl-5">
                    Prioridade {t.priority?.toUpperCase()}
                  </span>
                </div>
              ))}

              {/* Lançamentos Financeiros neste dia */}
              {selectedItems.txs.map((l) => (
                <div key={l.id} className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className={l.tipo === "entrada" ? "text-emerald-500" : "text-red-500"} />
                      <span className="text-xs font-black text-foreground truncate">{l.descricao}</span>
                    </div>
                    <span className={cn("text-xs font-black", l.tipo === "entrada" ? "text-emerald-500" : "text-red-500")}>
                      {formatBRL(l.valor)}
                    </span>
                  </div>
                </div>
              ))}

              {selectedItems.customEvents.length === 0 &&
                selectedItems.tasksDue.length === 0 &&
                selectedItems.txs.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground font-medium border border-dashed border-border/60 rounded-2xl">
                    Nenhum compromisso para esta data. Clique em "+ Add" acima para agendar.
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL NOVO EVENTO PINTEREST STYLE ────────────────────────────── */}
      <ModalPortal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Agendar Compromisso"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Título do Evento / Reunião
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treino de Academia, Reunião com Cliente..."
              className="input-ios text-xs font-bold"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Data
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-ios text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Horário de Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-ios text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Horário Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-ios text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Paleta de Cor Pastel (Pinterest Style)
            </label>
            <CustomSelect
              value={colorTag}
              onChange={(val) => setColorTag(val as any)}
              options={Object.entries(CATEGORY_COLORS).map(([key, val]) => ({
                value: key,
                label: val.label,
              }))}
              className="text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Notas / Observações
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes do compromisso..."
              className="input-ios text-xs font-medium min-h-[70px] resize-none"
            />
          </div>

          <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10 mt-2">
            Confirmar Agendamento
          </button>
        </form>
      </ModalPortal>
    </div>
  );
}
