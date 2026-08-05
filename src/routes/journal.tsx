import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { JournalModule } from "@/modules/journal/JournalModule";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Diário — LifeOS" },
      { name: "description", content: "Registre seu dia, pensamentos, rastreador de humor e conquistas pessoais." },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  return (
    <AppShell>
      <PageBody>
        <JournalModule />
      </PageBody>
    </AppShell>
  );
}
