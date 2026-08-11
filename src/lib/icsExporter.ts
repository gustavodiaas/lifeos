import type { CustomEvent } from "@/modules/calendar/CalendarModule";

/**
 * Formats a Date object or YYYY-MM-DD + HH:mm string to UTC iCalendar string (YYYYMMDDTHHMMSSZ)
 */
function formatIcsDateTime(dateStr: string, timeStr?: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  let hours = 9;
  let minutes = 0;

  if (timeStr && timeStr.includes(":")) {
    const parts = timeStr.split(":").map(Number);
    hours = parts[0];
    minutes = parts[1];
  }

  // Create local date object
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);

  // Format to UTC string YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, "0");
  const utcY = localDate.getUTCFullYear();
  const utcM = pad(localDate.getUTCMonth() + 1);
  const utcD = pad(localDate.getUTCDate());
  const utcH = pad(localDate.getUTCHours());
  const utcMin = pad(localDate.getUTCMinutes());

  return `${utcY}${utcM}${utcD}T${utcH}${utcMin}00Z`;
}

/**
 * Escape text for iCalendar format
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates an .ics string for one or multiple CustomEvents
 */
export function generateIcsContent(events: CustomEvent[], calendarName = "LifeOS Agenda"): string {
  const nowUtc = formatIcsDateTime(new Date().toISOString().slice(0, 10), "12:00");

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeOS//Agenda Sync//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ].join("\r\n");

  events.forEach((evt) => {
    const dtStart = formatIcsDateTime(evt.date, evt.startTime || "09:00");
    const dtEnd = formatIcsDateTime(evt.date, evt.endTime || evt.startTime || "10:00");
    const uid = `${evt.id}@lifeos.app`;

    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(evt.title)}`,
      evt.description ? `DESCRIPTION:${escapeIcsText(evt.description)}` : "",
      evt.label ? `CATEGORIES:${escapeIcsText(evt.label)}` : "",
      // Alarm 15 minutes before for iOS / Android native alert
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:Lembrete: ${escapeIcsText(evt.title)}`,
      "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  ics += "\r\nEND:VCALENDAR";
  return ics;
}

/**
 * Triggers a file download for an .ics file on iOS / Android / Desktop
 */
export function downloadIcsFile(events: CustomEvent[], filename = "lifeos-agenda.ics") {
  const content = generateIcsContent(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Generates a direct Google Calendar web link for single event creation
 */
export function getGoogleCalendarUrl(evt: CustomEvent): string {
  const dtStart = formatIcsDateTime(evt.date, evt.startTime || "09:00");
  const dtEnd = formatIcsDateTime(evt.date, evt.endTime || evt.startTime || "10:00");

  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evt.title,
    dates: `${dtStart}/${dtEnd}`,
    details: evt.description || "Evento sincronizado do LifeOS",
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates an Outlook Web Calendar link for single event
 */
export function getOutlookCalendarUrl(evt: CustomEvent): string {
  const startIso = `${evt.date}T${evt.startTime || "09:00"}:00`;
  const endIso = `${evt.date}T${evt.endTime || evt.startTime || "10:00"}:00`;

  const baseUrl = "https://outlook.live.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: evt.title,
    startdt: startIso,
    enddt: endIso,
    body: evt.description || "Evento sincronizado do LifeOS",
  });

  return `${baseUrl}?${params.toString()}`;
}
