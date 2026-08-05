import { useEffect } from "react";
import { checkDailyReminders } from "@/lib/notifications";

export function NotificationManager() {
  useEffect(() => {
    // Checa lembretes ao montar
    checkDailyReminders();

    // Loop de checagem a cada 60 segundos
    const interval = setInterval(() => {
      checkDailyReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null; // Componente silencioso de segundo plano
}
