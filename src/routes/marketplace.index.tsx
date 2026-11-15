import { createFileRoute } from "@tanstack/react-router";
import { Marketplace } from "@/components/api/marketplace";
export const Route = createFileRoute("/marketplace/")({
  validateSearch: (s: Record<string, unknown>): { q?: string; material?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
    material: typeof s.material === "string" ? s.material : undefined,
  }),
  component: Market,
});
function Market() {
  const search = Route.useSearch();
  return <Marketplace initialSearch={search.q} initialMaterial={search.material} />;
}
