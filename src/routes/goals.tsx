import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — LifeOS" },
      { name: "description", content: "Yearly, quarterly and monthly goals." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Goals"
      description="Metas anuais, trimestrais e mensais — vinculadas a hábitos e métricas."
      roadmap="Chega na v0.5: metas com escopo, progresso e vínculo a hábitos/métricas."
    />
  ),
});