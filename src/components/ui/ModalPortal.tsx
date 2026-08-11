import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Renders modal content directly into document.body via a React Portal.
 * This ensures fixed positioning works correctly regardless of parent
 * overflow/transform CSS, essential for mobile PWA usage.
 */
export function ModalPortal({ open, onClose, children }: ModalPortalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = containerRef.current!;
    document.body.appendChild(el);

    // Prevent body scroll when modal is open
    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.removeChild(el);
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

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>,
    containerRef.current
  );
}
