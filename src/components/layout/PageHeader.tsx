import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 pt-6 pb-4 border-b border-border/40">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs md:text-sm font-medium text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="px-6 md:px-8 py-6 space-y-6 max-w-7xl mx-auto">{children}</div>;
}
