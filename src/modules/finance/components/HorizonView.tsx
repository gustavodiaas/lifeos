import { useMemo } from 'react';
import { formatCurrency, buildDayRows, expandRecorrentes, calcSaldoInicial } from '@/lib/finance';
import type { Lancamento } from '@/lib/supabase';

const getSaldoColor = (v: number) => {
  if (v > 2000) return 'bg-emerald-700 text-white';
  if (v >= 1000) return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100';
  if (v >= 0) return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-200';
  if (v >= -499.99) return 'bg-orange-200 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200';
  return 'bg-red-600 text-white';
};

interface Props {
  lancamentos: Lancamento[];
  currentMonth: number;
  currentYear: number;
}

export function HorizonView({ lancamentos, currentMonth, currentYear }: Props) {
  const mesesProjetados = useMemo(() => {
    const projecao: any[] = [];
    let saldoReferencia: number | null = null;

    [0, 1, 2].forEach((offset) => {
      const d = new Date(currentYear, currentMonth + offset, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const saldoIni = offset === 0 ? calcSaldoInicial(lancamentos, y, m) : (saldoReferencia ?? 0);
      const exp = expandRecorrentes(lancamentos, y, m);
      const rows = buildDayRows(exp, y, m, saldoIni);

      if (rows.length > 0) saldoReferencia = rows[rows.length - 1].saldoAcumulado;

      projecao.push({
        nome: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        ano: d.getFullYear().toString().slice(-2),
        rows,
      });
    });

    return projecao;
  }, [lancamentos, currentMonth, currentYear]);

  return (
    <div className="flex w-full overflow-x-auto snap-x snap-mandatory pb-24">
      {mesesProjetados.map((m, idx) => (
        <div
          key={idx}
          className="w-1/3 min-w-[33.33%] border-r border-border flex flex-col snap-start snap-always shrink-0"
        >
          <div className="bg-primary text-primary-foreground py-3 px-2 flex justify-center items-center sticky top-0 z-20 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {m.nome}/{m.ano}
            </span>
          </div>

          <div className="flex flex-col">
            {m.rows.map((row: any) => (
              <div
                key={row.date}
                className="grid grid-cols-[28px_1fr] border-b border-border h-10 items-center"
              >
                <div className="text-[9px] text-muted-foreground text-center font-bold border-r border-border h-full flex items-center justify-center bg-muted/20">
                  {row.day}
                </div>
                <div
                  className={`text-[10px] font-black px-1.5 h-full flex items-center justify-end tracking-tighter ${getSaldoColor(row.saldoAcumulado)}`}
                >
                  {formatCurrency(row.saldoAcumulado).replace('R$', '').trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
