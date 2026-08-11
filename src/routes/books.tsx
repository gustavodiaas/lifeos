import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { BookTracker } from "@/modules/notes/components/BookTracker";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Estante Virtual — LifeOS" },
      { name: "description", content: "Sua estante virtual de livros com capas em alta definição, progresso e citações." },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  return (
    <AppShell>
      <PageBody>
        <BookTracker />
      </PageBody>
    </AppShell>
  );
}
