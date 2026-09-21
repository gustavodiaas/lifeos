import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  progress?: number; // 0 a 100
  trend?: string;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  iconBg = "bg-muted dark:bg-muted",
  iconColor = "text-foreground",
  progress,
  trend,
}: StatCardProps) {
  return (
    <div className="glass-card relative flex min-h-[136px] flex-col justify-between p-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={cn("ios-squircle size-8 shrink-0", iconBg, iconColor)}>
                <Icon size={17} strokeWidth={2} />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>

          {trend && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {trend}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div
            className={cn(
              "sf-display text-[27px] font-semibold tracking-[-0.04em] text-foreground md:text-[30px]",
              tone === "positive" && "text-emerald-600 dark:text-emerald-400",
              tone === "negative" && "text-red-500 dark:text-red-400",
              tone === "warning" && "text-foreground dark:text-foreground",
            )}
          >
            {value}
          </div>
        </div>
      </div>

      <div>
        {/* Barra de progresso se fornecida */}
        {typeof progress === "number" && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tone === "positive"
                  ? "bg-emerald-500"
                  : tone === "negative"
                    ? "bg-red-500"
                    : "bg-[var(--system-blue)]",
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {hint && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}
