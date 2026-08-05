import { useState } from "react";
import type { Lancamento } from "@/lib/supabase";
import { formatBRL } from "@/lib/date";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Edit3,
  Repeat,
  ShoppingCart,
  Home,
  CreditCard,
  Tv,
  Zap,
  Banknote,
  TrendingUp,
  Tag,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppleFinanceViewProps {
  transactions: Lancamento[];
  income: number;
  expense: number;
  balance: number;
  onNewTransaction: () => void;
  onEditTransaction: (t: Lancamento) => void;
  onDeleteTransaction: (id: string) => void;
}

const getCategoryBadge = (desc: string, category?: string | null) => {
  const d = (desc || "").toLowerCase();
  if (category === "investimento")
    return { icon: TrendingUp, color: "bg-emerald-500/15 text-emerald-500", label: "Investimento" };
  if (d.includes("aluguel") || d.includes("condo") || category === "fixo")
    return { icon: Home, color: "bg-blue-500/15 text-blue-500", label: "Moradia / Fixo" };
  if (d.includes("mercado") || d.includes("comida") || d.includes("ifood"))
    return { icon: ShoppingCart, color: "bg-amber-500/15 text-[#FCA311]", label: "Alimentação" };
  if (d.includes("nubank") || d.includes("cartao") || d.includes("inter"))
    return { icon: CreditCard, color: "bg-[#14213D]/15 text-[#14213D] dark:text-blue-400", label: "Cartão" };
  if (d.includes("salario") || d.includes("pix") || d.includes("receb"))
    return { icon: Banknote, color: "bg-emerald-500/15 text-emerald-500", label: "Renda / Pix" };
  if (d.includes("streaming") || d.includes("netflix") || d.includes("spotify"))
    return { icon: Tv, color: "bg-rose-500/15 text-rose-500", label: "Lazer" };
  if (d.includes("luz") || d.includes("agua") || d.includes("internet"))
    return { icon: Zap, color: "bg-indigo-500/15 text-indigo-500", label: "Contas" };
  return { icon: Tag, color: "bg-slate-500/15 text-slate-500", label: category || "Outros" };
};

export function AppleFinanceView({
  transactions,
  income,
  expense,
  balance,
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: AppleFinanceViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "entrada" | "saida">("all");

  const filteredTransactions = transactions.filter((t) => {
    if (
      searchQuery &&
      !t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(t.categoria || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedFilter !== "all" && t.tipo !== selectedFilter) return false;
    return true;
  });

  // Agrupa transações por data YYYY-MM-DD
  const groupedByDate = (() => {
    const map = new Map<string, Lancamento[]>();
    for (const t of filteredTransactions) {
      const list = map.get(t.data) || [];
      list.push(t);
      map.set(t.data, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  })();

  return (
    <div className="space-y-4 fade-in">

      {/* ── 1. Cartão Compacto de Saldo Apple Wallet ──────────────────────── */}
      <div className="glass-card p-4 sm:p-5 bg-gradient-to-br from-[#14213D] via-[#1a2c52] to-[#0a1124] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-0.5">
              Balanço do Mês
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatBRL(balance)}
            </h2>
          </div>

          <button
            onClick={onNewTransaction}
            className="px-3.5 py-2 rounded-xl text-xs font-black text-black bg-[#FCA311] hover:bg-[#e8920a] shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Novo</span>
          </button>
        </div>

        {/* Resumo Compacto Receitas vs Despesas */}
        <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={15} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-white/60 block leading-none">Receitas</span>
              <span className="text-xs font-extrabold text-emerald-400">{formatBRL(income)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <ArrowDownRight size={15} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-white/60 block leading-none">Despesas</span>
              <span className="text-xs font-extrabold text-red-400">{formatBRL(expense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Busca e Filtros Compactos ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full sm:flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar extrato..."
            className="input-ios pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto shrink-0">
          <button
            onClick={() => setSelectedFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0",
              selectedFilter === "all"
                ? "bg-[#FCA311] text-black shadow-sm font-extrabold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            Todos ({transactions.length})
          </button>
          <button
            onClick={() => setSelectedFilter("entrada")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
              selectedFilter === "entrada"
                ? "bg-emerald-500 text-white shadow-sm font-extrabold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowUpRight size={13} /> Receitas
          </button>
          <button
            onClick={() => setSelectedFilter("saida")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
              selectedFilter === "saida"
                ? "bg-red-500 text-white shadow-sm font-extrabold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowDownRight size={13} /> Despesas
          </button>
        </div>
      </div>

      {/* ── 3. Extrato de Lançamentos Compacto ────────────────────────────── */}
      {groupedByDate.length === 0 ? (
        <div className="glass-card p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center mx-auto">
            <Wallet size={24} />
          </div>
          <h3 className="text-sm font-bold text-foreground">Nenhum lançamento no extrato</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Adicione suas entradas e saídas do mês para acompanhar o fluxo de caixa.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateStr, items]) => {
            const dateFormatted = (() => {
              try {
                const d = new Date(dateStr + "T00:00:00");
                return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
              } catch {
                return dateStr;
              }
            })();

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Data Header */}
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider capitalize px-1 flex items-center gap-2">
                  <span>{dateFormatted}</span>
                  <span className="w-full h-px bg-border/40" />
                </p>

                {/* Lista de Transações */}
                <div className="glass-card divide-y divide-border/40 overflow-hidden">
                  {items.map((t) => {
                    const badge = getCategoryBadge(t.descricao, t.categoria);
                    const Icon = badge.icon;
                    const isIncome = t.tipo === "entrada";

                    return (
                      <div
                        key={t.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                      >
                        {/* Esquerda: Ícone & Detalhes */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-extrabold text-foreground truncate">{t.descricao}</h4>
                              {t.is_recorrente && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 text-[#FCA311] border border-amber-500/20 shrink-0">
                                  Recorrente
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground block truncate">
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        {/* Direita: Valor & Ações */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "text-xs font-black tracking-tight",
                              isIncome ? "text-emerald-500" : "text-foreground"
                            )}
                          >
                            {isIncome ? "+" : "-"} {formatBRL(t.valor)}
                          </span>

                          <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(t)}
                              className="p-1 rounded-md bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(t.id)}
                              className="p-1 rounded-md bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
