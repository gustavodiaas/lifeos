import { useState } from 'react';
import { type DayRow, formatCurrency } from '@/lib/finance';
import {
  Trash2, ChevronDown, ArrowUpCircle, ArrowDownCircle, Triangle,
  Edit3, LayoutGrid, Tag, Home, ShoppingCart, CreditCard, Tv,
  Zap, Banknote, TrendingUp,
} from 'lucide-react';

type Props = {
  rows: DayRow[];
  today: string;
  onDelete: (id: string) => void;
  onEdit: (transaction: any) => void;
};

const getIcon = (desc: string, categoria?: string) => {
  const d = desc.toLowerCase();
  if (categoria === 'investimento') return <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-500" />;
  if (d.includes('aluguel') || d.includes('condo')) return <Home size={13} className="text-muted-foreground" />;
  if (d.includes('mercado') || d.includes('comida') || d.includes('ifood')) return <ShoppingCart size={13} className="text-muted-foreground" />;
  if (d.includes('nubank') || d.includes('cartao') || d.includes('inter')) return <CreditCard size={13} className="text-muted-foreground" />;
  if (d.includes('salario') || d.includes('pix') || d.includes('receb')) return <Banknote size={13} className="text-muted-foreground" />;
  if (d.includes('streaming') || d.includes('netflix') || d.includes('spotify')) return <Tv size={13} className="text-muted-foreground" />;
  if (d.includes('luz') || d.includes('agua') || d.includes('internet')) return <Zap size={13} className="text-muted-foreground" />;
  return <Tag size={13} className="text-muted-foreground" />;
};

const getSaldoColor = (v: number) => {
  if (v > 2000) return 'bg-emerald-700 text-white';
  if (v >= 1000) return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100';
  if (v >= 0) return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-200';
  if (v >= -499.99) return 'bg-orange-200 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200';
  return 'bg-red-600 text-white';
};

export function SpreadsheetTable({ rows, today, onDelete, onEdit }: Props) {
  const [filtro, setFiltro] = useState<'total' | 'entradas' | 'saidas'>('total');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (date: string) =>
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));

  const cycleFilter = () => {
    if (filtro === 'total') setFiltro('entradas');
    else if (filtro === 'entradas') setFiltro('saidas');
    else setFiltro('total');
  };

  return (
    <div className="w-full text-sm flex flex-col pb-24 select-none">
      {/* Header */}
      <div className="grid grid-cols-[44px_1fr_90px] border-b border-border bg-background sticky top-0 z-10 shadow-sm">
        <div className="py-3 flex items-center justify-center text-[10px] font-black text-muted-foreground border-r border-border uppercase tracking-tighter">
          Dia
        </div>
        <button
          onClick={cycleFilter}
          className="px-3 py-3 flex items-center gap-2 text-[10px] font-black text-primary border-r border-border hover:bg-accent transition-colors uppercase tracking-tighter"
        >
          {filtro === 'total' && <LayoutGrid size={13} />}
          {filtro === 'entradas' && <ArrowUpCircle size={13} />}
          {filtro === 'saidas' && <ArrowDownCircle size={13} />}
          <span>{filtro === 'total' ? 'Tudo' : filtro}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
        <div className="px-3 py-3 flex items-center justify-end gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
          <Triangle size={7} className="fill-current text-muted-foreground rotate-180" />
          Saldo
        </div>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isToday = row.date === today;
        const isOpen = expandedDays[row.date];
        const valorExibido =
          filtro === 'total'
            ? row.totalEntradas - row.totalSaidas
            : filtro === 'entradas'
              ? row.totalEntradas
              : row.totalSaidas;
        const isVazio = valorExibido === 0;

        return (
          <div key={row.date} className="flex flex-col">
            <div
              onClick={() => toggleDay(row.date)}
              className="grid grid-cols-[44px_1fr_90px] border-b border-border bg-background min-h-[48px] hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
            >
              <div
                className={`flex items-center justify-center text-[13px] border-r border-border ${
                  isToday ? 'bg-primary text-primary-foreground font-black' : 'text-foreground font-bold'
                }`}
              >
                {row.day}
              </div>

              <div className="px-3 flex items-center justify-between text-[11px] border-r border-border">
                <div className="flex gap-1">
                  {filtro === 'total' ? (
                    valorExibido > 0 ? (
                      <ArrowUpCircle size={12} className="text-emerald-500" />
                    ) : valorExibido < 0 ? (
                      <ArrowDownCircle size={12} className="text-red-500" />
                    ) : (
                      <ArrowUpCircle size={12} className="text-muted-foreground/30" />
                    )
                  ) : filtro === 'entradas' ? (
                    <ArrowUpCircle size={12} className={row.totalEntradas > 0 ? 'text-emerald-500' : 'text-muted-foreground/30'} />
                  ) : (
                    <ArrowDownCircle size={12} className={row.totalSaidas > 0 ? 'text-red-500' : 'text-muted-foreground/30'} />
                  )}
                </div>
                <span className={`tracking-tight ${isVazio ? 'text-muted-foreground/40 font-medium' : 'text-foreground font-bold'}`}>
                  {isVazio ? 'R$ 0,00' : formatCurrency(Math.abs(valorExibido))}
                </span>
              </div>

              <div className={`px-3 flex items-center justify-end text-[11px] font-black tracking-tight h-full ${getSaldoColor(row.saldoAcumulado)}`}>
                {formatCurrency(row.saldoAcumulado).replace('R$', '').trim()}
              </div>
            </div>

            {isOpen && (
              <div className="bg-background">
                {(filtro === 'total' || filtro === 'entradas') &&
                  row.entradas.map((l) => (
                    <TransactionRow key={l.id} l={l} type="in" onDelete={onDelete} onEdit={onEdit} />
                  ))}
                {(filtro === 'total' || filtro === 'saidas') &&
                  row.saidas.map((l) => (
                    <TransactionRow key={l.id} l={l} type="out" onDelete={onDelete} onEdit={onEdit} />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransactionRow({ l, type, onDelete, onEdit }: any) {
  return (
    <div className="grid grid-cols-[44px_1fr_90px] border-b border-border/50 min-h-[44px]">
      <div className="border-r border-border bg-background" />
      <div className="px-3 flex items-center justify-between text-[11px] border-r border-border gap-2 pl-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-5 flex justify-center shrink-0">
            {type === 'in' ? (
              <Banknote size={13} className="text-muted-foreground" />
            ) : (
              getIcon(l.descricao, l.categoria)
            )}
          </div>
          <span className="truncate font-medium text-muted-foreground">{l.descricao}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(l); }}
            className="p-1.5 text-muted-foreground/50 hover:text-primary transition-colors"
          >
            <Edit3 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(l.id); }}
            className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      <div
        className={`px-3 flex items-center justify-end text-[11px] font-bold tracking-tight ${
          l.categoria === 'investimento' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
        }`}
      >
        {formatCurrency(Number(l.valor)).replace('R$', '').trim()}
      </div>
    </div>
  );
}
