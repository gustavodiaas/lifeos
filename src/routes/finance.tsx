import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — LifeOS" },
      { name: "description", content: "Income, expenses, categories and financial goals." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Finance"
      description="Receitas, despesas, categorias, taxa de economia e metas financeiras."
      roadmap="Chega na v0.4: transações, categorias, dashboard financeiro e metas."
    />
  ),
});