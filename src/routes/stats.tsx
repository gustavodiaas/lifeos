import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — LifeOS" },
      { name: "description", content: "Charts across habits, study, weight and finance." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Stats"
      description="Gráficos consolidados: peso, hábitos, estudos, finanças e metas."
      roadmap="Chega na v0.6: gráficos automáticos via Recharts e motor de marcos."
    />
  ),
});