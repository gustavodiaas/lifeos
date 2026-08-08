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
  ShoppingCart,
  Home,
  CreditCard,
  Tv,
  Zap,
  Banknote,
  TrendingUp,
  Tag,
  Search,
  PieChart,
  ShieldCheck,
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
    return { icon: Home, color: "bg-muted text-muted-foreground", label: "Moradia / Fixo" };
  if (d.includes("mercado") || d.includes("comida") || d.includes("ifood"))
    return { icon: ShoppingCart, color: "bg-muted text-foreground", label: "Alimentação" };
  if (d.includes("nubank") || d.includes("cartao") || d.includes("inter"))
    return { icon: CreditCard, color: "bg-muted text-muted-foreground dark:text-muted-foreground", label: "Cartão" };
  if (d.includes("salario") || d.includes("pix") || d.includes("receb"))
    return { icon: Banknote, color: "bg-emerald-500/15 text-emerald-500", label: "Renda / Pix" };
  if (d.includes("streaming") || d.includes("netflix") || d.includes("spotify"))
    return { icon: Tv, color: "bg-muted text-muted-foreground", label: "Lazer" };
  if (d.includes("luz") || d.includes("agua") || d.includes("internet"))
    return { icon: Zap, color: "bg-muted text-muted-foreground", label: "Contas" };
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

  const savingRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start fade-in">
      {/* ── Coluna Esquerda: Cartão Apple Wallet & Métricas Rápida (Desktop) ── */}
      <div className="md:col-span-5 lg:col-span-4 space-y-4">
        {/* Cartão de Saldo Apple Wallet */}
        <div className="glass-card p-5 bg-foreground text-white shadow-2xl relative overflow-hidden border border-white/15 rounded-3xl flex flex-col justify-between min-h-[200px]">
          {/* Sheen Decorativo */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-foreground/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Wallet size={16} className="text-foreground" />
              </div>
              <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest">
                Balanço do Mês
              </span>
            </div>

            <button
              onClick={onNewTransaction}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-black bg-foreground hover:bg-[currentColor] shadow-lg active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Novo</span>
            </button>
          </div>

          <div className="my-4 relative z-10">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
              {formatBRL(balance)}
            </h2>
            <span className="text-[11px] font-semibold text-white/60 mt-1 block">
              {balance >= 0 ? "Saldo positivo no período" : "Atenção: Saldo em défice"}
            </span>
          </div>

          {/* Resumo Receitas vs Despesas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight size={15} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold uppercase text-white/60 block leading-none">Receitas</span>
                <span className="text-xs font-black text-emerald-400 truncate block">{formatBRL(income)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ArrowDownRight size={15} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold uppercase text-white/60 block leading-none">Despesas</span>
                <span className="text-xs font-black text-red-400 truncate block">{formatBRL(expense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Card de Métricas Rápida */}
        <div className="glass-card p-4 rounded-3xl space-y-3 hidden md:block border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <PieChart size={14} className="text-foreground" />
              Saúde Financeira
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Mês Atual</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground block">Lançamentos</span>
              <span className="text-sm font-black text-foreground">{transactions.length}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground block">Economia</span>
              <span className="text-sm font-black text-emerald-500">{savingRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground pt-1">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Dados sincronizados localmente</span>
          </div>
        </div>
      </div>

      {/* ── Coluna Direita: Extrato de Lançamentos com Scroll Interno ────────── */}
      <div className="md:col-span-7 lg:col-span-8 space-y-3">
        {/* Busca e Filtros */}
        <div className="glass-card p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5 border border-border/60">
          <div className="relative w-full sm:flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar extrato..."
              className="input-ios pl-9 py-1.5 text-xs w-full bg-background/50"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto shrink-0 pb-0.5 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter("all")}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0",
                selectedFilter === "all"
                  ? "bg-foreground text-background shadow-sm font-extrabold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter("entrada")}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
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
                "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
                selectedFilter === "saida"
                  ? "bg-red-500 text-white shadow-sm font-extrabold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <ArrowDownRight size={13} /> Despesas
            </button>
          </div>
        </div>

        {/* Lista Contida com Scroll Interno Próprio */}
        <div className="glass-card p-3 rounded-3xl border border-border/60 min-h-[380px] max-h-[540px] overflow-y-auto custom-scrollbar">
          {groupedByDate.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted text-foreground flex items-center justify-center mx-auto">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Nenhum lançamento no extrato</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Adicione suas entradas e saídas do mês para acompanhar o fluxo de caixa.
                </p>
              </div>
              <button
                onClick={onNewTransaction}
                className="btn-ios text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Novo Lançamento</span>
              </button>
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
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider capitalize px-1 flex items-center gap-2 sticky top-0 bg-card/90 backdrop-blur-md py-1 z-10">
                      <span>{dateFormatted}</span>
                      <span className="w-full h-px bg-border/40" />
                    </p>

                    {/* Lista de Transações */}
                    <div className="divide-y divide-border/30 rounded-2xl bg-background/50 border border-border/40 overflow-hidden">
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
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-muted text-foreground border border-border shrink-0">
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
      </div>
    </div>
  );
}
