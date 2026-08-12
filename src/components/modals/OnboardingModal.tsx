import { useState, useEffect } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Repeat,
  Wallet,
  BookOpen,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  points: { title: string; desc: string }[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Bem-vindo ao LifeOS",
    subtitle: "Sua central completa de organização pessoal, produtividade e estilo de vida.",
    icon: Sparkles,
    badge: "Passo 1 de 7",
    points: [
      {
        title: "Tudo em um só lugar",
        desc: "Gerencie sua rotina, hábitos, agenda, finanças, compras e anotações em uma interface moderna e intuitiva.",
      },
      {
        title: "Design Monocromático & Limpo",
        desc: "Foco total no seu conteúdo sem distrações visuais ou elementos poluídos.",
      },
    ],
  },
  {
    title: "Painel & Ações Rápidas",
    subtitle: "Crie qualquer item em questão de segundos a partir do seu dashboard.",
    icon: LayoutDashboard,
    badge: "Passo 2 de 7",
    points: [
      {
        title: "Cartões de Atalho Rápido",
        desc: "No Painel principal, use os atalhos para lançar gastos, criar tarefas, notas e hábitos em 1 clique.",
      },
      {
        title: "Botão Flutuante (+)",
        desc: "Em qualquer tela, acesse o botão flutuante no canto inferior para registrar o que precisar instantaneamente.",
      },
    ],
  },
  {
    title: "Calendário Inteligente",
    subtitle: "Agendamento simples, visões flexíveis e feriados nacionais automáticos.",
    icon: Calendar,
    badge: "Passo 3 de 7",
    points: [
      {
        title: "Clique Duplo para Agendar",
        desc: "Dê um clique duplo em qualquer dia da grade do Mês, Split ou Semana para abrir a janela de evento.",
      },
      {
        title: "Feriados do Brasil & Sincronização",
        desc: "Feriados nacionais são exibidos automaticamente. Exporte sua agenda em .ICS para Apple Calendar, Google ou Outlook.",
      },
    ],
  },
  {
    title: "Hábitos & Rotina Diária",
    subtitle: "Construa consistência e acompanhe seu progresso diário.",
    icon: Repeat,
    badge: "Passo 4 de 7",
    points: [
      {
        title: "Rastreamento com Streaks",
        desc: "Marque os hábitos concluídos diariamente e acompanhe suas sequências ininterruptas de hábitos.",
      },
      {
        title: "Frequência Personalizada",
        desc: "Defina hábitos diários, semanais ou para dias específicos da semana conforme seu planejamento.",
      },
    ],
  },
  {
    title: "Finanças & Metas",
    subtitle: "Mantenha o controle total do seu orçamento e conquiste seus objetivos.",
    icon: Wallet,
    badge: "Passo 5 de 7",
    points: [
      {
        title: "Lançamentos Simples",
        desc: "Registre entradas e saídas financeiras com valores, categorias e notas explicativas.",
      },
      {
        title: "Acompanhamento de Metas",
        desc: "Defina alvos financeiros e pessoais com barras de progresso que indicam quanto falta para o objetivo.",
      },
    ],
  },
  {
    title: "Notas, Diário & Leituras",
    subtitle: "Registre ideias, reflexões e acompanhe seu conhecimento acumulado.",
    icon: BookOpen,
    badge: "Passo 6 de 7",
    points: [
      {
        title: "Diário Pessoal & Notas Rápida",
        desc: "Escreva sobre o seu dia e organize suas anotações e projetos por pastas.",
      },
      {
        title: "Acompanhamento de Livros",
        desc: "Cadastre suas leituras atuais, número de páginas e progresso de conclusão.",
      },
    ],
  },
  {
    title: "Tudo Pronto para Começar!",
    subtitle: "Acesse a busca rápida com Ctrl+K e revise este tutorial quando quiser.",
    icon: ShieldCheck,
    badge: "Passo 7 de 7",
    points: [
      {
        title: "Busca Rápida (Ctrl + K)",
        desc: "Use o atalho do teclado para navegar instantaneamente para qualquer área do aplicativo.",
      },
      {
        title: "Revisar Tutorial nos Ajustes",
        desc: "Se quiser rever este guia a qualquer momento, acesse a aba 'Ajustes' e clique em 'Revisar Onboarding'.",
      },
    ],
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Verifica se já viu o onboarding na primeira vez
    const hasSeen = localStorage.getItem("lifeos_onboarding_completed");
    if (!hasSeen) {
      setOpen(true);
    }

    // Listener para o evento customizado disparado pelos Ajustes ("Revisar Onboarding")
    const handleOpenOnboarding = () => {
      setCurrentStepIndex(0);
      setOpen(true);
    };

    window.addEventListener("open-lifeos-onboarding", handleOpenOnboarding);
    return () => {
      window.removeEventListener("open-lifeos-onboarding", handleOpenOnboarding);
    };
  }, []);

  const handleClose = () => {
    localStorage.setItem("lifeos_onboarding_completed", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!open) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <ModalPortal open={open} onClose={handleClose} raw>
      <div className="bg-card border border-border rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 slide-up my-auto overflow-hidden relative">
        {/* Header com Botão de Pular e Fechar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-wider uppercase">
            {currentStep.badge}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="text-xs font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              Pular Tutorial
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Superior */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Conteúdo do Slide */}
        <div className="space-y-4 py-2 fade-in key={currentStepIndex}">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
              <StepIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">{currentStep.title}</h2>
              <p className="text-xs font-medium text-muted-foreground">{currentStep.subtitle}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {currentStep.points.map((pt, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">{pt.title}</h4>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé de Navegação */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-muted text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-all flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === currentStepIndex ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/50"
                )}
                title={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1 shadow-md"
          >
            {isLastStep ? (
              <>
                <Check size={14} /> Começar a Usar
              </>
            ) : (
              <>
                Próximo <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
