import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Diário - LifeOS" },
      { name: "description", content: "Diário com humor e destaques." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Diário"
      description="Registro diário, humor, reflexões e conquistas."
      roadmap="Chega na v0.5: calendário, entrada diária, humor e highlights."
    />
  ),
});
