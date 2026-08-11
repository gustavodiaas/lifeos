import { useState, useEffect, useMemo } from "react";
import { formatBRL } from "@/lib/date";
import { PiggyBank, Plus, ArrowUpRight, ArrowDownRight, Target, Shield, Plane, Laptop, Car, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export interface SavingsBox {
  id: string;
  name: string;
  category: "emergencia" | "viagem" | "eletronico" | "carro" | "outro";
  targetAmount: number;
  currentAmount: number;
  history: { id: string; type: "deposit" | "withdraw"; amount: number; date: string; note?: string }[];
}

const DEFAULT_BOXES: SavingsBox[] = [
  {
    id: "1",
    name: "Reserva de Emergência (6 Meses)",
    category: "emergencia",
    targetAmount: 30000,
    currentAmount: 18500,
    history: [
      { id: "h1", type: "deposit", amount: 2500, date: new Date().toISOString().slice(0, 10), note: "Aporte mensal" },
    ],
  },
  {
    id: "2",
    name: "Viagem para Europa",
    category: "viagem",
    targetAmount: 15000,
    currentAmount: 6200,
    history: [],
  },
  {
    id: "3",
    name: "Novo MacBook Pro",
    category: "eletronico",
    targetAmount: 12000,
    currentAmount: 9500,
    history: [],
  },
];

const CATEGORY_META = {
  emergencia: { label: "Reserva de Emergência", icon: Shield, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  viagem: { label: "Viagens & Férias", icon: Plane, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  eletronico: { label: "Eletrônicos & Tech", icon: Laptop, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  carro: { label: "Veículo / Transporte", icon: Car, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  outro: { label: "Outro Objetivo", icon: Target, color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
};

export function SavingsGoalsView() {
  const [boxes, setBoxes] = useState<SavingsBox[]>(() => {
    try {
      const saved = localStorage.getItem("lifeos_savings_boxes");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOXES;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeBoxForTx, setActiveBoxForTx] = useState<{ box: SavingsBox; type: "deposit" | "withdraw" } | null>(null);

  // Form states para nova caixinha
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SavingsBox["category"]>("emergencia");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");

  // Form states para aporte/resgate
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");

  useEffect(() => {
    localStorage.setItem("lifeos_savings_boxes", JSON.stringify(boxes));
  }, [boxes]);

  const totalSaved = useMemo(() => boxes.reduce((acc, b) => acc + b.currentAmount, 0), [boxes]);
  const totalTarget = useMemo(() => boxes.reduce((acc, b) => acc + b.targetAmount, 0), [boxes]);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleCreateBox = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount.replace(",", "."));
    const initial = parseFloat(initialAmount.replace(",", ".")) || 0;

    if (!name.trim() || isNaN(target) || target <= 0) {
      toast.error("Preencha o nome e a meta de valor corretamente.");
      return;
    }

    const newBox: SavingsBox = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      targetAmount: target,
      currentAmount: initial,
      history: initial > 0 ? [{ id: crypto.randomUUID(), type: "deposit", amount: initial, date: new Date().toISOString().slice(0, 10), note: "Saldo inicial" }] : [],
    };

    setBoxes((prev) => [newBox, ...prev]);
    setShowCreateModal(false);
    setName("");
    setTargetAmount("");
    setInitialAmount("");
    toast.success(`Caixinha "${newBox.name}" criada com sucesso!`);
  };

  const handleExecuteTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBoxForTx) return;

    const val = parseFloat(txAmount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Insira um valor válido.");
      return;
    }

    const { box, type } = activeBoxForTx;
    if (type === "withdraw" && val > box.currentAmount) {
      toast.error("Saldo insuficiente na caixinha para resgate.");
      return;
    }

    const newAmount = type === "deposit" ? box.currentAmount + val : box.currentAmount - val;

    setBoxes((prev) =>
      prev.map((b) =>
        b.id === box.id
          ? {
              ...b,
              currentAmount: newAmount,
              history: [
                {
                  id: crypto.randomUUID(),
                  type,
                  amount: val,
                  date: new Date().toISOString().slice(0, 10),
                  note: txNote.trim() || (type === "deposit" ? "Aporte" : "Resgate"),
                },
                ...b.history,
              ],
            }
          : b
      )
    );

    toast.success(type === "deposit" ? `Aporte de ${formatBRL(val)} realizado!` : `Resgate de ${formatBRL(val)} realizado!`);
    setActiveBoxForTx(null);
    setTxAmount("");
    setTxNote("");
  };

  const handleRemoveBox = (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    toast.success("Caixinha removida.");
  };

  return (
    <div className="space-y-6 fade-in pb-8 select-none">
      {/* ── 1. Resumo Geral de Reservas ─────────────────────────────────── */}
      <div className="glass-card p-5 rounded-3xl border border-border/70 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center font-black">
              <PiggyBank size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground tracking-tight">Caixinhas & Cofrinhos de Reserva</h3>
              <p className="text-xs text-muted-foreground font-medium">Guarde dinheiro para objetivos específicos de curto e longo prazo</p>
            </div>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="btn-ios text-xs py-2.5 px-4 w-full sm:w-auto">
            <Plus size={15} strokeWidth={2.5} />
            <span>Nova Caixinha</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Total Guardado</span>
            <span className="text-2xl font-black text-foreground">{formatBRL(totalSaved)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Meta Consolidada</span>
            <span className="text-2xl font-black text-foreground">{formatBRL(totalTarget)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Progresso Geral</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{overallPct}%</span>
              <span className="text-xs font-bold text-muted-foreground">das metas alcançadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Grid de Caixinhas de Economia ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boxes.map((box) => {
          const meta = CATEGORY_META[box.category] || CATEGORY_META.outro;
          const Icon = meta.icon;
          const pct = box.targetAmount > 0 ? Math.min(100, Math.round((box.currentAmount / box.targetAmount) * 100)) : 0;
          const remaining = Math.max(0, box.targetAmount - box.currentAmount);

          return (
            <div key={box.id} className="glass-card p-5 rounded-3xl border border-border/70 space-y-4 flex flex-col justify-between hover:scale-[1.01] transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center border", meta.color)}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground leading-tight">{box.name}</h4>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{meta.label}</span>
                    </div>
                  </div>

                  <button onClick={() => handleRemoveBox(box.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-foreground">{formatBRL(box.currentAmount)}</span>
                    <span className="text-xs font-bold text-muted-foreground">Meta: {formatBRL(box.targetAmount)}</span>
                  </div>

                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden border border-border/40">
                    <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
                    <span className="text-muted-foreground">{pct}% concluído</span>
                    <span className="text-muted-foreground">Falta {formatBRL(remaining)}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Aporte e Resgate */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => setActiveBoxForTx({ box, type: "deposit" })}
                  className="py-2 px-3 rounded-xl bg-foreground text-background font-black text-xs flex items-center justify-center gap-1 shadow-sm hover:opacity-90 transition-all"
                >
                  <ArrowUpRight size={14} />
                  <span>Aportar</span>
                </button>

                <button
                  onClick={() => setActiveBoxForTx({ box, type: "withdraw" })}
                  className="py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <ArrowDownRight size={14} />
                  <span>Resgatar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Criar Caixinha */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border shadow-2xl p-5 space-y-4 slide-up">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-extrabold text-foreground">Nova Caixinha de Economia</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            </div>

            <form onSubmit={handleCreateBox} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Nome do Objetivo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem para o Japão"
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="input-ios py-2 text-xs font-bold w-full bg-card text-foreground"
                >
                  <option value="emergencia">Reserva de Emergência</option>
                  <option value="viagem">Viagens & Férias</option>
                  <option value="eletronico">Eletrônicos & Tech</option>
                  <option value="carro">Veículo / Transporte</option>
                  <option value="outro">Outro Objetivo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Valor Meta (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="Ex: 15000"
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Saldo Inicial Guardado (opcional)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="Ex: 1000"
                  className="input-ios text-xs font-bold"
                />
              </div>

              <button type="submit" className="btn-ios w-full py-3.5 text-xs font-black uppercase tracking-wider mt-2">
                Criar Caixinha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Aporte / Resgate */}
      {activeBoxForTx && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xs rounded-3xl border border-border shadow-2xl p-5 space-y-4 slide-up">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-extrabold text-foreground">
                {activeBoxForTx.type === "deposit" ? "🎯 Fazer Aporte" : "💸 Fazer Resgate"}
              </h3>
              <button onClick={() => setActiveBoxForTx(null)} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            </div>

            <form onSubmit={handleExecuteTx} className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground">
                Caixinha: <span className="text-foreground">{activeBoxForTx.box.name}</span>
              </p>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="Ex: 500"
                  className="input-ios text-xs font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="Ex: Sobra do mês"
                  className="input-ios text-xs font-semibold"
                />
              </div>

              <button type="submit" className="btn-ios w-full py-3 text-xs font-black uppercase tracking-wider mt-1">
                Confirmar {activeBoxForTx.type === "deposit" ? "Aporte" : "Resgate"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
