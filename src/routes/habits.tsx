import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { HabitsModule } from "@/modules/habits/HabitsModule";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Hábitos — LifeOS" },
      { name: "description", content: "Acompanhe seus hábitos com o heatmap de consistência anual." },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  return (
    <AppShell>
      <PageBody>
        <HabitsModule />
      </PageBody>
    </AppShell>
  );
}
