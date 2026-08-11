import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageBody } from "@/components/layout/PageHeader";
import { ShoppingModule } from "@/modules/shopping/ShoppingModule";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Compras & Desejos — LifeOS" },
      { name: "description", content: "Sua lista de compras por segmentos, desejos e histórico de compras." },
    ],
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  return (
    <AppShell>
      <PageBody>
        <ShoppingModule />
      </PageBody>
    </AppShell>
  );
}
