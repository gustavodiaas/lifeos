import { useState, useMemo, useEffect, useRef } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useGoals } from "@/hooks/useGoals";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { formatBRL } from "@/lib/date";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
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
  Search,
  SlidersHorizontal,
  CloudSun,
  MapPin,
  Tag,
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
  color: string; // hex color
  description?: string;
  label?: string; // category/label e.g. "Trabalho", "Saúde"
}

const COLOR_PALETTE = [
  { hex: "#212121", name: "Monocromático Principal" },
  { hex: "#616161", name: "Cinza Médio" },
  { hex: "#9e9e9e", name: "Cinza Suave" },
  { hex: "#424242", name: "Carvão" },
];

type ViewMode = "grid" | "split" | "week";

export function CalendarModule() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const { tasks } = useTasks(activeUserId);
  const { lancamentos } = useLancamentos(activeUserId);
  const { goals } = useGoals(activeUserId);
  const { events, addEvent, removeEvent } = useCalendarEvents(activeUserId || user?.id);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("split"); // Split view by default like Fantastical/iOS
  const [selectedDateIso, setSelectedDateIso] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState(getNotificationSettings);

  // Form state for event creation
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(selectedDateIso);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);
  const [labelText, setLabelText] = useState("");
  const [description, setDescription] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Grid Days for Month View
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

  // Week days for Week View strip
  const weekDays = useMemo(() => {
    const sel = new Date(selectedDateIso + "T12:00:00");
    const dayOfWeek = sel.getDay();
    const startOfWeek = new Date(sel);
    startOfWeek.setDate(sel.getDate() - dayOfWeek);

    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      result.push({
        dateIso: iso,
        dayNum: d.getDate(),
        dayShort: d.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().slice(0, 3),
      });
    }
    return result;
  }, [selectedDateIso]);

  // Items mapped by ISO date
  const itemsByDate = useMemo(() => {
    const map: Record<string, { customEvents: CustomEvent[]; tasksDue: typeof tasks; txs: typeof lancamentos }> = {};
    const ensure = (iso: string) => {
      if (!map[iso]) map[iso] = { customEvents: [], tasksDue: [], txs: [] };
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

    return map;
  }, [events, tasks, lancamentos]);

  // Filtered agenda list grouped by date
  const agendaDatesList = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateKeys = Object.keys(itemsByDate).sort();

    // Ensure selected date and today are present
    const set = new Set([...dateKeys, selectedDateIso, todayStr]);
    const sorted = Array.from(set).sort();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return sorted.filter((iso) => {
        const item = itemsByDate[iso];
        if (!item) return false;
        const matchesEvt = item.customEvents.some((e) => e.title.toLowerCase().includes(q) || (e.label && e.label.toLowerCase().includes(q)));
        const matchesTask = item.tasksDue.some((t) => t.title.toLowerCase().includes(q));
        return matchesEvt || matchesTask;
      });
    }

    return sorted;
  }, [itemsByDate, selectedDateIso, searchQuery]);

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addEvent({
      title: title.trim(),
      date: eventDate,
      startTime,
      endTime,
      color,
      label: labelText.trim() || undefined,
      description: description.trim() || undefined,
    });
    setShowModal(false);
    toast.success("Compromisso agendado!");
  };

  const handleDeleteEvent = async (id: string) => {
    await removeEvent(id);
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
      toast.success("Notificações da agenda ativadas!");
    } else {
      toast.info("Lembretes de agenda pausados.");
    }
  };

  const todayIsoString = new Date().toISOString().slice(0, 10);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16) || 160;
    const g = parseInt(hex.slice(3, 5), 16) || 160;
    const b = parseInt(hex.slice(5, 7), 16) || 160;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="space-y-5 fade-in select-none pb-24 max-w-7xl mx-auto">
      {/* ── 1. Header iOS Style (Fantastical / Apple Calendar) ──────────────── */}
      <div className="glass-card p-4 md:p-6 rounded-3xl border border-border/80 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Título do Mês / Ano */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 font-black text-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
              title="Ir para Hoje"
            >
              {new Date().getDate()}
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>{capitalizedMonth}</span>
                <span className="text-muted-foreground font-extrabold">{year}</span>
              </h2>
            </div>

            {/* Navegação de Mês */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Modos de Visualização & Ações */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de Modos */}
            <div className="flex items-center p-1 bg-muted/70 rounded-2xl border border-border/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid size={14} /> Mês Completo
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "split" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List size={14} /> Split + Agenda
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "week" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock size={14} /> Semana
              </button>
            </div>

            {/* Ações */}
            <button
              onClick={toggleCalendarNotifications}
              className={cn(
                "p-2.5 rounded-2xl border transition-all text-xs font-bold flex items-center gap-1.5",
                notifSettings.calendarReminder
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
              title="Notificações de Lembretes"
            >
              <Bell size={16} />
            </button>

            <button
              onClick={() => setSyncModalOpen(true)}
              className="p-2.5 rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground text-xs font-bold transition-colors"
              title="Sincronizar / Exportar ICS"
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => openNew(selectedDateIso)}
              className="btn-ios text-xs py-2.5 px-4 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Novo Evento</span>
            </button>
          </div>
        </div>

        {/* Campo de Busca Rápida na Agenda */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar evento, tarefa ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-background/80 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ── 2. MODO GRID (TELA 1 - Mês Completo em Estilo Monocromático) ──────── */}
      {viewMode === "grid" && (
        <div className="glass-card rounded-3xl border border-border/80 shadow-xl overflow-hidden">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40 text-center">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d, i) => (
              <div
                key={d}
                className={cn(
                  "py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7">
            {monthGridDays.map((cell, idx) => {
              const isSelected = cell.dateIso === selectedDateIso;
              const isToday = cell.dateIso === todayIsoString;
              const cellData = itemsByDate[cell.dateIso];
              const evts = cellData?.customEvents ?? [];
              const tasksDue = cellData?.tasksDue ?? [];
              const txs = cellData?.txs ?? [];

              const isLastRow = idx >= monthGridDays.length - 7;

              return (
                <div
                  key={cell.dateIso}
                  onClick={() => setSelectedDateIso(cell.dateIso)}
                  onDoubleClick={() => openNew(cell.dateIso)}
                  className={cn(
                    "min-h-[110px] md:min-h-[135px] p-1.5 md:p-2 text-left flex flex-col border-b border-r border-border/30 transition-all cursor-pointer group relative",
                    isLastRow && "border-b-0",
                    (idx + 1) % 7 === 0 && "border-r-0",
                    cell.isCurrentMonth ? "bg-card/40 hover:bg-muted/30" : "bg-muted/10 opacity-40",
                    isSelected && "bg-primary/5 ring-2 ring-inset ring-primary/40"
                  )}
                >
                  {/* Número do Dia e Ação Rápida */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : isSelected
                          ? "bg-foreground text-background font-bold"
                          : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {cell.dayNum}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Botão de Adicionar no Dia ao passar o mouse */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateIso(cell.dateIso);
                          openNew(cell.dateIso);
                        }}
                        className="w-5 h-5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="Adicionar evento neste dia"
                      >
                        <Plus size={12} />
                      </button>

                      {/* Indicadores neutros */}
                      <div className="flex items-center gap-0.5">
                        {evts.slice(0, 3).map((e) => (
                          <span key={e.id} className="w-1.5 h-1.5 rounded-full bg-foreground/70" />
                        ))}
                        {tasksDue.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* Event Pills dentro da célula */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {evts.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className="px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate leading-tight flex items-center gap-1 bg-muted/80 text-foreground border-l-2 border-primary shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}

                    {tasksDue.slice(0, 1).map((t) => (
                      <div
                        key={t.id}
                        className="px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate bg-secondary/70 text-secondary-foreground border-l-2 border-foreground/40 flex items-center gap-1"
                      >
                        <CheckSquare size={9} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}

                    {evts.length + tasksDue.length > 3 && (
                      <span className="text-[9px] font-extrabold text-muted-foreground pl-1 block">
                        +{evts.length + tasksDue.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. MODO SPLIT (TELA 2 - Calendário no Topo + Feed Continuo da Agenda) ──── */}
      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lado Esquerdo: Mini Calendário de Seleção */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-4 rounded-3xl border border-border/80 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {capitalizedMonth} {year}
                </span>
                <div className="flex gap-1">
                  <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Grid Compacto */}
              <div className="grid grid-cols-7 text-center pt-2 gap-y-2">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[10px] font-black text-muted-foreground">
                    {d}
                  </span>
                ))}

                {monthGridDays.map((cell) => {
                  const isSelected = cell.dateIso === selectedDateIso;
                  const isToday = cell.dateIso === todayIsoString;
                  const cellData = itemsByDate[cell.dateIso];
                  const hasEvt = cellData && (cellData.customEvents.length > 0 || cellData.tasksDue.length > 0);

                  return (
                    <button
                      key={cell.dateIso}
                      onClick={() => setSelectedDateIso(cell.dateIso)}
                      onDoubleClick={() => openNew(cell.dateIso)}
                      className={cn(
                        "h-9 rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs font-bold",
                        !cell.isCurrentMonth && "opacity-30",
                        isToday && !isSelected && "bg-primary/10 text-primary border border-primary/30",
                        isSelected && "bg-primary text-primary-foreground shadow-md font-extrabold"
                      )}
                    >
                      <span>{cell.dayNum}</span>
                      {hasEvt && (
                        <div className="flex items-center gap-0.5 absolute bottom-1">
                          {cellData.customEvents.slice(0, 2).map((e) => (
                            <span
                              key={e.id}
                              className={cn("w-1 h-1 rounded-full", isSelected ? "bg-primary-foreground" : "bg-foreground/70")}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eventos selecionados resumo */}
            <div className="glass-card p-4 rounded-3xl border border-border/80 space-y-2">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Resumo da Seleção</span>
                <span className="text-primary">{selectedDateIso}</span>
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                {(itemsByDate[selectedDateIso]?.customEvents.length || 0)} compromissos e{" "}
                {(itemsByDate[selectedDateIso]?.tasksDue.length || 0)} tarefas marcadas.
              </p>
            </div>
          </div>

          {/* Lado Direito: Feed Continuo de Agenda por Data (Estilo Fantastical) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-card p-5 rounded-3xl border border-border/80 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-primary" /> Agenda de Compromissos
                </h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {agendaDatesList.length} datas com registros
                </span>
              </div>

              {agendaDatesList.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground font-medium flex flex-col items-center gap-3">
                  <CalendarIcon size={36} className="opacity-30 text-muted-foreground" />
                  Nenhum compromisso encontrado para os filtros selecionados.
                  <button onClick={() => openNew(selectedDateIso)} className="btn-ios text-xs py-2 px-4 mt-2 bg-primary text-primary-foreground">
                    <Plus size={14} /> Agendar Novo Evento
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {agendaDatesList.map((dateIso) => {
                    const data = itemsByDate[dateIso] || { customEvents: [], tasksDue: [], txs: [] };
                    const isToday = dateIso === todayIsoString;

                    const dateObj = new Date(dateIso + "T12:00:00");
                    const dateFormatted = dateObj.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });

                    return (
                      <div key={dateIso} className="space-y-3">
                        {/* Header do Dia na Agenda */}
                        <div className="flex items-center justify-between bg-muted/40 px-3.5 py-2 rounded-2xl border border-border/40">
                          <span
                            className={cn(
                              "text-xs font-black uppercase tracking-wider flex items-center gap-2",
                              isToday ? "text-primary" : "text-foreground"
                            )}
                          >
                            {isToday ? "HOJE" : dateObj.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase()} —{" "}
                            {dateFormatted}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                              HOJE
                            </span>
                          )}
                        </div>

                        {/* Lista de itens daquele dia */}
                        <div className="space-y-2.5 pl-2">
                          {data.customEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className="p-3.5 rounded-2xl border border-border bg-card flex items-start justify-between gap-3 transition-all hover:scale-[1.01] shadow-xs"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="w-3 h-3 rounded-full mt-1 shrink-0 bg-primary" />
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-foreground">{evt.title}</span>
                                    {evt.label && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                                        {evt.label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                                    {evt.startTime && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} /> {evt.startTime} {evt.endTime ? `— ${evt.endTime}` : ""}
                                      </span>
                                    )}
                                    {evt.description && (
                                      <span className="truncate max-w-xs text-muted-foreground font-medium">
                                        {evt.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="text-muted-foreground hover:text-destructive p-1.5 rounded-xl hover:bg-destructive/10 transition-colors shrink-0"
                                title="Apagar evento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}

                          {data.tasksDue.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CheckSquare size={16} className="text-foreground shrink-0" />
                                <span className="font-bold text-foreground truncate">{t.title}</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground shrink-0">
                                TAREFA
                              </span>
                            </div>
                          ))}

                          {data.customEvents.length === 0 && data.tasksDue.length === 0 && (
                            <p className="text-xs text-muted-foreground italic pl-2 py-1">
                              Nenhum compromisso marcado para este dia.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MODO SEMANA (TELA 3 - Faixa de 7 dias + Lista Timeline) ──────────── */}
      {viewMode === "week" && (
        <div className="space-y-5">
          {/* Strip Semanal Estilo Monocromático */}
          <div className="glass-card p-4 rounded-3xl border border-border/80 shadow-lg">
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekDays.map((w) => {
                const isSelected = w.dateIso === selectedDateIso;
                const isToday = w.dateIso === todayIsoString;
                const hasEvts = (itemsByDate[w.dateIso]?.customEvents.length || 0) > 0;

                return (
                  <button
                    key={w.dateIso}
                    onClick={() => setSelectedDateIso(w.dateIso)}
                    onDoubleClick={() => openNew(w.dateIso)}
                    className={cn(
                      "py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-extrabold shadow-md scale-105"
                        : isToday
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted/30 text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span className="text-[10px] font-black tracking-wider uppercase opacity-80">{w.dayShort}</span>
                    <span className="text-sm font-black">{w.dayNum}</span>
                    {hasEvts && <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary")} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda da Data Selecionada na Semana */}
          <div className="glass-card p-5 rounded-3xl border border-border/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary" />
                {new Date(selectedDateIso + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button onClick={() => openNew(selectedDateIso)} className="btn-ios text-xs py-2 px-3 bg-primary text-primary-foreground">
                <Plus size={14} /> Novo Evento
              </button>
            </div>

            {!(itemsByDate[selectedDateIso]?.customEvents.length) && !(itemsByDate[selectedDateIso]?.tasksDue.length) ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-medium flex flex-col items-center gap-2">
                <Clock size={32} className="opacity-30 text-muted-foreground" />
                Sem compromissos nesta data.
              </div>
            ) : (
              <div className="space-y-3">
                {itemsByDate[selectedDateIso]?.customEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0 bg-primary" />
                      <div>
                        <h4 className="text-xs font-black text-foreground">{evt.title}</h4>
                        {evt.startTime && (
                          <p className="text-[11px] font-bold text-muted-foreground">
                            {evt.startTime} {evt.endTime ? `→ ${evt.endTime}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-xl hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. FAB Flutuante de Criação Rápida no Canto Inferior ───────────────── */}
      <button
        onClick={() => openNew(selectedDateIso)}
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[150]"
        title="Novo Evento Rápido"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ── Modal de Criação de Evento ───────────────────────────────────────── */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 fade-in">
            <div className="bg-card border border-border rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CalendarIcon size={16} className="text-primary" /> Agendar Novo Compromisso
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Título do Evento</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ex: Reunião de equipe, Consulta médica..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Data</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Categoria / Tag</label>
                    <input
                      type="text"
                      placeholder="Ex: Trabalho, Saúde"
                      value={labelText}
                      onChange={(e) => setLabelText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Início</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Término</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Paleta Monocromática Neutral */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Estilo do Destaque</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        className={cn(
                          "w-7 h-7 rounded-full transition-transform flex items-center justify-center border border-border",
                          color === c.hex ? "scale-110 ring-2 ring-offset-2 ring-foreground" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: c.hex }}
                      >
                        {color === c.hex && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Observações / Detalhes</label>
                  <textarea
                    rows={2}
                    placeholder="Adicionar notas ou local do compromisso..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-primary/90"
                  >
                    <Check size={14} /> Salvar Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal de Sincronização / Exportação ICS ─────────────────────────── */}
      {syncModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 fade-in">
            <div className="bg-card border border-border rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Download size={16} className="text-primary" /> Exportar / Sincronizar Agenda
                </h3>
                <button
                  onClick={() => setSyncModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    downloadIcsFile(events);
                    toast.success("Arquivo .ics baixado com sucesso!");
                  }}
                  className="w-full p-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">Baixar Arquivo .ICS</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Importar no Google Agenda, Apple Calendar ou Outlook
                    </span>
                  </div>
                  <Download size={16} className="text-primary" />
                </button>
              </div>

              <button
                onClick={() => setSyncModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
