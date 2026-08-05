import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative w-full select-none", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full input-ios py-3 px-4 flex items-center justify-between gap-2 text-left font-semibold text-sm transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className={selectedOption ? "text-foreground font-bold" : "text-muted-foreground font-medium"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 glass-card p-1.5 z-[150] shadow-2xl border border-border space-y-1 max-h-60 overflow-y-auto fade-in">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors text-left",
                  isSelected
                    ? "bg-[#FCA311] text-black shadow-sm"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                </span>
                {isSelected && <Check size={14} strokeWidth={3} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
