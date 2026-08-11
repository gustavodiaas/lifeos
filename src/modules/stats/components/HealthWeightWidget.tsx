import { useState, useEffect } from "react";
import type { Metric } from "@/lib/supabase";
import { Scale, HeartPulse, Flame, Utensils, Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

interface HealthWeightWidgetProps {
  weightLogs: Metric[];
  onOpenLogger: () => void;
}

export function HealthWeightWidget({ weightLogs, onOpenLogger }: HealthWeightWidgetProps) {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const userId = activeUserId || user?.id || "guest";
  const storageKey = `lifeos_${userId}_user_height`;

  const [heightCm, setHeightCm] = useState<string>(() => {
    return localStorage.getItem(storageKey) || "175";
  });
  const [showRecipes, setShowRecipes] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (heightCm) localStorage.setItem(storageKey, heightCm);
  }, [heightCm, storageKey]);

  const latestWeight = weightLogs.at(-1)?.value || 0;
  const heightM = parseFloat(heightCm) / 100;

  const imc = latestWeight > 0 && heightM > 0 ? (latestWeight / (heightM * heightM)).toFixed(1) : null;
  const imcNum = imc ? parseFloat(imc) : 0;

  const imcInfo = (() => {
    if (!imcNum) return { label: "Informe o peso e altura", color: "text-muted-foreground bg-muted" };
    if (imcNum < 18.5) return { label: "Abaixo do Peso", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (imcNum <= 24.9) return { label: "Peso Ideal / Saudável", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (imcNum <= 29.9) return { label: "Sobrepeso", color: "text-orange-500 bg-orange-500/10 border-orange-500/30" };
    return { label: "Obesidade", color: "text-red-500 bg-red-500/10 border-red-500/30" };
  })();

  const waterTargetL = latestWeight > 0 ? ((latestWeight * 35) / 1000).toFixed(1) : "2.5";
  const proteinTargetG = latestWeight > 0 ? Math.round(latestWeight * 1.8) : "130";

  return (
    <div className="glass-card p-5 space-y-4 rounded-3xl border border-border/70">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-foreground/10 text-foreground flex items-center justify-center">
            <Scale size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight">Saúde Corporal & IMC</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Métricas antropométricas e cálculo do Índice de Massa Corporal</p>
          </div>
        </div>

        <button
          onClick={onOpenLogger}
          className="btn-ios text-xs py-2 px-3"
        >
          <span>Atualizar Peso</span>
        </button>
      </div>

      {/* Indicadores Principais (Peso, Altura, IMC) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card Peso */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Peso Atual</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">{latestWeight || "—"}</span>
            <span className="text-xs font-bold text-muted-foreground">kg</span>
          </div>
          <span className="text-[10px] text-muted-foreground block font-medium">
            {weightLogs.length} medição(ões) registrada(s)
          </span>
        </div>

        {/* Card Altura & Ajuste */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Sua Altura</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              className="w-20 input-ios py-1 px-2 text-lg font-black text-foreground"
            />
            <span className="text-xs font-bold text-muted-foreground">cm</span>
          </div>
          <span className="text-[10px] text-muted-foreground block font-medium">Usado para cálculo do IMC</span>
        </div>

        {/* Card IMC */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">IMC Calculado</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{imc || "—"}</span>
            {imc && (
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", imcInfo.color)}>
                {imcInfo.label}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground block font-medium">
            Meta Proteína: ~{proteinTargetG}g | Água: {waterTargetL}L/dia
          </span>
        </div>
      </div>

      {/* Accordions de Dicas de Saúde & Receitas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Dicas de Emagrecimento / Composição */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between text-left font-extrabold text-xs text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Flame size={15} className="text-orange-500" />
              <span>Dicas de Saúde & Emagrecimento</span>
            </span>
            {showTips ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showTips && (
            <div className="space-y-2 pt-2 text-[11px] text-muted-foreground leading-relaxed fade-in">
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🥗 Déficit Calórico Moderado</strong>
                <span>Para perda de gordura sustentável, consuma 300 a 500 kcal a menos que seu gasto diário total.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🥩 Proteína Adequada (~{proteinTargetG}g/dia)</strong>
                <span>Preserva a massa muscular durante o processo e aumenta a saciedade pós-refeição.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🏋️ Treino de Força</strong>
                <span>Exercícios de musculação ou calistenia sinalizam ao corpo para manter músculos e queimar gordura.</span>
              </div>
            </div>
          )}
        </div>

        {/* Receitas Saudáveis e Rápidas */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
          <button
            onClick={() => setShowRecipes(!showRecipes)}
            className="w-full flex items-center justify-between text-left font-extrabold text-xs text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Utensils size={15} className="text-emerald-500" />
              <span>Receitas Rápidas & Fit</span>
            </span>
            {showRecipes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showRecipes && (
            <div className="space-y-2 pt-2 text-[11px] text-muted-foreground leading-relaxed fade-in">
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🥣 Overnight Oats Proteico</strong>
                <span>40g aveia + 150ml leite/água + 1 dose de Whey Protein + frutas vermelhas. Deixe no congelador a noite.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🍳 Omelete Turbinado</strong>
                <span>3 ovos (ou 2 inteiros + 2 claras) + espinafre + tomate + 30g queijo cottage ou minas frescal.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                <strong className="text-foreground block">🥤 Smoothie Pós-Treino</strong>
                <span>1 banana congelada + 200ml leite vegetal + 30g proteína em pó + 1 colher pasta de amendoim.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
