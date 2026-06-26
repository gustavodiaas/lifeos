import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { FinanceModule } from '@/modules/finance/FinanceModule';

export const Route = createFileRoute('/finance')({
  head: () => ({
    meta: [
      { title: 'Finanças — LifeOS' },
      { name: 'description', content: 'Receitas, despesas, saldo acumulado e projeção financeira.' },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">
        <FinanceModule />
      </div>
    </AppShell>
  );
}
