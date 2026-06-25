import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
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
  const now = new Date();
  const greeting =
    now.getHours() < 5
      ? "Madrugada"
      : now.getHours() < 12
        ? "Bom dia"
        : now.getHours() < 18
          ? "Boa tarde"
          : "Boa noite";
  return (
    <AppShell>
      <PageHeader
        title={`${greeting}.`}
        description={now.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />
      <PageBody>
        <Dashboard />
      </PageBody>
    </AppShell>
  );
}
