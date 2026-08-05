import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  head: () => ({
    meta: [
      { title: 'Entrar — LifeOS' },
      { name: 'description', content: 'Inicia sessão no teu LifeOS.' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return <AuthScreen />;
}
