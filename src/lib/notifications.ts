import { toast } from "sonner";
import { db } from "@/db";
import { todayIso } from "@/lib/date";

export interface NotificationSettings {
  enabled: boolean;
  habitsReminder: boolean;
  habitsTime: string; // "20:00"
  journalReminder: boolean;
  journalTime: string; // "21:30 text"
  pomodoroAlerts: boolean;
}

const STORAGE_KEY = "lifeos_notification_settings";

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    enabled: false,
    habitsReminder: true,
    habitsTime: "20:00",
    journalReminder: true,
    journalTime: "21:30",
    pomodoroAlerts: true,
  };
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Erro ao salvar configurações de notificação:", err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    toast.error("Este navegador não suporta notificações de sistema.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notificações ativadas no LifeOS!");
      return true;
    } else {
      toast.warning("Permissão de notificação negada pelo navegador.");
      return false;
    }
  } catch (err) {
    console.error("Erro ao solicitar permissão de notificação:", err);
    return false;
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (err) {
    console.error("Erro ao enviar notificação:", err);
  }
}

// Verificação de lembretes automáticos em segundo plano
export async function checkDailyReminders() {
  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== "granted") return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;

  const today = todayIso();

  // Lembrete de Hábitos
  if (settings.habitsReminder && currentTime === settings.habitsTime) {
    const lastSentHabits = localStorage.getItem("lifeos_last_notif_habits");
    if (lastSentHabits !== today) {
      try {
        const d = db();
        const habits = await d.habits.filter((h) => !h.archivedAt).toArray();
        const logsToday = await d.habit_logs.where("date").equals(today).filter((l) => l.done).toArray();

        const pendingCount = habits.length - logsToday.length;
        if (pendingCount > 0) {
          sendBrowserNotification("LifeOS — Lembrete de Hábitos ⚡", {
            body: `Você ainda tem ${pendingCount} hábitos pendentes para concluir hoje!`,
          });
          localStorage.setItem("lifeos_last_notif_habits", today);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Lembrete do Diário
  if (settings.journalReminder && currentTime === settings.journalTime) {
    const lastSentJournal = localStorage.getItem("lifeos_last_notif_journal");
    if (lastSentJournal !== today) {
      try {
        const d = db();
        const existingEntry = await d.journal_entries.where("date").equals(today).first();

        if (!existingEntry) {
          sendBrowserNotification("LifeOS — Diário Pessoal 📖", {
            body: "Como foi o seu dia? Guarde os seus pensamentos, reflexão e humor do dia.",
          });
          localStorage.setItem("lifeos_last_notif_journal", today);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
}
