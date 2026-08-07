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
    return { icon: Home, color: "bg-blue-500/15 text-blue-500", label: "Moradia / Fixo" };
  if (d.includes("mercado") || d.includes("comida") || d.includes("ifood"))
    return { icon: ShoppingCart, color: "bg-amber-500/15 text-[#FCA311]", label: "Alimentação" };
  if (d.includes("nubank") || d.includes("cartao") || d.includes("inter"))
    return { icon: CreditCard, color: "bg-blue-600/15 text-blue-500 dark:text-blue-400", label: "Cartão" };
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-start fade-in">

      {/* ── Coluna Esquerda: Cartão + Métricas ── */}
      <div className="md:col-span-5 lg:col-span-4 space-y-3">

        {/*
         * Cartão de saldo: no mobile é compacto (row layout),
         * no desktop mantém o estilo wallet vertical.
         */}
        <div className="glass-card bg-gradient-to-br from-[#14213D] via-[#1a2c52] to-[#0a1124] text-white shadow-2xl relative overflow-hidden border border-white/15 rounded-3xl">
          {/* Sheen */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FCA311]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Mobile: layout horizontal compacto */}
          <div className="flex md:hidden items-center gap-3 p-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
              <Wallet size={16} className="text-[#FCA311]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-widest leading-none">Balanço do Mês</p>
              <p className="text-xl font-black tracking-tight text-white leading-tight">{formatBRL(balance)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] font-bold text-emerald-400">{formatBRL(income)} ↑</span>
              <span className="text-[10px] font-bold text-red-400">{formatBRL(expense)} ↓</span>
            </div>
            <button
              onClick={onNewTransaction}
              className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-black bg-[#FCA311] hover:bg-[#e8920a] shadow-lg active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <Plus size={13} strokeWidth={3} />
              <span>Novo</span>
            </button>
          </div>

          {/* Desktop: layout vertical original */}
          <div className="hidden md:flex flex-col justify-between p-5 min-h-[200px] relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Wallet size={16} className="text-[#FCA311]" />
                </div>
                <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest">
                  Balanço do Mês
                </span>
              </div>
              <button
                onClick={onNewTransaction}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-black bg-[#FCA311] hover:bg-[#e8920a] shadow-lg active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Novo</span>
              </button>
            </div>

            <div className="my-4">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                {formatBRL(balance)}
              </h2>
              <span className="text-[11px] font-semibold text-white/60 mt-1 block">
                {balance >= 0 ? "Saldo positivo no período" : "Atenção: Saldo em défice"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
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
        </div>

        {/* Mini Card de Saúde Financeira — só desktop */}
        <div className="glass-card p-4 rounded-3xl space-y-3 hidden md:block border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <PieChart size={14} className="text-[#FCA311]" />
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

      {/* ── Coluna Direita: Busca + Lista ── */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-3">

        {/* Busca e Filtros */}
        <div className="glass-card p-2.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border border-border/60 shrink-0">
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
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto shrink-0 scrollbar-none">
            {(["all", "entrada", "saida"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
                  f === "all" && selectedFilter === "all" && "bg-[#FCA311] text-black shadow-sm font-extrabold",
                  f === "entrada" && selectedFilter === "entrada" && "bg-emerald-500 text-white shadow-sm font-extrabold",
                  f === "saida" && selectedFilter === "saida" && "bg-red-500 text-white shadow-sm font-extrabold",
                  selectedFilter !== f && "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" && `Todos (${transactions.length})`}
                {f === "entrada" && <><ArrowUpRight size={13} /> Receitas</>}
                {f === "saida" && <><ArrowDownRight size={13} /> Despesas</>}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="glass-card rounded-3xl border border-border/60 overflow-hidden">
          {groupedByDate.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center mx-auto">
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
            <div className="divide-y divide-border/20">
              {groupedByDate.map(([dateStr, items]) => {
                const dateFormatted = (() => {
                  try {
                    const d = new Date(dateStr + "T00:00:00");
                    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
                  } catch { return dateStr; }
                })();

                return (
                  <div key={dateStr}>
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider capitalize px-3 py-1.5 bg-muted/30 flex items-center gap-2 sticky top-0 z-10">
                      <span>{dateFormatted}</span>
                      <span className="w-full h-px bg-border/40" />
                    </p>
                    <div className="divide-y divide-border/20">
                      {items.map((t) => {
                        const badge = getCategoryBadge(t.descricao, t.categoria);
                        const Icon = badge.icon;
                        const isIncome = t.tipo === "entrada";

                        return (
                          <div
                            key={t.id}
                            className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                                <Icon size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-extrabold text-foreground truncate">{t.descricao}</h4>
                                  {t.is_recorrente && (
                                    <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-500/10 text-[#FCA311] border border-amber-500/20 shrink-0">
                                      Rec
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground block truncate">
                                  {badge.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn(
                                "text-xs font-black tracking-tight",
                                isIncome ? "text-emerald-500" : "text-foreground"
                              )}>
                                {isIncome ? "+" : "-"} {formatBRL(t.valor)}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditTransaction(t)}
                                  className="p-1 rounded-md bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => onDeleteTransaction(t.id)}
                                  className="p-1 rounded-md bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
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
