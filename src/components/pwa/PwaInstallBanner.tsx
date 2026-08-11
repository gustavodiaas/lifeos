import { useState, useEffect } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Check if dismissed in this session
    if (sessionStorage.getItem("lifeos_pwa_banner_dismissed")) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    if (iosDevice) {
      setIsIos(true);
      setShowBanner(true);
      return;
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("lifeos_pwa_banner_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[200] bg-card/95 backdrop-blur-md border border-border/80 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground">Instalar o LifeOS</h4>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Adicione à tela inicial para usar offline e com notificações.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1 transition-all"
          >
            <Download size={13} /> Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-5 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Share size={22} />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Como instalar no iOS / Safari</h3>
            <ol className="text-left text-xs text-muted-foreground space-y-2.5 bg-muted/40 p-3.5 rounded-2xl">
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">1.</span> Toque no ícone de <strong className="text-foreground">Compartilhar</strong> na barra do Safari (ícone com quadrado e seta).
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">2.</span> Role a lista para baixo e selecione <strong className="text-foreground">"Adicionar à Tela de Início"</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">3.</span> Confirme no canto superior direito para finalizar.
              </li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
