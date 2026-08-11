import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { todayIso } from "@/lib/date";

export interface NotificationSettings {
  enabled: boolean;
  habitsReminder: boolean;
  habitsTime: string; // "20:00"
  journalReminder: boolean;
  journalTime: string; // "21:30"
  calendarReminder: boolean; // Notificação de eventos da agenda
  calendarAdvanceMinutes: number; // 15
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
    calendarReminder: true,
    calendarAdvanceMinutes: 15,
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

export async function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notificationOptions: NotificationOptions = {
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    ...options,
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        return;
      }
    }

    new Notification(title, notificationOptions);
  } catch (err) {
    console.error("Erro ao enviar notificação via PWA / SW:", err);
    try {
      new Notification(title, notificationOptions);
    } catch (fallbackErr) {
      console.error("Erro no fallback de notificação:", fallbackErr);
    }
  }
}

import { isValidUuid } from "@/lib/utils";

// Verificação de lembretes automáticos em segundo plano
export async function checkDailyReminders() {
  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== "granted") return;

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!isValidUuid(userId)) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;
  const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const today = todayIso();

  // 1. Notificações do Calendário
  if (settings.calendarReminder) {
    try {
      const storageKey = `lifeos_${userId}_calendar_events_v2`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const events = JSON.parse(saved);
        const notifiedKey = `lifeos_notified_events_${today}`;
        const notifiedSet = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) || "[]"));

        events.forEach((evt: any) => {
          if (evt.date === today && evt.startTime && !notifiedSet.has(evt.id)) {
            const [evtHours, evtMins] = evt.startTime.split(":").map(Number);
            const evtTotalMinutes = evtHours * 60 + evtMins;
            const diffMinutes = evtTotalMinutes - nowTotalMinutes;

            // Se estiver entre 0 e X minutos antes do evento
            if (diffMinutes >= 0 && diffMinutes <= (settings.calendarAdvanceMinutes || 15)) {
              sendBrowserNotification(`LifeOS — Lembrete de Agenda ⏰`, {
                body: `${evt.title} começa às ${evt.startTime}${diffMinutes > 0 ? ` (em ${diffMinutes} min)` : " (agora!)"}`,
              });
              notifiedSet.add(evt.id);
              localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notifiedSet)));
            }
          }
        });
      }
    } catch (err) {
      console.error("Erro ao checar notificações do calendário:", err);
    }
  }

  // 2. Lembrete de Hábitos
  if (settings.habitsReminder && currentTime === settings.habitsTime) {
    const lastSentHabits = localStorage.getItem("lifeos_last_notif_habits");
    if (lastSentHabits !== today) {
      try {
        const [habitsRes, logsRes] = await Promise.all([
          supabase.from("habits").select("id").eq("user_id", userId).is("archived_at", null),
          supabase.from("habit_logs").select("id").eq("user_id", userId).eq("date", today).eq("done", true),
        ]);

        const habits = habitsRes.data || [];
        const logsToday = logsRes.data || [];

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

  // 3. Lembrete do Diário
  if (settings.journalReminder && currentTime === settings.journalTime) {
    const lastSentJournal = localStorage.getItem("lifeos_last_notif_journal");
    if (lastSentJournal !== today) {
      try {
        const { data: existingEntries } = await supabase
          .from("journal_entries")
          .select("id")
          .eq("user_id", userId)
          .eq("date", today);

        if (!existingEntries || existingEntries.length === 0) {
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
