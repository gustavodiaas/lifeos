import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  className?: string;
}

export function CustomDatePicker({ value, onChange, label, className }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Formatação em Português
  const displayFormatted = (() => {
    if (!value) return "Selecione uma data...";
    try {
      const d = parseDate(value);
      return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return value;
    }
  })();

  // Dias do Mês
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (dayNum: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange(formatted);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div ref={ref} className={cn("relative w-full select-none", className)}>
      {label && (
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-[#FCA311]" />
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full input-ios py-3 px-4 flex items-center justify-between gap-2 text-left font-bold text-sm transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon size={16} className="text-[#FCA311] shrink-0" />
          <span className="text-foreground capitalize truncate">{displayFormatted}</span>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 glass-card p-4 z-[160] shadow-2xl border border-border w-72 fade-in">
          {/* Header do Mês */}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold text-foreground capitalize">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center my-2 text-[10px] font-extrabold text-muted-foreground">
            <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
          </div>

          {/* Matriz de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

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
                      ? "bg-[#FCA311] text-black shadow-md shadow-[#FCA311]/30 font-black scale-105"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
