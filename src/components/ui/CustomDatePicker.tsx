import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  className?: string;
}

type ViewMode = "calendar" | "months" | "years";

export function CustomDatePicker({ value, onChange, label, className }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Parse YYYY-MM-DD
  const parseDate = (dStr: string) => {
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    } catch {}
    return new Date();
  };

  const selectedDate = parseDate(value || new Date().toISOString().slice(0, 10));
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Position popup relative to button (viewport relative for position: fixed)
  useEffect(() => {
    if (!open || !btnRef.current) return;

    const updatePosition = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const popupH = 340;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + 6;

      if (spaceBelow < popupH && rect.top > popupH) {
        top = Math.max(10, rect.top - popupH - 6);
      } else if (top + popupH > window.innerHeight) {
        top = Math.max(10, window.innerHeight - popupH - 10);
      }

      setPos({
        top,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 310)),
        width: Math.max(rect.width, 300),
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setViewMode("calendar");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const shortMonthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const yearOptions = Array.from({ length: 96 }, (_, i) => 1940 + i);

  const displayFormatted = (() => {
    if (!value) return "Selecione uma data...";
    try {
      const d = parseDate(value);
      return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return value;
    }
  })();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (dayNum: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
    setViewMode("calendar");
  };

  const handleSelectToday = () => {
    const now = new Date();
    onChange(now.toISOString().slice(0, 10));
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setOpen(false);
    setViewMode("calendar");
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const popup = open ? createPortal(
    <div
      ref={popupRef}
      className="glass-card p-4 shadow-2xl border border-border fade-in"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: Math.max(pos.width, 300),
        maxWidth: "calc(100vw - 32px)",
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-3 border-b border-border/50">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === "months" ? "calendar" : "months")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all border",
            viewMode === "months"
              ? "bg-foreground text-background border-foreground shadow-sm font-black"
              : "bg-muted/60 text-foreground border-border/50 hover:bg-muted"
          )}
        >
          {monthNames[viewMonth]}
        </button>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === "years" ? "calendar" : "years")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border",
            viewMode === "years"
              ? "bg-foreground text-background border-foreground shadow-sm font-black"
              : "bg-muted/60 text-foreground border-border/50 hover:bg-muted"
          )}
        >
          {viewYear}
        </button>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Month picker */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-2 py-3 fade-in">
          {shortMonthNames.map((mName, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setViewMonth(idx); setViewMode("calendar"); }}
              className={cn(
                "py-3 rounded-2xl text-xs font-bold transition-all border",
                viewMonth === idx
                  ? "bg-foreground text-background border-foreground font-black shadow-md scale-105"
                  : "bg-muted/30 border-border/50 text-foreground hover:bg-muted"
              )}
            >
              {mName}
            </button>
          ))}
        </div>
      )}

      {/* Year picker */}
      {viewMode === "years" && (
        <div className="grid grid-cols-4 gap-2 py-3 max-h-56 overflow-y-auto fade-in pr-1">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => { setViewYear(y); setViewMode("calendar"); }}
              className={cn(
                "py-2 rounded-xl text-xs font-bold transition-all border text-center",
                viewYear === y
                  ? "bg-foreground text-background border-foreground font-black shadow-md scale-105"
                  : "bg-muted/30 border-border/50 text-foreground hover:bg-muted"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {viewMode === "calendar" && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center my-2 text-[10px] font-extrabold text-muted-foreground">
            <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center mx-auto",
                    isSelected
                      ? "bg-foreground text-background shadow-md font-black scale-105"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Today button */}
      <div className="pt-3 mt-2 border-t border-border/50 flex justify-end">
        <button
          type="button"
          onClick={handleSelectToday}
          className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline px-2 py-1 rounded-lg hover:bg-muted transition-colors"
        >
          Ir para Hoje
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative w-full select-none", className)}>
      {label && (
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-muted-foreground" />
          {label}
        </label>
      )}

      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen(!open);
          setViewMode("calendar");
        }}
        className="w-full input-ios py-3 px-4 flex items-center justify-between gap-2 text-left font-bold text-sm transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon size={16} className="text-muted-foreground shrink-0" />
          <span className="text-foreground capitalize truncate">{displayFormatted}</span>
        </span>
      </button>

      {popup}
    </div>
  );
}
