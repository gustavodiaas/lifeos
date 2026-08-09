import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((o) => o.value === value);

  // Position popup below button
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
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
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const popup = open ? createPortal(
    <div
      ref={popupRef}
      className="glass-card p-1.5 shadow-2xl border border-border space-y-1 max-h-60 overflow-y-auto fade-in"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        minWidth: 180,
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
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
                ? "bg-foreground text-background shadow-sm"
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
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative w-full select-none", className)}>
      <button
        ref={btnRef}
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

      {popup}
    </div>
  );
}
