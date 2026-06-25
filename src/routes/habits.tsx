import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Hábitos - LifeOS" },
      { name: "description", content: "Acompanha hábitos com consistência de 7/30/90 dias." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Hábitos"
      description="Marque hábitos diariamente. Consistência em 7, 30 e 90 dias - sem streak como métrica principal."
      roadmap="Chega na v0.2: criação, marcação diária, frequência personalizada e consistência por janela."
    />
  ),
});
