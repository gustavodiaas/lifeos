import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Hexagon, ArrowRight, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Conta criada! Verifica o teu e-mail para confirmar.');
      }
    } catch {
      setError('E-mail ou senha inválidos. Verifica e tenta novamente.');
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
    <div className="min-h-[100dvh] bg-white dark:bg-[#0a1128] flex flex-col justify-center px-8 relative overflow-hidden select-none transition-colors duration-300">
      {/* Background blurs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-3xl opacity-60 pointer-events-none transition-colors" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gray-50 dark:bg-blue-500/5 rounded-full blur-3xl opacity-60 pointer-events-none transition-colors" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-white dark:bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-[24px] flex items-center justify-center mb-6 border border-transparent dark:border-gray-800 transition-all">
            <Hexagon size={40} strokeWidth={2.5} className="text-[#ff4d00] fill-[#fff0e6] dark:fill-orange-500/20" />
          </div>
          <h1 className="text-4xl font-black text-[#0a1128] dark:text-white tracking-tight transition-colors">LifeOS</h1>
          <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mt-2 transition-colors">
            O teu sistema operativo pessoal
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-bold rounded-2xl text-center uppercase tracking-tight border border-red-100 dark:border-red-500/20 transition-colors">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-green-50 dark:bg-green-500/10 text-green-600 text-xs font-bold rounded-2xl text-center uppercase tracking-tight border border-green-100 dark:border-green-500/20 transition-colors">
              {successMsg}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-300 dark:text-gray-600 transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Teu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#ff4d00] dark:focus:border-[#ff4d00] rounded-2xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-300 dark:text-gray-600 transition-colors" />
              </div>
              <input
                type="password"
                placeholder="Tua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#ff4d00] dark:focus:border-[#ff4d00] rounded-2xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-[#ff4d00] text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800 transition-colors" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#0a1128] text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest transition-colors">
                ou
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-6 py-4 bg-white dark:bg-[#111827] border-2 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.27-4.74 3.27-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com o Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-[#ff4d00] dark:hover:text-[#ff4d00] transition-colors"
          >
            {isLogin ? 'Criar nova conta com E-mail' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
