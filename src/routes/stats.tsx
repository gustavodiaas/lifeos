import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { StatsModule } from "@/modules/stats/StatsModule";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Estatísticas — LifeOS" },
      { name: "description", content: "Relatório de produtividade, rastreador de peso, horas de estudo e saúde financeira." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  return (
    <AppShell>
      <PageBody>
        <StatsModule />
      </PageBody>
    </AppShell>
  );
}
