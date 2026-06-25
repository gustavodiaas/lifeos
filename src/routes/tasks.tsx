import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — LifeOS" },
      { name: "description", content: "Tasks with priority, due dates and projects." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Tasks"
      description="Inbox, hoje, próximos e projetos. Prioridade, data limite e checklist."
      roadmap="Chega na v0.2: CRUD de tarefas, prioridade, due date, projetos e checklist."
    />
  ),
});