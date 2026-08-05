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
  iconBg = "bg-amber-500/10 dark:bg-amber-500/20",
  iconColor = "text-[#FCA311]",
  progress,
  trend,
}: StatCardProps) {
  return (
    <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden group">
      {/* Background glow sutil no hover */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-amber-500/5 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconBg, iconColor)}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>

          {trend && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {trend}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div
            className={cn(
              "text-2xl md:text-3xl font-extrabold tracking-tight text-foreground",
              tone === "positive" && "text-emerald-600 dark:text-emerald-400",
              tone === "negative" && "text-red-500 dark:text-red-400",
              tone === "warning" && "text-amber-500 dark:text-amber-400",
            )}
          >
            {value}
          </div>
        </div>
      </div>

      <div>
        {/* Barra de progresso se fornecida */}
        {typeof progress === "number" && (
          <div className="w-full bg-muted/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tone === "positive" ? "bg-emerald-500" : tone === "negative" ? "bg-red-500" : "bg-[#FCA311]"
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {hint && (
          <p className="mt-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
