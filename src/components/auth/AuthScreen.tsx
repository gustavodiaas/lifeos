import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from 'lucide-react';

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
          setError('Por favor, insere o teu nome antes de criar a conta.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: name.trim() } },
        });
        if (error) throw error;
        setSuccessMsg('Conta criada! Podes entrar agora ou verifica o teu e-mail se pedido.');
      }
    } catch (err: any) {
      console.error('Erro de Autenticação:', err);
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setError('Não foi possível conectar ao Supabase. Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram adicionadas nas configurações do Vercel.');
      } else if (msg.includes('User already registered') || msg.includes('user_already_exists')) {
        setError('Este e-mail já está cadastrado. Clique em "Entrar" na aba acima.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha inválidos. Verifica e tenta novamente.');
      } else if (msg.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifica a tua caixa de entrada para confirmar a conta.');
      } else {
        setError(msg || 'Erro ao realizar autenticação. Tenta novamente.');
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
    } catch {
      setError('Erro ao conectar com o Google.');
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ background: '#212121' }}
    >
      {/* Blobs de luz ambiente */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)' }}
      />

      {/* Card principal glass */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto px-5 fade-in"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)', paddingBottom: 'max(env(safe-area-inset-bottom), 48px)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-5 shadow-2xl"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 16px 48px rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-3xl font-black text-black tracking-tighter">L</span>
          </div>
          <h1
            className="text-4xl font-black tracking-tight text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            LifeOS
          </h1>
          <p className="text-[13px] font-medium mt-1.5" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
            O TEU SISTEMA PESSOAL
          </p>
        </div>

        {/* Formulário */}
        <div
          className="rounded-[24px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* Toggle login/cadastro */}
          <div className="flex p-1.5 m-3 rounded-[14px]" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all"
              style={{
                background: isLogin ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isLogin ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all"
              style={{
                background: !isLogin ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: !isLogin ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              }}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="px-4 pb-4 space-y-3">
            {/* Alertas */}
            {error && (
              <div className="rounded-[12px] px-4 py-3 text-xs font-semibold fade-in"
                style={{ background: 'rgba(255,59,48,0.18)', color: '#FF6B6B', border: '1px solid rgba(255,59,48,0.25)' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="rounded-[12px] px-4 py-3 text-xs font-semibold fade-in"
                style={{ background: 'rgba(52,199,89,0.15)', color: '#32D74B', border: '1px solid rgba(52,199,89,0.25)' }}>
                {successMsg}
              </div>
            )}

            {/* Nome — só no cadastro */}
            {!isLogin && (
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
                <input
                  type="text"
                  placeholder="Como queres ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-[14px] text-[15px] font-medium outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.09)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'currentColor'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-[14px] text-[15px] font-medium outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'currentColor'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                required
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 rounded-[14px] text-[15px] font-medium outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'currentColor'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 transition-all ios-spring disabled:opacity-60 mt-1"
              style={{
                background: 'linear-gradient(135deg, currentColor 0%, currentColor 100%)',
                color: '#000000',
                boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 mx-4 mb-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>OU</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google */}
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-[14px] font-semibold text-[14px] flex items-center justify-center gap-3 transition-all ios-spring"
              style={{
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.27-4.74 3.27-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com o Google
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center mt-6 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Ao entrar, concordas com os nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
