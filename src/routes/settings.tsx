import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { exportAll, importAll } from "@/db";
import { toast } from "sonner";
import { useRef } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LifeOS" },
      { name: "description", content: "Theme, data export/import and about LifeOS." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported");
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAll(data);
      toast.success("Data imported");
    } catch {
      toast.error("Invalid backup file");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Manage your LifeOS preferences and local data."
      />
      <PageBody>
        <section className="rounded-lg border border-border bg-card/60 p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Local data</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your data lives in this browser (IndexedDB). Cloud sync arrives in v1.0.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExport}>
              Export backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold">About</h2>
          <p className="text-xs text-muted-foreground mt-1">
            LifeOS v0.1 — fundação. Próximas fases: Hábitos & Tarefas (v0.2), Conhecimento (v0.3),
            Financeiro (v0.4), Metas & Diário (v0.5), Estatísticas & Conquistas (v0.6).
          </p>
        </section>
      </PageBody>
    </AppShell>
  );
}