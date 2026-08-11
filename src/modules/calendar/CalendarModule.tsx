import { useState, useMemo, useEffect, useRef } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useGoals } from "@/hooks/useGoals";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { formatBRL } from "@/lib/date";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from "@/lib/icsExporter";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
} from "@/lib/notifications";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckSquare,
  Wallet,
  Trash2,
  Grid,
  List,
  Palette,
  Smartphone,
  Download,
  ExternalLink,
  Bell,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

// ── Types ────────────────────────────────────────────────────────────────────
export interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  color: string; // user-chosen hex like "#a78bfa"
  description?: string;
  label?: string; // optional user label e.g. "Trabalho", "Saúde"
}

// Palette of nice pastel/vivid colors the user can pick from
const COLOR_PALETTE = [
  { hex: "#a78bfa", name: "Lavanda" },
  { hex: "#f472b6", name: "Rosa" },
  { hex: "#34d399", name: "Menta" },
  { hex: "#60a5fa", name: "Azul Céu" },
  { hex: "#fb923c", name: "Pêssego" },
  { hex: "#fbbf24", name: "Âmbar" },
  { hex: "#f87171", name: "Coral" },
  { hex: "#2dd4bf", name: "Turquesa" },
  { hex: "#c084fc", name: "Lilás" },
  { hex: "#4ade80", name: "Verde Neon" },
  { hex: "#38bdf8", name: "Celeste" },
  { hex: "#e879f9", name: "Orchidea" },
];

type ViewMode = "month" | "day";

// ── Component ─────────────────────────────────────────────────────────────────
export function CalendarModule() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const { tasks } = useTasks(activeUserId);
  const { lancamentos } = useLancamentos(activeUserId);
  const { goals } = useGoals(activeUserId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDateIso, setSelectedDateIso] = useState(new Date().toISOString().slice(0, 10));

  const userId = activeUserId || user?.id || "guest";
  const storageKey = `lifeos_${userId}_calendar_events_v2`;

  // Events
  const [events, setEvents] = useState<CustomEvent[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setEvents(JSON.parse(saved));
      else setEvents([]);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(events));
  }, [events, storageKey]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState(getNotificationSettings);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(selectedDateIso);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);
  const [labelText, setLabelText] = useState("");
  const [description, setDescription] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthGridDays = useMemo(() => {
    const days: { dateIso: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({ dateIso: prevDate.toISOString().slice(0, 10), dayNum: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateIso: iso, dayNum: d, isCurrentMonth: true });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({ dateIso: nextDate.toISOString().slice(0, 10), dayNum: d, isCurrentMonth: false });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, { customEvents: CustomEvent[]; tasksDue: typeof tasks; txs: typeof lancamentos }> = {};
    const ensure = (iso: string) => {
      if (!map[iso]) map[iso] = { customEvents: [], tasksDue: [], txs: [] };
    };
    events.forEach((evt) => { ensure(evt.date); map[evt.date].customEvents.push(evt); });
    tasks.forEach((t) => {
      const iso = t.dueDate || t.due_date;
      if (iso) { ensure(iso); map[iso].tasksDue.push(t); }
    });
    lancamentos.forEach((l) => {
      if (l.data) { ensure(l.data); map[l.data].txs.push(l); }
    });
    return map;
  }, [events, tasks, lancamentos]);

  // Dynamic legend: unique (color, label) pairs from events that have a label
  const legend = useMemo(() => {
    const seen = new Set<string>();
    const items: { color: string; label: string }[] = [];
    events.forEach((e) => {
      if (e.label) {
        const key = `${e.color}::${e.label}`;
        if (!seen.has(key)) { seen.add(key); items.push({ color: e.color, label: e.label }); }
      }
    });
    return items;
  }, [events]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateIso(now.toISOString().slice(0, 10));
  };

  const openNew = (dateIso: string) => {
    setEventDate(dateIso);
    setTitle("");
    setDescription("");
    setLabelText("");
    setColor(COLOR_PALETTE[0].hex);
    setStartTime("09:00");
    setEndTime("10:00");
    setShowModal(true);
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
      color,
      label: labelText.trim() || undefined,
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

  const toggleCalendarNotifications = async () => {
    if (!notifSettings.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    const updated = {
      ...notifSettings,
      enabled: true,
      calendarReminder: !notifSettings.calendarReminder,
    };
    saveNotificationSettings(updated);
    setNotifSettings(updated);
    if (updated.calendarReminder) {
      toast.success("Notificações da agenda ativadas com sucesso!");
    } else {
      toast.info("Lembretes de agenda pausados.");
    }
  };

  const selectedItems = itemsByDate[selectedDateIso] || { customEvents: [], tasksDue: [], txs: [] };
  const todayIsoString = new Date().toISOString().slice(0, 10);

  // Hex to rgba for subtle backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="space-y-5 fade-in select-none pb-12">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="glass-card p-5 rounded-3xl border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="badge-ios text-[10px]">Agenda Inteligente & Sincronizada</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{capitalizedMonth}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/50">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
                viewMode === "month" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid size={13} /><span>Mês</span>
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
                viewMode === "day" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={13} /><span>Dia</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleToday} className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-extrabold text-foreground transition-colors">
              Hoje
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botão de Sincronizar com iOS/Android */}
          <button
            onClick={() => setSyncModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
            title="Sincronizar com iPhone ou Android"
          >
            <Smartphone size={15} className="text-foreground" />
            <span className="hidden sm:inline">Sincronizar Celular</span>
          </button>

          <button
            onClick={() => openNew(selectedDateIso)}
            className="btn-ios text-xs py-2.5 px-4"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* ── Dynamic Legend ───────────────────────────────────────────── */}
      {legend.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {legend.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
              style={{ borderColor: hexToRgba(item.color, 0.4), backgroundColor: hexToRgba(item.color, 0.12), color: item.color }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* CALENDÁRIO — coluna principal, muito maior */}
        <div className="xl:col-span-9">
          {viewMode === "month" && (
            <div className="glass-card rounded-3xl border border-border/70 shadow-lg overflow-hidden">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="py-3 text-center text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {monthGridDays.map((cell, idx) => {
                  const isSelected = cell.dateIso === selectedDateIso;
                  const isToday = cell.dateIso === todayIsoString;
                  const cellData = itemsByDate[cell.dateIso];
                  const evts = cellData?.customEvents ?? [];
                  const taskCount = cellData?.tasksDue.length ?? 0;
                  const isLastRow = idx >= monthGridDays.length - 7;

                  return (
                    <button
                      key={cell.dateIso}
                      onClick={() => setSelectedDateIso(cell.dateIso)}
                      className={cn(
                        "min-h-[100px] lg:min-h-[120px] p-2 text-left flex flex-col border-b border-r border-border/30 transition-all relative",
                        isLastRow && "border-b-0",
                        (idx + 1) % 7 === 0 && "border-r-0",
                        cell.isCurrentMonth ? "bg-card/50 hover:bg-muted/40" : "bg-muted/10 opacity-50",
                        isSelected && "bg-foreground/5 ring-inset ring-1 ring-foreground/40",
                        isToday && !isSelected && "bg-primary/5"
                      )}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={cn(
                            "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center",
                            isToday ? "bg-foreground text-background" : "text-foreground"
                          )}
                        >
                          {cell.dayNum}
                        </span>
                        {taskCount > 0 && (
                          <span className="text-[9px] font-bold text-muted-foreground">
                            📌{taskCount}
                          </span>
                        )}
                      </div>

                      {/* Event pills */}
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        {evts.slice(0, 3).map((evt) => (
                          <div
                            key={evt.id}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate leading-tight"
                            style={{
                              background: hexToRgba(evt.color, 0.18),
                              color: evt.color,
                              borderLeft: `3px solid ${evt.color}`,
                            }}
                          >
                            {evt.startTime && `${evt.startTime} `}{evt.title}
                          </div>
                        ))}
                        {evts.length > 3 && (
                          <div className="text-[9px] font-extrabold text-muted-foreground pl-1">
                            +{evts.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODO DIA */}
          {viewMode === "day" && (
            <div className="glass-card p-6 rounded-3xl border border-border/70 space-y-4 min-h-[400px]">
              <h3 className="text-base font-black text-foreground border-b border-border/50 pb-2">
                {new Date(selectedDateIso + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </h3>

              {selectedItems.customEvents.length === 0 && selectedItems.tasksDue.length === 0 && selectedItems.txs.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground font-medium flex flex-col items-center gap-3">
                  <CalendarIcon size={32} className="opacity-30" />
                  Nenhum evento registrado para este dia.
                  <button onClick={() => openNew(selectedDateIso)} className="btn-ios text-xs py-2 px-4 mt-2">
                    <Plus size={14} /> Agendar algo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.customEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-2xl border flex items-start justify-between gap-3"
                      style={{ background: hexToRgba(evt.color, 0.1), borderColor: hexToRgba(evt.color, 0.35) }}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: evt.color }} />
                          <span className="text-xs font-black" style={{ color: evt.color }}>{evt.title}</span>
                        </div>
                        {evt.startTime && (
                          <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock size={11} />
                            {evt.startTime} {evt.endTime ? `→ ${evt.endTime}` : ""}
                          </p>
                        )}
                        {evt.label && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: hexToRgba(evt.color, 0.2), color: evt.color }}>
                            {evt.label}
                          </span>
                        )}
                        {evt.description && (
                          <p className="text-xs text-muted-foreground font-medium pt-1">{evt.description}</p>
                        )}
                      </div>

                      {/* Ações Rápidas de Sincronização do Evento */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={getGoogleCalendarUrl(evt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors"
                          title="Adicionar ao Google Calendar"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => downloadIcsFile([evt], `${evt.title}.ics`)}
                          className="p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors"
                          title="Baixar para iPhone/Android (.ics)"
                        >
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PAINEL DO DIA SELECIONADO */}
        <div className="xl:col-span-3 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-border/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Dia Selecionado</span>
                <h3 className="text-base font-black text-foreground mt-0.5">
                  {new Date(selectedDateIso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                </h3>
              </div>
              <button
                onClick={() => openNew(selectedDateIso)}
                className="p-2 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /><span>Add</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {selectedItems.customEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl border flex items-center justify-between gap-2"
                  style={{ background: hexToRgba(evt.color, 0.1), borderColor: hexToRgba(evt.color, 0.3) }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: evt.color }} />
                      <span className="text-xs font-black truncate" style={{ color: evt.color }}>{evt.title}</span>
                    </div>
                    {evt.startTime && (
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {evt.startTime}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => downloadIcsFile([evt], `${evt.title}.ics`)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title="Baixar para celular (.ics)"
                    >
                      <Download size={13} />
                    </button>
                    <button onClick={() => handleDeleteEvent(evt.id)} className="p-1 text-muted-foreground hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {selectedItems.tasksDue.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs font-black text-foreground truncate">{t.title}</span>
                  </div>
                </div>
              ))}

              {selectedItems.txs.map((l) => (
                <div key={l.id} className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet size={13} className={l.tipo === "entrada" ? "text-emerald-500" : "text-red-500"} />
                      <span className="text-xs font-black text-foreground truncate">{l.descricao}</span>
                    </div>
                    <span className={cn("text-xs font-black", l.tipo === "entrada" ? "text-emerald-500" : "text-red-500")}>
                      {formatBRL(l.valor)}
                    </span>
                  </div>
                </div>
              ))}

              {selectedItems.customEvents.length === 0 && selectedItems.tasksDue.length === 0 && selectedItems.txs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground font-medium border border-dashed border-border/60 rounded-2xl">
                  Sem eventos. Clique em "+ Add" para agendar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL NOVO EVENTO ─────────────────────────────────────────── */}
      <ModalPortal open={showModal} onClose={() => setShowModal(false)} title="Agendar Compromisso">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Título do Evento
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Data</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-ios text-xs font-bold" required />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Início</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-ios text-xs font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Fim</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-ios text-xs font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Cor do Evento
              </label>
              <div className="relative" ref={colorPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowColorPicker((v) => !v)}
                  className="input-ios text-xs font-bold flex items-center gap-2 w-full"
                >
                  <span className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ background: color }} />
                  <span>{COLOR_PALETTE.find((c) => c.hex === color)?.name ?? "Personalizada"}</span>
                  <Palette size={13} className="ml-auto text-muted-foreground" />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-50 p-3">
                    <div className="grid grid-cols-6 gap-2">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() => { setColor(c.hex); setShowColorPicker(false); }}
                          className={cn(
                            "w-7 h-7 rounded-full transition-all hover:scale-110",
                            color === c.hex && "ring-2 ring-offset-1 ring-foreground scale-110"
                          )}
                          style={{ background: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                        title="Escolha qualquer cor"
                      />
                      <span className="text-[10px] text-muted-foreground font-bold">Cor personalizada</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Categoria / Legenda
              </label>
              <input
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="Ex: Trabalho, Saúde..."
                className="input-ios text-xs font-bold"
              />
            </div>
          </div>

          {title && (
            <div
              className="px-3 py-2 rounded-xl text-xs font-bold border"
              style={{ background: hexToRgba(color, 0.15), borderColor: hexToRgba(color, 0.4), color }}
            >
              <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: color }} />
              {startTime && `${startTime} · `}{title}
              {labelText && <span className="ml-2 opacity-70">#{labelText}</span>}
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Notas</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do compromisso..."
              className="input-ios text-xs font-medium min-h-[60px] resize-none"
            />
          </div>

          <button type="submit" className="btn-ios w-full py-3.5 text-xs font-black uppercase tracking-wider">
            Confirmar Agendamento
          </button>
        </form>
      </ModalPortal>

      {/* ── MODAL DE SINCRONIZAÇÃO iOS & ANDROID ───────────────────────── */}
      <ModalPortal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        title="📲 Sincronizar Calendário (iOS & Android)"
      >
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Exporte seus compromissos diretamente para o aplicativo de calendário nativo do seu smartphone (Apple Calendar no iPhone ou Google Calendar no Android).
          </p>

          <div className="space-y-3">
            {/* Sincronizar iOS (iPhone) */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center text-xs font-black">
                    🍏
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground">iPhone / Apple Calendar</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">Exporta arquivo .ics com alarmes nativos de 15 min</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    downloadIcsFile(events, `lifeos-agenda-iphone.ics`);
                    toast.success("Arquivo .ics baixado! Toque nele para adicionar ao Calendário do iPhone.");
                  }}
                  className="btn-ios text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} />
                  <span>Baixar .ics</span>
                </button>
              </div>
            </div>

            {/* Sincronizar Android / Google */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-black">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground">Android / Google Calendar</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">Exporta todos os eventos para o Google/Samsung Calendar</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    downloadIcsFile(events, `lifeos-agenda-android.ics`);
                    toast.success("Arquivo .ics baixado! Abra no celular para sincronizar.");
                  }}
                  className="btn-ios text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} />
                  <span>Baixar .ics</span>
                </button>
              </div>
            </div>

            {/* Notificações do Navegador / PWA */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground">Lembretes & Notificações Push</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">Alertas do sistema no computador e celular antes do evento</p>
                  </div>
                </div>
                <button
                  onClick={toggleCalendarNotifications}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0",
                    notifSettings.calendarReminder
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted text-foreground border border-border"
                  )}
                >
                  {notifSettings.calendarReminder ? <Check size={13} /> : <Bell size={13} />}
                  <span>{notifSettings.calendarReminder ? "Ativado" : "Ativar Lembretes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
