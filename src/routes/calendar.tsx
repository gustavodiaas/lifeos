import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { CalendarModule } from "@/modules/calendar/CalendarModule";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendário — LifeOS" },
      { name: "description", content: "Sua agenda inteligente estilo Notion Calendar com cores pastel estilo Pinterest." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <PageBody>
        <CalendarModule />
      </PageBody>
    </AppShell>
  );
}
