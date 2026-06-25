import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tarefas - LifeOS" },
      { name: "description", content: "Tarefas com prioridade, datas limite e projetos." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Tarefas"
      description="Inbox, hoje, próximos e projetos. Prioridade, data limite e checklist."
      roadmap="Chega na v0.2: CRUD de tarefas, prioridade, due date, projetos e checklist."
    />
  ),
});
