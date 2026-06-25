import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Estatísticas - LifeOS" },
      { name: "description", content: "Gráficos de hábitos, estudos, peso e finanças." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Estatísticas"
      description="Gráficos consolidados: peso, hábitos, estudos, finanças e metas."
      roadmap="Chega na v0.6: gráficos automáticos via Recharts e motor de marcos."
    />
  ),
});
