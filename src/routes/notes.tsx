import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Knowledge — LifeOS" },
      { name: "description", content: "Markdown notes, folders, tags and backlinks." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      title="Knowledge"
      description="Páginas, subpáginas, tags, links e backlinks."
      roadmap="Chega na v0.3: editor markdown, organização em pastas, [[links]] e backlinks, busca rápida."
    />
  ),
});