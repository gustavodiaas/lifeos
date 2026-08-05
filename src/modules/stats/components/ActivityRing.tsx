interface ActivityRingProps {
  score: number; // 0 to 100
  size?: number; // size in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ActivityRing({
  score,
  size = 140,
  strokeWidth = 12,
  label = "Score",
  sublabel = "Desempenho Geral",
}: ActivityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Círculo de Fundo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-muted/40 stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Círculo de Progresso Animação */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-[#FCA311] stroke-current transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Texto Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-foreground tracking-tighter">
            {normalizedScore}
          </span>
          <span className="text-[10px] font-extrabold text-[#FCA311] uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm font-extrabold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground font-medium">{sublabel}</p>
    </div>
  );
}
