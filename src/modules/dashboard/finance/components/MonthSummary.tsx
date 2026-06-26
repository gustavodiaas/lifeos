import { formatCurrency } from '@/lib/finance';
import type { SummaryData } from '@/lib/finance';

interface Props {
  summary: SummaryData;
  selectedMonth: number;
  selectedYear: number;
}

export function MonthSummary({ summary, selectedMonth, selectedYear }: Props) {
  const now = new Date();
  const isPast =
    selectedYear < now.getFullYear() ||
    (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());

  const isPositivo = summary.economizado >= 0;
  const isDiarioNegativo = summary.diarioMedio < 0;

  const statusText = isPositivo
    ? isPast ? 'Sobrou dinheiro' : 'Sobrará dinheiro'
    : isPast ? 'Fechou no vermelho' : 'Fechará no vermelho';

  const statusColor = isPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500';
  const monthBg = isPositivo ? 'bg-emerald-500' : 'bg-red-500';
  const custoVidaOK = summary.custoVida <= summary.rendaReal * 0.6;

  return (
    <div className="flex flex-col p-6 space-y-8 pb-24">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        Cálculos do mês
      </p>

      {/* Performance */}
      <div className="flex justify-between items-start border-b border-border pb-5">
        <div>
          <p className="text-sm font-bold text-foreground">Performance</p>
          <div className="flex gap-1.5 mt-3">
            {[4, 3, 2, 1, 0].map((offset, i) => {
              const d = new Date(selectedYear, selectedMonth - offset, 1);
              const letra = d.toLocaleDateString('pt-BR', { month: 'short' })[0].toUpperCase();
              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    i === 4 ? monthBg : 'bg-yellow-400 dark:bg-yellow-600'
                  }`}
                >
                  {letra}
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-foreground">{formatCurrency(summary.saldoFinal)}</p>
          <p className={`text-[10px] font-bold mt-1 ${statusColor}`}>{statusText}</p>
        </div>
      </div>

      {/* Economizado */}
      <div className="flex justify-between items-start border-b border-border pb-5">
        <div>
          <p className="text-sm font-bold text-foreground">Economizado</p>
          <div className="w-32 h-2 bg-muted rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, summary.porcentagemEconomy))}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-foreground">{summary.porcentagemEconomy}%</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Eficiência real</p>
        </div>
      </div>

      {/* Custo de vida */}
      <div className="flex justify-between items-center border-b border-border pb-5">
        <p className="text-sm font-bold text-foreground">Custo de vida</p>
        <div className="text-right">
          <p className="text-sm font-black text-foreground">{formatCurrency(summary.custoVida)}</p>
          <p className={`text-[10px] font-bold mt-1 ${custoVidaOK ? 'text-violet-500' : 'text-orange-500'}`}>
            {custoVidaOK ? 'Dentro da renda' : 'Custo elevado'}
          </p>
        </div>
      </div>

      {/* Diário médio */}
      <div className="flex justify-between items-center border-b border-border pb-5">
        <p className="text-sm font-bold text-foreground">Diário médio</p>
        <div className="text-right">
          <p className={`text-sm font-black ${isDiarioNegativo ? 'text-red-500' : 'text-primary'}`}>
            {formatCurrency(summary.diarioMedio)}
          </p>
          <p className={`text-[10px] font-bold mt-1 ${isDiarioNegativo ? 'text-red-400' : 'text-muted-foreground'}`}>
            {isDiarioNegativo ? 'Excedido por dia' : 'Sugestão de gasto'}
          </p>
        </div>
      </div>

      {/* Movimentações */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Movimentações reais
        </p>
        <div className="flex justify-between py-1">
          <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Entradas
          </span>
          <span className="text-sm font-black text-foreground">{formatCurrency(summary.rendaReal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Saídas
          </span>
          <span className="text-sm font-black text-foreground">{formatCurrency(summary.totalSaidas)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            Investimentos
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.investimentos)}
          </span>
        </div>
      </div>
    </div>
  );
}
