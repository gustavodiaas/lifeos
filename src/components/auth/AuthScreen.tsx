import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Eye,
  EyeOff,
  Layers3,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";

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

const highlights = [
  {
    icon: CalendarCheck2,
    title: "Planeje com clareza",
    description: "Metas, agenda e tarefas conectadas ao seu dia.",
  },
  {
    icon: Layers3,
    title: "Um fluxo contínuo",
    description: "Hábitos, notas e finanças sem perder o contexto.",
  },
  {
    icon: ShieldCheck,
    title: "Feito para ser seu",
    description: "Uma base open source com privacidade em evolução.",
  },
];

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
    <main className="auth-shell min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1500px] lg:grid-cols-[1.06fr_0.94fr]">
        <section className="auth-hero relative hidden overflow-hidden border-r border-white/10 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-16">
          <div className="auth-orb auth-orb-one" />
          <div className="auth-orb auth-orb-two" />

          <div className="relative z-10 flex items-center gap-3">
            <BrandMark className="size-11 rounded-[15px]" />
            <div>
              <p className="sf-display text-lg font-bold tracking-[-0.035em]">LifeOS</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Sistema pessoal
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl py-14">
            <span className="vibrancy-label inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white/75">
              <span className="size-1.5 rounded-full bg-[#64d2ff] shadow-[0_0_12px_rgba(100,210,255,0.9)]" />
              Seu dia começa com intenção
            </span>
            <h1 className="sf-display mt-7 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] xl:text-6xl">
              Menos ruído.
              <br />
              Mais direção.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/60 xl:text-[17px]">
              Organize o que importa, transforme objetivos em ações e acompanhe sua evolução em um
              único espaço.
            </p>

            <div className="mt-10 grid max-w-xl gap-3">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="thin-material flex items-center gap-4 rounded-[20px] p-4"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-white/[0.08] text-[#a7dcff]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/45">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/32">
            Open source · Feito para evoluir com você
          </p>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="auth-mobile-glow pointer-events-none absolute inset-0" />
          <div className="relative z-10 w-full max-w-[430px] fade-in">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <BrandMark className="size-11 rounded-[15px]" />
              <div>
                <p className="sf-display text-lg font-bold tracking-[-0.035em]">LifeOS</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Sistema pessoal
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-[var(--system-blue)]">
                {isLogin ? "Bem-vindo de volta" : "Comece por aqui"}
              </p>
              <h2 className="sf-display mt-2 text-[34px] font-semibold leading-tight tracking-[-0.045em] text-foreground sm:text-[40px]">
                {isLogin ? "Entre no seu espaço" : "Crie seu LifeOS"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isLogin
                  ? "Continue de onde parou e organize as próximas ações."
                  : "Uma conta para reunir seus planos, rotinas e aprendizados."}
              </p>
            </div>

            <div className="segmented-control mb-6 grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => selectMode(true)}
                className={cn(
                  "rounded-[10px] px-3 py-2 text-sm font-semibold transition-all",
                  isLogin
                    ? "segmented-control-active"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => selectMode(false)}
                className={cn(
                  "rounded-[10px] px-3 py-2 text-sm font-semibold transition-all",
                  !isLogin
                    ? "segmented-control-active"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-[14px] border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300"
                >
                  {error}
                </div>
              )}
              {successMsg && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-[14px] border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <Check className="size-4" />
                  {successMsg}
                </div>
              )}

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-foreground">
                    Como podemos chamar você?
                  </span>
                  <span className="relative block">
                    <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="input-ios h-12 pl-10"
                      placeholder="Seu nome"
                      autoComplete="name"
                      required
                    />
                  </span>
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-foreground">E-mail</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input-ios h-12 pl-10"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-foreground">Senha</span>
                <span className="relative block">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                    className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-ios h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Entrar" : "Criar minha conta"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou continue com
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="material-button flex h-12 w-full items-center justify-center gap-2.5 text-sm font-semibold text-foreground"
            >
              <GoogleIcon />
              Google
            </button>

            <p className="mt-7 text-center text-[11px] leading-5 text-muted-foreground">
              Ao continuar, você concorda em usar o LifeOS de forma responsável.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
