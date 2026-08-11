import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarEvent } from "@/lib/supabase";

function normalizeEvent(item: any): CalendarEvent {
  return {
    id: item.id,
    user_id: item.user_id,
    title: item.title,
    date: item.date,
    startTime: item.start_time ?? item.startTime ?? "",
    start_time: item.start_time ?? item.startTime ?? "",
    endTime: item.end_time ?? item.endTime ?? "",
    end_time: item.end_time ?? item.endTime ?? "",
    color: item.color || "#a78bfa",
    description: item.description || "",
    label: item.label || "",
    category: item.category || "",
    completed: item.completed ?? false,
    createdAt: item.created_at ?? item.createdAt,
    created_at: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    updated_at: item.updated_at ?? item.updatedAt,
  };
}

export function useCalendarEvents(userId: string | undefined) {
  const effectiveUserId = userId || "guest";
  const localStorageKey = `lifeos_${effectiveUserId}_calendar_events_v2`;

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Sync to localStorage whenever events state changes
  const updateLocalAndState = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(newEvents));
    } catch (e) {
      console.error("Erro ao salvar eventos no localStorage:", e);
    }
  };

  const fetchEvents = useCallback(async () => {
    if (!userId || userId === "guest") {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const normalized = data.map(normalizeEvent);
        updateLocalAndState(normalized);
      } else {
        // Fallback: load from local storage if query fails (e.g. table not created yet)
        const saved = localStorage.getItem(localStorageKey);
        if (saved) setEvents(JSON.parse(saved));
      }
    } catch (err) {
      console.warn("Usando fallback do localStorage para eventos do calendário:", err);
      const saved = localStorage.getItem(localStorageKey);
      if (saved) setEvents(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  }, [userId, localStorageKey]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (event: Omit<CalendarEvent, "id"> & { id?: string }): Promise<CalendarEvent> => {
    const id = event.id || crypto.randomUUID();
    const newEvt: CalendarEvent = {
      id,
      user_id: userId,
      title: event.title,
      date: event.date,
      startTime: event.startTime || event.start_time || "",
      endTime: event.endTime || event.end_time || "",
      color: event.color || "#a78bfa",
      description: event.description || "",
      label: event.label || "",
    };

    const updated = [...events, newEvt];
    updateLocalAndState(updated);

    if (userId && userId !== "guest") {
      try {
        const payload = {
          id: newEvt.id,
          user_id: userId,
          title: newEvt.title,
          date: newEvt.date,
          start_time: newEvt.startTime,
          end_time: newEvt.endTime,
          color: newEvt.color,
          description: newEvt.description,
          label: newEvt.label,
        };
        await supabase.from("calendar_events").upsert([payload]);
      } catch (err) {
        console.warn("Erro ao salvar evento no Supabase, mantido em cache local:", err);
      }
    }

    return newEvt;
  };

  const removeEvent = async (id: string): Promise<boolean> => {
    const updated = events.filter((e) => e.id !== id);
    updateLocalAndState(updated);

    if (userId && userId !== "guest") {
      try {
        await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", userId);
      } catch (err) {
        console.warn("Erro ao apagar evento no Supabase:", err);
      }
    }

    return true;
  };

  const updateEvent = async (id: string, partial: Partial<CalendarEvent>): Promise<boolean> => {
    const updated = events.map((evt) => (evt.id === id ? { ...evt, ...partial } : evt));
    updateLocalAndState(updated);

    if (userId && userId !== "guest") {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (partial.title !== undefined) payload.title = partial.title;
        if (partial.date !== undefined) payload.date = partial.date;
        if (partial.startTime !== undefined) payload.start_time = partial.startTime;
        if (partial.endTime !== undefined) payload.end_time = partial.endTime;
        if (partial.color !== undefined) payload.color = partial.color;
        if (partial.description !== undefined) payload.description = partial.description;
        if (partial.label !== undefined) payload.label = partial.label;

        await supabase.from("calendar_events").update(payload).eq("id", id).eq("user_id", userId);
      } catch (err) {
        console.warn("Erro ao atualizar evento no Supabase:", err);
      }
    }

    return true;
  };

  return {
    events,
    loading,
    addEvent,
    removeEvent,
    updateEvent,
    refetch: fetchEvents,
  };
}
