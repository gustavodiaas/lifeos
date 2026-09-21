import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "sf-display grid size-10 shrink-0 place-items-center rounded-[11px] bg-foreground text-sm font-semibold text-background",
        className,
      )}
      aria-hidden="true"
    >
      <span className={cn(iconClassName)}>L</span>
    </div>
  );
}
