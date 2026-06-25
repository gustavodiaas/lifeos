import { AppShell } from "./AppShell";
import { PageBody, PageHeader } from "./PageHeader";
import type { ReactNode } from "react";

export function ModulePlaceholder({
  title,
  description,
  roadmap,
  children,
}: {
  title: string;
  description: string;
  roadmap: string;
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <PageHeader title={title} description={description} />
      <PageBody>
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{roadmap}</p>
        </div>
        {children}
      </PageBody>
    </AppShell>
  );
}