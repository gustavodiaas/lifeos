import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name.trim()) {
          setError('Por favor, insira o seu nome antes de criar a conta.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: name.trim() } },
        });
        if (error) throw error;
        setSuccessMsg('Conta criada com sucesso! Você já pode entrar.');
      }
    } catch (err: any) {
      console.error('Erro de Autenticação:', err);
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setError('Não foi possível conectar ao servidor. Verifique a sua conexão de internet.');
      } else if (msg.includes('User already registered') || msg.includes('user_already_exists')) {
        setError('Este e-mail já está cadastrado. Clique em "Entrar" acima.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha inválidos. Verifique os seus dados.');
      } else if (msg.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifique a sua caixa de entrada.');
      } else {
        setError(msg || 'Erro ao realizar autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro no Login Google:', err);
      const msg = err.message || '';
      if (msg.includes('provider is not enabled') || msg.includes('validation_failed') || err.status === 400) {
        setError('O login com Google precisa ser ativado no painel do Supabase (Authentication > Providers > Google). Use o cadastro com e-mail e senha abaixo por enquanto.');
      } else {
        setError('Erro ao conectar com o Google. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden select-none bg-background text-foreground px-4 py-8">
      {/* Luzes ambiente responsivas ao tema do sistema */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none bg-foreground/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full pointer-events-none bg-foreground/5 blur-3xl" />

      {/* Container Principal */}
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-6 fade-in">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-[24px] bg-foreground text-background flex items-center justify-center shadow-xl shadow-black/10">
            <span className="text-2xl font-black tracking-tighter">L</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            LifeOS
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Seu Sistema Pessoal
          </p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-card border border-border/70 rounded-[28px] p-5 shadow-2xl space-y-4">
          {/* Alternador Entrar / Criar Conta */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-2xl border border-border/50">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-bold transition-all text-center",
                isLogin
                  ? "bg-foreground text-background shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-bold transition-all text-center",
                !isLogin
                  ? "bg-foreground text-background shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Criar Conta
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleAuth} className="space-y-3.5 pt-1">
            {/* Alertas */}
            {error && (
              <div className="rounded-2xl px-4 py-3 text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30 fade-in">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="rounded-2xl px-4 py-3 text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 fade-in">
                {successMsg}
              </div>
            )}

            {/* Nome (apenas Cadastro) */}
            {!isLogin && (
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-ios pl-10 text-xs font-semibold"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            {/* E-mail */}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-ios pl-10 text-xs font-semibold"
                required
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-ios pl-10 pr-10 text-xs font-semibold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Botão de Submissão com Alto Contraste */}
            <button
              type="submit"
              disabled={loading}
              className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-black/10 active:scale-98 transition-all mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OU</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Botão Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-2xl font-bold text-xs bg-muted/40 hover:bg-muted text-foreground border border-border/60 flex items-center justify-center gap-2.5 transition-all active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.27-4.74 3.27-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar com o Google</span>
          </button>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] font-medium text-muted-foreground">
          Ao entrar, você concorda com os nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
