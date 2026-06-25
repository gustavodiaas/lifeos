import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Habits — LifeOS" },
      { name: "description", content: "Track habits with 7/30/90-day consistency." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Habits"
      description="Marque hábitos diariamente. Consistência em 7, 30 e 90 dias — sem streak como métrica principal."
      roadmap="Chega na v0.2: criação, marcação diária, frequência personalizada e consistência por janela."
    />
  ),
});