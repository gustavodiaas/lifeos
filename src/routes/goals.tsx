import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { GoalsModule } from "@/modules/goals/GoalsModule";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Metas — LifeOS" },
      { name: "description", content: "Defina e acompanhe metas anuais, trimestrais e mensais com vínculos a hábitos." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  return (
    <AppShell>
      <PageBody>
        <GoalsModule />
      </PageBody>
    </AppShell>
  );
}
