import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Metas - LifeOS" },
      { name: "description", content: "Metas anuais, trimestrais e mensais." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Metas"
      description="Metas anuais, trimestrais e mensais - vinculadas a hábitos e métricas."
      roadmap="Chega na v0.5: metas com escopo, progresso e vínculo a hábitos/métricas."
    />
  ),
});
