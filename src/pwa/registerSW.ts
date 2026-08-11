export function initPWA() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("LifeOS Service Worker registrado com sucesso:", registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("Nova versão do LifeOS disponível.");
                  } else {
                    console.log("LifeOS pronto para uso offline.");
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn("Falha ao registrar Service Worker do LifeOS:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }
  }
}
