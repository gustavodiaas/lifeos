import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function readAuthError(error: unknown) {
  if (error instanceof Error) return { message: error.message, status: undefined };
  if (typeof error !== "object" || error === null) return { message: "", status: undefined };

  const candidate = error as { message?: unknown; status?: unknown };
  return {
    message: typeof candidate.message === "string" ? candidate.message : "",
    status: typeof candidate.status === "number" ? candidate.status : undefined,
  };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.29-2.66l-3.58-2.77c-.99.66-2.24 1.06-3.71 1.06a6.47 6.47 0 0 1-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l2.85-2.22.81-.63Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84A6.47 6.47 0 0 1 12 5.38Z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setSuccessMsg(null);
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        if (!name.trim()) {
          setError("Informe seu nome antes de criar a conta.");
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: name.trim() } },
        });
        if (signUpError) throw signUpError;
        setSuccessMsg("Conta criada. Agora você já pode entrar.");
      }
    } catch (authError: unknown) {
      console.error("Erro de autenticação:", authError);
      const { message } = readAuthError(authError);

      if (message.includes("Failed to fetch") || message.includes("fetch")) {
        setError("Não foi possível conectar ao servidor. Verifique sua conexão.");
      } else if (
        message.includes("User already registered") ||
        message.includes("user_already_exists")
      ) {
        setError("Este e-mail já está cadastrado. Selecione Entrar.");
      } else if (message.includes("Invalid login credentials")) {
        setError("E-mail ou senha inválidos.");
      } else if (message.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de entrar.");
      } else {
        setError(message || "Não foi possível concluir a autenticação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    try {
      const redirectUrl = window.location.origin.includes("localhost")
        ? window.location.origin
        : "https://lifeos-omega-three.vercel.app";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (oauthError) throw oauthError;
    } catch (authError: unknown) {
      console.error("Erro no login Google:", authError);
      const { message, status } = readAuthError(authError);
      if (
        message.includes("provider is not enabled") ||
        message.includes("validation_failed") ||
        status === 400
      ) {
        setError("O acesso com Google ainda não está disponível. Use e-mail e senha.");
      } else {
        setError("Não foi possível conectar com o Google. Tente novamente.");
      }
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10 text-foreground">
      <div className="w-full max-w-[380px]">
        <div className="mb-12 flex items-center gap-3">
          <BrandMark className="size-9" />
          <p className="sf-display text-lg font-semibold tracking-[-0.035em]">LifeOS</p>
        </div>

        <header className="mb-8">
          <h1 className="sf-display text-[32px] font-semibold leading-tight tracking-[-0.045em]">
            {isLogin ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Acesse seu espaço pessoal." : "Comece com o essencial."}
          </p>
        </header>

        <div className="mb-7 flex gap-5 border-b border-border">
          <button
            type="button"
            onClick={() => selectMode(true)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm transition-colors",
              isLogin
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => selectMode(false)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm transition-colors",
              !isLogin
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-300"
            >
              {error}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
            >
              <Check className="size-4" />
              {successMsg}
            </div>
          )}

          {!isLogin && (
            <AuthField label="Nome" icon={User}>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-ios h-12 pl-10"
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            </AuthField>
          )}

          <AuthField label="E-mail" icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-ios h-12 pl-10"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </AuthField>

          <AuthField label="Senha" icon={Lock}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-ios h-12 px-10"
              placeholder="Mínimo de 6 caracteres"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((visible) => !visible)}
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground"
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </AuthField>

          <button
            type="submit"
            disabled={loading}
            className="btn-ios mt-2 h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar" : "Criar conta"}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="material-button flex h-12 w-full items-center justify-center gap-2.5 text-sm font-medium"
        >
          <GoogleIcon />
          Continuar com Google
        </button>
      </div>
    </main>
  );
}

function AuthField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </span>
    </label>
  );
}
