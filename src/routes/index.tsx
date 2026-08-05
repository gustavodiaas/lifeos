import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { Dashboard } from "@/modules/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeOS - Painel" },
      { name: "description", content: "Visão geral dos teus hábitos, tarefas, metas e finanças." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <AppShell>
      <PageBody>
        <Dashboard />
      </PageBody>
    </AppShell>
  );
}
