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
        <ProfileSection />

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
              Exporta ou importa uma cópia de segurança dos teus dados locais.
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

function ProfileSection() {
  const { user, signOut } = useAuthContext();
  const [username, setUsername] = useState("");
  const [income, setIncome] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username || "");
        setIncome(data.monthly_income?.toString().replace(".", ",") || "");
      }
    }
    loadProfile();
  }, [user?.id]);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast.success("Avatar atualizado!");
    } catch {
      toast.error("Erro no upload do avatar.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const numIncome = parseFloat(income.replace(",", "."));
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      monthly_income: isNaN(numIncome) ? 0 : numIncome,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) toast.success("Perfil atualizado!");
    else toast.error("Erro ao guardar perfil.");
  }

  if (!user) return null;

  return (
    <section className="rounded-lg border border-border bg-card/60 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Perfil</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Dados do teu perfil e renda mensal de referência para cálculos financeiros.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={28} className="text-muted-foreground" />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary border-2 border-background rounded-full flex items-center justify-center cursor-pointer">
            {uploading ? (
              <Loader2 size={12} className="text-primary-foreground animate-spin" />
            ) : (
              <Camera size={12} className="text-primary-foreground" />
            )}
            <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold">{username || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome de exibição</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Como queres ser chamado?"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <Banknote size={12} />
            Renda Mensal (referência para cálculos)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/[^0-9,]/g, ""))}
            placeholder="0,00"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
          Guardar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={14} className="mr-1" />
          Sair da conta
        </Button>
      </div>
    </section>
  );
}
