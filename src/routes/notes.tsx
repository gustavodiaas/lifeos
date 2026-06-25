import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Conhecimento - LifeOS" },
      { name: "description", content: "Notas markdown, pastas, etiquetas e backlinks." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Conhecimento"
      description="Páginas, subpáginas, tags, links e backlinks."
      roadmap="Chega na v0.3: editor markdown, organização em pastas, [[links]] e backlinks, busca rápida."
    />
  ),
});
