import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/finance';
import type { DayRow } from '@/lib/finance';
import { Building2, ShoppingCart, TrendingUp, ChevronDown } from 'lucide-react';

interface Props {
  rows: DayRow[];
}

export function TagsView({ rows }: Props) {
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const { tagStats, transactionsByTag } = useMemo(() => {
    const stats: Record<string, number> = {};
    const grouped: Record<string, any[]> = {};

    rows.forEach((row) => {
      row.saidas.forEach((s: any) => {
        const cat = s.categoria || 'diario';
        const dia = s.data ? String(s.data).split('-')[2] : '--';
        stats[cat] = (stats[cat] || 0) + Number(s.valor);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ ...s, dia });
      });
    });

    return {
      tagStats: Object.entries(stats).sort((a, b) => b[1] - a[1]),
      transactionsByTag: grouped,
    };
  }, [rows]);

  const getIcon = (tag: string) => {
    if (tag === 'fixo') return <Building2 size={18} className="text-primary" />;
    if (tag === 'investimento') return <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />;
    return <ShoppingCart size={18} className="text-primary" />;
  };

  const labelMap: Record<string, string> = {
    fixo: 'Custo Fixo',
    diario: 'Gastos Diários',
    investimento: 'Investimentos',
  };

  return (
    <div className="flex flex-col p-6 space-y-4 pb-24">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        Visão por Categoria
      </p>

      <div className="space-y-3">
        {tagStats.map(([tag, valor]) => {
          const isExpanded = expandedTag === tag;
          const isInvest = tag === 'investimento';

          return (
            <div
              key={tag}
              className="flex flex-col rounded-xl overflow-hidden border border-border bg-card"
            >
              <button
                onClick={() => setExpandedTag(isExpanded ? null : tag)}
                className="flex items-center justify-between p-4 w-full hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center border border-border">
                    {getIcon(tag)}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {labelMap[tag] ?? tag}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${isInvest ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {formatCurrency(valor)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="bg-background rounded-lg border border-border overflow-hidden">
                    {transactionsByTag[tag].map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border-b last:border-0 border-border/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-black text-primary-foreground bg-primary px-2 py-0.5 rounded-md uppercase tracking-tighter">
                            Dia {t.dia}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground truncate max-w-[140px]">
                            {t.descricao}
                          </span>
                        </div>
                        <span className="text-xs font-black text-foreground whitespace-nowrap">
                          {formatCurrency(t.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tagStats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma saída registrada neste mês.
          </p>
        )}
      </div>
    </div>
  );
}
