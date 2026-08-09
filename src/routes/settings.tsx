import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef, useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendBrowserNotification,
  type NotificationSettings,
} from "@/lib/notifications";
import {
  User,
  Camera,
  Loader2,
  Save,
  LogOut,
  Banknote,
  Sun,
  Moon,
  Monitor,
  KeyRound,
  Shield,
  Download,
  Upload,
  Sparkles,
  Calendar,
  Briefcase,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — LifeOS" },
      { name: "description", content: "Configurações de perfil, aparência, segurança e dados." },
    ],
  }),
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuthContext();
  const [theme, setTheme] = useState<Theme>("system");

  // Perfil State
  const [username, setUsername] = useState("");
  const [income, setIncome] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Segurança State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Notificações State
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);

  // Carrega tema
  useEffect(() => {
    const stored = localStorage.getItem("lifeos-theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  // Carrega perfil
  useEffect(() => {
    if (!user?.id) return;
    async function loadProfile() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user!.id)
          .maybeSingle();

        if (data) {
          setUsername(data.username || user?.user_metadata?.username || "");
          setIncome(data.monthly_income ? data.monthly_income.toString().replace(".", ",") : "");
        } else if (user?.user_metadata) {
          setUsername(user.user_metadata.username || "");
        }

        // Metadados adicionais do usuário
        if (user?.user_metadata?.birth_date) setBirthDate(user.user_metadata.birth_date);
        if (user?.user_metadata?.occupation) setOccupation(user.user_metadata.occupation);
        if (user?.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      }
    }
    loadProfile();
  }, [user]);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("lifeos-theme", newTheme);
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    toast.success(`Tema alterado para ${newTheme === "dark" ? "Escuro" : newTheme === "light" ? "Claro" : "Sistema"}`);
  }

  // Upload Avatar
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Salvar Perfil
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      setSavingProfile(true);
      const numIncome = parseFloat(income.replace(",", "."));

      // 1. Atualiza tabela profiles no Supabase
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        monthly_income: isNaN(numIncome) ? 0 : numIncome,
        updated_at: new Date().toISOString(),
      });

      if (profileErr) console.warn("Aviso ao atualizar profiles:", profileErr.message);

      // 2. Atualiza user metadata no Supabase Auth
      await supabase.auth.updateUser({
        data: {
          username,
          birth_date: birthDate,
          occupation,
          avatar_url: avatarUrl,
        },
      });

      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar dados do perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Redefinir Senha
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar senha.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  // Enviar e-mail de redefinição
  async function handleSendResetEmail() {
    if (!user?.email) return;
    try {
      setSendingResetEmail(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success(`E-mail de redefinição enviado para ${user.email}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar e-mail.");
    } finally {
      setSendingResetEmail(false);
    }
  }

  // Exportar Backup Supabase
  async function handleExport() {
    if (!user) return;
    try {
      const tables = [
        "habits",
        "habit_logs",
        "projects",
        "tasks",
        "goals",
        "notes",
        "folders",
        "journal_entries",
        "metrics",
        "lancamentos",
      ];
      const backupData: Record<string, any[]> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select("*").eq("user_id", user.id);
        backupData[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Cópia de segurança exportada!");
    } catch {
      toast.error("Erro ao exportar dados.");
    }
  }

  // Importar Backup Supabase
  async function handleImport(file: File) {
    if (!user) return;
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      let count = 0;
      for (const table of Object.keys(backupData)) {
        const rows = backupData[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const formattedRows = rows.map((r: any) => ({ ...r, user_id: user.id }));
        const { error } = await supabase.from(table).upsert(formattedRows);
        if (!error) count += formattedRows.length;
      }
      toast.success(`${count} registros importados com sucesso!`);
    } catch {
      toast.error("Ficheiro de segurança inválido.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Ajustes"
        description="Gere o teu perfil pessoal, aparência, segurança da conta e backups."
      />

      <PageBody>
        <div className="space-y-6 max-w-4xl fade-in">

          {/* ── 1. Perfil do Usuário & Dados Pessoais ──────────────────── */}
          <section className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Perfil & Dados Pessoais</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Informações de exibição e preferências pessoais no teu LifeOS.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar + Status */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User size={36} className="text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-foreground hover:opacity-80 border-2 border-background rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95">
                    {uploadingAvatar ? (
                      <Loader2 size={14} className="text-black animate-spin" />
                    ) : (
                      <Camera size={14} className="text-black" />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-foreground">{username || "Usuário LifeOS"}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 size={13} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">{user?.email}</span>
                  </div>
                  <span className="badge-ios mt-2 inline-block">Conta Ativa</span>
                </div>
              </div>

              {/* Grid de Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Como queres ser chamado?"
                    className="input-ios"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Banknote size={14} className="text-muted-foreground" />
                    Renda Mensal (Referência para Finanças)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={income}
                    onChange={(e) => setIncome(e.target.value.replace(/[^0-9,]/g, ""))}
                    placeholder="Ex: 5000,00"
                    className="input-ios"
                  />
                </div>

                <div>
                  <CustomDatePicker
                    label="Data de Aniversário"
                    value={birthDate}
                    onChange={setBirthDate}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-muted-foreground" />
                    Profissão / Área de Atuação
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Ex: Desenvolvedor, Engenheiro..."
                    className="input-ios"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-ios py-3 px-6"
                >
                  {savingProfile ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ── 2. Aparência & Tema (Apple Segmented Switcher) ──────────── */}
          <section className="glass-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <Sun size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Aparência & Modo de Exibição</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Escolha como o LifeOS deve parecer no seu dispositivo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ios-spring ${
                  theme === "light"
                    ? "border-foreground bg-foreground/10 text-foreground font-bold shadow-sm"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Sun size={24} className={theme === "light" ? "text-foreground" : "text-muted-foreground"} />
                <span className="text-xs">Claro</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ios-spring ${
                  theme === "dark"
                    ? "border-foreground bg-foreground/10 text-foreground font-bold shadow-sm"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Moon size={24} className={theme === "dark" ? "text-foreground" : "text-muted-foreground"} />
                <span className="text-xs">Escuro</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ios-spring ${
                  theme === "system"
                    ? "border-foreground bg-foreground/10 text-foreground font-bold shadow-sm"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Monitor size={24} className={theme === "system" ? "text-foreground" : "text-muted-foreground"} />
                <span className="text-xs">Sistema</span>
              </button>
            </div>
          </section>
          {/* ── 2.5 Notificações PWA & Lembretes ────────────────────────── */}
          <section className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Notificações PWA & Lembretes</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Receba alertas automáticos de hábitos pendentes e lembrete do diário.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!notifSettings.enabled) {
                    const granted = await requestNotificationPermission();
                    if (granted) {
                      const updated = { ...notifSettings, enabled: true };
                      setNotifSettings(updated);
                      saveNotificationSettings(updated);
                    }
                  } else {
                    const updated = { ...notifSettings, enabled: false };
                    setNotifSettings(updated);
                    saveNotificationSettings(updated);
                    toast.info("Notificações desativadas.");
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  notifSettings.enabled
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {notifSettings.enabled ? "Ativadas" : "Ativar Notificações"}
              </button>
            </div>

            {notifSettings.enabled && (
              <div className="space-y-4 fade-in">
                {/* Lembrete de Hábitos */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/50">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Lembrete de Hábitos Pendentes</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Avisa às {notifSettings.habitsTime} se houver hábitos não concluídos</span>
                  </div>
                  <input
                    type="time"
                    value={notifSettings.habitsTime}
                    onChange={(e) => {
                      const updated = { ...notifSettings, habitsTime: e.target.value };
                      setNotifSettings(updated);
                      saveNotificationSettings(updated);
                    }}
                    className="input-ios py-1.5 px-3 text-xs w-28 font-bold"
                  />
                </div>

                {/* Lembrete de Diário */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/50">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Lembrete do Diário Pessoal</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Lembrança para registrar a reflexão do dia às {notifSettings.journalTime}</span>
                  </div>
                  <input
                    type="time"
                    value={notifSettings.journalTime}
                    onChange={(e) => {
                      const updated = { ...notifSettings, journalTime: e.target.value };
                      setNotifSettings(updated);
                      saveNotificationSettings(updated);
                    }}
                    className="input-ios py-1.5 px-3 text-xs w-28 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sendBrowserNotification("LifeOS — Notificação de Teste ⚡", {
                      body: "Seu sistema de notificações PWA está funcionando perfeitamente!",
                    });
                    toast.success("Notificação de teste enviada!");
                  }}
                  className="btn-ios text-xs py-2.5 px-4 font-bold"
                >
                  🔔 Enviar Notificação de Teste
                </button>
              </div>
            )}
          </section>

          {/* ── 3. Segurança & Redefinição de Senha ───────────────────── */}
          <section className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Segurança & Alteração de Senha</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Altere sua senha de acesso ou solicite um link por e-mail.
                </p>
              </div>
            </div>

            {/* Painel Redefinir Senha */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input-ios"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="input-ios"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingResetEmail}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {sendingResetEmail ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <KeyRound size={14} />
                  )}
                  <span>Enviar link para e-mail</span>
                </button>

                <button
                  type="submit"
                  disabled={updatingPassword || !newPassword}
                  className="btn-ios text-xs py-2.5 px-5"
                >
                  {updatingPassword ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Atualizar Senha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ── 4. Dados Locais & Cópia de Segurança ──────────────────── */}
          <section className="glass-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <Download size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Cópia de Segurança & Dados</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Exporte ou importe uma cópia de segurança em formato JSON dos seus dados locais.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="px-5 py-3 rounded-xl bg-muted border border-border font-bold text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Download size={16} className="text-muted-foreground" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-5 py-3 rounded-xl border border-border font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                <span>Importar Backup (JSON)</span>
              </button>

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

          {/* ── 5. Botão Sair da Conta ─────────────────────────────────── */}
          <section className="glass-card p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Sessão da Conta</h3>
              <p className="text-xs text-muted-foreground font-medium">Desconectar deste dispositivo</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Terminar Sessão</span>
            </button>
          </section>

          {/* ── 6. Sobre ──────────────────────────────────────────────── */}
          <div className="text-center py-4 space-y-1">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-muted-foreground" />
              LifeOS v0.4 Pro — Sistema Operativo Pessoal
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Desenvolvido com TanStack Router, Supabase & Tailwind CSS.
            </p>
          </div>

        </div>
      </PageBody>
    </AppShell>
  );
}
