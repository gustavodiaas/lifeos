import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finanças - LifeOS" },
      { name: "description", content: "Receitas, despesas, categorias e metas financeiras." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Finanças"
      description="Receitas, despesas, categorias, taxa de economia e metas financeiras."
      roadmap="Chega na v0.4: transações, categorias, dashboard financeiro e metas."
    />
  ),
});
