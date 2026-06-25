import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — LifeOS" },
      { name: "description", content: "Daily journal with mood and highlights." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Journal"
      description="Registro diário, humor, reflexões e conquistas."
      roadmap="Chega na v0.5: calendário, entrada diária, humor e highlights."
    />
  ),
});