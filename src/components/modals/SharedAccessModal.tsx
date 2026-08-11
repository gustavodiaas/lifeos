import { useState } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useWorkspace, type RoleType, type ModulePermissions } from "@/context/WorkspaceContext";
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Shield,
  UserCheck,
  ChevronDown,
  Globe,
  Lock,
  Eye,
  Edit3,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface SharedAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function SharedAccessModal({ open, onClose }: SharedAccessModalProps) {
  const {
    activeWorkspace,
    mySharedMembers,
    workspaceInviteLink,
    isPublicLinkEnabled,
    inviteMember,
    joinWorkspaceByToken,
    updateMemberRole,
    revokeAccess,
    togglePublicLink,
  } = useWorkspace();

  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType>("member");
  const [copiedLink, setCopiedLink] = useState(false);
  const [pasteLinkInput, setPasteLinkInput] = useState("");
  const [showJoinSection, setShowJoinSection] = useState(false);

  // Custom permissions state when role is 'custom'
  const [customPerms, setCustomPerms] = useState<ModulePermissions>({
    calendar: "edit",
    finance: "edit",
    tasks: "edit",
    books: "edit",
    habits: "edit",
    shopping: "edit",
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    await inviteMember(emailInput, selectedRole, customPerms);
    setEmailInput("");
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(workspaceInviteLink);
    setCopiedLink(true);
    toast.success("Link de convite copiado para a área de transferência!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoinViaLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteLinkInput.trim()) return;

    let token = pasteLinkInput.trim();
    if (token.includes("invite=")) {
      const match = token.match(/invite=([^&]+)/);
      if (match) token = match[1];
    }

    const success = await joinWorkspaceByToken(token);
    if (success) {
      setPasteLinkInput("");
      onClose();
    }
  };

  return (
    <ModalPortal open={open} onClose={onClose} title="Compartilhar Espaço & Equipe">
      <div className="space-y-5 select-none max-w-lg mx-auto">
        {/* Header do Espaço de Trabalho */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
              {activeWorkspace.ownerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <span>{activeWorkspace.ownerName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {activeWorkspace.role === "owner" ? "Seu Espaço" : "Equipe"}
                </span>
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium">
                {mySharedMembers.length + 1} membro(s) nesta equipe
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowJoinSection(!showJoinSection)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            {showJoinSection ? "Voltar ao Gerenciador" : "+ Entrar em outro Espaço"}
          </button>
        </div>

        {/* MODO 1: ENTRAR EM OUTRO ESPAÇO VIA LINK */}
        {showJoinSection ? (
          <form onSubmit={handleJoinViaLink} className="space-y-3.5 p-4 rounded-2xl bg-card border border-border/70 shadow-sm fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Sparkles size={16} className="text-primary" />
              <h4 className="text-xs font-black text-foreground">Entrar em um Espaço de Trabalho</h4>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Cole o link de convite ou o código que você recebeu de outra pessoa para se conectar instantaneamente.
            </p>
            <input
              type="text"
              value={pasteLinkInput}
              onChange={(e) => setPasteLinkInput(e.target.value)}
              placeholder="Cole aqui o link (ex: https://lifeos.app/?invite=...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-sm hover:bg-primary/90 transition-colors"
            >
              Conectar e Alternar Espaço
            </button>
          </form>
        ) : (
          <>
            {/* ── 1. Convite Rápido por E-mail (Estilo Notion) ────────────────────── */}
            <form onSubmit={handleInviteSubmit} className="space-y-3.5 fade-in">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Convidar novo membro para a equipe
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Digite o e-mail da pessoa..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                  className="px-3 py-2.5 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="member">Membro (Acesso Total)</option>
                  <option value="viewer">Visualizador (Leitura)</option>
                  <option value="custom">Personalizado...</option>
                </select>

                <button
                  type="submit"
                  disabled={!emailInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <UserPlus size={14} /> Convidar
                </button>
              </div>

              {/* Permissões personalizadas se role === 'custom' */}
              {selectedRole === "custom" && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2 fade-in">
                  <span className="text-[11px] font-bold text-foreground block">
                    Permissões por Módulo:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "calendar", label: "📅 Calendário" },
                      { key: "finance", label: "💰 Finanças" },
                      { key: "tasks", label: "📌 Tarefas" },
                      { key: "habits", label: "🔁 Hábitos" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
                        <span className="text-xs font-bold text-foreground">{label}</span>
                        <select
                          value={customPerms[key as keyof ModulePermissions]}
                          onChange={(e) =>
                            setCustomPerms((prev) => ({
                              ...prev,
                              [key]: e.target.value as any,
                            }))
                          }
                          className="text-[11px] font-bold bg-transparent text-foreground cursor-pointer"
                        >
                          <option value="edit">Editar</option>
                          <option value="view">Ver</option>
                          <option value="none">Ocultar</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* ── 2. Link de Convite Direto (Estilo Notion 1-Click Link) ─────────────── */}
            <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-primary" />
                  <span className="text-xs font-black text-foreground">Link de Convite Direto</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">Qualquer pessoa pode entrar</span>
                  <button
                    type="button"
                    onClick={() => togglePublicLink(!isPublicLinkEnabled)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-all relative p-0.5",
                      isPublicLinkEnabled ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full bg-white block transition-transform shadow-xs",
                        isPublicLinkEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {isPublicLinkEnabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={workspaceInviteLink}
                    className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-[11px] font-mono text-muted-foreground truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3.5 py-2 rounded-xl bg-foreground text-background font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shrink-0"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedLink ? "Copiado!" : "Copiar Link"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-medium italic">
                  O link público de convite está desativado. Ative para compartilhar via link.
                </p>
              )}
            </div>

            {/* ── 3. Lista de Membros da Equipe (Notion Team List) ───────────────────── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  Membros com Acesso ({mySharedMembers.length + 1})
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {/* Linha do Proprietário (Você) */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      <Crown size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-foreground block">
                        {activeWorkspace.ownerName} (Você)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Proprietário do Espaço
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Proprietário
                  </span>
                </div>

                {/* Membros Convidados */}
                {mySharedMembers.map((member) => (
                  <div
                    key={member.email}
                    className="p-3 rounded-2xl bg-card border border-border/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-foreground block truncate">
                          {member.name}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground block truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.email, e.target.value as RoleType)}
                        className="px-2.5 py-1 rounded-xl bg-muted text-xs font-bold text-foreground cursor-pointer border border-border/50"
                      >
                        <option value="member">Membro (Editar)</option>
                        <option value="viewer">Visualizador</option>
                        <option value="custom">Personalizado</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => revokeAccess(member.email)}
                        className="p-1.5 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remover acesso"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ModalPortal>
  );
}
