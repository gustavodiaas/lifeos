import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Lancamento } from "@/lib/supabase";
import { formatBRL } from "@/lib/date";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface FinanceChartProps {
  transactions: Lancamento[];
}

export function FinanceChart({ transactions }: FinanceChartProps) {
  // Agrupa transações por mês (últimos 6 meses)
  const chartData = (() => {
    const monthsMap: Record<string, { month: string; receita: number; despesa: number }> = {};

    // Ordenar transações
    const sorted = [...transactions].sort((a, b) => a.data.localeCompare(b.data));

    for (const t of sorted) {
      const monthKey = t.data.slice(0, 7); // YYYY-MM
      if (!monthsMap[monthKey]) {
        try {
          const d = new Date(monthKey + "-01T00:00:00");
          const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
          monthsMap[monthKey] = { month: label, receita: 0, despesa: 0 };
        } catch {
          monthsMap[monthKey] = { month: monthKey, receita: 0, despesa: 0 };
        }
      }

      if (t.tipo === "entrada") {
        monthsMap[monthKey].receita += t.valor;
      } else {
        monthsMap[monthKey].despesa += t.valor;
      }
    }

    return Object.values(monthsMap).slice(-6);
  })();

  if (chartData.length === 0) return null;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">Fluxo de Caixa Mensal</h3>
            <p className="text-xs text-muted-foreground font-medium">Comparativo de Receitas vs Despesas</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-500">
            <div className="w-3 h-3 rounded-full bg-emerald-500" /> Receitas
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <div className="w-3 h-3 rounded-full bg-red-500" /> Despesas
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card p-3 shadow-xl border border-border text-xs space-y-1">
                      <p className="font-extrabold text-foreground uppercase">{data.month}</p>
                      <p className="text-emerald-500 font-bold">Receita: {formatBRL(data.receita)}</p>
                      <p className="text-red-500 font-bold">Despesa: {formatBRL(data.despesa)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="receita" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="despesa" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
