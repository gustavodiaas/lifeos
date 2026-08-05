import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { TasksModule } from "@/modules/tasks/TasksModule";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tarefas — LifeOS" },
      { name: "description", content: "Quadro Kanban e gerenciador de tarefas com prioridades, prazos e checklists." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <AppShell>
      <PageBody>
        <TasksModule />
      </PageBody>
    </AppShell>
  );
}
