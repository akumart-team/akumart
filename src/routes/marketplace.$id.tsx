import { createFileRoute } from "@tanstack/react-router";
import { ListingDetails } from "@/components/api/marketplace";
export const Route = createFileRoute("/marketplace/$id")({
  validateSearch: (s: Record<string, unknown>): { action?: "offer" | "buy" } => ({
    action: s.action === "offer" || s.action === "buy" ? s.action : undefined,
  }),
  component: Detail,
});
function Detail() {
  return <ListingDetails id={Route.useParams().id} />;
}
