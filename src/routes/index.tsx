import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Dashboard } from "@/modules/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeOS — Dashboard" },
      { name: "description", content: "Overview of your habits, tasks, goals and finances." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const now = new Date();
  const greeting =
    now.getHours() < 5
      ? "Late night"
      : now.getHours() < 12
        ? "Good morning"
        : now.getHours() < 18
          ? "Good afternoon"
          : "Good evening";
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
