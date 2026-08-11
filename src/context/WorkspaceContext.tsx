import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

export type RoleType = "owner" | "member" | "viewer" | "custom";

export interface ModulePermissions {
  calendar: "edit" | "view" | "none";
  finance: "edit" | "view" | "none";
  tasks: "edit" | "view" | "none";
  books: "edit" | "view" | "none";
  habits: "edit" | "view" | "none";
  shopping: "edit" | "view" | "none";
}

export interface SharedWorkspace {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar?: string;
  role: RoleType;
  permissions: ModulePermissions;
  inviteCode?: string;
  inviteLink?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: RoleType;
  status: "active" | "pending";
  permissions: ModulePermissions;
  inviteCode: string;
}

interface WorkspaceContextValue {
  activeUserId: string;
  isSharedWorkspace: boolean;
  activeWorkspace: SharedWorkspace;
  myWorkspaces: SharedWorkspace[];
  mySharedMembers: TeamMember[];
  workspaceInviteLink: string;
  isPublicLinkEnabled: boolean;
  setActiveUserId: (id: string) => void;
  inviteMember: (email: string, role: RoleType, customPerms?: ModulePermissions) => Promise<string>;
  joinWorkspaceByToken: (token: string) => Promise<boolean>;
  updateMemberRole: (email: string, role: RoleType, customPerms?: ModulePermissions) => void;
  revokeAccess: (emailOrId: string) => void;
  togglePublicLink: (enabled: boolean) => void;
  getInviteLink: () => string;
}

export const PERMISSION_PRESETS: Record<"member" | "viewer", ModulePermissions> = {
  member: {
    calendar: "edit",
    finance: "edit",
    tasks: "edit",
    books: "edit",
    habits: "edit",
    shopping: "edit",
  },
  viewer: {
    calendar: "view",
    finance: "view",
    tasks: "view",
    books: "view",
    habits: "view",
    shopping: "view",
  },
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const currentUserId = user?.id || "guest";
  const currentUserName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Pessoal";
  const currentUserEmail = user?.email || "";
  const currentUserAvatar = user?.user_metadata?.avatar_url || (typeof window !== "undefined" ? localStorage.getItem("lifeos_avatar_url") : null) || "";

  // Selected Active Workspace Owner ID
  const [activeUserId, setActiveUserIdState] = useState<string>(currentUserId);

  // Toggle de link público do workspace (Estilo Notion: Qualquer pessoa com o link pode entrar)
  const [isPublicLinkEnabled, setIsPublicLinkEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_${currentUserId}_public_link`);
      return saved ? JSON.parse(saved) : true;
    } catch {}
    return true;
  });

  // Lista de workspaces que este usuário pode acessar (Equipes onde sou membro)
  const [myWorkspaces, setMyWorkspaces] = useState<SharedWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_${currentUserId}_workspaces`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Membros do meu time / espaço
  const [mySharedMembers, setMySharedMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_${currentUserId}_members`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (user?.id) {
      setActiveUserIdState((prev) => (prev === "guest" ? user.id : prev));
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`lifeos_${currentUserId}_workspaces`, JSON.stringify(myWorkspaces));
    }
  }, [myWorkspaces, currentUserId, user]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`lifeos_${currentUserId}_members`, JSON.stringify(mySharedMembers));
    }
  }, [mySharedMembers, currentUserId, user]);

  const togglePublicLink = (enabled: boolean) => {
    setIsPublicLinkEnabled(enabled);
    localStorage.setItem(`lifeos_${currentUserId}_public_link`, JSON.stringify(enabled));
    toast.success(enabled ? "Link de convite direto ativado!" : "Link de convite desativado.");
  };

  const getInviteLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://lifeos.app";
    const token = btoa(`${currentUserId}::${currentUserName}`);
    return `${origin}/?invite=${token}`;
  };

  const setActiveUserId = (id: string) => {
    setActiveUserIdState(id);
    const targetWs = myWorkspaces.find((w) => w.ownerId === id);
    if (targetWs) {
      toast.info(`Espaço de trabalho de ${targetWs.ownerName}`);
    } else {
      toast.info("Navegando no seu Espaço Pessoal");
    }
  };

  // Convidar membro por e-mail ou link (estilo Notion)
  const inviteMember = async (
    email: string,
    role: RoleType,
    customPerms?: ModulePermissions
  ): Promise<string> => {
    const cleanEmail = email.trim().toLowerCase();
    const token = "LIFEOS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const perms = role === "member" ? PERMISSION_PRESETS.member : role === "viewer" ? PERMISSION_PRESETS.viewer : customPerms || PERMISSION_PRESETS.member;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role,
      status: "pending",
      permissions: perms,
      inviteCode: token,
    };

    setMySharedMembers((prev) => [...prev.filter((m) => m.email !== cleanEmail), newMember]);
    toast.success(`Convite de ${role === "member" ? "Membro" : "Visualizador"} enviado para ${cleanEmail}!`);
    return token;
  };

  // Entrar em um workspace via link/token (1 clique estilo Notion)
  const joinWorkspaceByToken = async (token: string): Promise<boolean> => {
    try {
      let ownerId = "";
      let ownerName = "Espaço Compartilhado";

      if (token.startsWith("LIFEOS-")) {
        ownerId = `team_${token.toUpperCase()}`;
        ownerName = `Equipe (${token.slice(-4).toUpperCase()})`;
      } else {
        const decoded = atob(token);
        const parts = decoded.split("::");
        ownerId = parts[0] || `team_${token}`;
        ownerName = parts[1] || "Equipe LifeOS";
      }

      const newWs: SharedWorkspace = {
        ownerId,
        ownerName,
        ownerEmail: "",
        role: "member",
        permissions: PERMISSION_PRESETS.member,
        inviteCode: token,
      };

      setMyWorkspaces((prev) => [...prev.filter((w) => w.ownerId !== ownerId), newWs]);
      setActiveUserIdState(ownerId);
      toast.success(`Você entrou no espaço de trabalho de ${ownerName}!`);
      return true;
    } catch {
      toast.error("Link de convite inválido ou expirado.");
      return false;
    }
  };

  const updateMemberRole = (email: string, role: RoleType, customPerms?: ModulePermissions) => {
    const perms = role === "member" ? PERMISSION_PRESETS.member : role === "viewer" ? PERMISSION_PRESETS.viewer : customPerms || PERMISSION_PRESETS.member;

    setMySharedMembers((prev) =>
      prev.map((m) => (m.email === email ? { ...m, role, permissions: perms } : m))
    );
    toast.success(`Função de ${email} atualizada para ${role === "member" ? "Membro" : role === "viewer" ? "Visualizador" : "Personalizado"}.`);
  };

  const revokeAccess = (identifier: string) => {
    setMySharedMembers((prev) => prev.filter((m) => m.email !== identifier && m.id !== identifier && m.inviteCode !== identifier));
    setMyWorkspaces((prev) => prev.filter((w) => w.ownerId !== identifier && w.inviteCode !== identifier));
    if (activeUserId === identifier) {
      setActiveUserIdState(currentUserId);
    }
    toast.success("Acesso removido.");
  };

  const isSharedWorkspace = activeUserId !== currentUserId;

  const currentWorkspaceInfo: SharedWorkspace = isSharedWorkspace
    ? myWorkspaces.find((w) => w.ownerId === activeUserId) || {
        ownerId: activeUserId,
        ownerName: "Espaço Compartilhado",
        ownerEmail: "",
        role: "member",
        permissions: PERMISSION_PRESETS.member,
      }
    : {
        ownerId: currentUserId,
        ownerName: currentUserName,
        ownerEmail: currentUserEmail,
        ownerAvatar: currentUserAvatar,
        role: "owner",
        permissions: PERMISSION_PRESETS.member,
      };

  return (
    <WorkspaceContext.Provider
      value={{
        activeUserId,
        isSharedWorkspace,
        activeWorkspace: currentWorkspaceInfo,
        myWorkspaces,
        mySharedMembers,
        workspaceInviteLink: getInviteLink(),
        isPublicLinkEnabled,
        setActiveUserId,
        inviteMember,
        joinWorkspaceByToken,
        updateMemberRole,
        revokeAccess,
        togglePublicLink,
        getInviteLink,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace deve ser usado dentro de um WorkspaceProvider");
  }
  return context;
}
