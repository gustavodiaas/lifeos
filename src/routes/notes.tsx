import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { NotesModule } from "@/modules/notes/NotesModule";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Conhecimento — LifeOS" },
      { name: "description", content: "Central de estudos com relógio de foco pomodoro, notas markdown, pastas e backlinks." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  return (
    <AppShell>
      <PageBody>
        <NotesModule />
      </PageBody>
    </AppShell>
  );
}
