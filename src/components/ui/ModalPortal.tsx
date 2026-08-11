import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalPortalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidth?: string; // "max-w-md", "max-w-lg", "max-w-xl"
  raw?: boolean; // Set to true if children already contains its own full card container box
}

/**
 * Renders modal content directly into document.body via a React Portal.
 * Wraps modal children in a clean solid card container box with title header and close button.
 */
export function ModalPortal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidth = "max-w-lg",
  raw = false,
}: ModalPortalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = containerRef.current!;
    document.body.appendChild(el);

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  if (raw) {
    return createPortal(
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {children}
      </div>,
      containerRef.current
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-card border border-border/80 rounded-3xl p-5 md:p-6 shadow-2xl w-full relative slide-up my-auto max-h-[90vh] overflow-y-auto custom-scrollbar select-none",
          maxWidth,
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/60">
            <h3 className="text-sm font-black text-foreground tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>,
    containerRef.current
  );
}
