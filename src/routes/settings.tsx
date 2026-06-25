import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { exportAll, importAll } from "@/db";
import { toast } from "sonner";
import { useRef, useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Definições — LifeOS" },
      { name: "description", content: "Tema, exportação/importação de dados e sobre o LifeOS." },
    ],
  }),
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("lifeos-theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("lifeos-theme", newTheme);
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  }

  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cópia de segurança exportada");
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAll(data);
      toast.success("Dados importados com sucesso");
    } catch {
      toast.error("Ficheiro de segurança inválido");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Definições"
        description="Gere as tuas preferências do LifeOS e os dados locais."
      />
      <PageBody>
        <section className="rounded-lg border border-border bg-card/60 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Aparência</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Escolhe o teu tema preferido.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => handleThemeChange("light")}
            >
              Claro
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => handleThemeChange("dark")}
            >
              Escuro
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => handleThemeChange("system")}
            >
              Sistema
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/60 p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Dados locais</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Os teus dados residem neste navegador (IndexedDB). A sincronização na nuvem chega na v1.0.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExport}>
              Exportar cópia
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Importar cópia
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
          <h2 className="text-sm font-semibold">Sobre</h2>
          <p className="text-xs text-muted-foreground mt-1">
            LifeOS v0.1 — Fundação. Próximas fases: Hábitos & Tarefas (v0.2), Conhecimento (v0.3),
            Financeiro (v0.4), Metas & Diário (v0.5), Estatísticas & Conquistas (v0.6).
          </p>
        </section>
      </PageBody>
    </AppShell>
  );
}
