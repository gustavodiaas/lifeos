import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[linear-gradient(145deg,#64d2ff_0%,#0a84ff_48%,#0066cc_100%)] text-white shadow-[0_12px_30px_-12px_rgba(10,132,255,0.9)]",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute -right-2 -top-2 size-7 rounded-full border border-white/25" />
      <span className="absolute -bottom-3 -left-2 size-8 rounded-full bg-cyan-300/25 blur-sm" />
      <Sparkles className={cn("relative size-5", iconClassName)} strokeWidth={2.2} />
    </div>
  );
}
