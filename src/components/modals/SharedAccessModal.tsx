import { useState } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useWorkspace, type ModulePermissions } from "@/context/WorkspaceContext";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Users, UserPlus, KeyRound, Shield, Check, Copy, Trash2, Sparkles, ChevronRight, Lock, Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface SharedAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function SharedAccessModal({ open, onClose }: SharedAccessModalProps) {
  const {
    mySharedMembers,
    inviteUserByEmail,
    acceptInviteCode,
    updateMemberPermissions,
    revokeAccess,
  } = useWorkspace();

  const [tab, setTab] = useState<"invite" | "accept" | "members">("invite");
  const [emailInput, setEmailInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Granular Module Permissions
  const [permissions, setPermissions] = useState<ModulePermissions>({
    calendar: "edit",
    finance: "edit",
    tasks: "edit",
    books: "edit",
    habits: "edit",
  });

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const code = await inviteUserByEmail(emailInput, permissions);
    setGeneratedCode(code);
    setEmailInput("");
  };

  const handleAcceptCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    const success = await acceptInviteCode(inviteCodeInput);
    if (success) {
      setInviteCodeInput("");
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado!");
  };

  return (
    <ModalPortal open={open} onClose={onClose} title="Acessos Simultâneos & Convites">
      <div className="space-y-5 select-none">
        {/* Navegação por Abas Internas */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => setTab("invite")}
            className={cn(
              "py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
              tab === "invite"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus size={14} />
            <span>Convidar</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("accept")}
            className={cn(
              "py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
              tab === "accept"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <KeyRound size={14} />
            <span>Inserir Código</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("members")}
            className={cn(
              "py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
              tab === "members"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users size={14} />
            <span>Membros ({mySharedMembers.length})</span>
          </button>
        </div>

        {/* ABA 1: CONVIDAR & GERAR CÓDIGO */}
        {tab === "invite" && (
          <form onSubmit={handleGenerateInvite} className="space-y-4 fade-in">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                E-mail da pessoa a ser convidada
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ex: parceiro@email.com"
                className="input-ios text-xs font-bold"
                required
              />
            </div>

            {/* Permissões Granulares por Módulo */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-foreground" />
                <h4 className="text-xs font-black text-foreground">Permissões de Acesso aos Módulos</h4>
              </div>

              <div className="space-y-2">
                {[
                  { key: "calendar", label: "📅 Calendário & Agenda" },
                  { key: "finance", label: "💰 Finanças & Caixinhas" },
                  { key: "tasks", label: "📌 Tarefas & Quadro" },
                  { key: "books", label: "📖 Livros & Conhecimento" },
                  { key: "habits", label: "🔁 Hábitos" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card border border-border/50">
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <div className="w-36">
                      <CustomSelect
                        value={permissions[key as keyof ModulePermissions]}
                        onChange={(val) =>
                          setPermissions((prev) => ({
                            ...prev,
                            [key]: val as any,
                          }))
                        }
                        options={[
                          { value: "edit", label: "Editar & Ver" },
                          { value: "view", label: "Apenas Ver" },
                          { value: "none", label: "Sem Acesso" },
                        ]}
                        className="text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10">
              Gerar Convite & Permissões
            </button>

            {generatedCode && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 fade-in">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Código de Acesso Criado com Sucesso
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-black text-foreground tracking-widest bg-card px-4 py-2 rounded-xl border border-border">
                    {generatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)}
                    className="p-2.5 rounded-xl bg-foreground text-background font-bold"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Envie este código para a outra pessoa digitar no aplicativo dela em "Inserir Código".
                </p>
              </div>
            )}
          </form>
        )}

        {/* ABA 2: INSERIR CÓDIGO DE CONVITE */}
        {tab === "accept" && (
          <form onSubmit={handleAcceptCode} className="space-y-4 fade-in">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-2">
              <Sparkles size={20} className="mx-auto text-amber-500" />
              <h4 className="text-xs font-black text-foreground">Conectar a uma Conta Compartilhada</h4>
              <p className="text-[11px] font-medium text-muted-foreground">
                Digite o código de convite (ex: `LIFEOS-XXXXXX`) que foi gerado para você por outro usuário.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Código de Acesso
              </label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="LIFEOS-ABC123"
                className="input-ios text-sm font-black tracking-widest text-center uppercase"
                required
              />
            </div>

            <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10">
              Conectar e Alternar Espaço
            </button>
          </form>
        )}

        {/* ABA 3: MEMBROS COM ACESSO Á SUA CONTA */}
        {tab === "members" && (
          <div className="space-y-3 fade-in">
            {mySharedMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-medium border border-dashed border-border/70 rounded-2xl">
                Você ainda não convidou nenhum membro para acessar sua conta.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {mySharedMembers.map((member) => (
                  <div key={member.email} className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-foreground block truncate">{member.name}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground block truncate">{member.email}</span>
                      <span className="text-[9px] font-extrabold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border inline-block mt-1">
                        Código: {member.code}
                      </span>
                    </div>

                    <button
                      onClick={() => revokeAccess(member.email)}
                      className="p-2 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-red-500 border border-border transition-colors"
                      title="Revogar Acesso"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
