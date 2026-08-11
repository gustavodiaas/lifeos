interface SyncingLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function SyncingLoader({ message = "Sincronizando seus dados...", fullScreen = true }: SyncingLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 select-none fade-in"
          : "py-16 w-full flex flex-col items-center justify-center text-foreground gap-3 select-none fade-in"
      }
    >
      {fullScreen && (
        <div className="w-12 h-12 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-xl shadow-black/10">
          <span className="text-xl font-black text-foreground tracking-tighter">L</span>
        </div>
      )}

      {/* 3 Pontos Animados de Carregamento (iOS Bouncing Dots) */}
      <div className="flex items-center gap-2 py-1">
        <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-bounce" />
      </div>

      <p className="text-xs font-extrabold text-muted-foreground tracking-wider uppercase">
        {message}
      </p>
    </div>
  );
}
