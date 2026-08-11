import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

export interface ModulePermissions {
  calendar: "edit" | "view" | "none";
  finance: "edit" | "view" | "none";
  tasks: "edit" | "view" | "none";
  books: "edit" | "view" | "none";
  habits: "edit" | "view" | "none";
}

export interface SharedWorkspace {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar?: string;
  permissions: ModulePermissions;
  inviteCode?: string;
}

interface WorkspaceContextValue {
  activeUserId: string;
  isSharedWorkspace: boolean;
  activeWorkspace: SharedWorkspace;
  myWorkspaces: SharedWorkspace[];
  setActiveUserId: (id: string) => void;
  inviteUserByEmail: (email: string, permissions: ModulePermissions) => Promise<string>;
  acceptInviteCode: (code: string) => Promise<boolean>;
  updateMemberPermissions: (email: string, permissions: ModulePermissions) => void;
  revokeAccess: (emailOrId: string) => void;
  mySharedMembers: { email: string; name: string; permissions: ModulePermissions; code: string }[];
}

const DEFAULT_PERMISSIONS: ModulePermissions = {
  calendar: "edit",
  finance: "edit",
  tasks: "edit",
  books: "edit",
  habits: "edit",
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

  // Lista de workspaces que este usuário pode acessar
  const [myWorkspaces, setMyWorkspaces] = useState<SharedWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_${currentUserId}_workspaces`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Lista de pessoas que eu convidei para a minha conta
  const [mySharedMembers, setMySharedMembers] = useState<
    { email: string; name: string; permissions: ModulePermissions; code: string }[]
  >(() => {
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

  const setActiveUserId = (id: string) => {
    setActiveUserIdState(id);
    const targetWs = myWorkspaces.find((w) => w.ownerId === id);
    if (targetWs) {
      toast.info(`Navegando no espaço de trabalho de ${targetWs.ownerName}`);
    } else {
      toast.info("Navegando na sua Conta Pessoal");
    }
  };

  // Gerar código de convite / Convidar por E-mail
  const inviteUserByEmail = async (email: string, permissions: ModulePermissions): Promise<string> => {
    const code = "LIFEOS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newMember = {
      email: email.trim().toLowerCase(),
      name: email.split("@")[0],
      permissions,
      code,
    };

    setMySharedMembers((prev) => [...prev.filter((m) => m.email !== newMember.email), newMember]);
    toast.success(`Código de acesso gerado para ${email}: ${code}`);
    return code;
  };

  // Aceitar Código de Convite
  const acceptInviteCode = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode.startsWith("LIFEOS-")) {
      toast.error("Código de convite inválido. Formato esperado: LIFEOS-XXXXXX");
      return false;
    }

    // Criar um workspace compartilhado fictício associado ao código
    const newWs: SharedWorkspace = {
      ownerId: `shared_${cleanCode}`,
      ownerName: `Conta Compartilhada (${cleanCode.slice(-4)})`,
      ownerEmail: `convite-${cleanCode.slice(-4)}@lifeos.app`,
      permissions: DEFAULT_PERMISSIONS,
      inviteCode: cleanCode,
    };

    setMyWorkspaces((prev) => [...prev.filter((w) => w.inviteCode !== cleanCode), newWs]);
    setActiveUserIdState(newWs.ownerId);
    toast.success("Convite aceito! Espaço de trabalho conectado.");
    return true;
  };

  const updateMemberPermissions = (email: string, permissions: ModulePermissions) => {
    setMySharedMembers((prev) =>
      prev.map((m) => (m.email === email ? { ...m, permissions } : m))
    );
    toast.success("Permissões do membro atualizadas!");
  };

  const revokeAccess = (identifier: string) => {
    setMySharedMembers((prev) => prev.filter((m) => m.email !== identifier && m.code !== identifier));
    setMyWorkspaces((prev) => prev.filter((w) => w.ownerId !== identifier && w.inviteCode !== identifier));
    if (activeUserId === identifier) {
      setActiveUserIdState(currentUserId);
    }
    toast.success("Acesso revogado.");
  };

  const isSharedWorkspace = activeUserId !== currentUserId;

  const currentWorkspaceInfo: SharedWorkspace = isSharedWorkspace
    ? myWorkspaces.find((w) => w.ownerId === activeUserId) || {
        ownerId: activeUserId,
        ownerName: "Conta Compartilhada",
        ownerEmail: "",
        permissions: DEFAULT_PERMISSIONS,
      }
    : {
        ownerId: currentUserId,
        ownerName: currentUserName,
        ownerEmail: currentUserEmail,
        ownerAvatar: currentUserAvatar,
        permissions: DEFAULT_PERMISSIONS,
      };

  return (
    <WorkspaceContext.Provider
      value={{
        activeUserId,
        isSharedWorkspace,
        activeWorkspace: currentWorkspaceInfo,
        myWorkspaces,
        setActiveUserId,
        inviteUserByEmail,
        acceptInviteCode,
        updateMemberPermissions,
        revokeAccess,
        mySharedMembers,
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
